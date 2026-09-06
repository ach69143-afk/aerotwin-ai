import { create } from 'zustand';

export interface Telemetry {
  timestamp: string;
  rpm: number;
  cht: number;
  oilPressure: number;
  vibration: number;
  healthPct: number;
  risk: string;
  rul: string;
  anomalyScore: number;
  status: string;
  likelyFault?: string;
}

export interface FaultEvent {
  id: string;
  timestamp: string;
  type: 'SYSTEM' | 'AI' | 'THERMAL' | 'VIBRATION' | 'MISSION' | 'MECHANICAL';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Settings {
  autoRotation: boolean;
  animationIntensity: number; // 0-1
  showComponentLabels: boolean;
  showTelemetryOverlay: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

interface AppState {
  // Core telemetry — preserved from original
  telemetry: Telemetry | null;
  setTelemetry: (data: Telemetry) => void;
  isConnected: boolean;
  setConnected: (status: boolean) => void;

  // Throttled telemetry for UI components (updated at 4 FPS)
  throttledTelemetry: Telemetry | null;
  throttledHistory: Telemetry[];
  lastThrottleTime: number;

  // Session telemetry history
  telemetryHistory: Telemetry[];
  addToHistory: (data: Telemetry) => void;
  clearHistory: () => void;

  // Fault event timeline
  faultEvents: FaultEvent[];
  addFaultEvent: (event: FaultEvent) => void;
  clearFaultEvents: () => void;

  // Previous status tracking for fault detection
  previousStatus: string | null;
  setPreviousStatus: (status: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Core — preserved
  telemetry: null,
  throttledTelemetry: null,
  throttledHistory: [],
  lastThrottleTime: 0,
  setTelemetry: (data) => {
    const state = get();
    // Auto-add to history
    const newHistory = [...state.telemetryHistory, data];
    if (newHistory.length > 600) newHistory.shift(); // ~60s at 10Hz

    // Auto-detect fault transitions and add events
    let events = state.faultEvents;
    const prevStatus = state.previousStatus;

    if (prevStatus && prevStatus !== data.status) {
      const newEvents = [...events];
      if (data.status === 'ANOMALY DETECTED') {
        newEvents.push({
          id: `evt-${Date.now()}`,
          timestamp: data.timestamp,
          type: 'AI',
          message: 'Anomaly detected by Isolation Forest model',
          severity: 'warning',
        });
        if (data.cht > 165) {
          newEvents.push({
            id: `evt-${Date.now()}-th`,
            timestamp: data.timestamp,
            type: 'THERMAL',
            message: `Temperature deviation detected — CHT ${data.cht.toFixed(1)}°C`,
            severity: 'warning',
          });
        }
        if (data.vibration > 0.4) {
          newEvents.push({
            id: `evt-${Date.now()}-vib`,
            timestamp: data.timestamp,
            type: 'VIBRATION',
            message: `Mechanical vibration increasing — ${data.vibration.toFixed(2)} mm/s`,
            severity: 'warning',
          });
        }
      }
      if (data.status === 'CRITICAL FAILURE') {
        newEvents.push({
          id: `evt-${Date.now()}-crit`,
          timestamp: data.timestamp,
          type: 'MECHANICAL',
          message: 'Critical failure threshold reached',
          severity: 'critical',
        });
        newEvents.push({
          id: `evt-${Date.now()}-mission`,
          timestamp: data.timestamp,
          type: 'MISSION',
          message: 'Immediate Return-to-Base recommended',
          severity: 'critical',
        });
      }
      if (data.status === 'HEALTHY' && prevStatus !== 'HEALTHY') {
        newEvents.push({
          id: `evt-${Date.now()}-reset`,
          timestamp: data.timestamp,
          type: 'SYSTEM',
          message: 'System restored to nominal operation',
          severity: 'info',
        });
      }
      
      // Keep max 100 events
      if (newEvents.length > 100) newEvents.splice(0, newEvents.length - 100);
      events = newEvents;
    }

    // Throttle for UI
    const now = Date.now();
    const shouldThrottleUpdate = now - state.lastThrottleTime > 250; // 4 FPS

    if (shouldThrottleUpdate) {
      set({
        telemetry: data,
        telemetryHistory: newHistory,
        faultEvents: events,
        previousStatus: data.status,
        throttledTelemetry: data,
        throttledHistory: newHistory,
        lastThrottleTime: now,
      });
    } else {
      set({
        telemetry: data,
        telemetryHistory: newHistory,
        faultEvents: events,
        previousStatus: data.status,
      });
    }
  },
  isConnected: false,
  setConnected: (status) => set({ isConnected: status }),

  // Session history
  telemetryHistory: [],
  addToHistory: (data) =>
    set((state) => {
      const newHistory = [...state.telemetryHistory, data];
      if (newHistory.length > 600) newHistory.shift();
      return { telemetryHistory: newHistory };
    }),
  clearHistory: () => set({ telemetryHistory: [], faultEvents: [] }),

  // Fault events
  faultEvents: [],
  addFaultEvent: (event) =>
    set((state) => ({
      faultEvents: [...state.faultEvents, event],
    })),
  clearFaultEvents: () => set({ faultEvents: [] }),

  // Previous status
  previousStatus: null,
  setPreviousStatus: (status) => set({ previousStatus: status }),

  // Settings
  settings: {
    autoRotation: true,
    animationIntensity: 0.7,
    showComponentLabels: true,
    showTelemetryOverlay: true,
    compactMode: false,
    animationsEnabled: true,
  },
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
}));
