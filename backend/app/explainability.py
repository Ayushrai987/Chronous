"""
Explainability Engine for Project Chronos.
SHAP-based feature attribution, causal cascade graph, 
counterfactual intervention analysis, and human-readable label generation.
"""

import numpy as np
import torch
from typing import List, Dict, Tuple, Optional
from .model import ChronosModel, FEATURE_NAMES, predict

# ──────────────────────────────────────────────────────────────────────────────
# SHAP-Like Feature Attribution
# Using gradient-based attribution as a lightweight alternative to
# DeepExplainer for demo mode. In production, swap to SHAP DeepExplainer.
# ──────────────────────────────────────────────────────────────────────────────

def compute_shap_values(model: ChronosModel, vitals_window: np.ndarray) -> np.ndarray:
    """
    Compute feature importance scores using integrated gradients.
    
    For production: Use shap.DeepExplainer(model, background_data)
    For demo: Use gradient-based attribution (faster, no background data needed)
    
    Returns: (12, 8) matrix of importance scores per timestep per feature.
    """
    model.eval()
    x = torch.FloatTensor(vitals_window).unsqueeze(0).requires_grad_(True)  # (1, 12, 8)
    
    # Forward pass
    output = model(x)
    
    # Backward pass to get gradients
    output.backward()
    
    # Gradient * input as attribution (simplified SHAP approximation)
    gradients = x.grad.data.numpy()[0]  # (12, 8)
    attributions = gradients * vitals_window  # Element-wise
    
    return attributions


def compute_feature_importance(shap_matrix: np.ndarray) -> List[Dict]:
    """
    Aggregate SHAP matrix (12x8) to get per-feature importance scores.
    Returns sorted list of {feature, importance, direction}.
    """
    # Mean absolute SHAP value across timesteps for each feature
    importance = np.mean(np.abs(shap_matrix), axis=0)  # (8,)
    
    # Determine sign direction (net effect)
    mean_signed = np.mean(shap_matrix, axis=0)  # (8,)
    
    features = []
    for i, name in enumerate(FEATURE_NAMES):
        features.append({
            "feature": name,
            "importance": float(importance[i]),
            "direction": "risk-increasing" if mean_signed[i] > 0 else "risk-decreasing",
            "raw_score": float(mean_signed[i])
        })
    
    # Sort by importance descending
    features.sort(key=lambda x: x["importance"], reverse=True)
    return features


def compute_trend(vitals_window: np.ndarray, feature_idx: int) -> str:
    """
    Compute trend direction for a feature by comparing
    last 3 readings vs previous 3 readings.
    Returns: 'rising', 'falling', or 'stable'
    """
    if vitals_window.shape[0] < 6:
        return "stable"
    
    recent = np.mean(vitals_window[-3:, feature_idx])
    previous = np.mean(vitals_window[-6:-3, feature_idx])
    
    diff = recent - previous
    threshold = 0.15 * max(abs(previous), 0.01)  # 15% change threshold
    
    if diff > threshold:
        return "rising"
    elif diff < -threshold:
        return "falling"
    else:
        return "stable"


def generate_trend_label(feature_name: str, trend: str, importance: float) -> str:
    """
    Generate human-readable label for a top driver.
    E.g., "MAP has been falling steadily for 90 minutes"
    """
    intensity = "sharply" if importance > 0.5 else "steadily" if importance > 0.2 else "slightly"
    
    labels = {
        ("Heart Rate", "rising"): f"Heart Rate rising {intensity} over last 3 hours",
        ("Heart Rate", "falling"): f"Heart Rate declining {intensity} — possible bradycardia",
        ("Heart Rate", "stable"): "Heart Rate stable",
        
        ("MAP", "rising"): f"Blood Pressure (MAP) increasing {intensity}",
        ("MAP", "falling"): f"MAP has been falling {intensity} — hemodynamic compromise",
        ("MAP", "stable"): "MAP stable",
        
        ("SpO2", "rising"): f"Oxygen saturation improving {intensity}",
        ("SpO2", "falling"): f"SpO2 dropping {intensity} — respiratory deterioration",
        ("SpO2", "stable"): "SpO2 stable",
        
        ("Respiratory Rate", "rising"): f"Respiratory Rate climbing {intensity} — compensatory breathing",
        ("Respiratory Rate", "falling"): f"Respiratory Rate decreasing {intensity}",
        ("Respiratory Rate", "stable"): "Respiratory Rate stable",
        
        ("Temperature", "rising"): f"Temperature rising {intensity} — possible infection",
        ("Temperature", "falling"): f"Temperature falling {intensity} — hypothermia risk",
        ("Temperature", "stable"): "Temperature stable",
        
        ("Serum Lactate", "rising"): f"Lactate rising {intensity} over last 3 hours — tissue hypoperfusion",
        ("Serum Lactate", "falling"): f"Lactate clearing {intensity} — positive response",
        ("Serum Lactate", "stable"): "Lactate level stable",
        
        ("GCS Score", "rising"): "Neurological status improving",
        ("GCS Score", "falling"): f"GCS declining {intensity} — altered consciousness",
        ("GCS Score", "stable"): "GCS stable",
        
        ("Urine Output", "rising"): f"Urine output increasing {intensity} — kidney perfusion improving",
        ("Urine Output", "falling"): f"Urine output declining {intensity} — renal compromise",
        ("Urine Output", "stable"): "Urine output stable",
    }
    
    return labels.get((feature_name, trend), f"{feature_name} {trend}")


