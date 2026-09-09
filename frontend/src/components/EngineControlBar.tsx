import { useState, useCallback, memo } from 'react';
import { useStore } from '../store/useStore';
import { API_AUTH_HEADERS, API_BASE } from '../config/api';

interface EngineControlBarProps {
  /** Render a more compact version for inline use (e.g. OverviewPage) */
  compact?: boolean;
}

export const EngineControlBar = memo(function EngineControlBar({ compact = false }: EngineControlBarProps) {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const [selectedFault, setSelectedFault] = useState<string>('GENERIC');
  const [controlError, setControlError] = useState<string | null>(null);

  const postControl = useCallback(async (path: string, body?: object) => {
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
        console.error('Control request failed:', {
          endpoint: `${API_BASE}${path}`,
          status: response.status,
          body: payload
        });
        throw new Error(payload?.detail || `Request failed (${response.status})`);
      }
      setControlError(null);
      return true;
    } catch (error) {
      setControlError(error instanceof Error ? error.message : 'Control request failed.');
      return false;
    }
  }, []);

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
    ? 'px-3 py-1.5 rounded-sm text-[10px] tracking-widest font-mono transition-all duration-150'
    : 'px-4 py-2 rounded-sm text-[10px] tracking-widest font-mono transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]';

  const disabledCls = 'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'gap-3'}`}>
      {/* Engine controls group */}
      <div className="flex gap-2 items-center flex-wrap md:border-r border-white/10 md:pr-3 md:mr-1 w-full md:w-auto pb-2 md:pb-0 border-b md:border-b-0">
        <button
          onClick={startEngine}
          disabled={engineState !== 'OFF'}
          className={`${btnBase} bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/60 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          START RPM
        </button>
        <button
          onClick={holdEngine}
          disabled={engineState === 'OFF' || engineState === 'STOPPING'}
          className={`${btnBase} bg-amber-950/40 text-amber-400 border border-amber-900/50 hover:bg-amber-900/60 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          {engineState === 'HOLD' ? 'RESUME RPM' : 'HOLD RPM'}
        </button>
        <button
          onClick={stopEngine}
          disabled={engineState === 'OFF'}
          className={`${btnBase} bg-zinc-950/40 text-zinc-400 border border-zinc-900/50 hover:bg-zinc-900/60 shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          STOP ENGINE
        </button>
      </div>

      {/* Fault controls group */}
      <div className="flex gap-2 items-center flex-wrap w-full md:w-auto">
        <select
          value={selectedFault}
          onChange={(e) => setSelectedFault(e.target.value)}
          className="px-2 py-2 md:py-1.5 bg-[#0a0a0c] border border-border/60 rounded-sm text-[10px] tracking-widest font-mono text-muted-foreground focus:outline-none focus:border-cyan-900/50 flex-1 md:flex-none"
        >
          <option value="GENERIC">GENERIC</option>
          <option value="MISFIRE">MISFIRE</option>
          <option value="INJECTOR_ABNORMALITY">INJECTOR ABNORMALITY</option>
          <option value="LUBRICATION_ISSUE">LUBRICATION ISSUE</option>
          <option value="OVERHEATING">OVERHEATING</option>
          <option value="ABNORMAL_VIBRATION">ABNORMAL VIBRATION</option>
          <option value="SENSOR_DRIFT">SENSOR DRIFT</option>
        </select>
        <button
          onClick={simulateFault}
          disabled={engineState === 'OFF'}
          className={`${btnBase} bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.15)] shadow-sm flex-1 md:flex-none justify-center ${disabledCls}`}
        >
          SIMULATE FAULT
        </button>
        <button
          onClick={stopFault}
          className={`${btnBase} bg-orange-950/40 text-orange-400 border border-orange-900/50 hover:bg-orange-900/60 shadow-sm flex-1 md:flex-none justify-center`}
        >
          STOP FAULT
        </button>
        <button
          onClick={resetSimulation}
          className={`${btnBase} bg-cyan-950/40 text-cyan-400 border border-cyan-900/50 hover:bg-cyan-900/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] shadow-sm flex-1 md:flex-none justify-center`}
        >
          RESET
        </button>
      </div>
      {controlError && (
        <p role="alert" className="w-full text-[10px] font-mono text-red-400">
          CONTROL ERROR: {controlError}
        </p>
      )}
    </div>
  );
});
