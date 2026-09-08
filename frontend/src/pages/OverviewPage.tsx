import { useStore } from '../store/useStore';
import { DigitalTwin } from '../components/DigitalTwin';
import { EngineControlBar } from '../components/EngineControlBar';
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
      className={`p-3 md:p-4 bg-card/80 backdrop-blur-sm rounded-sm border ${colors[status]} flex items-center justify-between shadow-lg relative overflow-hidden`}
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
      
      {/* Background glow for warning/critical — subtle pulse */}
      {(status === 'warning' || status === 'critical') && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
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

  const chtStatus = telemetry.cht < 165 ? 'normal' : telemetry.cht < 180 ? 'warning' : 'critical';
  const riskColor = telemetry.risk === 'NORMAL' ? 'text-emerald-400' : telemetry.risk === 'WARNING' ? 'text-amber-400' : 'text-red-500';

  // Use the last 60 entries from store history for the chart
  const chartData = telemetryHistory.slice(-60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="page-container flex flex-col"
    >
      
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 order-1">
        {[
          { label: 'ENGINE HEALTH', value: `${telemetry.healthPct.toFixed(1)}%`, color: telemetry.healthPct > 90 ? 'text-emerald-400' : 'text-amber-400' },
          { label: 'RISK LEVEL', value: telemetry.risk, color: riskColor },
          { label: 'RUL (ESTIMATED)', value: telemetry.rul, color: 'text-cyan-400' },
          { label: 'MISSION STATUS', value: telemetry.risk === 'NORMAL' ? 'SAFE' : telemetry.risk === 'WARNING' ? 'WARNING' : telemetry.risk === 'CRITICAL' ? 'CRITICAL' : 'ABORT', color: telemetry.risk === 'NORMAL' ? 'text-emerald-400' : telemetry.risk === 'WARNING' ? 'text-amber-400' : 'text-red-500' }
        ].map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08, duration: 0.2 }}
            key={kpi.label} 
            className="p-5 bg-gradient-to-br from-card/80 to-card/30 backdrop-blur-md border border-border/50 rounded-sm shadow-lg relative overflow-hidden"
          >
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">{kpi.label}</p>
            <p className={`text-3xl font-mono mt-2 font-light tracking-tight ${kpi.color}`}>{kpi.value}</p>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </motion.div>
        ))}
      </div>

      {/* Control Row — uses shared EngineControlBar */}
      <div className="bg-card/80 p-3 rounded-sm border border-border/50 shadow-lg mt-2 mb-2 shrink-0 order-4 xl:order-2">
        <EngineControlBar compact />
      </div>

      {/* Main Grid */}
      <div className="contents xl:grid xl:grid-cols-12 gap-4 xl:flex-1 xl:min-h-[500px] order-none xl:order-3">
        
        {/* Left Panel - Telemetry Cards */}
        <div className="flex flex-col gap-2 xl:col-span-3 order-3 xl:order-none">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-[10px] font-bold tracking-[0.2em] text-cyan-500/70 uppercase flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
               Live Telemetry
             </h2>
          </div>
          <TelemetryCard title="Engine RPM" value={telemetry.rpm.toFixed(0)} unit="REV/MIN" icon={Activity} status={telemetry.rpm < 4800 ? 'warning' : 'normal'} />
          <TelemetryCard title="Cyl Head Temp" value={telemetry.cht.toFixed(1)} unit="°C" icon={Thermometer} status={chtStatus} />
          <TelemetryCard title="Oil Pressure" value={telemetry.oilPressure.toFixed(2)} unit="BAR" icon={Droplets} status={telemetry.oilPressure < 3.5 ? 'warning' : 'normal'} />
          <TelemetryCard title="Vibration" value={telemetry.vibration.toFixed(2)} unit="MM/S" icon={Vibrate} status={telemetry.vibration > 0.4 ? 'warning' : 'normal'} />
        </div>

        {/* Center Panel - Digital Twin */}
        <div className="xl:col-span-6 flex flex-col gap-2 relative order-2 xl:order-none">
           <div className="flex justify-between items-center mb-1">
             <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Digital Twin</h2>
           </div>
           <div className="flex-1 rounded-sm overflow-hidden border border-border/60 shadow-2xl relative bg-[#040508] min-h-[320px] xl:min-h-0">
             <DigitalTwin hideTitle />
           </div>
        </div>

        {/* Right Panel - AI Diagnostics */}
        <div className="xl:col-span-3 flex flex-col gap-2 order-6 xl:order-none mt-2 xl:mt-0">
          <div className="flex justify-between items-center mb-1">
             <h2 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">AI Diagnostics</h2>
          </div>
          <div className="flex-1 p-5 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-md border border-border/50 rounded-sm flex flex-col shadow-lg">
            <div className="space-y-4 font-mono text-xs flex-1">
               <div className="flex justify-between items-center border-b border-border/50 pb-3">
                 <span className="text-muted-foreground">AI ENGINE STATUS</span>
                 <span className={`px-2 py-0.5 rounded-sm bg-background border ${telemetry.status === 'HEALTHY' ? 'text-emerald-400 border-emerald-900/50' : 'text-red-500 border-red-900/50'}`}>
                   {telemetry.status}
                 </span>
               </div>
               {(telemetry.likelyFault && telemetry.likelyFault !== "NONE") && (
                 <div className="flex justify-between items-center border-b border-border/50 pb-3">
                   <span className="text-muted-foreground">LIKELY FAULT</span>
                   <span className="text-amber-400">{telemetry.likelyFault.replace('_', ' ')}</span>
                 </div>
               )}
               <div className="flex justify-between border-b border-border/50 pb-3">
                 <span className="text-muted-foreground">ANOMALY SCORE</span>
                 <span className={telemetry.anomalyScore < 0 ? 'text-red-400' : 'text-emerald-400'}>{telemetry.anomalyScore.toFixed(3)}</span>
               </div>
               <div className="flex justify-between border-b border-border/50 pb-3">
                 <span className="text-muted-foreground">RISK LEVEL</span>
                 <span className={riskColor}>{telemetry.risk}</span>
               </div>
               <AnimatePresence mode="wait">
                 <motion.div 
                   key={telemetry.status}
                   initial={{ opacity: 0, y: 5 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -5 }}
                   transition={{ duration: 0.2 }}
                   className={`mt-6 p-4 border rounded-sm ${telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY' ? 'bg-emerald-950/10 border-emerald-900/30' : telemetry.recommendationPriority === 'CRITICAL' ? 'bg-red-950/20 border-red-900/50' : 'bg-amber-950/10 border-amber-900/30'}`}
                 >
                   <p className="text-[9px] text-muted-foreground mb-2 font-sans uppercase tracking-widest flex items-center gap-2">
                     <span className={`w-1 h-1 rounded-full ${telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY' ? 'bg-emerald-400' : telemetry.recommendationPriority === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-400'}`} />
                     AI-Assisted Recommendation
                   </p>
                   <p className={`text-xs font-bold leading-relaxed mb-4 ${telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY' ? 'text-emerald-400' : telemetry.recommendationPriority === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                     {telemetry.recommendation?.toUpperCase()}
                   </p>
                   {telemetry.status !== 'HEALTHY' && telemetry.status !== 'STANDBY' && (
                     <>
                       <div className="border-t border-border/50 pt-2 mt-2">
                         <p className="text-[9px] text-muted-foreground uppercase tracking-widest">REASON</p>
                         <p className="text-[10px] text-zinc-300 mt-1">{telemetry.recommendationReason}</p>
                       </div>
                       <div className="flex justify-between items-center mt-3">
                         <div>
                           <p className="text-[9px] text-muted-foreground uppercase tracking-widest">PRIORITY</p>
                           <p className={`text-[10px] font-bold ${telemetry.recommendationPriority === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`}>{telemetry.recommendationPriority}</p>
                         </div>
                         <div className="text-[8px] bg-zinc-900/80 px-2 py-1 rounded-sm text-zinc-500 border border-zinc-800">
                           PROTOTYPE SIMULATION
                         </div>
                       </div>
                     </>
                   )}
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Chart */}
      <div className="w-full h-[240px] md:h-56 shrink-0 mt-2 order-5 xl:order-4">
        <div className="w-full h-full p-4 bg-gradient-to-t from-card/80 to-card/20 backdrop-blur-md border border-border/50 rounded-sm flex flex-col shadow-lg relative overflow-hidden">
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

    </motion.div>
  );
}
