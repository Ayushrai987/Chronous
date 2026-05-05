import numpy as np
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict
from .database import init_db, store_patient, store_vitals, clear_all_data

def add_noise(val, scale=0.05):
    return val + np.random.normal(0, val * scale)

def generate_synthetic_patients():
    first_names_m = ["Aarav", "Arjun", "Rohan", "Vikram", "Sanjay", "Aditya", "Ishaan", "Vivek", "Anil", "Rajesh"]
    first_names_f = ["Ananya", "Priya", "Neha", "Sneha", "Kavita", "Savitri", "Meena", "Deepa", "Sunita", "Ritu"]
    last_names = ["Sharma", "Patel", "Gupta", "Singh", "Kumar", "Reddy", "Malhotra", "Menon", "Deshmukh", "Khanna"]
    
    diagnoses = [
        "Septic Shock", "ARDS", "AMI", "DKA", "Hypertensive Emergency", 
        "AKI on CRRT", "Acute Liver Failure", "TBI post neurosurgery", "Pulmonary Embolism", 
        "Decompensated Heart Failure", "Cerebral Malaria", "GI Bleed with hemorrhagic shock"
    ]

    patient_cohort = []

    for i in range(1, 109):
        pid = f"P{str(i).zfill(3)}"
        is_male = random.random() > 0.5
        fname = random.choice(first_names_m if is_male else first_names_f)
        lname = random.choice(last_names)
        age = random.randint(22, 85)
        bed = f"{random.choice(['A', 'B', 'C', 'D'])}{random.randint(101, 127)}"
        
        # Override for specific cases
        status = "active"
        if i == 1:
            name, age, sex, bed, dx, status = "Ramesh Agarwal", 71, "M", "ICU-B2", "Refractory Septic Shock", "deceased"
        elif i == 2:
            name, age, sex, bed, dx, status = "Savitri Desai", 84, "F", "ICU-C1", "Massive Pulmonary Embolism", "deceased"
        elif i == 3:
            name, age, sex, bed, dx, status = "Prakash Nambiar", 58, "M", "ICU-D3", "Post-Cardiac Surgery Day 2", "hardware_failure"
        else:
            name = f"{fname} {lname}"
            sex = "M" if is_male else "F"
            dx = random.choice(diagnoses)
            if i > 93: status = "discharged"
            elif i > 83: status = "transferred"

        patient = {
            "patient_id": pid,
            "name": name,
            "age": age,
            "sex": sex,
            "bed_id": bed,
            "admission_time": (datetime.now() - timedelta(hours=random.randint(12, 168))).isoformat(),
            "diagnosis": dx,
            "status": status
        }
        
        vitals_history = []
        base = {"hr": 80, "map": 85, "spo2": 98, "rr": 16, "temp": 37.0, "lac": 1.2, "gcs": 15, "uo": 50}
        
        for h in range(12):
            v = {k: add_noise(v_base) for k, v_base in {"heart_rate": base["hr"], "map_pressure": base["map"], "spo2": base["spo2"], "respiratory_rate": base["rr"], "temperature": base["temp"], "serum_lactate": base["lac"], "gcs_score": base["gcs"], "urine_output": base["uo"]}.items()}
            
            # Case specific vital trends
            if status == "deceased" and i == 1: # Gradual
                factor = (11 - h) / 11
                v["heart_rate"] = 124 * factor
                v["map_pressure"] = 65 * factor
                v["spo2"] = 88 * factor
            elif status == "deceased" and i == 2: # Sudden
                if h >= 10: 
                    v["heart_rate"] = 0; v["map_pressure"] = 0; v["spo2"] = 0
            elif status == "hardware_failure" and h >= 9:
                v["heart_rate"] = 0; v["map_pressure"] = 0

            v["timestamp"] = (datetime.now() - timedelta(hours=11-h)).isoformat()
            vitals_history.append(v)
            
        patient["baseline_stats"] = compute_baseline_stats(vitals_history)
        patient_cohort.append((patient, vitals_history))
            
    return patient_cohort

def compute_baseline_stats(vitals: List[Dict]) -> Dict:
    features = ["heart_rate", "map_pressure", "spo2", "respiratory_rate",
                 "temperature", "serum_lactate", "gcs_score", "urine_output"]
    stats = {}
    for feat in features:
        vals = [v[feat] for v in vitals if v[feat] > 0] # Avoid zeros for baseline
        if not vals: vals = [0]
        stats[feat] = {
            "mean": float(np.mean(vals)),
            "std": float(np.std(vals)) if np.std(vals) > 0 else 1.0
        }
    return stats

def normalize_vitals(vitals: List[Dict], baseline_stats: Dict) -> np.ndarray:
    features = ["heart_rate", "map_pressure", "spo2", "respiratory_rate",
                 "temperature", "serum_lactate", "gcs_score", "urine_output"]
    normalized = []
    for v in vitals:
        row = []
        for feat in features:
            val = v.get(feat, 0)
            stats = baseline_stats.get(feat, {"mean": 0, "std": 1})
            z = (val - stats["mean"]) / stats["std"]
            row.append(z)
        normalized.append(row)
    return np.array(normalized, dtype=np.float32)

def seed_demo_data():
    init_db()
    clear_all_data()
    patient_cohort = generate_synthetic_patients()
    for patient, vitals in patient_cohort:
        store_patient(patient)
        for v in vitals:
            store_vitals(patient["patient_id"], v)
    print(f"[OK] Seeded Enterprise Cohort: {len(patient_cohort)} Indian Patients")