def get_top_drivers(model: ChronosModel, vitals_window: np.ndarray, top_n: int = 3) -> List[Dict]:
    """
    Get top N feature drivers with human-readable labels.
    """
    shap_matrix = compute_shap_values(model, vitals_window)
    feature_importance = compute_feature_importance(shap_matrix)
    
    top_drivers = []
    for i, feat in enumerate(feature_importance[:top_n]):
        feature_idx = FEATURE_NAMES.index(feat["feature"])
        trend = compute_trend(vitals_window, feature_idx)
        label = generate_trend_label(feat["feature"], trend, feat["importance"])
        
        top_drivers.append({
            "rank": i + 1,
            "feature": feat["feature"],
            "importance": round(feat["importance"], 4),
            "direction": feat["direction"],
            "trend": trend,
            "label": label,
        })
    
    return top_drivers


# ──────────────────────────────────────────────────────────────────────────────
# Causal Cascade Graph
# ──────────────────────────────────────────────────────────────────────────────

# Pre-defined physiological rule graph (directed edges)
CAUSAL_EDGES = [
    {
        "source": "Serum Lactate",
        "target": "MAP",
        "source_trend": "rising",
        "target_trend": "falling",
        "label": "Tissue hypoperfusion → Vasodilation",
        "cascade": "Septic Shock"
    },
    {
        "source": "MAP",
        "target": "Heart Rate",
        "source_trend": "falling",
        "target_trend": "rising",
        "label": "Hypotension → Compensatory tachycardia",
        "cascade": "Hemodynamic Collapse"
    },
    {
        "source": "Heart Rate",
        "target": "SpO2",
        "source_trend": "rising",
        "target_trend": "falling",
        "label": "Tachycardia → Oxygen delivery failure",
        "cascade": "Cardiac Arrest"
    },
    {
        "source": "SpO2",
        "target": "Respiratory Rate",
        "source_trend": "falling",
        "target_trend": "rising",
        "label": "Hypoxemia → Compensatory hyperventilation",
        "cascade": "Respiratory Failure"
    },
    {
        "source": "Temperature",
        "target": "Serum Lactate",
        "source_trend": "rising",
        "target_trend": "rising",
        "label": "Fever/Infection → Metabolic demand → Lactate",
        "cascade": "Septic Shock"
    },
    {
        "source": "MAP",
        "target": "Urine Output",
        "source_trend": "falling",
        "target_trend": "falling",
        "label": "Hypotension → Renal hypoperfusion",
        "cascade": "Organ Failure"
    },
    {
        "source": "GCS Score",
        "target": "Respiratory Rate",
        "source_trend": "falling",
        "target_trend": "falling",
        "label": "Declining consciousness → Respiratory depression",
        "cascade": "Neurological Collapse"
    },
    {
        "source": "Serum Lactate",
        "target": "GCS Score",
        "source_trend": "rising",
        "target_trend": "falling",
        "label": "Metabolic acidosis → Encephalopathy",
        "cascade": "Multi-Organ Failure"
    },
]


def get_active_causal_edges(top_drivers: List[Dict], vitals_window: np.ndarray) -> List[Dict]:
    """
    Check each causal edge against current top SHAP drivers and trends.
    An edge is active if:
    1. Source feature is among top SHAP drivers
    2. Source feature's trend matches the edge's expected direction
    """
    # Build lookup of top driver features and their trends
    driver_lookup = {}
    for d in top_drivers:
        driver_lookup[d["feature"]] = d["trend"]
    
    # Also compute trends for all features (for target matching)
    all_trends = {}
    for i, name in enumerate(FEATURE_NAMES):
        all_trends[name] = compute_trend(vitals_window, i)
    
    active_edges = []
    for edge in CAUSAL_EDGES:
        source_is_driver = edge["source"] in driver_lookup
        source_trend_match = all_trends.get(edge["source"]) == edge["source_trend"]
        target_trend_match = all_trends.get(edge["target"]) == edge["target_trend"]
        
        # Determine if this specific path is active
        is_active = source_is_driver and source_trend_match and target_trend_match
        
        # Always return the edge so the graph isn't blank, but mark its state
        active_edges.append({
            "source": edge["source"],
            "target": edge["target"],
            "label": edge["label"],
            "cascade": edge["cascade"],
            "active": is_active,
        })
    
    return active_edges


