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
    GENERIC = "GENERIC"
    MISFIRE = "MISFIRE"
    INJECTOR_ABNORMALITY = "INJECTOR_ABNORMALITY"
    LUBRICATION_ISSUE = "LUBRICATION_ISSUE"
    OVERHEATING = "OVERHEATING"
    ABNORMAL_VIBRATION = "ABNORMAL_VIBRATION"
    SENSOR_DRIFT = "SENSOR_DRIFT"


class FaultRequest(BaseModel):
    fault_type: FaultType = FaultType.GENERIC


ENVIRONMENT = os.getenv("AEROTWIN_ENV", "development").lower()
CONTROL_TOKEN = os.getenv("AEROTWIN_CONTROL_TOKEN")
DEFAULT_LOCAL_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
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
    """Generate a varied demo baseline until real healthy telemetry is supplied."""
    rng = random.Random(42)
    normal_history = []

    # Cover the normal operational RPM range and realistic sensor variation.
    for _ in range(320):
        normal_history.append({
            "rpm": rng.gauss(5000.0, 25.0),
            "cht": rng.gauss(150.0, 1.5),
            "oil_pressure": rng.gauss(4.0, 0.08),
            "vibration": max(0.05, rng.gauss(0.2, 0.015)),
            "engine_state": "RUNNING",
        })

    # The simulator also transitions through STARTING, so include that regime.
    for rpm in range(0, 5001, 250):
        for _ in range(4):
            normal_history.append({
                "rpm": max(0.0, rng.gauss(float(rpm), 20.0)),
                "cht": rng.gauss(150.0, 1.5),
                "oil_pressure": rng.gauss(4.0, 0.08),
                "vibration": max(0.05, rng.gauss(0.2, 0.015)),
                "engine_state": "STARTING" if rpm else "OFF",
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
    }


async def run_simulation():
    """Advance the shared simulator once at 10 Hz, regardless of viewer count."""
    global latest_telemetry
    while True:
        latest_telemetry = create_payload(engine.get_sensor_data())
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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Engine is not OFF.")
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


@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    # CORS middleware does not validate WebSocket origins.
    if ENVIRONMENT == "production" and websocket.headers.get("origin") not in ALLOWED_ORIGINS:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        while True:
            if latest_telemetry is not None:
                await websocket.send_text(json.dumps(latest_telemetry))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as error:
        print(f"WebSocket error: {error}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
