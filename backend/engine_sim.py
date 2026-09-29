import random
import time
import math
from datetime import datetime


class AeroEngineSimulator:
    def __init__(self):
        self.last_tick_time = time.time()
        self.reset()

    def reset(self):
        self.engine_state = "OFF"

        # Internal smooth telemetry values — core
        self.rpm = 0.0
        self.cht = 30.0
        self.oil_pressure = 0.0
        self.vibration = 0.02

        # New telemetry channels (Rotax 915 iS specific)
        self.map_pressure = 29.9       # Manifold Absolute Pressure (inHg) (Ambient)
        self.turbo_rpm = 0.0           # Turbocharger RPM
        self.cyl2_egt = 30.0           # Cylinder 2 Exhaust Gas Temperature (°C)
        self.cyl2_cht = 30.0           # Cylinder 2 CHT (°C)
        self.voltage_lane_a = 0.0      # Lane A voltage (V)
        self.voltage_lane_b = 0.0      # Lane B voltage (V)
        self.throttle = 0.0            # Throttle position (%)

        # Fault system
        self.fault_active = False
        self.fault_type = "NONE"
        self.fault_severity = 0.0       # 0.0 to 1.0, continuous
        self.target_severity = 0.0      # What severity is ramping toward
        self.fault_recovering = False    # True when fault stopped but severity > 0

        # Startup tracking — time-based linear ramp
        self.startup_start_time = None   # time.time() when START was pressed
        self.startup_rate = 115.0        # RPM per second (~45s to reach 5200)

        # Smooth telemetry targets (what values are heading toward)
        self.target_rpm = 0.0
        self.target_cht = 30.0
        self.target_oil = 0.0
        self.target_vib = 0.02
        self.target_map = 29.9
        self.target_turbo_rpm = 0.0
        self.target_cyl2_egt = 30.0
        self.target_cyl2_cht = 30.0
        self.target_vlane_a = 0.0
        self.target_vlane_b = 0.0
        self.target_throttle = 0.0

        # Healthy baseline targets (Rotax 915 iS at cruise)
        self.healthy_rpm = 5200.0
        self.healthy_cht = 105.0
        self.healthy_oil = 4.2
        self.healthy_vib = 0.3
        self.healthy_map = 38.0
        self.healthy_turbo_rpm = 42000.0
        self.healthy_cyl2_egt = 780.0
        self.healthy_cyl2_cht = 105.0
        self.healthy_vlane_a = 14.2
        self.healthy_vlane_b = 14.2
        self.healthy_throttle = 75.0

    def start_engine(self):
        if self.engine_state == "OFF":
            self.engine_state = "STARTING"
            self.startup_start_time = time.time()
            return True
        return False

    def stop_engine(self):
        if self.engine_state in ["STARTING", "RUNNING", "HOLD"]:
            self.engine_state = "STOPPING"
            # Clear faults on shutdown
            self.fault_active = False
            self.target_severity = 0.0
            self.fault_recovering = True
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
        if was_active:
            self.fault_active = False
            self.target_severity = 0.0
            self.fault_recovering = True
            # DO NOT instantly zero severity — let it ramp down
        return was_active

    def trigger_fault(self, fault_type: str = "TURBOCHARGER_BOOST_LEAK"):
        if self.engine_state != "OFF":
            self.fault_active = True
            self.fault_type = fault_type
            self.target_severity = 1.0
            self.fault_recovering = False
            # Start from current severity (allows re-triggering during recovery)
            return True
        return False

    def _lerp(self, current, target, rate, dt):
        """Smoothly move current toward target."""
        diff = target - current
        step = diff * min(1.0, rate * dt)
        return current + step

    def _compute_fault_targets(self, sev):
        """Compute target telemetry values based on fault type and severity.

        Five Rotax 915 iS fault models from faults.pdf:
        1. TURBOCHARGER_BOOST_LEAK — MAP ↓, Turbo RPM ↑
        2. OIL_CAVITATION — Oil Pressure ↓, Vibration ↑ (30-60s progression)
        3. CYLINDER2_INJECTOR_CLOG — Cyl2 EGT ↑, Cyl2 CHT ↑
        4. ALTERNATOR_RAIL_DROP — Lane A ↓, Lane B stable
        5. MAP_SENSOR_DRIFT — MAP ↓, RPM/Throttle stay stable
        """
        # Start from healthy baselines
        rpm_t = self.healthy_rpm
        cht_t = self.healthy_cht
        oil_t = self.healthy_oil
        vib_t = self.healthy_vib
        map_t = self.healthy_map
        turbo_t = self.healthy_turbo_rpm
        c2egt_t = self.healthy_cyl2_egt
        c2cht_t = self.healthy_cyl2_cht
        vla_t = self.healthy_vlane_a
        vlb_t = self.healthy_vlane_b
        thr_t = self.healthy_throttle

        if self.fault_type == "TURBOCHARGER_BOOST_LEAK":
            # MAP drops from 38 → 26 inHg, Turbo RPM rises from 42k → 52k
            map_t -= 12.0 * sev             # 38 → 26 inHg
            turbo_t += 10000.0 * sev         # 42k → 52k RPM
            rpm_t -= 300 * sev               # RPM degrades slightly due to boost loss
            cht_t += 8 * sev                 # Slight thermal increase
            vib_t += 0.4 * sev               # Compressor surge vibration

        elif self.fault_type == "OIL_CAVITATION":
            # Oil Pressure drops from 4.2 → 1.2 bar, Vibration rises from 0.3 → 2.4 g
            # 30-60s progression (handled by severity ramp rate)
            oil_t -= 3.0 * sev              # 4.2 → 1.2 bar
            oil_t = max(0.8, oil_t)
            vib_t += 2.1 * sev              # 0.3 → 2.4 g
            rpm_t -= 500 * sev              # Bearing friction degradation
            cht_t += 15 * sev               # Thermal rise from friction

        elif self.fault_type == "CYLINDER2_INJECTOR_CLOG":
            # Cyl2 EGT rises from 780 → 910°C, Cyl2 CHT rises from 105 → 138°C
            c2egt_t += 130.0 * sev           # 780 → 910°C
            c2cht_t += 33.0 * sev            # 105 → 138°C
            cht_t += 12 * sev                # Overall CHT rises moderately
            rpm_t -= 150 * sev               # Slight RPM roughness
            vib_t += 0.5 * sev               # Combustion imbalance vibration

        elif self.fault_type == "ALTERNATOR_RAIL_DROP":
            # Lane A drops from 14.2 → 11.0V, Lane B stays 14.2 → 14.1V
            vla_t -= 3.2 * sev              # 14.2 → 11.0 V
            vlb_t -= 0.1 * sev              # 14.2 → 14.1 V (slight sympathetic)
            # Engine mechanically fine but ECU may destabilize
            rpm_t -= 80 * sev                # Minor RPM fluctuation from ECU

        elif self.fault_type == "MAP_SENSOR_DRIFT":
            # MAP sensor reads low: 38 → 22 inHg, but RPM ~5200, Throttle ~75%
            map_t -= 16.0 * sev              # 38 → 22 inHg (sensor reading)
            # RPM and throttle remain stable — this is a sensor problem, not mechanical
            rpm_t += 0                       # Stays ~5200
            thr_t += 0                       # Stays ~75%

        return rpm_t, cht_t, oil_t, vib_t, map_t, turbo_t, c2egt_t, c2cht_t, vla_t, vlb_t, thr_t

    def get_sensor_data(self):
        current_time = time.time()
        elapsed = current_time - self.last_tick_time
        if elapsed > 1.0:
            elapsed = 0.1
        self.last_tick_time = current_time

        # ── Severity ramping ──
        if self.fault_active:
            # Per-fault ramp rates (OIL_CAVITATION is slower: 30-60s progression)
            if self.fault_type == "OIL_CAVITATION":
                severity_rate = 0.04   # Slow: reaches ~1.0 in ~25-30 seconds
            elif self.fault_type == "TURBOCHARGER_BOOST_LEAK":
                severity_rate = 0.15   # Moderate: ~7-8 seconds
            elif self.fault_type == "CYLINDER2_INJECTOR_CLOG":
                severity_rate = 0.10   # Moderate: ~10 seconds
            elif self.fault_type == "ALTERNATOR_RAIL_DROP":
                severity_rate = 0.25   # Faster: ~4-5 seconds (electrical)
            elif self.fault_type == "MAP_SENSOR_DRIFT":
                severity_rate = 0.06   # Slow drift: ~15-20 seconds
            else:
                severity_rate = 0.15

            self.fault_severity = self._lerp(
                self.fault_severity, self.target_severity, severity_rate, elapsed
            )
        elif self.fault_recovering:
            # Ramp severity DOWN toward 0.0
            recovery_rate = 0.6  # recovers in about 1.5-2 seconds
            self.fault_severity = self._lerp(
                self.fault_severity, 0.0, recovery_rate, elapsed
            )
            if self.fault_severity < 0.005:
                self.fault_severity = 0.0
                self.fault_recovering = False
                self.fault_type = "NONE"

        sev = self.fault_severity

        # ── Engine state machine ──
        if self.engine_state == "OFF":
            self.target_rpm = 0.0
            self.target_cht = 30.0
            self.target_oil = 0.0
            self.target_vib = 0.02
            self.target_map = 29.9
            self.target_turbo_rpm = 0.0
            self.target_cyl2_egt = 30.0
            self.target_cyl2_cht = 30.0
            self.target_vlane_a = 0.0
            self.target_vlane_b = 0.0
            self.target_throttle = 0.0

        elif self.engine_state == "STARTING":
            # Time-based linear RPM ramp: ~115 RPM/sec → ~45s to 5200
            if self.startup_start_time is not None:
                startup_elapsed = current_time - self.startup_start_time
                self.target_rpm = min(self.healthy_rpm, startup_elapsed * self.startup_rate)
            else:
                self.target_rpm = 0.0

            # All other params stay at healthy baselines during startup
            self.target_cht = self.healthy_cht
            self.target_oil = self.healthy_oil
            self.target_vib = self.healthy_vib
            self.target_map = self.healthy_map
            self.target_turbo_rpm = self.healthy_turbo_rpm
            self.target_cyl2_egt = self.healthy_cyl2_egt
            self.target_cyl2_cht = self.healthy_cyl2_cht
            self.target_vlane_a = self.healthy_vlane_a
            self.target_vlane_b = self.healthy_vlane_b
            self.target_throttle = self.healthy_throttle

            # Transition to RUNNING when RPM reaches operating range
            if self.rpm >= 5100:
                self.engine_state = "RUNNING"
                self.startup_start_time = None

        elif self.engine_state == "RUNNING" or self.engine_state == "HOLD":
            if sev > 0.01:
                # Compute fault-affected targets
                (ft_rpm, ft_cht, ft_oil, ft_vib, ft_map, ft_turbo,
                 ft_c2egt, ft_c2cht, ft_vla, ft_vlb, ft_thr) = self._compute_fault_targets(sev)
                self.target_rpm = ft_rpm
                self.target_cht = ft_cht
                self.target_oil = ft_oil
                self.target_vib = ft_vib
                self.target_map = ft_map
                self.target_turbo_rpm = ft_turbo
                self.target_cyl2_egt = ft_c2egt
                self.target_cyl2_cht = ft_c2cht
                self.target_vlane_a = ft_vla
                self.target_vlane_b = ft_vlb
                self.target_throttle = ft_thr
            else:
                # Healthy targets
                self.target_rpm = self.healthy_rpm
                self.target_cht = self.healthy_cht
                self.target_oil = self.healthy_oil
                self.target_vib = self.healthy_vib
                self.target_map = self.healthy_map
                self.target_turbo_rpm = self.healthy_turbo_rpm
                self.target_cyl2_egt = self.healthy_cyl2_egt
                self.target_cyl2_cht = self.healthy_cyl2_cht
                self.target_vlane_a = self.healthy_vlane_a
                self.target_vlane_b = self.healthy_vlane_b
                self.target_throttle = self.healthy_throttle

        elif self.engine_state == "STOPPING":
            self.target_rpm = 0.0
            self.target_oil = 0.0
            self.target_vib = 0.02
            self.target_map = 29.9
            self.target_turbo_rpm = 0.0
            self.target_vlane_a = 0.0
            self.target_vlane_b = 0.0
            self.target_throttle = 0.0
            # CHT/EGT stay high until COOLDOWN
            
            if self.rpm <= 100:
                self.rpm = 0.0
                self.engine_state = "COOLDOWN"
                self.fault_severity = 0.0
                self.fault_recovering = False
                self.fault_type = "NONE"

        elif self.engine_state == "COOLDOWN":
            self.target_rpm = 0.0
            self.target_oil = 0.0
            self.target_vib = 0.02
            self.target_map = 29.9
            self.target_turbo_rpm = 0.0
            self.target_vlane_a = 0.0
            self.target_vlane_b = 0.0
            self.target_throttle = 0.0
            
            self.target_cht = 30.0
            self.target_cyl2_egt = 30.0
            self.target_cyl2_cht = 30.0
            
            # Transition to OFF when cooled down enough
            if self.cht <= 35.0 and self.cyl2_egt <= 35.0:
                self.engine_state = "OFF"

        # ── Smooth telemetry toward targets ──
        if self.engine_state == "STARTING":
            rpm_rate = 1.0
        elif self.engine_state == "STOPPING":
            rpm_rate = 2.5  # Moderate shutdown
        else:
            rpm_rate = 2.0  # Normal tracking

        if self.engine_state == "STARTING":
            self.rpm = self.target_rpm
        else:
            self.rpm = self._lerp(self.rpm, self.target_rpm, rpm_rate, elapsed)

        self.cht = self._lerp(self.cht, self.target_cht, 0.1 if self.engine_state == "COOLDOWN" else 0.8, elapsed)
        self.oil_pressure = self._lerp(self.oil_pressure, self.target_oil, 1.2, elapsed)
        self.vibration = self._lerp(self.vibration, self.target_vib, 1.5, elapsed)
        self.map_pressure = self._lerp(self.map_pressure, self.target_map, 1.0, elapsed)
        self.turbo_rpm = self._lerp(self.turbo_rpm, self.target_turbo_rpm, 0.8, elapsed)
        self.cyl2_egt = self._lerp(self.cyl2_egt, self.target_cyl2_egt, 0.2 if self.engine_state == "COOLDOWN" else 0.6, elapsed)
        self.cyl2_cht = self._lerp(self.cyl2_cht, self.target_cyl2_cht, 0.1 if self.engine_state == "COOLDOWN" else 0.5, elapsed)
        self.voltage_lane_a = self._lerp(self.voltage_lane_a, self.target_vlane_a, 2.0, elapsed)
        self.voltage_lane_b = self._lerp(self.voltage_lane_b, self.target_vlane_b, 2.0, elapsed)
        self.throttle = self._lerp(self.throttle, self.target_throttle, 1.5, elapsed)

        # Clamp values
        self.rpm = max(0.0, self.rpm)
        self.oil_pressure = max(0.0, self.oil_pressure)
        self.vibration = max(0.0, self.vibration)
        self.map_pressure = max(10.0, self.map_pressure)
        self.turbo_rpm = max(0.0, self.turbo_rpm)
        self.cyl2_egt = max(20.0, self.cyl2_egt)
        self.cyl2_cht = max(20.0, self.cyl2_cht)
        self.voltage_lane_a = max(0.0, self.voltage_lane_a)
        self.voltage_lane_b = max(0.0, self.voltage_lane_b)
        self.throttle = max(0.0, min(100.0, self.throttle))

        # ── Add realistic noise ──
        c_rpm = self.rpm
        c_cht = self.cht
        c_oil = self.oil_pressure
        c_vib = self.vibration
        c_map = self.map_pressure
        c_turbo = self.turbo_rpm
        c_c2egt = self.cyl2_egt
        c_c2cht = self.cyl2_cht
        c_vla = self.voltage_lane_a
        c_vlb = self.voltage_lane_b
        c_thr = self.throttle

        if self.engine_state != "OFF":
            # Base sensor noise
            c_rpm += random.gauss(0, 15)
            c_cht += random.gauss(0, 0.5)
            c_oil += random.gauss(0, 0.03)
            c_vib += random.gauss(0, 0.01)
            c_map += random.gauss(0, 0.2)
            c_turbo += random.gauss(0, 200)
            c_c2egt += random.gauss(0, 2.0)
            c_c2cht += random.gauss(0, 0.3)
            c_vla += random.gauss(0, 0.05)
            c_vlb += random.gauss(0, 0.05)
            c_thr += random.gauss(0, 0.3)

            # Additional fault-driven fluctuation (correlated instability)
            if sev > 0.05:
                t = time.time()
                if self.fault_type == "TURBOCHARGER_BOOST_LEAK":
                    # Compressor surge oscillation
                    c_turbo += math.sin(t * 6.0) * 500 * sev
                    c_map += math.sin(t * 4.0) * 0.8 * sev
                    c_rpm += random.gauss(0, 25 * sev)

                elif self.fault_type == "OIL_CAVITATION":
                    # Bearing rumble — high-frequency vibration noise
                    c_vib += math.sin(t * 15.0) * 0.15 * sev
                    c_vib += random.gauss(0, 0.08 * sev)
                    c_rpm += random.gauss(0, 35 * sev)
                    c_oil += random.gauss(0, 0.06 * sev)

                elif self.fault_type == "CYLINDER2_INJECTOR_CLOG":
                    # Combustion roughness in Cyl2
                    c_c2egt += random.gauss(0, 8 * sev)
                    c_c2cht += random.gauss(0, 1.5 * sev)
                    c_rpm += math.sin(t * 8.0) * 40 * sev
                    c_vib += random.gauss(0, 0.04 * sev)

                elif self.fault_type == "ALTERNATOR_RAIL_DROP":
                    # Electrical ripple on Lane A
                    c_vla += math.sin(t * 20.0) * 0.3 * sev
                    c_rpm += random.gauss(0, 15 * sev)

                elif self.fault_type == "MAP_SENSOR_DRIFT":
                    # Slow sensor drift — low noise
                    c_map += random.gauss(0, 0.5 * sev)

        # Final clamps for reported values
        c_rpm = max(0.0, c_rpm)
        c_oil = max(0.0, c_oil)
        c_vib = max(0.0, c_vib)
        c_map = max(10.0, c_map)
        c_turbo = max(0.0, c_turbo)
        c_c2egt = max(20.0, c_c2egt)
        c_c2cht = max(20.0, c_c2cht)
        c_vla = max(0.0, c_vla)
        c_vlb = max(0.0, c_vlb)
        c_thr = max(0.0, min(100.0, c_thr))

        return {
            "timestamp": str(datetime.now().strftime("%H:%M:%S")),
            "rpm": round(c_rpm, 2),
            "cht": round(c_cht, 2),
            "oil_pressure": round(c_oil, 2),
            "vibration": round(c_vib, 2),
            "map_pressure": round(c_map, 2),
            "turbo_rpm": round(c_turbo, 2),
            "cyl2_egt": round(c_c2egt, 2),
            "cyl2_cht": round(c_c2cht, 2),
            "voltage_lane_a": round(c_vla, 2),
            "voltage_lane_b": round(c_vlb, 2),
            "throttle": round(c_thr, 2),
            "engine_state": self.engine_state,
            "fault_active": self.fault_active,
            "fault_type": self.fault_type,
            "fault_severity": round(self.fault_severity, 4)
        }
