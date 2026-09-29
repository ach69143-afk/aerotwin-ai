import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function EngineHealthPage() {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const history = useStore((s) => s.throttledHistory);

  if (!telemetry) return null;

  const { minRpm, maxRpm, avgRpm } = useMemo(() => {
    if (!history || history.length === 0) {
      return { minRpm: telemetry.rpm, maxRpm: telemetry.rpm, avgRpm: telemetry.rpm };
    }
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    for (let i = 0; i < history.length; i++) {
      const r = history[i].rpm;
      if (r < min) min = r;
      if (r > max) max = r;
      sum += r;
    }
    return { minRpm: min, maxRpm: max, avgRpm: sum / history.length };
  }, [history, telemetry.rpm]);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container h-full overflow-y-auto">
      <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] mb-2 uppercase">Engine Health Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel p-6 flex flex-col items-center justify-center min-h-[300px]">
           <h2 className="section-header mb-8">Overall Health Index</h2>
           <div className="relative flex items-center justify-center">
             <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#D9E2DC" strokeWidth="12" />
                <motion.circle 
                  cx="100" cy="100" r="80" fill="none" 
                  stroke={telemetry.healthPct > 90 ? '#2E7D32' : telemetry.healthPct > 70 ? '#D97706' : '#DC2626'} 
                  strokeWidth="12" 
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - telemetry.healthPct / 100)}
                  className="transition-all duration-1000 ease-out"
                />
             </svg>
             <div className="absolute flex flex-col items-center">
               <span className="text-4xl font-mono text-[#1F2933]">{telemetry.healthPct.toFixed(1)}%</span>
               <span className="text-xs font-mono text-[#667085] tracking-widest mt-1">{telemetry.status}</span>
             </div>
           </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">RPM Analysis</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-2xl font-mono text-[#2563EB] mb-2">{telemetry.rpm.toFixed(0)} <span className="text-xs text-[#667085]">curr</span></div>
               <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[#667085] mt-2 border-t border-[#D9E2DC] pt-2">
                 <div>Min: <span className="text-[#1F2933]">{minRpm.toFixed(0)}</span></div>
                 <div>Max: <span className="text-[#1F2933]">{maxRpm.toFixed(0)}</span></div>
                 <div>Avg: <span className="text-[#1F2933]">{avgRpm.toFixed(0)}</span></div>
               </div>
            </div>
          </div>
          
          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">MAP Pressure</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-2xl font-mono text-[#1F2933] mb-2">
                 {telemetry.mapPressure.toFixed(1)} inHg
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Nominal: ~38.0 inHg
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Turbo RPM</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-2xl font-mono text-[#1F2933] mb-2">
                 {telemetry.turboRpm.toFixed(0)}
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Nominal: ~42,000 RPM
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Thermal Status (CHT)</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-2xl font-mono mb-2 ${telemetry.cht > 165 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
                 {telemetry.cht.toFixed(1)}°C
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Threshold: 165°C Warn / 180°C Crit
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Cyl2 EGT</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-2xl font-mono mb-2 ${telemetry.cyl2Egt > 900 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
                 {telemetry.cyl2Egt.toFixed(1)}°C
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Nominal: 780°C - 850°C
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Electrical Systems</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-2xl font-mono mb-2 ${telemetry.voltageLaneA < 12 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
                 {telemetry.voltageLaneA.toFixed(1)} V
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Lane B: {telemetry.voltageLaneB.toFixed(1)} V
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Oil Pressure</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-2xl font-mono mb-2 ${telemetry.oilPressure < 3.5 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
                 {telemetry.oilPressure.toFixed(2)} BAR
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Nominal Range: 3.5 - 5.0 BAR
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Throttle Position</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-2xl font-mono mb-2 text-[#1F2933]">
                 {telemetry.throttle.toFixed(1)}%
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Load Demand
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Vibration</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-2xl font-mono mb-2 ${telemetry.vibration > 0.4 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
                 {telemetry.vibration.toFixed(2)} MM/S
               </div>
               <div className="mt-2 border-t border-[#D9E2DC] pt-2 text-[10px] font-mono text-[#667085]">
                  Baseline: 0.20 MM/S
               </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
