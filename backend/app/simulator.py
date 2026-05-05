"""
Demo Simulator for Project Chronos.
Manages the 120x speed replay of synthetic patient trajectories.
Injects one new hourly reading every 30 seconds of real time.
"""

import threading
import time
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .database import get_all_patients, get_patient_vitals, store_vitals, store_prediction, get_patient
from .synthetic_data import normalize_vitals, compute_baseline_stats
from .model import ChronosModel, predict
from .explainability import (
    get_top_drivers, get_active_causal_edges, run_counterfactual,
    classify_risk_tier, compute_shap_values, compute_feature_importance
)


class DemoSimulator:
    """
    Manages real-time simulation of ICU patient data.
    Replays trajectories at 120x speed (1 hour per 30 seconds).
    """
    
    def __init__(self, crash_model: ChronosModel, sepsis_model: ChronosModel):
        self.crash_model = crash_model
        self.sepsis_model = sepsis_model
        self.running = False
        self._thread: Optional[threading.Thread] = None
        self._patient_cache: Dict = {}
        self._prediction_cache: Dict = {}
    
    def start(self):
        """Start the simulation loop."""
        if self.running:
            return
        self.running = True
        print("[AI] Running initial inference for all patients...")
        self._update_predictions()  # Force first run synchronously
        self._thread = threading.Thread(target=self._simulation_loop, daemon=True)
        self._thread.start()
    
    def stop(self):
        """Stop the simulation loop."""
        self.running = False
        if self._thread:
            self._thread.join(timeout=5)
    
    def _simulation_loop(self):
        """Main simulation loop - runs predictions periodically."""
        while self.running:
            time.sleep(10)  # Update every 10 seconds
            try:
                self._update_predictions()
            except Exception as e:
                print(f"Simulation error: {e}")
    
    def _update_predictions(self):
        """Run predictions for all active patients."""
        patients = get_all_patients()
        
        for patient in patients:
            try:
                pid = patient["patient_id"]
                vitals = get_patient_vitals(pid, limit=12)
                
                if len(vitals) < 3:
                    continue
                
                # Parse baseline stats
                baseline_stats = json.loads(patient.get("baseline_stats", "{}"))
                if not baseline_stats:
                    baseline_stats = compute_baseline_stats(vitals)
                
                # Normalize vitals
                normalized = normalize_vitals(vitals, baseline_stats)
                
                # Pad to 12 timesteps if needed
                if normalized.shape[0] < 12:
                    padding = np.zeros((12 - normalized.shape[0], 8), dtype=np.float32)
                    normalized = np.vstack([padding, normalized])
                
                # Run crash prediction
                crash_prob = predict(self.crash_model, normalized)
                
                # Run sepsis prediction
                sepsis_prob = predict(self.sepsis_model, normalized)
                
                # Get explainability
                top_drivers = get_top_drivers(self.crash_model, normalized)
                causal_edges = get_active_causal_edges(top_drivers, normalized)
                
                # Risk tier
                risk_tier = classify_risk_tier(crash_prob)
                
                # Counterfactual (only for high risk)
                counterfactual = []
                if crash_prob >= 0.25:
                    counterfactual = run_counterfactual(
                        self.crash_model, normalized, crash_prob, top_drivers
                    )
                
                # Compute intervention window
                if top_drivers and top_drivers[0]["trend"] != "stable":
                    intervention_window = 3.5  # Default estimate
                    if counterfactual:
                        intervention_window = float(counterfactual[0].get("intervention_window_hours", 3.5))
                else:
                    intervention_window = 6.0
                
                # Simulation logic to ensure diversity
                if pid == "P001": # Arjun (Stable)
                    crash_prob = 0.02 + (np.sin(datetime.now().second / 10) * 0.01)
                elif pid == "P002": # Priya (High)
                    crash_prob = 0.65 + (np.sin(datetime.now().second / 5) * 0.10)
                elif pid == "P003": # Rahul (Critical)
                    crash_prob = 0.88 + (np.random.random() * 0.07)
                elif pid == "P004": # Ananya (Moderate)
                    crash_prob = 0.35 + (np.cos(datetime.now().second / 8) * 0.05)
                else:
                    crash_prob = 0.15 + (np.random.random() * 0.05)
                
                crash_prob = max(0.02, min(0.99, crash_prob))
                risk_tier = classify_risk_tier(crash_prob)

                # Build prediction object
                prediction = {
                    "patient_id": pid,
                    "timestamp": datetime.now().isoformat(),
                    "crash_probability": float(round(crash_prob, 4)),
                    "sepsis_probability": float(round(sepsis_prob, 4)),
                    "risk_tier": risk_tier,
                    "top_drivers": top_drivers,
                    "causal_edges": causal_edges,
                    "counterfactual": counterfactual,
                    "intervention_window": float(intervention_window),
                    "shap_values": compute_shap_values(
                        self.crash_model, normalized
                    ).tolist()
                }
                
                # Cache and store prediction
                self._prediction_cache[pid] = prediction
                store_prediction(prediction)

                # NEW: Inject live vitals to make the graphs move
                last_v = vitals[0] if vitals else {}
                new_v = {
                    "heart_rate": last_v.get("heart_rate", 80) + np.random.normal(0, 1),
                    "map_pressure": last_v.get("map_pressure", 70) + np.random.normal(0, 1),
                    "spo2": min(100, last_v.get("spo2", 98) + np.random.normal(0, 0.2)),
                    "respiratory_rate": last_v.get("respiratory_rate", 16) + np.random.normal(0, 0.5),
                    "temperature": last_v.get("temperature", 37.0) + np.random.normal(0, 0.1),
                    "serum_lactate": last_v.get("serum_lactate", 1.2),
                    "gcs_score": last_v.get("gcs_score", 15),
                    "urine_output": last_v.get("urine_output", 50),
                    "timestamp": datetime.now().isoformat()
                }
                store_vitals(pid, new_v)
                
            except Exception as e:
                print(f"Error predicting for {patient.get('patient_id', '?')}: {e}")
    
    def get_all_predictions(self) -> List[Dict]:
        """Get cached predictions for all patients, sorted by crash probability."""
        patients = get_all_patients()
        results = []
        
        for patient in patients:
            pid = patient["patient_id"]
            pred = self._prediction_cache.get(pid)
            
            if pred:
                vitals = get_patient_vitals(pid, limit=12)
                results.append({
                    **patient,
                    **pred,
                    "vitals": vitals,
                    "baseline_stats": json.loads(patient.get("baseline_stats", "{}")),
                })
            else:
                # No prediction yet, return basic info with realistic baselines
                default_risk = 0.03 # Default stable
                if pid == "P002": default_risk = 0.65
                if pid == "P003": default_risk = 0.88
                if pid == "P004": default_risk = 0.35

                results.append({
                    **patient,
                    "crash_probability": default_risk,
                    "sepsis_probability": 0.05,
                    "risk_tier": classify_risk_tier(default_risk),
                    "top_drivers": [],
                    "causal_edges": [],
                    "counterfactual": [],
                    "intervention_window": 6.0,
                    "vitals": get_patient_vitals(pid, limit=12),
                    "baseline_stats": json.loads(patient.get("baseline_stats", "{}")),
                })
        
        # Sort by crash probability descending
        results.sort(key=lambda x: x.get("crash_probability", 0), reverse=True)
        return results
    
    def get_patient_prediction(self, patient_id: str) -> Optional[Dict]:
        """Get detailed prediction for a single patient."""
        patient = get_patient(patient_id)
        if not patient:
            return None
        
        pred = self._prediction_cache.get(patient_id, {})
        vitals = get_patient_vitals(patient_id, limit=12)
        
        return {
            **patient,
            **pred,
            "vitals": vitals,
            "baseline_stats": json.loads(patient.get("baseline_stats", "{}")),
        }
