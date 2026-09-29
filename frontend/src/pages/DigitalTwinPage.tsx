import { DigitalTwin } from '../components/DigitalTwin';
import { EngineControlBar } from '../components/EngineControlBar';
import { motion } from 'framer-motion';

export function DigitalTwinPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="page-container p-0 gap-0"
    >
      <div className="w-full h-full flex flex-col min-h-0">

        {/* ── Engine Control Bar ─────────────────────────────── */}
        <div className="shrink-0 px-4 py-3 border-b border-[#E4E7EC] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: title */}
            <div className="shrink-0 mr-4">
              <h1 className="text-lg font-semibold font-sans tracking-[0.08em] text-[#1F2933] uppercase leading-tight">
                Interactive Digital Twin
              </h1>
              <p className="text-[10px] font-sans tracking-[0.12em] text-[#667085] mt-0.5 uppercase">
                3D Spatial Telemetry Mapping
              </p>
            </div>

            {/* Right: controls — wraps on narrow screens */}
            <EngineControlBar />
          </div>
        </div>

        {/* ── 3D Viewport ──────────────────────────────────── */}
        <div className="flex-1 min-h-0 relative bg-[#F4F8F4]">
          <div className="absolute inset-0">
            <DigitalTwin hideTitle={true} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
