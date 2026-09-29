import { useStore } from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export function RULPredictionPage() {
  const telemetry = useStore(s => s.throttledTelemetry);
  const history = useStore(s => s.throttledHistory);

  const trendData = useMemo(() => {
    return history.map(h => ({
      timestamp: h.timestamp,
      health: h.healthPct,
      threshold: 20 // Critical failure threshold
    }));
  }, [history]);

  if (!telemetry) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] uppercase">Remaining Useful Life (RUL)</h1>
          <p className="text-xs font-mono tracking-widest text-[#667085] mt-1">PROGNOSTIC HEALTH MANAGEMENT</p>
        </div>
        <div className="session-badge">Live Estimate</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="panel p-8 flex flex-col items-center justify-center text-center">
          <Clock size={48} className={`mb-6 ${telemetry.rul !== 'N/A' ? 'text-[#D97706]' : 'text-[#2E7D32] opacity-50'}`} strokeWidth={1} />
          <div className="text-[10px] font-semibold tracking-[0.15em] text-[#667085] uppercase mb-2">Estimated Time to Failure</div>
          
          <div className={`text-5xl font-mono tracking-tighter ${telemetry.rul === 'N/A' ? 'text-[#2E7D32]' : telemetry.rul === '0.0s' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
            {telemetry.rul === 'N/A' ? '> 100h' : telemetry.rul}
          </div>
          
          <p className="text-xs font-sans text-[#667085] mt-6 leading-relaxed">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#D9E2DC" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#667085" fontSize={10} tick={{fontFamily: 'monospace'}} minTickGap={30} />
                <YAxis stroke="#667085" fontSize={10} tick={{fontFamily: 'monospace'}} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#FFFFFF', border: '1px solid #D9E2DC', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'}} 
                />
                <Line type="stepAfter" dataKey="threshold" stroke="#DC2626" strokeWidth={1} strokeDasharray="5 5" dot={false} isAnimationActive={false} name="Critical Threshold" />
                <Line type="monotone" dataKey="health" stroke="#D97706" strokeWidth={2} dot={false} isAnimationActive={false} name="Health %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
