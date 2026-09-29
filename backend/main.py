import asyncio
import json
import os
import random
import secrets
from contextlib import suppress
from enum import Enum
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine_sim import AeroEngineSimulator
from smart_engine import EngineHealthMonitor


class FaultType(str, Enum):
    TURBOCHARGER_BOOST_LEAK = "TURBOCHARGER_BOOST_LEAK"
    OIL_CAVITATION = "OIL_CAVITATION"
    CYLINDER2_INJECTOR_CLOG = "CYLINDER2_INJECTOR_CLOG"
    ALTERNATOR_RAIL_DROP = "ALTERNATOR_RAIL_DROP"
    MAP_SENSOR_DRIFT = "MAP_SENSOR_DRIFT"


class FaultRequest(BaseModel):
    fault_type: FaultType = FaultType.TURBOCHARGER_BOOST_LEAK


ENVIRONMENT = os.getenv("AEROTWIN_ENV", "development").lower()
CONTROL_TOKEN = os.getenv("AEROTWIN_CONTROL_TOKEN")
DEFAULT_LOCAL_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("AEROTWIN_ALLOWED_ORIGINS", DEFAULT_LOCAL_ORIGINS).split(",")
    if origin.strip()
]

if ENVIRONMENT == "production" and not CONTROL_TOKEN:
    raise RuntimeError(
        "AEROTWIN_CONTROL_TOKEN must be configured when AEROTWIN_ENV=production."
    )

app = FastAPI(title="Aerotwin AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)

engine = AeroEngineSimulator()
monitor = EngineHealthMonitor()
latest_telemetry: Optional[dict] = None
simulation_task: Optional[asyncio.Task] = None


def require_control_token(authorization: Optional[str] = Header(default=None)):
    """Protect mutating controls outside local development.

    Production requires a bearer token. A real deployment should issue this
    credential through an authenticated operator gateway, never commit it to
    the frontend source tree.
    """
    if not CONTROL_TOKEN:
        return

    expected = f"Bearer {CONTROL_TOKEN}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A valid operator token is required for engine controls.",
        )


def build_normal_baseline():
    """Generate a varied demo baseline that includes both cruise and startup
    telemetry so the Isolation Forest learns that gradual startup transients
    are normal behaviour, not faults.
    """
    import math
    rng = random.Random(42)
    normal_history = []

    # Use a temporary simulator instance to compute realistic startup targets
    _sim = AeroEngineSimulator()

    # ── 1.  Steady-state cruise data (bulk of training) ──
    for _ in range(320):
        normal_history.append({
            "rpm": rng.gauss(5200.0, 25.0),
            "cht": rng.gauss(105.0, 1.5),
            "oil_pressure": rng.gauss(4.2, 0.08),
            "vibration": max(0.05, rng.gauss(0.3, 0.015)),
            "map_pressure": rng.gauss(38.0, 0.3),
            "turbo_rpm": rng.gauss(42000.0, 300.0),
            "cyl2_egt": rng.gauss(780.0, 3.0),
            "cyl2_cht": rng.gauss(105.0, 1.5),
            "voltage_lane_a": rng.gauss(14.2, 0.08),
            "voltage_lane_b": rng.gauss(14.2, 0.08),
            "throttle": rng.gauss(75.0, 0.5),
            "engine_state": "RUNNING",
        })

    # ── 2.  Startup ramp data — uses the same curves as _compute_startup_targets ──
    # Walk through RPM from 0 → 5200 in steps, computing the correlated
    # parameter values at each step so the model sees the realistic startup
    # regime.
    for rpm_int in range(0, 5201, 200):
        rpm_frac = rpm_int / _sim.healthy_rpm
        (cht_t, oil_t, vib_t, map_t, turbo_t,
         c2egt_t, c2cht_t, vla_t, vlb_t, thr_t) = _sim._compute_startup_targets(rpm_frac)

        for _ in range(4):
            normal_history.append({
                "rpm": max(0.0, rng.gauss(float(rpm_int), 20.0)),
                "cht": rng.gauss(cht_t, max(0.5, 1.5 * rpm_frac)),
                "oil_pressure": max(0.0, rng.gauss(oil_t, max(0.01, 0.08 * rpm_frac))),
                "vibration": max(0.0, rng.gauss(vib_t, 0.015)),
                "map_pressure": rng.gauss(map_t, max(0.1, 0.3 * rpm_frac)),
                "turbo_rpm": max(0.0, rng.gauss(turbo_t, max(10.0, 300.0 * rpm_frac))),
                "cyl2_egt": rng.gauss(c2egt_t, max(0.5, 3.0 * rpm_frac)),
                "cyl2_cht": rng.gauss(c2cht_t, max(0.5, 1.5 * rpm_frac)),
                "voltage_lane_a": max(0.0, rng.gauss(vla_t, max(0.01, 0.08 * rpm_frac))),
                "voltage_lane_b": max(0.0, rng.gauss(vlb_t, max(0.01, 0.08 * rpm_frac))),
                "throttle": max(0.0, rng.gauss(thr_t, 0.5)),
                "engine_state": "OFF" if rpm_int == 0 else "STARTING",
            })

    # ── 3.  Cooldown / stopping data ──
    # Engine stopped but temperatures still elevated — gradually falling.
    for cool_frac_pct in range(0, 101, 10):
        cool_frac = cool_frac_pct / 100.0  # 0 = just stopped, 1 = fully cooled
        for _ in range(3):
            normal_history.append({
                "rpm": 0.0,
                "cht": rng.gauss(105.0 - 75.0 * cool_frac, 1.5),
                "oil_pressure": 0.0,
                "vibration": max(0.0, rng.gauss(0.02, 0.005)),
                "map_pressure": rng.gauss(29.9, 0.1),
                "turbo_rpm": 0.0,
                "cyl2_egt": rng.gauss(780.0 - 750.0 * cool_frac, 3.0),
                "cyl2_cht": rng.gauss(105.0 - 75.0 * cool_frac, 1.5),
                "voltage_lane_a": 0.0,
                "voltage_lane_b": 0.0,
                "throttle": 0.0,
                "engine_state": "COOLDOWN",
            })

    return normal_history


