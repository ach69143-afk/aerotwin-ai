[AeroTwin_AI_Judges_README.md](https://github.com/user-attachments/files/32841860/AeroTwin_AI_Judges_README.md)
# AeroTwin AI — Digital Twin & Engine Health Monitoring

> **Smart India Hackathon 2026 — Round 2 Prototype**

AeroTwin AI is a prototype **Digital Twin and engine health-monitoring platform** for aero-piston engines in **MALE-UAV applications**. The system combines a software-based engine simulator, real-time telemetry, anomaly detection, engineering diagnostic rules, health/risk assessment, prototype Remaining Useful Life (RUL) estimation, maintenance advisories, and an interactive 3D engine Digital Twin.

The current implementation is designed to demonstrate the **complete Digital Twin workflow** in a controlled software environment. The present prototype uses **simulated engine telemetry**, not live telemetry from a real UAV.

---

## 1. Project Overview

AeroTwin AI addresses a practical engine-monitoring problem:

**How can an operator continuously observe engine condition, detect abnormal behavior early, identify the likely fault signature, understand degradation, and receive a maintenance-oriented advisory from a single monitoring system?**

The prototype creates a software representation of an engine and continuously updates that representation from simulated telemetry.

The system is intended to demonstrate:

- Real-time engine condition monitoring
- Multi-parameter telemetry visualization
- Unsupervised anomaly detection
- Engineering-rule-based fault diagnosis
- Progressive fault simulation
- Engine health and risk assessment
- Prototype RUL estimation
- Maintenance advisory generation
- Interactive 3D Digital Twin visualization
- Historical telemetry and degradation tracking

### Core Digital Twin idea

The 3D model is not the Digital Twin by itself.

The Digital Twin combines:

```text
Engine / Telemetry Simulation
        ↓
Engine State
        ↓
Fault & Degradation Modeling
        ↓
Anomaly Detection
        ↓
Diagnostic Assessment
        ↓
Health / Risk
        ↓
RUL / Prognostics
        ↓
Maintenance Advisory
        ↓
3D Digital Twin + Dashboard
```

---

# 2. What Makes AeroTwin AI a Digital Twin?

AeroTwin AI treats the 3D engine as a live visual representation of the simulated engine state.

The system synchronizes:

- Engine state
- RPM
- MAP pressure
- Turbocharger RPM
- CHT
- Cylinder-specific EGT
- Oil pressure
- Vibration
- Electrical system voltage
- Fault state
- Fault severity
- Engine health
- Risk level
- RUL
- Diagnostic output

This means the 3D model and dashboard are intended to represent the **same underlying simulated engine condition** rather than functioning as separate visual components.

---

# 3. Current Prototype Scope

The current prototype uses a **software engine simulator** to reproduce engine behavior and controlled fault scenarios.

The simulator allows a demonstration of:

1. Engine startup
2. Normal running
3. Hold/resume behavior
4. Manual fault injection
5. Progressive fault development
6. Diagnostic response
7. Health/risk deterioration
8. RUL degradation
9. Maintenance advisory generation
10. Engine shutdown and cooldown

### Important scope statement

The current prototype is **not directly connected to a real MALE-UAV engine**.

It demonstrates the software architecture and Digital Twin workflow using simulated telemetry. The architecture is intended to allow the simulator to be replaced later by an appropriate real-engine/ECU/UAV telemetry interface.

The prototype is **not a certified flight-control, flight-safety, or maintenance-release system**.

---

# 4. System Architecture

```text
┌─────────────────────────────────────────┐
│          Software Engine Simulator      │
│                                         │
│  RPM / MAP / Turbo RPM / CHT / EGT      │
│  Oil Pressure / Vibration / Voltage     │
│  Engine State / Fault Severity          │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│             FastAPI Backend             │
│                                         │
│  Engine State Management                │
│  Fault Simulation                       │
│  Telemetry Generation                   │
│  Diagnostic Pipeline                    │
└───────────────┬───────────────┬─────────┘
                │               │
                ▼               ▼
     ┌─────────────────┐  ┌──────────────────┐
     │ Isolation Forest│  │ Engineering      │
     │ Anomaly Detector│  │ Diagnostic Rules │
     └────────┬────────┘  └────────┬─────────┘
              └────────────┬───────┘
                           ▼
              ┌────────────────────────┐
              │ Health / Risk / RUL    │
              │ Maintenance Advisory  │
              └────────────┬───────────┘
                           │
                     WebSocket
                     Telemetry
                           │
                           ▼
┌─────────────────────────────────────────┐
│              React Frontend              │
│                                         │
│  Dashboard / Telemetry / Diagnostics   │
│  RUL / Historical Data / Controls       │
│  3D Digital Twin                       │
└─────────────────────────────────────────┘
```

### Communication model

The prototype uses two primary communication paths:

**Control path**

```text
React UI
   ↓
HTTP control request
   ↓
FastAPI backend
   ↓
Engine simulator state change
```

**Telemetry path**

```text
Engine simulator
   ↓
FastAPI
   ↓
WebSocket
   ↓
React / Zustand
   ↓
Dashboard + Charts + 3D Digital Twin
```

---

# 5. Backend

The backend is implemented in Python using FastAPI and provides:

- Engine state control
- Real-time telemetry streaming
- Fault injection
- Fault progression
- Diagnostic processing
- Anomaly detection
- Health/risk assessment
- Prototype RUL calculation
- Maintenance advisory data

### Backend technologies

- Python 3.12+
- FastAPI
- Uvicorn
- WebSockets
- NumPy
- Pandas
- scikit-learn

The project architecture uses a real-time telemetry stream and an Isolation Forest anomaly detector operating on a subset of telemetry variables.

---

# 6. AI / ML and Diagnostic Pipeline

AeroTwin AI uses a **hybrid approach** rather than relying on a single model.

## Layer 1 — Unsupervised anomaly detection

An **Isolation Forest** is used to identify telemetry patterns that deviate from the learned normal baseline.

The current prototype uses a multivariate feature set including:

- RPM
- CHT
- Oil pressure
- Vibration

The model is trained using synthetic/normal baseline data generated for the prototype.

## Layer 2 — Engineering diagnostic rules

Anomaly detection indicates that behavior is abnormal, but an anomaly model alone does not automatically establish the physical root cause.

Therefore, deterministic diagnostic rules examine the observed signature and classify the likely simulated condition.

Examples include:

- Thermal abnormality
- Vibration abnormality
- Lubrication-related degradation
- Injector-related abnormality
- Sensor invalidation
- Electrical rail degradation
- Turbocharger/boost abnormality

## Layer 3 — Safety/engineering threshold handling

Deterministic engineering limits can override a low ML anomaly score when a simulated physical variable reaches a defined critical boundary.

This is intended to prevent a critical simulated condition from being hidden by a statistical model.

### Pipeline summary

```text
Telemetry
   ↓
Isolation Forest
   ↓
Anomaly indication
   +
Engineering rules
   ↓
Fault classification
   ↓
Health / Risk assessment
   ↓
RUL / Degradation
   ↓
Maintenance Advisory
```

---

# 7. Fault Simulation

The current SIH demonstration focuses on **five critical fault scenarios**.

The key design principle is:

> A fault should progress from a healthy baseline toward a defined terminal extent rather than simply switching one value from normal to broken instantly.

Each fault has its own characteristic telemetry signature.

---

## Fault 1 — Turbocharger Boost Leak

### What it represents

A simulated loss of boost caused by a condition such as a leaking manifold connection or wastegate-related problem.

### Normal baseline

- MAP ≈ 38.0 inHg
- Turbo RPM ≈ 42,000 RPM

### Progression

After injection:

- MAP progressively decreases
- Turbo RPM progressively increases as the turbo attempts to compensate

### Terminal extent

- MAP ≈ 26.0 inHg
- Turbo RPM ≈ 52,000 RPM

### Expected diagnostic behavior

The Digital Twin should recognize the cross-parameter pattern:

```text
MAP ↓
Turbo RPM ↑
```

rather than treating either value in isolation.

---

## Fault 2 — High-Altitude Oil Cavitation

### What it represents

A simulated lubrication problem in which low-pressure conditions lead to oil-line cavitation and progressive lubrication degradation.

### Normal baseline

- Oil pressure ≈ 4.2 bar
- Vibration ≈ 0.3 g

### Progression

- Oil pressure progressively decreases
- Vibration progressively increases

### Terminal extent

- Oil pressure ≈ 1.2 bar
- Vibration ≈ 2.4 g

This is a progressive mechanical degradation scenario and is intended to show:

```text
Oil Pressure ↓
+
Vibration ↑
      ↓
Degradation ↑
      ↓
Health ↓
      ↓
Risk ↑
      ↓
RUL ↓
```

---

## Fault 3 — Cylinder 2 Injector Clog

### What it represents

A simulated partial injector blockage affecting Cylinder 2.

### Normal baseline

- Cylinder 2 EGT ≈ 780°C
- Cylinder 2 CHT ≈ 105°C

### Progression

- Cylinder 2 EGT increases
- Cylinder 2 CHT increases
- Vibration increases appropriately

### Terminal extent

- Cylinder 2 EGT ≈ 910°C
- Cylinder 2 CHT ≈ 138°C

The intended behavior is localized: Cylinder 2 becomes abnormal while the rest of the engine does not need to show the same thermal signature.

### Key diagnostic idea

This scenario demonstrates **cylinder-level localization** rather than treating the engine as a single undifferentiated sensor.

---

## Fault 4 — Alternator Rail Drop

### What it represents

A simulated electrical fault affecting one redundant electrical rail.

### Normal baseline

- Lane A ≈ 14.2 V
- Lane B ≈ 14.2 V

### Fault behavior

Lane A undergoes a sudden voltage drop.

### Terminal extent

- Lane A ≈ 11.0 V
- Lane B ≈ 14.1 V

### Key diagnostic idea

The system should recognize a **single-lane power degradation** while the redundant Lane B remains available.

The important feature is the difference between the two measurements:

```text
Lane A ↓↓↓
Lane B ≈ stable
```

---

## Fault 5 — MAP Sensor Drift / Invalidation

### What it represents

A simulated faulty MAP sensor rather than a true mechanical loss of engine power.

### Normal baseline

- MAP ≈ 38.0 inHg
- Mechanical RPM ≈ 5200 RPM
- Throttle ≈ 75%

### Fault behavior

- MAP progressively/strongly drops toward ≈ 22.0 inHg
- Mechanical RPM remains approximately stable

### Terminal extent

- MAP ≈ 22.0 inHg
- RPM remains approximately 5200 RPM

### Key diagnostic idea

The system should distinguish:

```text
Abnormal sensor reading
```

from:

```text
Actual mechanical engine degradation
```

This makes the scenario useful for demonstrating consistency checks using multiple correlated variables.

---

# 8. Fault Severity and Degradation

Faults are modeled as progressive states.

Conceptually:

```text
Healthy
   ↓
Fault Injected
   ↓
Early Deviation
   ↓
Moderate Degradation
   ↓
Severe Degradation
   ↓
Critical / Terminal Extent
```

The intended implementation uses fault severity as a common state variable so the following can respond consistently:

- Telemetry
- Diagnostics
- Health
- Risk
- RUL
- Maintenance advisory
- 3D Digital Twin state

This prevents contradictory states such as:

```text
Terminal fault
+
healthy engine
+
normal risk
+
"no action required"
```

---

# 9. Engine Lifecycle Simulation

The simulator models an engine lifecycle rather than a single static state.

## OFF / COLD

Representative behavior:

- Engine RPM = 0
- Turbo RPM = 0
- Oil pressure ≈ 0
- Fuel flow = 0
- Vibration near zero
- CHT/EGT near ambient/cold conditions
- No active fault

OFF does not mean engine failure.

## STARTING

Parameters progressively move toward the running baseline.

The intended sequence is approximately:

```text
RPM
0 → starter speed → 800 → 1500 → 3000 → 5000 RPM
```

At the same time:

- Oil pressure builds
- Turbo speed increases
- MAP moves toward operating conditions
- EGT increases
- CHT increases more slowly due to thermal inertia
- Electrical system comes online
- Vibration shows a small startup transient

Normal startup transients should not be interpreted as critical faults.

## RUNNING

The engine settles near its normal simulated operating baseline.

## HOLD / RESUME

The operator can hold the current simulated operating RPM and resume operation.

## STOPPING / COOLDOWN

Shutdown is progressive:

```text
RUNNING
   ↓
STOPPING
   ↓
COOLDOWN
   ↓
OFF
```

RPM, turbo speed, oil pressure, fuel flow and vibration reduce toward zero.

CHT and EGT should cool progressively rather than instantly resetting to ambient.

---

# 10. RUL — Remaining Useful Life

RUL is used as a **prototype prognostic indicator**.

Its purpose in this prototype is to demonstrate how increasing simulated degradation can be converted into a continuously changing estimate of remaining operating life.

### Intended progression

```text
Fault begins
    ↓
Severity increases
    ↓
Health decreases
    ↓
RUL decreases
    ↓
Terminal degradation
    ↓
RUL = 0
```

The RUL display and degradation trajectory should be based on the same underlying degradation history.

### Important limitation

The current RUL is a **prototype/simulated estimate**, not a validated production aerospace RUL predictor trained and validated against real engine fleet data.

For that reason, it should be presented to judges as a demonstration of the **prognostic workflow**, not as a certified prediction of real engine life.

---

# 11. Digital Twin Visualization

The frontend uses an interactive 3D engine model.

### Technologies

- Three.js
- React Three Fiber
- React Three Drei

The Digital Twin reacts to engine telemetry and fault severity.

### Intended visual states

**OFF**
- Stable
- Light metallic/white
- No fault glow

**STARTING**
- Gradual transition toward healthy green
- Small startup motion effects

**RUNNING**
- Stable healthy-state indication

**WARNING**
- Subtle amber indication

**FAULT**
- Progressive red indication based on fault severity
- Increased visual vibration where appropriate

The objective is to make the 3D model communicate the same engine condition shown by the numerical dashboard.

---

# 12. Frontend

The frontend is designed as a responsive engineering monitoring dashboard.

### Main sections

- Overview
- Engine
- Digital Twin
- Telemetry
- Diagnostics
- Maintenance
- Mission Replay
- Historical Data
- System

### Dashboard information

The current interface can present:

- System health
- Risk level
- RUL
- RPM
- MAP pressure
- Turbo RPM
- Voltage Lane A
- CHT
- Cylinder 2 EGT
- Oil pressure
- Vibration
- Digital Twin
- Diagnostic summary
- Active fault
- Engineering/maintenance advisory

The UI uses a professional **white + light-green engineering theme**, with red, blue and amber used as semantic status colors.

---

# 13. Maintenance Advisory

The project separates engineering diagnostics from a conversational AI-style interface.

The core diagnostic result is presented as a **Maintenance Advisory**.

Example normal state:

```text
MAINTENANCE ADVISORY

No action required.

Engine parameters are within normal operating conditions.
```

Example abnormal state:

```text
MAINTENANCE ADVISORY

Abnormal vibration detected.

Recommended Action:
Inspect rotating/mechanical components and reduce engine load.

Priority:
HIGH
```

The advisory is generated from the existing simulated diagnostic state.

It is a prototype operator aid and should not be presented as an autonomous flight-control command.

---

# 14. State Management and Data Flow

The frontend uses Zustand for client-side state management.

The intended high-frequency flow is:

```text
WebSocket telemetry
        ↓
Selective Zustand updates
        ↓
Required dashboard components
        ↓
Charts / diagnostics / 3D Digital Twin
```

This separation helps prevent the entire application from being unnecessarily coupled to every telemetry update.

---

# 15. Technology Stack

| Domain | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion |
| 3D Engine | Three.js, React Three Fiber, React Three Drei |
| State / Visualization | Zustand, Recharts, React Router DOM |
| Backend API | Python 3.12+, FastAPI, Uvicorn, WebSockets |
| Machine Learning | scikit-learn — Isolation Forest |
| Scientific/Data Processing | NumPy, Pandas |
| Deployment | Vercel (frontend), Render (backend) |

---

# 16. Deployment

### Frontend

https://aerotwin-ai-lac.vercel.app/

### Backend / FastAPI Documentation

https://aerotwin-ai.onrender.com/docs

### Local frontend

```text
http://localhost:5173
```

### Local backend

```text
http://localhost:8000
```

---

# 17. Local Setup

## Prerequisites

- Node.js 18+
- Python 3.10+

## Start the backend

```bash
cd backend
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run FastAPI:

```bash
uvicorn main:app --reload --port 8000
```

## Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 18. Demonstration Workflow for Judges

AeroTwin AI is best demonstrated as a short sequence.

## Step 1 — Normal startup

Start with the engine OFF.

Show:

- RPM = 0
- cold/ambient thermal state
- no active fault
- normal risk

Press **Start Engine**.

Demonstrate:

```text
OFF
 ↓
STARTING
 ↓
RPM increases
 ↓
pressures/temperatures build
 ↓
RUNNING
```

## Step 2 — Show the Digital Twin

Point out that the 3D model is synchronized with the simulated engine state.

## Step 3 — Inject a fault

Select one of the five fault scenarios.

Demonstrate progressive change:

```text
Fault injection
 ↓
Telemetry deviation
 ↓
Anomaly
 ↓
Diagnosis
 ↓
Health degradation
 ↓
Risk increase
 ↓
RUL decrease
 ↓
Maintenance Advisory
 ↓
3D fault indication
```

## Step 4 — Demonstrate a distinctive fault

For example, with MAP Sensor Drift:

```text
MAP ↓
RPM ≈ stable
```

Explain that the system can distinguish a suspicious sensor reading from a mechanical RPM loss.

## Step 5 — Demonstrate recovery/reset

Stop the fault where supported, stop the engine, allow cooldown, and reset to a clean OFF state.

---

# 19. Why the Five Faults Are Different

A major design objective is that the system should not simply react to a generic "fault" switch.

Each fault has a distinct signature.

```text
Turbo Boost Leak
MAP ↓ + Turbo RPM ↑

Oil Cavitation
Oil Pressure ↓ + Vibration ↑

Cylinder 2 Injector Clog
Cylinder 2 EGT ↑ + Cylinder 2 CHT ↑

Alternator Rail Drop
Lane A Voltage ↓ + Lane B stable

MAP Sensor Drift
MAP ↓ + Mechanical RPM stable
```

This lets the prototype demonstrate **multi-parameter fault reasoning** rather than simple single-threshold alarming.

---

# 20. Current Limitations and Future Extension

The current implementation is intentionally a prototype.

### Current limitations

- Telemetry is simulated rather than captured directly from a real UAV engine.
- The ML anomaly detector uses synthetic/normal baseline data.
- Fault diagnosis includes deterministic engineering rules.
- RUL is a prototype/simulated prognostic indicator.
- The current simulator does not represent every possible engine subsystem or failure mode.
- Real aircraft integration would require an appropriate engine/ECU/data acquisition and telemetry interface.
- Production aerospace deployment would require extensive validation, calibration, cybersecurity, reliability testing, and safety/certification processes.

### Future extension path

```text
Current Prototype
      ↓
Real Engine / ECU Telemetry
      ↓
Hardware Data Acquisition
      ↓
Secure UAV Telemetry Link
      ↓
Ground Station Integration
      ↓
Real Engine Historical Data
      ↓
Validated Fault Models
      ↓
Validated RUL Model
      ↓
Fleet-Level Predictive Maintenance
```

Potential future technical extensions include:

- Real engine sensor/ECU integration
- EGT and temperature sensing across multiple cylinders
- Oil temperature and fuel-flow integration
- Battery/alternator health monitoring
- Injection timing telemetry
- Physics-informed models
- Real degradation datasets
- More robust RUL models
- Edge inference
- Explainable AI
- Mission/environment simulation
- Fleet-level analytics
- Secure telemetry and audit trails

These are future extensions and are not claimed as fully implemented in the current prototype.

---

# 21. Engineering Design Principles

AeroTwin AI follows several core principles:

### 1. Multi-parameter reasoning

Engine condition should be inferred from correlated telemetry rather than one value alone.

### 2. Hybrid AI + engineering logic

Machine learning identifies anomalous behavior while deterministic engineering rules help classify known simulated signatures and enforce critical limits.

### 3. Progressive degradation

Faults develop over time rather than simply appearing as a final failure value.

### 4. State consistency

Telemetry, diagnostics, health, risk, RUL, advisories and the 3D Digital Twin should represent the same simulated engine state.

### 5. Human-in-the-loop operation

The prototype produces information and maintenance-oriented advisories for an operator; it is not intended to autonomously command flight operations.

---

# 22. Judge-Focused Summary

### Problem

Continuous engine monitoring can involve many parameters and failure signatures. A useful system should help an operator detect abnormal behavior early, understand what is happening, and observe how the condition evolves.

### Solution

AeroTwin AI creates a software Digital Twin that connects:

```text
Telemetry
+
Simulation
+
Anomaly Detection
+
Fault Diagnostics
+
Health Assessment
+
RUL
+
Maintenance Advisory
+
3D Visualization
```

### Demonstration value

A judge can inject a specific fault and watch the system move through:

```text
Healthy
   ↓
Fault begins
   ↓
Telemetry deviation
   ↓
Anomaly detected
   ↓
Fault diagnosed
   ↓
Health deteriorates
   ↓
Risk increases
   ↓
RUL decreases
   ↓
Maintenance Advisory
   ↓
3D Digital Twin changes
```

The five scenarios are intentionally different so that the prototype demonstrates **fault-specific multi-parameter behavior**, not just a generic alarm.

---

# 23. Quick Judge Questions

### Is this connected to a real UAV?

**Current prototype:** No. It uses a software engine simulator to demonstrate the complete workflow. The architecture is designed for future integration with real engine/ECU/UAV telemetry.

### Is the RUL a real prediction?

It is a **prototype/simulated RUL estimate** based on the simulated degradation state. It is not claimed to be a validated real-engine fleet prognostic model.

### Why Isolation Forest?

It provides unsupervised anomaly detection without requiring labeled examples for every possible fault. It is used here as one layer of the hybrid detection pipeline.

### Why use rule-based diagnostics as well?

Anomaly detection tells us that behavior is unusual; deterministic engineering rules help map the observed telemetry signature to a known simulated fault category and enforce defined critical limits.

### Why is the 3D model important?

It provides a visual representation of the Digital Twin's current simulated engine condition. The 3D model is a visualization layer within the broader Digital Twin workflow.

### What happens when a fault is injected?

The selected fault progressively changes its relevant telemetry signature. That change feeds the diagnostic, health, risk, RUL and advisory layers, and the 3D Digital Twin reflects the same severity.

---

# 24. Important Terminology

For technical accuracy, use the following descriptions when presenting the project:

- **Prototype** instead of production-certified system
- **Simulated telemetry** instead of real aircraft telemetry
- **Prototype RUL estimate** instead of validated engine-life prediction
- **Maintenance advisory** instead of autonomous maintenance command
- **Representative engine model** instead of claiming the model is the exact target aircraft engine
- **Hybrid anomaly + engineering diagnostic system** instead of claiming a fully trained end-to-end AI fault classifier

---

## Status

**Smart India Hackathon 2026 — Round 2 Prototype**

The current project demonstrates an end-to-end Digital Twin workflow for simulated aerospace engine health monitoring, progressive fault simulation, anomaly detection, diagnostics, prognostics, and operator-oriented visualization.

---

## Documentation

For detailed architecture and implementation information, see:

`Aerotwin_AI_Architecture_Document.html`

---

<div align="center">

**AeroTwin AI**  
*Digital Twin & Engine Health Monitoring*

Developed for **Smart India Hackathon 2026**

</div>
