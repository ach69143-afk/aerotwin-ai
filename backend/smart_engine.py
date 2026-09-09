import pandas as pd
from sklearn.ensemble import IsolationForest


FEATURE_COLUMNS = ['rpm', 'cht', 'oil_pressure', 'vibration']

class EngineHealthMonitor:
    def __init__(self):
        # Isolation Forest anomaly detect karta hai
        self.ai_model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False
        self.baseline_data = []

    def train_model(self, normal_data):
        df = pd.DataFrame(normal_data)
        features = df[FEATURE_COLUMNS]
        if features.empty or features.isnull().values.any():
            raise ValueError("Normal training data must include finite telemetry features.")
        self.ai_model.fit(features)
        self.baseline_data = normal_data
        self.is_trained = True

    def detect_safety_fault(self, data):
        """Apply deterministic limits that must not depend on an ML prediction."""
        if data['oil_pressure'] < 2.0:
            return "LUBRICATION_ISSUE"
        if data['cht'] >= 165:
            return "OVERHEATING"
        if data['vibration'] >= 1.2:
            return "ABNORMAL_VIBRATION"
        return None

    def diagnose(self, data):
        # Very simple heuristic rules for diagnostic layer
        rpm, cht, oil, vib = data['rpm'], data['cht'], data['oil_pressure'], data['vibration']
        
        if oil < 2.0:
            return "LUBRICATION_ISSUE"
        elif cht > 165 and vib < 0.8:
            if oil < 3.8:
                return "OVERHEATING"
            else:
                return "SENSOR_DRIFT"
        elif vib > 1.2 and rpm > 4500:
            return "ABNORMAL_VIBRATION"
        elif vib > 0.5 and cht > 155:
            return "MISFIRE"
        elif rpm < 4600 and vib > 0.3:
            return "INJECTOR_ABNORMALITY"
            
        return "GENERIC"

    def get_recommendation(self, likely_fault):
        if likely_fault == "OVERHEATING":
            return {
                "recommendation": "Reduce throttle by approximately 15% and activate emergency cooling procedure.",
                "reason": "Elevated cylinder-head temperature trend detected.",
                "priority": "HIGH"
            }
        elif likely_fault == "MISFIRE":
            return {
                "recommendation": "Reduce engine load and inspect ignition/combustion system.",
                "reason": "RPM instability and elevated vibration pattern detected.",
                "priority": "HIGH"
            }
        elif likely_fault == "INJECTOR_ABNORMALITY":
            return {
                "recommendation": "Reduce engine load and inspect injector/fuel delivery system.",
                "reason": "Combustion instability detected.",
                "priority": "HIGH"
            }
        elif likely_fault == "LUBRICATION_ISSUE":
            return {
                "recommendation": "Reduce engine load and initiate lubrication-system inspection.",
                "reason": "Low oil-pressure trend detected.",
                "priority": "CRITICAL"
            }
        elif likely_fault == "ABNORMAL_VIBRATION":
            return {
                "recommendation": "Reduce engine load and inspect rotating/mechanical components.",
                "reason": "Abnormal vibration detected.",
                "priority": "HIGH"
            }
        elif likely_fault == "SENSOR_DRIFT":
            return {
                "recommendation": "Verify sensor integrity and cross-check telemetry with redundant measurements.",
                "reason": "Sensor trend inconsistent with expected engine behavior.",
                "priority": "MEDIUM"
            }
        elif likely_fault == "GENERIC":
            return {
                "recommendation": "Reduce engine load and inspect engine telemetry for abnormal behavior.",
                "reason": "Generic anomaly detected.",
                "priority": "MEDIUM"
            }
        return {
            "recommendation": "NO ACTION REQUIRED",
            "reason": "Engine operating within normal parameters.",
            "priority": "LOW"
        }

    def predict_health(self, current_data):
        if not self.is_trained:
            return "STANDBY", "N/A", 0.0, "NORMAL", 100.0, "NONE", "NO ACTION REQUIRED", "", "LOW"
            
        engine_state = current_data.get('engine_state', "OFF")
        fault_active = current_data.get('fault_active', False)
        fault_type = current_data.get('fault_type', "NONE")
        fault_severity = current_data.get('fault_severity', 0.0)
        
        df_current = pd.DataFrame([current_data])
        features = df_current[FEATURE_COLUMNS]
        
        # If engine is OFF or STARTING (and RPM very low), don't flag anomalies unless there's a serious sensor drift
        if engine_state == "OFF":
            return "STANDBY", "N/A", 0.0, "NORMAL", 100.0, "NONE", "NO ACTION REQUIRED", "", "LOW"
            
        prediction = self.ai_model.predict(features)[0]
        anomaly_score = self.ai_model.decision_function(features)[0]
        safety_fault = self.detect_safety_fault(current_data)
        
        # Avoid false positives during startup sequence if they happen
        if engine_state == "STARTING" and current_data['rpm'] < 4000:
            prediction = 1
            anomaly_score = 0.0
            
        # Deterministic override if fault is active (Synthetic Demo Requirement)
        if fault_active and fault_severity > 0.05:
            prediction = -1

        # Safety limits override the statistical model.  This protects against
        # a sparse or stale baseline failing to flag a dangerous measurement.
        if safety_fault:
            prediction = -1

        if prediction == -1 and anomaly_score >= 0:
            anomaly_score = -0.01
            
        health_status = "HEALTHY" if prediction == 1 else "ANOMALY DETECTED"
        risk_level = "NORMAL"
        
        rul = "N/A"
        
        health_pct = 100.0 if health_status == "HEALTHY" else 98.0
        
        if prediction == -1:
            # Scale health down based on severity
            if fault_active:
                health_pct = max(0.0, 98.0 - (fault_severity * 60.0))
            
            # Further penalize based on physical parameters
            current_cht = current_data['cht']
            penalty = max(0, (current_cht - 150) / 30 * 40)
            health_pct = max(0.0, health_pct - penalty)
            
            # Determine Risk Level
            if health_pct < 40.0 or current_cht >= 170 or current_data['oil_pressure'] < 1.5:
                risk_level = "CRITICAL"
                health_status = "CRITICAL FAILURE"
            elif health_pct < 70.0:
                risk_level = "HIGH"
            else:
                risk_level = "WARNING"
                
            # Compute RUL estimate based on health
            time_left = max(0, (health_pct / 100.0) * 180.0)
            rul = f"{round(time_left, 1)}s"

        likely_fault = "NONE"
        rec_data = {
            "recommendation": "NO ACTION REQUIRED",
            "reason": "",
            "priority": "LOW"
        }
        
        if prediction == -1:
            if fault_active and fault_type != "NONE":
                likely_fault = fault_type
            else:
                likely_fault = safety_fault or self.diagnose(current_data)
                
            rec_data = self.get_recommendation(likely_fault)
            
            # Elevate priority if risk is critical
            if risk_level == "CRITICAL" or risk_level == "HIGH":
                rec_data["priority"] = "CRITICAL"

        return health_status, rul, anomaly_score, risk_level, round(health_pct, 1), likely_fault, rec_data["recommendation"], rec_data["reason"], rec_data["priority"]