def create_payload(sensor_data):
    (
        health_status,
        rul,
        anomaly_score,
        risk_level,
        health_pct,
        likely_fault,
        recommendation,
        recommendation_reason,
        recommendation_priority,
    ) = monitor.predict_health(sensor_data)

    return {
        "timestamp": sensor_data["timestamp"],
        "rpm": sensor_data["rpm"],
        "cht": sensor_data["cht"],
        "oilPressure": sensor_data["oil_pressure"],
        "vibration": sensor_data["vibration"],
        "mapPressure": sensor_data["map_pressure"],
        "turboRpm": sensor_data["turbo_rpm"],
        "cyl2Egt": sensor_data["cyl2_egt"],
        "cyl2Cht": sensor_data["cyl2_cht"],
        "voltageLaneA": sensor_data["voltage_lane_a"],
        "voltageLaneB": sensor_data["voltage_lane_b"],
        "throttle": sensor_data["throttle"],
        "healthPct": health_pct,
        "risk": risk_level,
        "rul": rul,
        "anomalyScore": round(anomaly_score, 4),
        "status": health_status,
        "likelyFault": likely_fault,
        "recommendation": recommendation,
        "recommendationReason": recommendation_reason,
        "recommendationPriority": recommendation_priority,
        "engineState": sensor_data["engine_state"],
        "faultActive": sensor_data.get("fault_active", False),
        "faultType": sensor_data.get("fault_type", "NONE"),
        "faultSeverity": sensor_data.get("fault_severity", 0.0),
    }


async def run_simulation():
    """Advance the shared simulator once at 10 Hz, regardless of viewer count."""
    global latest_telemetry
    while True:
        try:
            latest_telemetry = create_payload(engine.get_sensor_data())
        except Exception as e:
            print(f"ERROR IN RUN_SIMULATION: {e}")
            import traceback
            traceback.print_exc()
        await asyncio.sleep(0.1)


@app.on_event("startup")
async def startup_event():
    global simulation_task
    print("Training AI model on varied normal engine behavior...")
    monitor.train_model(build_normal_baseline())
    simulation_task = asyncio.create_task(run_simulation())
    print("AI model trained and telemetry simulation started.")


@app.on_event("shutdown")
async def shutdown_event():
    if simulation_task:
        simulation_task.cancel()
        with suppress(asyncio.CancelledError):
            await simulation_task


@app.post("/api/start-engine", dependencies=[Depends(require_control_token)])
async def start_engine():
    if not engine.start_engine():
        state = engine.engine_state
        if state == "STARTING":
            detail = "Engine is starting."
        elif state in ["RUNNING", "HOLD"]:
            detail = "Engine is already running."
        elif state in ["STOPPING", "COOLDOWN"]:
            detail = "Engine is cooling down. Wait until OFF before starting."
        else:
            detail = "Engine is not OFF."
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return {"status": "Engine starting"}


@app.post("/api/stop-engine", dependencies=[Depends(require_control_token)])
async def stop_engine():
    if not engine.stop_engine():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Engine is already OFF or stopping.")
    return {"status": "Engine stopping"}


@app.post("/api/hold-engine", dependencies=[Depends(require_control_token)])
async def hold_engine():
    if engine.engine_state == "HOLD":
        engine.resume_engine()
        return {"status": "Engine resumed"}
    if not engine.hold_engine():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Engine must be RUNNING to hold RPM.")
    return {"status": "Engine holding"}


@app.post("/api/simulate-fault", dependencies=[Depends(require_control_token)])
async def simulate_fault(request: FaultRequest):
    if not engine.trigger_fault(request.fault_type.value):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot simulate a fault while engine is OFF.")
    return {"status": f"Fault '{request.fault_type.value}' injected successfully"}


@app.post("/api/stop-fault", dependencies=[Depends(require_control_token)])
async def stop_fault():
    if not engine.stop_fault():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No active fault to stop.")
    return {"status": "Fault stopped successfully"}


@app.post("/api/reset", dependencies=[Depends(require_control_token)])
async def reset_simulation():
    engine.reset()
    return {"status": "Simulation reset successfully"}


active_connections = 0

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    global active_connections
    # CORS middleware does not validate WebSocket origins.
    if ENVIRONMENT == "production" and websocket.headers.get("origin") not in ALLOWED_ORIGINS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    active_connections += 1
    try:
        while True:
            if latest_telemetry is not None:
                await websocket.send_text(json.dumps(latest_telemetry))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as error:
        print(f"WebSocket error: {error}")
    finally:
        active_connections -= 1
        if active_connections == 0:
            print("No active frontend sessions. Resetting engine to OFF.")
            engine.reset()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
