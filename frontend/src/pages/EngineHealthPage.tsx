import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function EngineHealthPage() {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const history = useStore((s) => s.throttledHistory);

  if (!telemetry) return null;

  const minRpm = history.length > 0 ? Math.min(...history.map(h => h.rpm)) : telemetry.rpm;
  const maxRpm = history.length > 0 ? Math.max(...history.map(h => h.rpm)) : telemetry.rpm;
  const avgRpm = history.length > 0 ? history.reduce((sum, h) => sum + h.rpm, 0) / history.length : telemetry.rpm;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 mb-2 uppercase">Engine Health Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel p-6 flex flex-col items-center justify-center min-h-[300px]">
           <h2 className="section-header mb-8">Overall Health Index</h2>
           <div className="relative flex items-center justify-center">
             <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#27272a" strokeWidth="12" />
                <motion.circle 
                  cx="100" cy="100" r="80" fill="none" 
                  stroke={telemetry.healthPct > 90 ? '#34d399' : telemetry.healthPct > 70 ? '#fbbf24' : '#ef4444'} 
                  strokeWidth="12" 
                  strokeDasharray={2 * Math.PI * 80}
                  strokeDashoffset={2 * Math.PI * 80 * (1 - telemetry.healthPct / 100)}
                  className="transition-all duration-1000 ease-out"
                />
             </svg>
             <div className="absolute flex flex-col items-center">
               <span className="text-4xl font-mono text-foreground">{telemetry.healthPct.toFixed(1)}%</span>
               <span className="text-xs font-mono text-muted-foreground tracking-widest mt-1">{telemetry.status}</span>
             </div>
           </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">RPM Analysis</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className="text-3xl font-mono text-cyan-400 mb-2">{telemetry.rpm.toFixed(0)} <span className="text-sm text-muted-foreground">curr</span></div>
               <div className="grid grid-cols-3 gap-2 text-xs font-mono text-zinc-400 mt-4 border-t border-border/50 pt-4">
                 <div>Min: <span className="text-foreground">{minRpm.toFixed(0)}</span></div>
                 <div>Max: <span className="text-foreground">{maxRpm.toFixed(0)}</span></div>
                 <div>Avg: <span className="text-foreground">{avgRpm.toFixed(0)}</span></div>
               </div>
            </div>
          </div>
          
          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Thermal Status (CHT)</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-3xl font-mono mb-2 ${telemetry.cht > 165 ? 'text-amber-400' : 'text-emerald-400'}`}>
                 {telemetry.cht.toFixed(1)}°C
               </div>
               <div className="mt-4 border-t border-border/50 pt-4 text-xs font-mono text-zinc-400">
                  Threshold: 165°C Warn / 180°C Crit
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Oil Pressure</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-3xl font-mono mb-2 ${telemetry.oilPressure < 3.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                 {telemetry.oilPressure.toFixed(2)} BAR
               </div>
               <div className="mt-4 border-t border-border/50 pt-4 text-xs font-mono text-zinc-400">
                  Nominal Range: 3.5 - 5.0 BAR
               </div>
            </div>
          </div>

          <div className="panel p-5 flex flex-col">
            <h3 className="section-header mb-4">Vibration Signature</h3>
            <div className="flex-1 flex flex-col justify-center">
               <div className={`text-3xl font-mono mb-2 ${telemetry.vibration > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                 {telemetry.vibration.toFixed(2)} MM/S
               </div>
               <div className="mt-4 border-t border-border/50 pt-4 text-xs font-mono text-zinc-400">
                  Baseline: 0.20 MM/S
               </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
