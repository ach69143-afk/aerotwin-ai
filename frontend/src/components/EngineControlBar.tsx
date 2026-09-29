import { useState, useCallback, memo } from 'react';
import { useStore } from '../store/useStore';
import { API_AUTH_HEADERS, API_BASE } from '../config/api';

interface EngineControlBarProps {
  /** Render a more compact version for inline use (e.g. OverviewPage) */
  compact?: boolean;
}

export const EngineControlBar = memo(function EngineControlBar({ compact = false }: EngineControlBarProps) {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const [selectedFault, setSelectedFault] = useState<string>('TURBOCHARGER_BOOST_LEAK');
  const [controlError, setControlError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
        const data = await res.json();
        // Inject the backend's true engine state into telemetry so the UI resyncs
        const store = useStore.getState();
        if (store.telemetry) {
          store.setTelemetry({
            ...store.telemetry,
            engineState: data.engine_state,
            faultActive: data.fault_active,
            faultType: data.fault_type,
            faultSeverity: data.fault_severity,
          });
        }
      }
    } catch {
      // Status fetch failed — will resync on next WebSocket message
    }
  }, []);

  const postControl = useCallback(async (path: string, body?: object) => {
    setIsRequesting(true);
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          ...API_AUTH_HEADERS,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        // Extract message from new structured detail or plain string
        const detail = payload?.detail;
        const message = typeof detail === 'object' ? detail?.message : detail;
        console.error('Control request failed:', {
          endpoint: `${API_BASE}${path}`,
          status: response.status,
          body: payload
        });
        // On 409, resync UI with backend's true state
        if (response.status === 409) {
          await fetchStatus();
        }
        throw new Error(message || `Request failed (${response.status})`);
      }
      setControlError(null);
      return true;
    } catch (error) {
      setControlError(error instanceof Error ? error.message : 'Control request failed.');
      return false;
    } finally {
      // Keep buttons disabled briefly to allow telemetry state to catch up
      setTimeout(() => setIsRequesting(false), 500);
    }
  }, [fetchStatus]);

  const startEngine = useCallback(async () => {
    await postControl('/api/start-engine');
  }, [postControl]);

  const holdEngine = useCallback(async () => {
    await postControl('/api/hold-engine');
  }, [postControl]);

  const stopEngine = useCallback(async () => {
    await postControl('/api/stop-engine');
  }, [postControl]);

  const simulateFault = useCallback(async () => {
    await postControl('/api/simulate-fault', { fault_type: selectedFault });
  }, [postControl, selectedFault]);

  const stopFault = useCallback(async () => {
    await postControl('/api/stop-fault');
  }, [postControl]);

  const resetSimulation = useCallback(async () => {
    if (await postControl('/api/reset')) {
      useStore.getState().clearHistory();
    }
  }, [postControl]);

  const engineState = telemetry?.engineState;

  const btnBase = compact
    ? 'px-3 py-1.5 rounded-lg text-[10px] tracking-widest font-mono transition-all duration-150'
    : 'px-4 py-2 rounded-lg text-[10px] tracking-widest font-mono transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]';

  const disabledCls = 'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-3'}`}>
      {/* Engine controls group */}
      <div className="flex gap-2 items-center flex-wrap md:border-r border-[#D9E2DC] md:pr-3 md:mr-1 w-full md:w-auto pb-2 md:pb-0 border-b md:border-b-0">
        <button
          onClick={startEngine}
          disabled={isRequesting || !engineState || engineState !== 'OFF'}
          className={`${btnBase} bg-[#EAF4EC] text-[#2E7D32] border border-[#2E7D32]/30 hover:bg-[#2E7D32]/15 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          START RPM
        </button>
        <button
          onClick={holdEngine}
          disabled={isRequesting || !engineState || (engineState !== 'RUNNING' && engineState !== 'HOLD')}
          className={`${btnBase} bg-[#FEF3C7]/50 text-[#D97706] border border-[#D97706]/30 hover:bg-[#D97706]/10 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          {engineState === 'HOLD' ? 'RESUME RPM' : 'HOLD RPM'}
        </button>
        <button
          onClick={stopEngine}
          disabled={isRequesting || !engineState || (engineState !== 'STARTING' && engineState !== 'RUNNING' && engineState !== 'HOLD')}
          className={`${btnBase} bg-[#F4F8F4] text-[#667085] border border-[#D9E2DC] hover:bg-[#EAF4EC] shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          STOP ENGINE
        </button>
      </div>

      {/* Fault controls group */}
      <div className="flex gap-2 items-center flex-wrap w-full md:w-auto">
        <select
          value={selectedFault}
          onChange={(e) => setSelectedFault(e.target.value)}
          disabled={isRequesting}
          className="px-2 py-2 md:py-1.5 bg-white border border-[#D9E2DC] rounded-lg text-[10px] tracking-widest font-mono text-[#667085] focus:outline-none focus:border-[#2E7D32]/50 focus:ring-1 focus:ring-[#2E7D32]/20 flex-1 md:flex-none disabled:opacity-50"
        >
          <option value="TURBOCHARGER_BOOST_LEAK">TURBO BOOST LEAK</option>
          <option value="OIL_CAVITATION">OIL CAVITATION</option>
          <option value="CYLINDER2_INJECTOR_CLOG">CYL2 INJECTOR CLOG</option>
          <option value="ALTERNATOR_RAIL_DROP">ALTERNATOR RAIL DROP</option>
          <option value="MAP_SENSOR_DRIFT">MAP SENSOR DRIFT</option>
        </select>
        <button
          onClick={simulateFault}
          disabled={isRequesting || !engineState || (engineState !== 'RUNNING' && engineState !== 'HOLD')}
          className={`${btnBase} bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/30 hover:bg-[#DC2626]/10 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          SIMULATE FAULT
        </button>
        <button
          onClick={stopFault}
          disabled={isRequesting || !telemetry?.faultActive}
          className={`${btnBase} bg-[#FFF7ED] text-[#D97706] border border-[#D97706]/30 hover:bg-[#D97706]/10 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          STOP FAULT
        </button>
        <button
          onClick={resetSimulation}
          disabled={isRequesting}
          className={`${btnBase} bg-[#EAF4EC] text-[#2E7D32] border border-[#2E7D32]/30 hover:bg-[#2E7D32]/15 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          RESET
        </button>
      </div>
      {controlError && (
        <p role="alert" className="w-full text-[10px] font-mono text-[#DC2626]">
          CONTROL ERROR: {controlError}
        </p>
      )}
    </div>
  );
});
