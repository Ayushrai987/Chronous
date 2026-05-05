"""
Project Chronos — FastAPI Backend
Fully local ICU patient monitoring and deterioration prediction API.
No external cloud API calls during inference.
"""

import os
import json
import numpy as np
import torch
from datetime import datetime, timedelta
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader

from .database import init_db, get_all_patients, get_patient, get_patient_vitals
from .model import ChronosModel, create_model, save_model, load_model, predict
from .synthetic_data import seed_demo_data, normalize_vitals, compute_baseline_stats
from .explainability import (
    get_top_drivers, get_active_causal_edges, run_counterfactual,
    classify_risk_tier, compute_shap_values, compute_feature_importance,
    FEATURE_NAMES
)
from .simulator import DemoSimulator

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
CRASH_MODEL_PATH = os.path.join(MODEL_DIR, "crash_model.pt")
SEPSIS_MODEL_PATH = os.path.join(MODEL_DIR, "sepsis_model.pt")
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

# ──────────────────────────────────────────────────────────────────────────────
# Global state
# ──────────────────────────────────────────────────────────────────────────────
crash_model: Optional[ChronosModel] = None
sepsis_model: Optional[ChronosModel] = None
simulator: Optional[DemoSimulator] = None


def initialize_models():
    """Initialize or create demo models."""
    global crash_model, sepsis_model

    os.makedirs(MODEL_DIR, exist_ok=True)

    # Create and save demo models if they don't exist
    if not os.path.exists(CRASH_MODEL_PATH):
        print("Creating demo crash prediction model...")
        model = create_model()
        # Initialize with slightly different weights for realistic behavior
        torch.manual_seed(42)
        for param in model.parameters():
            if param.dim() > 1:
                torch.nn.init.xavier_normal_(param)
        save_model(model, CRASH_MODEL_PATH)

    if not os.path.exists(SEPSIS_MODEL_PATH):
        print("Creating demo sepsis prediction model...")
        model = create_model()
        torch.manual_seed(123)
        for param in model.parameters():
            if param.dim() > 1:
                torch.nn.init.xavier_normal_(param)
        save_model(model, SEPSIS_MODEL_PATH)

    # Load models
    crash_model = load_model(CRASH_MODEL_PATH)
    sepsis_model = load_model(SEPSIS_MODEL_PATH)
    print("[OK] Models loaded successfully")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle - startup and shutdown."""
    # Startup
    print("=" * 60)
    print("  PROJECT CHRONOS — ICU Early Warning System")
    print("  Starting up...")
    print("=" * 60)

    # Initialize database
    init_db()
    print("[OK] Database initialized")

    # Seed demo data
    seed_demo_data()

    # Initialize models
    initialize_models()

    # Start simulator
    global simulator
    simulator = DemoSimulator(crash_model, sepsis_model)
    simulator.start()
    print("[OK] Demo simulator started")
    print("=" * 60)
    print("  System ready. Dashboard: http://localhost:3000")
    print("  API docs: http://localhost:8000/docs")
    print("=" * 60)

    yield

    # Shutdown
    if simulator:
        simulator.stop()
    print("System shut down.")


# ──────────────────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Project Chronos",
    description="ICU Patient Deterioration Prediction & Explainable AI System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────────────────────────────────────
class VitalsInput(BaseModel):
    heart_rate: List[float]
    map_pressure: List[float]
    spo2: List[float]
    respiratory_rate: List[float]
    temperature: List[float]
    serum_lactate: List[float]
    gcs_score: List[float]
    urine_output: List[float]


class SimulateRequest(BaseModel):
    vitals: VitalsInput
    patient_name: Optional[str] = "Simulated Patient"


# ──────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check."""
    return {
        "system": "Project Chronos",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/patients")
async def get_patients():
    """
    Get all active ICU patients ranked by crash probability.
    Returns bed ID, risk tier, top drivers, and intervention estimates.
    """
    if simulator:
        patients = simulator.get_all_predictions()
    else:
        patients = []

    return {
        "timestamp": datetime.now().isoformat(),
        "patient_count": len(patients),
        "patients": patients,
    }


@app.get("/api/patients/{patient_id}")
async def get_patient_detail(patient_id: str):
    """
    Get full prediction details for a single patient.
    Includes vitals, SHAP analysis, causal graph, and counterfactuals.
    """
    if simulator:
        result = simulator.get_patient_prediction(patient_id)
    else:
        result = None

    if not result:
        raise HTTPException(status_code=404, detail="Patient not found")

    return result


@app.post("/api/simulate")
async def simulate_prediction(request: SimulateRequest):
    """
    Run prediction on synthetic/custom vitals data.
    Used for demos and testing without real patient data.
    """
    if not crash_model or not sepsis_model:
        raise HTTPException(status_code=503, detail="Models not loaded")

    # Build vitals array from input
    vitals_data = request.vitals
    n_readings = len(vitals_data.heart_rate)

    if n_readings < 3 or n_readings > 24:
        raise HTTPException(
            status_code=400,
            detail="Provide between 3 and 24 hourly readings"
        )

    # Build vitals dict list
    vitals_list = []
    for i in range(n_readings):
        vitals_list.append({
            "heart_rate": vitals_data.heart_rate[i],
            "map_pressure": vitals_data.map_pressure[i],
            "spo2": vitals_data.spo2[i],
            "respiratory_rate": vitals_data.respiratory_rate[i],
            "temperature": vitals_data.temperature[i],
            "serum_lactate": vitals_data.serum_lactate[i],
            "gcs_score": vitals_data.gcs_score[i],
            "urine_output": vitals_data.urine_output[i],
        })

    # Compute baseline from first 2 readings
    baseline = compute_baseline_stats(vitals_list)

    # Normalize
    normalized = normalize_vitals(vitals_list, baseline)

    # Pad/trim to 12 timesteps
    if normalized.shape[0] < 12:
        padding = np.zeros((12 - normalized.shape[0], 8), dtype=np.float32)
        normalized = np.vstack([padding, normalized])
    else:
        normalized = normalized[-12:]

    # Predictions
    crash_prob = predict(crash_model, normalized)
    sepsis_prob = predict(sepsis_model, normalized)

    # Explainability
    top_drivers = get_top_drivers(crash_model, normalized)
    causal_edges = get_active_causal_edges(top_drivers, normalized)
    risk_tier = classify_risk_tier(crash_prob)

    # Counterfactual
    counterfactual = []
    if crash_prob >= 0.25:
        counterfactual = run_counterfactual(
            crash_model, normalized, crash_prob, top_drivers
        )

    return {
        "patient_name": request.patient_name,
        "crash_probability": float(round(crash_prob, 4)),
        "sepsis_probability": float(round(sepsis_prob, 4)),
        "risk_tier": risk_tier,
        "top_drivers": top_drivers,
        "causal_edges": causal_edges,
        "counterfactual": counterfactual,
        "shap_values": compute_shap_values(crash_model, normalized).tolist(),
    }


@app.get("/api/shift-brief", response_class=PlainTextResponse)
async def generate_shift_brief():
    """
    Generate a structured shift handover document.
    Uses Jinja2 template filled with current model outputs.
    No LLM involved — pure template rendering.
    """
    if not simulator:
        raise HTTPException(status_code=503, detail="Simulator not running")

    patients = simulator.get_all_predictions()

    # Count by tier
    tier_counts = {"CRITICAL": 0, "HIGH": 0, "WATCH": 0, "STABLE": 0}
    for p in patients:
        tier = p.get("risk_tier", "STABLE")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

    # Render template
    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("shift_brief.txt")

    brief = template.render(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        shift_start=(datetime.now() - timedelta(hours=12)).strftime("%H:%M"),
        shift_end=datetime.now().strftime("%H:%M"),
        patient_count=len(patients),
        patients=patients,
        critical_count=tier_counts["CRITICAL"],
        high_count=tier_counts["HIGH"],
        watch_count=tier_counts["WATCH"],
        stable_count=tier_counts["STABLE"],
    )

    return brief


@app.get("/api/feature-names")
async def get_feature_names():
    """Get the list of tracked vital feature names."""
    return {"features": FEATURE_NAMES}


@app.get("/api/system-status")
async def system_status():
    """Get system operational status."""
    return {
        "status": "operational",
        "crash_model_loaded": crash_model is not None,
        "sepsis_model_loaded": sepsis_model is not None,
        "simulator_running": simulator is not None and simulator.running,
        "timestamp": datetime.now().isoformat(),
        "total_patients": len(get_all_patients()),
    }
