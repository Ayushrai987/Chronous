"""
Database module for Project Chronos.
SQLite-based storage for patient data, vitals, and predictions.
All data stays local - no external database dependency.
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chronos.db")


def get_db():
    """Get a database connection."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Initialize the database schema."""
    conn = get_db()
    cursor = conn.cursor()

    # Patients table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER,
            sex TEXT,
            bed_id TEXT NOT NULL,
            admission_time TEXT NOT NULL,
            diagnosis TEXT,
            status TEXT DEFAULT 'active',
            baseline_stats TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Vitals table - hourly readings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            heart_rate REAL,
            map_pressure REAL,
            spo2 REAL,
            respiratory_rate REAL,
            temperature REAL,
            serum_lactate REAL,
            gcs_score REAL,
            urine_output REAL,
            is_missing INTEGER DEFAULT 0,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        )
    """)

    # Predictions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            crash_probability REAL,
            sepsis_probability REAL,
            risk_tier TEXT,
            shap_values TEXT,
            top_drivers TEXT,
            causal_edges TEXT,
            counterfactual TEXT,
            intervention_window REAL,
            FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
        )
    """)

    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_vitals_patient ON vitals(patient_id, timestamp)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_predictions_patient ON predictions(patient_id, timestamp)")

    conn.commit()
    conn.close()


def store_patient(patient_data: dict):
    """Store or update a patient record."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO patients 
        (patient_id, name, age, sex, bed_id, admission_time, diagnosis, status, baseline_stats)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_data["patient_id"],
        patient_data["name"],
        patient_data.get("age"),
        patient_data.get("sex"),
        patient_data["bed_id"],
        patient_data["admission_time"],
        patient_data.get("diagnosis", ""),
        patient_data.get("status", "active"),
        json.dumps(patient_data.get("baseline_stats", {}))
    ))
    conn.commit()
    conn.close()


def store_vitals(patient_id: str, vitals: dict):
    """Store a vitals reading."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vitals 
        (patient_id, timestamp, heart_rate, map_pressure, spo2, respiratory_rate,
         temperature, serum_lactate, gcs_score, urine_output, is_missing)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        vitals["timestamp"],
        vitals.get("heart_rate"),
        vitals.get("map_pressure"),
        vitals.get("spo2"),
        vitals.get("respiratory_rate"),
        vitals.get("temperature"),
        vitals.get("serum_lactate"),
        vitals.get("gcs_score"),
        vitals.get("urine_output"),
        vitals.get("is_missing", 0)
    ))
    conn.commit()
    conn.close()


def get_patient_vitals(patient_id: str, limit: int = 12):
    """Get the last N vitals readings for a patient."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM vitals 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """, (patient_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in reversed(rows)]


def get_all_patients():
    """Get all active patients."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE status = 'active'")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_patient(patient_id: str):
    """Get a single patient."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients WHERE patient_id = ?", (patient_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def store_prediction(prediction: dict):
    """Store a prediction result."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO predictions 
        (patient_id, timestamp, crash_probability, sepsis_probability, risk_tier,
         shap_values, top_drivers, causal_edges, counterfactual, intervention_window)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        prediction["patient_id"],
        prediction["timestamp"],
        prediction["crash_probability"],
        prediction.get("sepsis_probability", 0.0),
        prediction["risk_tier"],
        json.dumps(prediction.get("shap_values", [])),
        json.dumps(prediction.get("top_drivers", [])),
        json.dumps(prediction.get("causal_edges", [])),
        json.dumps(prediction.get("counterfactual", {})),
        prediction.get("intervention_window", 0.0)
    ))
    conn.commit()
    conn.close()


def get_latest_prediction(patient_id: str):
    """Get the most recent prediction for a patient."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM predictions 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
    """, (patient_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        result = dict(row)
        result["shap_values"] = json.loads(result["shap_values"])
        result["top_drivers"] = json.loads(result["top_drivers"])
        result["causal_edges"] = json.loads(result["causal_edges"])
        result["counterfactual"] = json.loads(result["counterfactual"])
        return result
    return None


def clear_all_data():
    """Clear all data from the database (for demo reset)."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM predictions")
    cursor.execute("DELETE FROM vitals")
    cursor.execute("DELETE FROM patients")
    conn.commit()
    conn.close()
