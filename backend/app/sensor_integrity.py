"""
Sensor Integrity & Lead-Off Detection Layer for Project Chronos.
Distinguishes between clinical emergencies (arrest) and technical faults (sensor failure).
"""

import numpy as np
from typing import Dict, List, Tuple, Optional

class SensorGuard:
    def __init__(self):
        # Thresholds for technical fault detection
        self.TECHNICAL_FAULT_THRESHOLDS = {
            "Heart Rate": {"min": 30, "max": 220, "max_drop": 0.6},
            "MAP": {"min": 40, "max": 180, "max_drop": 0.5},
            "SpO2": {"min": 50, "max": 100, "max_drop": 0.4},
        }

    def validate_vitals(self, current_vitals: Dict[str, float], history: List[Dict[str, float]]) -> Tuple[bool, str]:
        """
        Validates vitals against physiological cross-checks and technical thresholds.
        Returns: (is_valid, error_message)
        """
        
        # 1. Check for Absolute Zero (Lead-off)
        for feature, value in current_vitals.items():
            if value == 0.0:
                # If HR is 0, but MAP is > 60, it's a lead-off, not a death.
                if feature == "Heart Rate" and current_vitals.get("MAP", 0) > 60:
                    return False, f"TECHNICAL FAULT: Heart Rate sensor disconnected (Lead-Off detected). MAP is {current_vitals.get('MAP')} mmHg."
                
                # If SpO2 is 0, but Respiratory Rate is 12-20, it's likely a probe-off.
                if feature == "SpO2" and 10 < current_vitals.get("Respiratory Rate", 0) < 30:
                    return False, "TECHNICAL FAULT: SpO2 probe disconnected. Patient still breathing."

        # 2. Check for Implausible Step-Functions (Signal Integrity)
        if len(history) > 0:
            last_reading = history[-1]
            for feature, value in current_vitals.items():
                if feature in self.TECHNICAL_FAULT_THRESHOLDS:
                    prev_value = last_reading.get(feature, value)
                    if prev_value > 0:
                        drop_ratio = (prev_value - value) / prev_value
                        if drop_ratio > self.TECHNICAL_FAULT_THRESHOLDS[feature]["max_drop"]:
                             return False, f"SIGNAL QUALITY ALERT: Unrealistic {feature} drop from {prev_value} to {value}. Potential sensor displacement."

        # 3. Physiological Cross-Check (The "Multivariate" Solution)
        hr = current_vitals.get("Heart Rate", 0)
        map_p = current_vitals.get("MAP", 0)
        spo2 = current_vitals.get("SpO2", 0)

        # Cardiac Arrest check: ALL hemodynamic markers must collapse together
        if hr < 40 and map_p < 45 and spo2 < 70:
            return True, "CLINICAL EMERGENCY: True Hemodynamic Collapse detected. All markers consistent."

        # If only one is extremely low, it's highly suspicious of a sensor error
        if hr < 20 and map_p > 60:
             return False, "TECHNICAL FAULT: Asymmetric hemodynamic data. HR indicates arrest but MAP indicates life. Check ECG leads."

        return True, "Signals valid."

# Integration Example for the Backend:
# guard = SensorGuard()
# is_valid, msg = guard.validate_vitals(new_vitals, patient_history)
# if not is_valid:
#     # Trigger Yellow Technical Alarm instead of Red Clinical Alarm
#     trigger_technical_alert(msg)
