import random
import time
from datetime import datetime

class AeroEngineSimulator:
    def __init__(self):
        self.last_tick_time = time.time()
        self.reset()

    def reset(self):
        self.engine_state = "OFF"
        self.rpm = 0.0
        self.cht = 150.0
        self.oil_pressure = 4.0
        self.vibration = 0.2
        
        self.fault_active = False
        self.fault_type = "NONE"
        self.fault_severity = 0.0

    def start_engine(self):
        if self.engine_state == "OFF":
            self.engine_state = "STARTING"
            return True
        return False
            
    def stop_engine(self):
        if self.engine_state in ["STARTING", "RUNNING", "HOLD"]:
            self.engine_state = "STOPPING"
            self.fault_active = False
            self.fault_severity = 0.0
            self.fault_type = "NONE"
            return True
        return False
            
    def hold_engine(self):
        if self.engine_state == "RUNNING":
            self.engine_state = "HOLD"
            return True
        return False
            
    def resume_engine(self):
        if self.engine_state == "HOLD":
            self.engine_state = "RUNNING"
            return True
        return False
            
    def stop_fault(self):
        was_active = self.fault_active
        self.fault_active = False
        self.fault_severity = 0.0
        self.fault_type = "NONE"
        return was_active

    def trigger_fault(self, fault_type: str = "GENERIC"):
        if self.engine_state != "OFF":
            self.fault_active = True
            self.fault_type = fault_type
            self.fault_severity = 0.0
            return True
        return False

    def get_sensor_data(self):
        current_time = time.time()
        elapsed = current_time - self.last_tick_time
        if elapsed > 1.0:
            elapsed = 0.1
        self.last_tick_time = current_time

        # Update internal state based on engine_state
        if self.engine_state == "OFF":
            self.rpm = 0.0
            self.cht = max(150.0, self.cht - 0.5)
            self.oil_pressure = 4.0
            self.vibration = 0.2
        elif self.engine_state == "STARTING":
            acceleration_rate = 75.0
            self.rpm += acceleration_rate * elapsed
            
            if self.rpm >= 4950:
                self.rpm = 5000.0
                self.engine_state = "RUNNING"
        elif self.engine_state == "RUNNING":
            self.rpm = 5000.0
        elif self.engine_state == "HOLD":
            pass # Keep current RPM
        elif self.engine_state == "STOPPING":
            deceleration_rate = 150.0
            self.rpm -= deceleration_rate * elapsed
            if self.rpm <= 0:
                self.rpm = 0.0
                self.engine_state = "OFF"
                
        # If fault stopped, gradually recover
        if not self.fault_active and self.engine_state != "OFF":
            self.cht += (150.0 - self.cht) * 0.1
            self.oil_pressure += (4.0 - self.oil_pressure) * 0.1
            self.vibration += (0.2 - self.vibration) * 0.1

        # Base normal values with natural noise
        current_rpm = self.rpm
        if self.engine_state in ["STARTING", "RUNNING", "HOLD"]:
            current_rpm += random.uniform(-50, 50)
            
        current_cht = self.cht
        if self.engine_state != "OFF":
            current_cht += random.uniform(-2, 2)
            
        current_oil = self.oil_pressure
        if self.engine_state != "OFF":
            current_oil += random.uniform(-0.1, 0.1)
            
        current_vib = self.vibration
        if self.engine_state != "OFF":
            current_vib += random.uniform(-0.02, 0.02)

        if self.fault_active and self.engine_state != "OFF":
            # Progress severity slowly over time
            self.fault_severity = min(1.0, self.fault_severity + 0.01)
            sev = self.fault_severity

            if self.fault_type == "MISFIRE":
                current_rpm += random.uniform(-300 * sev, 300 * sev)
                current_vib += 0.8 * sev + random.uniform(-0.2, 0.2) * sev
                self.cht += 1.0 * sev
                current_cht = self.cht
                
            elif self.fault_type == "INJECTOR_ABNORMALITY":
                # Drops in RPM
                if random.random() < 0.3:
                    current_rpm -= random.uniform(100 * sev, 400 * sev)
                current_vib += 0.4 * sev
                self.cht -= 0.5 * sev
                current_cht = self.cht

            elif self.fault_type == "LUBRICATION_ISSUE":
                self.oil_pressure -= 0.2 * sev
                self.oil_pressure = max(0.5, self.oil_pressure)
                current_oil = self.oil_pressure
                current_vib += 0.5 * sev
                self.cht += 1.5 * sev
                current_cht = self.cht

            elif self.fault_type == "OVERHEATING":
                self.cht += 3.5 * sev
                current_cht = self.cht
                self.oil_pressure -= 0.05 * sev
                self.oil_pressure = max(1.0, self.oil_pressure)
                current_oil = self.oil_pressure
                
            elif self.fault_type == "ABNORMAL_VIBRATION":
                current_vib += 1.5 * sev
                current_rpm += random.uniform(-100 * sev, 100 * sev)

            elif self.fault_type == "SENSOR_DRIFT":
                # Only CHT drifts up steadily with almost no extra noise
                self.cht += 3.0 * sev
                current_cht = self.cht
                
            else:
                # GENERIC fault
                current_rpm -= (sev * 100) + random.uniform(-50, 50)
                self.cht += 2.5 * sev
                current_cht = self.cht
                self.oil_pressure -= 0.15 * sev
                self.oil_pressure = max(1.0, self.oil_pressure)
                current_oil = self.oil_pressure
                current_vib += (sev * 0.8) + random.uniform(-0.02, 0.02)

        # Update internal persistent state for next tick if we modified them in faults
        # We did so directly by assigning to self.cht, etc.

        return {
            "timestamp": str(datetime.now().strftime("%H:%M:%S")),
            "rpm": round(current_rpm, 2),
            "cht": round(current_cht, 2),
            "oil_pressure": round(current_oil, 2),
            "vibration": round(current_vib, 2),
            "engine_state": self.engine_state,
            "fault_active": self.fault_active,
            "fault_type": self.fault_type,
            "fault_severity": self.fault_severity
        }