# ──────────────────────────────────────────────────────────────────────────────
# Counterfactual Intervention Engine
# ──────────────────────────────────────────────────────────────────────────────

# Clinical action lookup table
INTERVENTION_MAP = {
    "MAP": {
        "direction": "increase",
        "action": "500ml saline bolus consideration + vasopressor titration",
        "icon": "💉"
    },
    "Heart Rate": {
        "direction": "decrease",
        "action": "Beta-blocker or rate control review",
        "icon": "💊"
    },
    "Serum Lactate": {
        "direction": "decrease",
        "action": "Fluid resuscitation and source control",
        "icon": "🩸"
    },
    "SpO2": {
        "direction": "increase",
        "action": "Increase FiO2 / consider intubation",
        "icon": "🫁"
    },
    "Temperature": {
        "direction": "decrease",
        "action": "Blood cultures + empiric antibiotics",
        "icon": "🌡️"
    },
    "Respiratory Rate": {
        "direction": "decrease",
        "action": "Ventilator optimization / BiPAP adjustment",
        "icon": "💨"
    },
    "GCS Score": {
        "direction": "increase",
        "action": "Neurological assessment + CT head",
        "icon": "🧠"
    },
    "Urine Output": {
        "direction": "increase",
        "action": "Fluid challenge + renal function panel",
        "icon": "🔬"
    },
}


def run_counterfactual(
    model: ChronosModel,
    vitals_window: np.ndarray,
    current_prob: float,
    top_drivers: List[Dict],
    num_interventions: int = 2
) -> List[Dict]:
    """
    For each top driver, perturb the feature 10% in the clinically safe direction
    across all timesteps, re-run inference, and compute the probability delta.
    """
    results = []
    
    for driver in top_drivers[:num_interventions]:
        feature_name = driver["feature"]
        feature_idx = FEATURE_NAMES.index(feature_name)
        intervention = INTERVENTION_MAP.get(feature_name, {
            "direction": "normalize",
            "action": "Clinical review recommended",
            "icon": "⚕️"
        })
        
        # Create perturbed input
        perturbed = vitals_window.copy()
        
        # Perturb 10% in the clinically safe direction
        if intervention["direction"] == "increase":
            perturbed[:, feature_idx] *= 1.10  # Increase by 10%
        elif intervention["direction"] == "decrease":
            perturbed[:, feature_idx] *= 0.90  # Decrease by 10%
        else:
            # Normalize toward 0 (z-scored baseline)
            perturbed[:, feature_idx] *= 0.90
        
        # Re-run inference
        new_prob = predict(model, perturbed)
        
        # Estimate intervention window (hours)
        # Based on trend rate extrapolation
        if driver["trend"] in ("rising", "falling"):
            recent_values = vitals_window[-3:, feature_idx]
            rate = float(abs(np.mean(np.diff(recent_values))))
            if rate > 0.01:
                intervention_window = float(round(min(6.0, 1.0 / rate), 1))
            else:
                intervention_window = 4.0
        else:
            intervention_window = 4.0
        
        results.append({
            "feature": feature_name,
            "current_probability": float(round(current_prob, 4)),
            "post_intervention_probability": float(round(new_prob, 4)),
            "probability_reduction": float(round(current_prob - new_prob, 4)),
            "action": intervention["action"],
            "icon": intervention["icon"],
            "intervention_window_hours": float(intervention_window),
        })
    
    return results


# ──────────────────────────────────────────────────────────────────────────────
# Risk Tier Classification
# ──────────────────────────────────────────────────────────────────────────────

def classify_risk_tier(probability: float) -> str:
    """Classify risk tier based on crash probability."""
    if probability >= 0.75:
        return "CRITICAL"
    elif probability >= 0.50:
        return "HIGH"
    elif probability >= 0.25:
        return "WATCH"
    else:
        return "STABLE"


def get_tier_color(tier: str) -> str:
    """Get hex color for risk tier."""
    colors = {
        "CRITICAL": "#DC2626",
        "HIGH": "#F59E0B",
        "WATCH": "#EAB308",
        "STABLE": "#22C55E",
    }
    return colors.get(tier, "#6B7280")
