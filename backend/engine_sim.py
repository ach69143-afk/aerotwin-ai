import random
from datetime import datetime

class AeroEngineSimulator:
    def __init__(self):
        self.reset()

    def reset(self):
        self.rpm = 5000.0
        self.cht = 150.0
        self.oil_pressure = 4.0
        self.vibration = 0.2
        
        self.fault_active = False
        self.fault_type = "NONE"
        self.fault_severity = 0.0

    def trigger_fault(self, fault_type: str = "GENERIC"):
        self.fault_active = True
        self.fault_type = fault_type
        self.fault_severity = 0.0

    def get_sensor_data(self):
        # Base normal values with natural noise
        current_rpm = self.rpm + random.uniform(-50, 50)
        current_cht = self.cht + random.uniform(-2, 2)
        current_oil = self.oil_pressure + random.uniform(-0.1, 0.1)
        current_vib = self.vibration + random.uniform(-0.02, 0.02)

        if self.fault_active:
            # Progress severity slowly over time
            self.fault_severity = min(1.0, self.fault_severity + 0.01)
            sev = self.fault_severity

            if self.fault_type == "MISFIRE":
                current_rpm += random.uniform(-300 * sev, 300 * sev)
                current_vib += 0.8 * sev + random.uniform(-0.2, 0.2) * sev
                current_cht += 10 * sev
                
            elif self.fault_type == "INJECTOR_ABNORMALITY":
                # Drops in RPM
                if random.random() < 0.3:
                    current_rpm -= random.uniform(100 * sev, 400 * sev)
                current_vib += 0.4 * sev
                current_cht -= 5 * sev

            elif self.fault_type == "LUBRICATION_ISSUE":
                current_oil -= 2.8 * sev
                current_vib += 0.5 * sev
                current_cht += 15 * sev

            elif self.fault_type == "OVERHEATING":
                current_cht += 35 * sev
                current_oil -= 0.5 * sev
                
            elif self.fault_type == "ABNORMAL_VIBRATION":
                current_vib += 1.5 * sev
                current_rpm += random.uniform(-100 * sev, 100 * sev)

            elif self.fault_type == "SENSOR_DRIFT":
                # Only CHT drifts up steadily with almost no extra noise
                current_cht += 30 * sev
                
            else:
                # GENERIC fault
                current_rpm -= (sev * 100) + random.uniform(-50, 50)
                current_cht += (sev * 25) + random.uniform(-2, 2)
                current_oil -= (sev * 1.5) + random.uniform(-0.1, 0.1)
                current_vib += (sev * 0.8) + random.uniform(-0.02, 0.02)

        return {
            "timestamp": str(datetime.now().strftime("%H:%M:%S")),
            "rpm": round(current_rpm, 2),
            "cht": round(current_cht, 2),
            "oil_pressure": round(current_oil, 2),
            "vibration": round(current_vib, 2)
        }
