import { useStore } from '../store/useStore';
import { DigitalTwin } from '../components/DigitalTwin';
import { Activity, Thermometer, Droplets, Vibrate } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const TelemetryCard = ({ title, value, unit, icon: Icon, status }: { title: string, value: string | number, unit: string, icon: any, status: 'normal' | 'warning' | 'critical' }) => {
  const colors = {
    normal: 'text-emerald-400 border-emerald-900/50 shadow-emerald-900/20',
    warning: 'text-amber-400 border-amber-900/50 shadow-amber-900/20',
    critical: 'text-red-500 border-red-900/50 shadow-red-900/20',
  };

  return (
    <div 
      className={`p-4 bg-card/80 backdrop-blur-sm rounded-sm border ${colors[status]} flex items-center justify-between shadow-lg relative overflow-hidden`}
    >
      <div className="z-10 relative">
        <p className="text-muted-foreground text-xs font-sans uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`text-2xl font-mono font-medium ${colors[status].split(' ')[0]}`}>{value}</span>
          <span className="text-muted-foreground text-[10px] font-mono">{unit}</span>
        </div>
      </div>
      <div className={`p-2 rounded-full bg-background/50 border border-border z-10 relative ${colors[status].split(' ')[0]}`}>
        <Icon size={18} />
      </div>
      
      {/* Background glow for warning/critical */}
      {(status === 'warning' || status === 'critical') && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`absolute inset-0 bg-current opacity-10 pointer-events-none ${colors[status].split(' ')[0]}`}
        />
      )}
    </div>
  );
};

