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

# Global state to share across endpoints
simulation_active = True

@app.on_event("startup")
async def startup_event():
    print("Pre-training AI model on normal engine behavior...")
    normal_history = []
    for _ in range(20):
        normal_history.append(engine.get_sensor_data())
    monitor.train_model(normal_history)
    print("AI Model trained successfully.")

@app.post("/api/simulate-fault")
async def simulate_fault(request: FaultRequest = None):
    fault_type = request.fault_type if request else "GENERIC"
    engine.trigger_fault(fault_type)
    return {"status": f"Fault '{fault_type}' injected successfully"}

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
            health_status, rul, anomaly_score, risk_level, health_pct, likely_fault = monitor.predict_health(sensor_data)
            
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
                "likelyFault": likely_fault
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
