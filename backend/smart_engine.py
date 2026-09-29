import pandas as pd
from sklearn.ensemble import IsolationForest
import time

FEATURE_COLUMNS = ['rpm', 'cht', 'oil_pressure', 'vibration', 'map_pressure',
                   'turbo_rpm', 'cyl2_egt', 'cyl2_cht', 'voltage_lane_a',
                   'voltage_lane_b', 'throttle']

class EngineHealthMonitor:
    def __init__(self):
        # Isolation Forest anomaly detect karta hai
        self.ai_model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False
        self.baseline_data = []
        self.current_health = 100.0
        self.current_rul = 180.0
        self.last_update_time = time.time()

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
        # Oil cavitation — critical oil pressure loss
        if data['oil_pressure'] < 2.0:
            return "OIL_CAVITATION"
        # Cylinder 2 overheating
        if data.get('cyl2_egt', 780) >= 870:
            return "CYLINDER2_INJECTOR_CLOG"
        # Turbocharger anomaly — MAP too low while RPM is high AND turbo RPM is extremely high
        if data.get('map_pressure', 38) < 30 and data['rpm'] > 4500 and data.get('turbo_rpm', 42000) > 46000:
            return "TURBOCHARGER_BOOST_LEAK"
        # Vibration critical threshold
        if data['vibration'] >= 1.5:
            return "OIL_CAVITATION"
        # Electrical rail drop
        if data.get('voltage_lane_a', 14.2) < 12.0:
            return "ALTERNATOR_RAIL_DROP"
        return None

    def diagnose(self, data):
        """Heuristic diagnostic rules for the 5 Rotax 915 iS fault models."""
        rpm = data['rpm']
        cht = data['cht']
        oil = data['oil_pressure']
        vib = data['vibration']
        map_p = data.get('map_pressure', 38.0)
        turbo = data.get('turbo_rpm', 42000.0)
        c2egt = data.get('cyl2_egt', 780.0)
        c2cht = data.get('cyl2_cht', 105.0)
        vla = data.get('voltage_lane_a', 14.2)
        vlb = data.get('voltage_lane_b', 14.2)
        throttle = data.get('throttle', 75.0)

        # OIL_CAVITATION: oil pressure drops, vibration rises
        if oil < 2.5 and vib > 0.8:
            return "OIL_CAVITATION"

        # TURBOCHARGER_BOOST_LEAK: MAP drops but turbo RPM rises
        if map_p < 32 and turbo > 46000 and rpm > 4000:
            return "TURBOCHARGER_BOOST_LEAK"

        # MAP_SENSOR_DRIFT: MAP reads low but RPM, Throttle, and Turbo RPM are normal
        if map_p < 30 and rpm > 4800 and throttle > 70 and turbo < 45000:
            return "MAP_SENSOR_DRIFT"

        # CYLINDER2_INJECTOR_CLOG: Cyl2 EGT/CHT elevated
        if c2egt > 830 and c2cht > 115:
            return "CYLINDER2_INJECTOR_CLOG"

        # ALTERNATOR_RAIL_DROP: Lane A voltage drops, Lane B stable
        if vla < 12.5 and vlb > 13.5:
            return "ALTERNATOR_RAIL_DROP"

        # Fallback: check individual parameter deviations
        if oil < 3.0:
            return "OIL_CAVITATION"
        if c2egt > 830:
            return "CYLINDER2_INJECTOR_CLOG"
        if vla < 13.0:
            return "ALTERNATOR_RAIL_DROP"
        if map_p < 32 and turbo > 45000:
            return "TURBOCHARGER_BOOST_LEAK"
        if map_p < 32:
            return "MAP_SENSOR_DRIFT"

        return "TURBOCHARGER_BOOST_LEAK"

    def get_recommendation(self, likely_fault):
        if likely_fault == "TURBOCHARGER_BOOST_LEAK":
            return {
                "recommendation": "Reduce throttle to 50%, inspect turbocharger ducting and intercooler for boost leaks. Prepare for emergency landing if MAP continues to decay.",
                "reason": "Manifold pressure decay with turbocharger over-speed detected — probable boost duct leak or wastegate malfunction.",
                "priority": "HIGH"
            }
        elif likely_fault == "OIL_CAVITATION":
            return {
                "recommendation": "Reduce engine load immediately. Prepare for precautionary shutdown. Oil system cavitation may cause bearing seizure within 30-60 seconds.",
                "reason": "Oil pressure critical drop with high-frequency vibration — bearing cavitation progression detected.",
                "priority": "CRITICAL"
            }
        elif likely_fault == "CYLINDER2_INJECTOR_CLOG":
            return {
                "recommendation": "Reduce engine load, monitor Cyl2 EGT/CHT trends. Schedule injector cleaning or replacement at next maintenance window.",
                "reason": "Cylinder 2 exhaust gas temperature and CHT above normal — injector flow restriction detected.",
                "priority": "HIGH"
            }
        elif likely_fault == "ALTERNATOR_RAIL_DROP":
            return {
                "recommendation": "Switch critical avionics to Lane B. Reduce electrical load on Lane A. Inspect alternator brushes, rectifier, and wiring harness.",
                "reason": "Lane A voltage decay detected while Lane B remains stable — alternator or regulator fault on primary rail.",
                "priority": "HIGH"
            }
        elif likely_fault == "MAP_SENSOR_DRIFT":
            return {
                "recommendation": "Cross-reference MAP with turbocharger RPM and throttle position. If engine performance is normal, suspect MAP sensor calibration drift. Schedule sensor replacement.",
                "reason": "MAP sensor reading inconsistent with RPM and throttle — sensor drift suspected, not a mechanical fault.",
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
        
        # Calculate elapsed time
        current_time = time.time()
        elapsed = current_time - self.last_update_time
        if elapsed > 1.0:
            elapsed = 0.1  # Prevent huge jumps if paused
        self.last_update_time = current_time

        # If engine is OFF, don't flag anomalies and reset health state
        if engine_state == "OFF":
            self.current_health = 100.0
            self.current_rul = 180.0
            return "STANDBY", "N/A", 0.0, "NORMAL", 100.0, "NONE", "NO ACTION REQUIRED", "", "LOW"
            
        prediction = self.ai_model.predict(features)[0]
        anomaly_score = self.ai_model.decision_function(features)[0]
        safety_fault = self.detect_safety_fault(current_data)
        
        # Avoid false positives during startup sequence
        if engine_state == "STARTING" and current_data['rpm'] < 4000:
            prediction = 1
            anomaly_score = 0.0
            
        # Use fault_severity > 0 as the trigger (covers both active and recovering faults)
        if fault_severity > 0.02:
            prediction = -1

        # Safety limits override the statistical model
        if safety_fault:
            prediction = -1

        if prediction == -1 and anomaly_score >= 0:
            anomaly_score = -0.01
            
        likely_fault = "NONE"
        if prediction == -1:
            if fault_severity > 0.02 and fault_type != "NONE":
                likely_fault = fault_type
            else:
                likely_fault = safety_fault or self.diagnose(current_data)
        
        # Determine RUL bounds based on fault type
        max_rul = 180.0
        if likely_fault == "TURBOCHARGER_BOOST_LEAK":
            max_rul = 600.0
        elif likely_fault == "OIL_CAVITATION":
            max_rul = 120.0
        elif likely_fault in ["CYLINDER2_INJECTOR_CLOG", "ALTERNATOR_RAIL_DROP"]:
            max_rul = 3600.0

        if prediction == -1:
            if likely_fault != "MAP_SENSOR_DRIFT":
                # Ensure RUL degradation is exactly proportional to health degradation for synchronization
                target_deg_rate = 100.0 / max_rul
                # Accelerate degradation slightly as severity peaks
                actual_deg_rate = target_deg_rate * max(0.1, fault_severity)
                
                self.current_health -= actual_deg_rate * elapsed
            else:
                # MAP_SENSOR_DRIFT does not degrade actual engine health
                self.current_health = max(90.0, self.current_health)
        else:
            # Recover health if normal
            self.current_health += 5.0 * elapsed
            
        self.current_health = max(0.0, min(100.0, self.current_health))
        health_pct = self.current_health

        # Synchronize RUL strictly with health percentage
        if likely_fault == "MAP_SENSOR_DRIFT":
            self.current_rul = -1.0
        else:
            self.current_rul = (health_pct / 100.0) * max_rul

        # Determine Risk Level based on health
        if health_pct <= 0.0:
            risk_level = "CRITICAL"
            health_status = "CRITICAL FAILURE"
        elif health_pct < 35.0 or current_data.get('oil_pressure', 4.2) < 1.5 or current_data.get('vibration', 0.0) > 2.0:
            risk_level = "CRITICAL"
            health_status = "CRITICAL FAILURE"
        elif health_pct < 60.0:
            risk_level = "HIGH"
            health_status = "ANOMALY DETECTED"
        elif health_pct < 80.0:
            risk_level = "WARNING"
            health_status = "ANOMALY DETECTED"
        else:
            risk_level = "NORMAL"
            health_status = "HEALTHY"

        # Specific UI override for MAP_SENSOR_DRIFT
        if likely_fault == "MAP_SENSOR_DRIFT":
            health_status = "SENSOR INVALIDATION DETECTED — DISREGARDING READOUT"
            risk_level = "WARNING"

        if prediction == -1 or health_pct < 100.0:
            if likely_fault == "MAP_SENSOR_DRIFT":
                rul = "N/A"
            elif self.current_rul <= 0:
                rul = "0.0s"
            else:
                rul = f"{round(self.current_rul, 1)}s"
        else:
            rul = "N/A"

        rec_data = {
            "recommendation": "NO ACTION REQUIRED",
            "reason": "",
            "priority": "LOW"
        }
        
        if prediction == -1:
            rec_data = self.get_recommendation(likely_fault)
            
            # Elevate priority if risk is critical
            if risk_level == "CRITICAL" or risk_level == "HIGH":
                rec_data["priority"] = "CRITICAL"

        return health_status, rul, anomaly_score, risk_level, round(health_pct, 1), likely_fault, rec_data["recommendation"], rec_data["reason"], rec_data["priority"]