export function OverviewPage() {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const telemetryHistory = useStore((s) => s.throttledHistory);

  if (!telemetry) return null;

  const simulateFault = async () => {
    await fetch('http://localhost:8000/api/simulate-fault', { method: 'POST' });
  };

  const resetSimulation = async () => {
    await fetch('http://localhost:8000/api/reset', { method: 'POST' });
    useStore.getState().clearHistory();
  };

  const chtStatus = telemetry.cht < 165 ? 'normal' : telemetry.cht < 180 ? 'warning' : 'critical';
  const riskColor = telemetry.risk === 'NORMAL' ? 'text-emerald-400' : telemetry.risk === 'WARNING' ? 'text-amber-400' : 'text-red-500';

  // Use the last 60 entries from store history for the chart
  const chartData = telemetryHistory.slice(-60);

  return (
    <div className="page-container">
      
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'ENGINE HEALTH', value: `${telemetry.healthPct.toFixed(1)}%`, color: telemetry.healthPct > 90 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'RISK LEVEL', value: telemetry.risk, color: riskColor },
          { label: 'RUL (ESTIMATED)', value: telemetry.rul, color: 'text-cyan-400' },
          { label: 'MISSION STATUS', value: telemetry.status === 'HEALTHY' ? 'SAFE' : 'ABORT', color: telemetry.status === 'HEALTHY' ? 'text-emerald-400' : 'text-red-500' }
        ].map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            key={kpi.label} 
            className="p-4 bg-card/40 backdrop-blur-sm border border-border/50 rounded-sm shadow-lg relative overflow-hidden"
          >
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{kpi.label}</p>
            <p className={`text-2xl font-mono mt-1 ${kpi.color}`}>{kpi.value}</p>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Center Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-[400px]">
        
        {/* Left Panel - Telemetry Cards */}
        <div className="flex flex-col gap-3 xl:col-span-1">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Live Telemetry</h2>
          </div>
          <TelemetryCard title="Engine RPM" value={telemetry.rpm.toFixed(0)} unit="REV/MIN" icon={Activity} status={telemetry.rpm < 4800 ? 'warning' : 'normal'} />
          <TelemetryCard title="Cyl Head Temp" value={telemetry.cht.toFixed(1)} unit="°C" icon={Thermometer} status={chtStatus} />
          <TelemetryCard title="Oil Pressure" value={telemetry.oilPressure.toFixed(2)} unit="BAR" icon={Droplets} status={telemetry.oilPressure < 3.5 ? 'warning' : 'normal'} />
          <TelemetryCard title="Vibration" value={telemetry.vibration.toFixed(2)} unit="MM/S" icon={Vibrate} status={telemetry.vibration > 0.4 ? 'warning' : 'normal'} />
        </div>

        {/* Center Panel - Digital Twin */}
        <div className="xl:col-span-3 flex flex-col gap-3 relative">
           <div className="flex justify-between items-center mb-1">
             <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Digital Twin</h2>
             <div className="flex gap-2">
               <button onClick={simulateFault} className="px-4 py-1.5 bg-red-950/30 text-red-400 border border-red-900/50 rounded-sm text-[10px] tracking-widest font-mono hover:bg-red-900/50 transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]">SIMULATE FAULT</button>
               <button onClick={resetSimulation} className="px-4 py-1.5 bg-cyan-950/30 text-cyan-400 border border-cyan-900/50 rounded-sm text-[10px] tracking-widest font-mono hover:bg-cyan-900/50 transition-all hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]">RESET</button>
             </div>
           </div>
           <div className="flex-1 rounded-sm overflow-hidden border border-border/50 shadow-2xl relative bg-[#09090b]">
             {/* Grid background overlay for technical feel */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
             <DigitalTwin />
           </div>
        </div>
      </div>

      {/* Bottom Panel - AI Diagnostics & Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-64 shrink-0">
        
        <div className="xl:col-span-1 p-5 bg-card/40 backdrop-blur-sm border border-border/50 rounded-sm flex flex-col shadow-lg">
          <h3 className="text-[10px] tracking-[0.2em] text-cyan-500 font-bold mb-4 uppercase">AI Diagnostics</h3>
          <div className="space-y-4 font-mono text-xs flex-1">
             <div className="flex justify-between border-b border-border/50 pb-2">
               <span className="text-muted-foreground">ANOMALY SCORE</span>
               <span className={telemetry.anomalyScore < 0 ? 'text-red-400' : 'text-emerald-400'}>{telemetry.anomalyScore.toFixed(3)}</span>
             </div>
             <div className="flex justify-between border-b border-border/50 pb-2">
               <span className="text-muted-foreground">AI STATE</span>
               <span className={telemetry.status === 'HEALTHY' ? 'text-emerald-400' : 'text-red-500'}>{telemetry.status}</span>
             </div>
             <AnimatePresence mode="wait">
               <motion.div 
                 key={telemetry.status}
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -5 }}
                 className={`mt-4 p-3 border rounded-sm ${telemetry.status === 'HEALTHY' ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-amber-950/10 border-amber-900/30'}`}
               >
                 <p className="text-[9px] text-muted-foreground mb-1 font-sans uppercase tracking-widest">System Recommendation</p>
                 <p className={`text-xs leading-relaxed ${telemetry.status === 'HEALTHY' ? 'text-emerald-400/80' : 'text-amber-400'}`}>
                   {telemetry.status === 'HEALTHY' 
                    ? "No significant degradation pattern detected. Continue normal operation." 
                    : "Thermal degradation detected. Consider reducing engine load and initiating Return-to-Base planning."}
                 </p>
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
        
        <div className="xl:col-span-3 p-5 bg-card/40 backdrop-blur-sm border border-border/50 rounded-sm flex flex-col shadow-lg relative overflow-hidden">
          <h3 className="text-[10px] tracking-[0.2em] text-cyan-500 font-bold mb-4 uppercase z-10">Thermal & Vibration Trend</h3>
          <div className="flex-1 min-h-0 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tick={{fontFamily: 'monospace'}} tickMargin={8} minTickGap={30} />
                <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['dataMin - 10', 'dataMax + 10']} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['dataMin - 0.1', 'dataMax + 0.1']} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '2px', fontFamily: 'monospace', fontSize: '12px'}} 
                  itemStyle={{padding: '2px 0'}}
                />
                <Line yAxisId="left" type="monotone" dataKey="cht" stroke="#ef4444" dot={false} isAnimationActive={false} strokeWidth={2} name="CHT (°C)" />
                <Line yAxisId="right" type="monotone" dataKey="vibration" stroke="#f59e0b" dot={false} isAnimationActive={false} strokeWidth={2} name="VIB (mm/s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
