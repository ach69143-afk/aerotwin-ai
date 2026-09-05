import pandas as pd
from sklearn.ensemble import IsolationForest

class EngineHealthMonitor:
    def __init__(self):
        # Isolation Forest anomaly detect karta hai
        self.ai_model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False
        self.baseline_data = []

    def train_model(self, normal_data):
        df = pd.DataFrame(normal_data)
        features = df[['rpm', 'cht', 'oil_pressure', 'vibration']]
        self.ai_model.fit(features)
        self.is_trained = True

    def predict_health(self, current_data):
        if not self.is_trained:
            return "HEALTHY", "N/A", 0.0, "NORMAL"
            
        df_current = pd.DataFrame([current_data])
        features = df_current[['rpm', 'cht', 'oil_pressure', 'vibration']]
        
        prediction = self.ai_model.predict(features)[0]
        anomaly_score = self.ai_model.decision_function(features)[0]
        
        health_status = "HEALTHY" if prediction == 1 else "ANOMALY DETECTED"
        risk_level = "NORMAL"
        
        rul = "N/A"
        if prediction == -1:
            risk_level = "WARNING"
            current_cht = current_data['cht']
            time_left = (180.0 - current_cht) / 0.5 
            if time_left > 0:
                rul = f"{round(time_left, 1)}s"
            else:
                rul = "0s"
                health_status = "CRITICAL FAILURE"
                risk_level = "CRITICAL"
                
            if current_cht >= 170:
                risk_level = "CRITICAL"

        # Calculate a pseudo "health percentage" based on anomaly score and CHT
        health_pct = 98.0
        if prediction == -1:
            current_cht = current_data['cht']
            # Scale down from 98% based on how close CHT is to 180
            penalty = max(0, (current_cht - 150) / 30 * 98)
            health_pct = max(0.0, 98.0 - penalty)

        return health_status, rul, anomaly_score, risk_level, round(health_pct, 1)
