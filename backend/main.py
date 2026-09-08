import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine_sim import AeroEngineSimulator
from smart_engine import EngineHealthMonitor

class FaultRequest(BaseModel):
    fault_type: str = "GENERIC"

app = FastAPI(title="Aerotwin AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = AeroEngineSimulator()
monitor = EngineHealthMonitor()

@app.on_event("startup")
async def startup_event():
    print("Pre-training AI model on normal engine behavior...")
    normal_history = []
    # Train with different RPM stages to avoid false anomalies during startup
    for _ in range(5):
        normal_history.append({"rpm": 0.0, "cht": 150.0, "oil_pressure": 4.0, "vibration": 0.2, "engine_state": "OFF"})
    for _ in range(5):
        normal_history.append({"rpm": 800.0, "cht": 150.0, "oil_pressure": 4.0, "vibration": 0.2, "engine_state": "STARTING"})
    for _ in range(20):
        normal_history.append({"rpm": 5000.0, "cht": 150.0, "oil_pressure": 4.0, "vibration": 0.2, "engine_state": "RUNNING"})
    monitor.train_model(normal_history)
    print("AI Model trained successfully.")

@app.post("/api/start-engine")
async def start_engine():
    engine.start_engine()
    return {"status": "Engine starting"}

@app.post("/api/stop-engine")
async def stop_engine():
    engine.stop_engine()
    return {"status": "Engine stopping"}

@app.post("/api/hold-engine")
async def hold_engine():
    if engine.engine_state == "HOLD":
        engine.resume_engine()
        return {"status": "Engine resumed"}
    else:
        engine.hold_engine()
        return {"status": "Engine holding"}

@app.post("/api/simulate-fault")
async def simulate_fault(request: FaultRequest = None):
    fault_type = request.fault_type if request else "GENERIC"
    if engine.engine_state == "OFF":
        return {"status": "Cannot simulate fault while engine is OFF"}
    engine.trigger_fault(fault_type)
    return {"status": f"Fault '{fault_type}' injected successfully"}

@app.post("/api/stop-fault")
async def stop_fault():
    engine.stop_fault()
    return {"status": "Fault stopped successfully"}

@app.post("/api/reset")
async def reset_simulation():
    engine.reset()
    return {"status": "Simulation reset successfully"}

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Generate sensor data
            sensor_data = engine.get_sensor_data()
            
            # Predict health
            health_status, rul, anomaly_score, risk_level, health_pct, likely_fault, rec, rec_reason, rec_priority = monitor.predict_health(sensor_data)
            
            # Build payload
            payload = {
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
                "recommendation": rec,
                "recommendationReason": rec_reason,
                "recommendationPriority": rec_priority,
                "engineState": sensor_data["engine_state"],
                "faultActive": sensor_data.get("fault_active", False),
                "faultType": sensor_data.get("fault_type", "NONE")
            }
            
            await websocket.send_text(json.dumps(payload))
            # Send data at 10Hz
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
