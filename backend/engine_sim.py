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
        self.is_degrading = False
        self.degradation_step = 0

    def trigger_fault(self):
        self.is_degrading = True

    def get_sensor_data(self):
        if not self.is_degrading:
            current_rpm = self.rpm + random.uniform(-50, 50)
            current_cht = self.cht + random.uniform(-2, 2)
            current_oil = self.oil_pressure + random.uniform(-0.1, 0.1)
            current_vib = self.vibration + random.uniform(-0.02, 0.02)
        else:
            self.degradation_step += 1
            current_rpm = self.rpm - (self.degradation_step * 2) + random.uniform(-50, 50)
            current_cht = self.cht + (self.degradation_step * 0.5) + random.uniform(-2, 2)
            current_oil = self.oil_pressure - (self.degradation_step * 0.02) + random.uniform(-0.1, 0.1)
            current_vib = self.vibration + (self.degradation_step * 0.05) + random.uniform(-0.02, 0.02)

        return {
            "timestamp": str(datetime.now().strftime("%H:%M:%S")),
            "rpm": round(current_rpm, 2),
            "cht": round(current_cht, 2),
            "oil_pressure": round(current_oil, 2),
            "vibration": round(current_vib, 2)
        }
