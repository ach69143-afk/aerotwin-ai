import { DigitalTwin } from '../components/DigitalTwin';
import { EngineControlBar } from '../components/EngineControlBar';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function DigitalTwinPage() {
  const telemetry = useStore(s => s.throttledTelemetry);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="page-container p-0 gap-0"
    >
      <div className="w-full h-full flex flex-col min-h-0">

        {/* ── Engine Control Bar ─────────────────────────────────
             Normal document flow — never overlaps the viewport. */}
        <div className="shrink-0 px-4 py-3 border-b border-cyan-900/20 bg-[#0a0a0c]/90 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: title */}
            <div className="shrink-0 mr-4">
              <h1 className="text-lg font-bold font-sans tracking-widest text-cyan-400 uppercase leading-tight">
                Interactive Digital Twin
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 mt-0.5">
                3D SPATIAL TELEMETRY MAPPING
              </p>
            </div>

            {/* Right: controls — wraps on narrow screens */}
            <EngineControlBar />
          </div>
        </div>

        {/* ── 3D Viewport with overlays ────────────────────────── */}
        <div className="flex-1 min-h-0 relative bg-[#09090b]">
          {/* Left telemetry overlay — positioned inside the viewport only */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-44 flex flex-col gap-3 pointer-events-none">
            {telemetry && (
              <>
                <div className="bg-[#05080D]/70 backdrop-blur-md border border-cyan-500/20 p-3 rounded-sm">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Rotational Speed</div>
                  <div className="text-base font-mono text-cyan-400">{telemetry.rpm.toFixed(0)} RPM</div>
                </div>
                <div className="bg-[#05080D]/70 backdrop-blur-md border border-cyan-500/20 p-3 rounded-sm">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Thermal Load</div>
                  <div className={`text-base font-mono ${telemetry.cht > 165 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {telemetry.cht.toFixed(1)} °C
                  </div>
                </div>
                <div className="bg-[#05080D]/70 backdrop-blur-md border border-cyan-500/20 p-3 rounded-sm">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">Structural Vib</div>
                  <div className={`text-base font-mono ${telemetry.vibration > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {telemetry.vibration.toFixed(2)} mm/s
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3D Canvas — fills the remaining viewport area */}
          <div className="absolute inset-0">
            <DigitalTwin hideTitle={true} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
