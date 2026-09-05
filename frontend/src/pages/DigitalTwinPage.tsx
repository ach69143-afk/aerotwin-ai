import { DigitalTwin } from '../components/DigitalTwin';
import { useStore } from '../store/useStore';

export function DigitalTwinPage() {
  const telemetry = useStore(s => s.throttledTelemetry);

  const simulateFault = async () => {
    await fetch('http://localhost:8000/api/simulate-fault', { method: 'POST' });
  };

  const resetSimulation = async () => {
    await fetch('http://localhost:8000/api/reset', { method: 'POST' });
    useStore.getState().clearHistory();
  };

  return (
    <div className="page-container p-0">
      <div className="relative w-full h-full flex flex-col">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start pointer-events-none">
          <div>
            <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase drop-shadow-md">Interactive Digital Twin</h1>
            <p className="text-xs font-mono tracking-widest text-zinc-300 mt-1 drop-shadow-md">3D SPATIAL TELEMETRY MAPPING</p>
          </div>
          
          <div className="flex gap-3 pointer-events-auto">
            <button onClick={simulateFault} className="px-4 py-2 bg-red-950/80 backdrop-blur-md text-red-400 border border-red-900/50 rounded-sm text-xs tracking-widest font-mono hover:bg-red-900/80 transition-all shadow-lg">SIMULATE FAULT</button>
            <button onClick={resetSimulation} className="px-4 py-2 bg-cyan-950/80 backdrop-blur-md text-cyan-400 border border-cyan-900/50 rounded-sm text-xs tracking-widest font-mono hover:bg-cyan-900/80 transition-all shadow-lg">RESET SIMULATION</button>
          </div>
        </div>

        {/* Telemetry Overlay */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-48 flex flex-col gap-4 pointer-events-none">
          {telemetry && (
            <>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Rotational Speed</div>
                <div className="text-lg font-mono text-cyan-400">{telemetry.rpm.toFixed(0)} RPM</div>
              </div>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Thermal Load</div>
                <div className={`text-lg font-mono ${telemetry.cht > 165 ? 'text-amber-400' : 'text-emerald-400'}`}>{telemetry.cht.toFixed(1)} °C</div>
              </div>
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-sm">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Structural Vib</div>
                <div className={`text-lg font-mono ${telemetry.vibration > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>{telemetry.vibration.toFixed(2)} mm/s</div>
              </div>
            </>
          )}
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 w-full bg-[#09090b]">
           <DigitalTwin hideTitle={true} />
        </div>
      </div>
    </div>
  );
}
