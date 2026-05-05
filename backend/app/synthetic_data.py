import numpy as np
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict
from .database import init_db, store_patient, store_vitals, clear_all_data

def add_noise(val, scale=0.05):
    return val + np.random.normal(0, val * scale)

def generate_synthetic_patients():
    first_names = [
        "Arjun", "Priya", "Rahul", "Ananya", "Vikram", "Sunita", "Rohan", "Kavita", 
        "Sanjay", "Deepa", "Amit", "Meera", "Vijay", "Asha", "Rajesh", "Pooja",
        "Anil", "Jyoti", "Manoj", "Shanti", "Ravi", "Lata", "Dinesh", "Usha",
        "Kishore", "Rekha", "Suresh", "Seema", "Mohan", "Gita", "Ashok", "Sita",
        "Ramesh", "Maya", "Sunil", "Anita", "Pankaj", "Ritu", "Harish", "Neelam"
    ]
    last_names = [
        "Mehta", "Sharma", "Nair", "Iyer", "Gupta", "Verma", "Reddy", "Patel",
        "Singh", "Joshi", "Kulkarni", "Deshmukh", "Malhotra", "Bose", "Chatterjee",
        "Rao", "Menon", "Kapoor", "Khanna", "Trivedi", "Sarin", "Chopra"
    ]
    
    scenarios = [
        {"desc": "Post-CABG Recovery", "risk": "STABLE"},
        {"desc": "Septic Shock / Pneumonia", "risk": "CRITICAL"},
        {"desc": "Acute Myocardial Infarction", "risk": "HIGH"},
        {"desc": "Post-Trauma Observation", "risk": "WATCH"},
        {"desc": "Chronic Kidney Disease / Dialysis", "risk": "WATCH"},
        {"desc": "Gastrointestinal Bleeding", "risk": "HIGH"},
        {"desc": "Neurological Observation (Stroke)", "risk": "STABLE"},
        {"desc": "Post-Op Orthopedic Surgery", "risk": "STABLE"}
    ]

    patients = []
    for i in range(1, 109):
        pid = f"P{str(i).zfill(3)}"
        abha_id = f"{random.randint(10, 99)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        scenario = random.choice(scenarios)
        age = random.randint(22, 85)
        bed = f"{random.choice(['A', 'B', 'C', 'D'])}{random.randint(101, 127)}"
        
        patient = {
            "patient_id": pid,
            "abha_id": abha_id,
            "name": f"{fname} {lname}",
            "age": age,
            "sex": random.choice(["M", "F"]),
            "bed_id": bed,
            "admission_time": (datetime.now() - timedelta(hours=random.randint(12, 168))).isoformat(),
            "diagnosis": scenario["desc"],
            "status": "active"
        }
        
        # Initial 12-hour vitals block
        vitals_history = []
        base_vitals = {
            "heart_rate": 75 if scenario["risk"] == "STABLE" else 110 if scenario["risk"] == "CRITICAL" else 95,
            "map_pressure": 85 if scenario["risk"] == "STABLE" else 60 if scenario["risk"] == "CRITICAL" else 70,
            "spo2": 98 if scenario["risk"] == "STABLE" else 88 if scenario["risk"] == "CRITICAL" else 93,
            "respiratory_rate": 16 if scenario["risk"] == "STABLE" else 28 if scenario["risk"] == "CRITICAL" else 22,
            "temperature": 36.8 if scenario["risk"] == "STABLE" else 38.5 if scenario["risk"] == "CRITICAL" else 37.5,
            "serum_lactate": 1.1 if scenario["risk"] == "STABLE" else 4.5 if scenario["risk"] == "CRITICAL" else 2.2,
            "gcs_score": 15 if scenario["risk"] != "CRITICAL" else 11,
            "urine_output": 50 if scenario["risk"] == "STABLE" else 20 if scenario["risk"] == "CRITICAL" else 35
        }
        
        for h in range(12):
            v = {k: add_noise(v_base) for k, v_base in base_vitals.items()}
            v["timestamp"] = (datetime.now() - timedelta(hours=12-h)).isoformat()
            vitals_history.append(v)
            
        patient["baseline_stats"] = json.dumps(compute_baseline_stats(vitals_history))
        patients.append((patient, vitals_history))
            
    return patients

def compute_baseline_stats(vitals: List[Dict]) -> Dict:
    features = ["heart_rate", "map_pressure", "spo2", "respiratory_rate",
                 "temperature", "serum_lactate", "gcs_score", "urine_output"]
    stats = {}
    for feat in features:
        vals = [v[feat] for v in vitals]
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
    """Seed the database with 108 Indian patients."""
    init_db()
    clear_all_data()
    patient_cohort = generate_synthetic_patients()
    for patient, vitals in patient_cohort:
        store_patient(patient)
        for v in vitals:
            store_vitals(patient["patient_id"], v)
    print(f"[OK] Seeded Enterprise Cohort: {len(patient_cohort)} Indian Patients")
