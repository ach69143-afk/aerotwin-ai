import { useStore } from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function RULPredictionPage() {
  const telemetry = useStore(s => s.throttledTelemetry);
  const history = useStore(s => s.throttledHistory);

  if (!telemetry) return null;

  // We map the anomaly score and CHT to a pseudo-degradation curve for visualization
  const trendData = history.slice(-100).map(h => {
    // Normalizing health for the chart (0-100)
    return {
      timestamp: h.timestamp,
      degradation: 100 - h.healthPct,
      threshold: 80 // Arbitrary critical threshold
    };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase">Remaining Useful Life (RUL)</h1>
          <p className="text-xs font-mono tracking-widest text-zinc-500 mt-1">PROGNOSTIC HEALTH MANAGEMENT</p>
        </div>
        <div className="session-badge">Live Estimate</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel p-8 flex flex-col items-center justify-center text-center">
          <Clock size={48} className={`mb-6 ${telemetry.rul !== 'N/A' ? 'text-amber-400 animate-pulse' : 'text-emerald-500 opacity-50'}`} strokeWidth={1} />
          <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-2">Estimated Time to Failure</div>
          
          <div className={`text-5xl font-mono tracking-tighter ${telemetry.rul === 'N/A' ? 'text-emerald-400' : telemetry.rul === '0s' ? 'text-red-500' : 'text-amber-400'}`}>
            {telemetry.rul === 'N/A' ? '> 100h' : telemetry.rul}
          </div>
          
          <p className="text-xs font-sans text-zinc-400 mt-6 leading-relaxed">
            {telemetry.rul === 'N/A' 
              ? 'Engine is operating within nominal parameters. No imminent failure condition detected by prognostic models.'
              : 'Critical degradation trajectory detected. Immediate operator intervention required to prevent catastrophic failure.'}
          </p>
        </div>

        <div className="md:col-span-2 panel p-6 flex flex-col">
          <h3 className="section-header mb-6">Degradation Trajectory (Session)</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tick={{fontFamily: 'monospace'}} minTickGap={30} />
                <YAxis stroke="#52525b" fontSize={10} tick={{fontFamily: 'monospace'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '2px', fontFamily: 'monospace', fontSize: '12px'}} 
                />
                <Line type="stepAfter" dataKey="threshold" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Critical Threshold" />
                <Line type="monotone" dataKey="degradation" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} name="Degradation %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
