import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, Thermometer, Vibrate } from 'lucide-react';

export function FaultAnalysisPage() {
  const faultEvents = useStore(s => s.faultEvents);

  const getIcon = (type: string, severity: string) => {
    switch (type) {
      case 'THERMAL': return <Thermometer size={16} className={severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />;
      case 'VIBRATION': return <Vibrate size={16} className={severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />;
      case 'MISSION': return <ShieldAlert size={16} className="text-red-500" />;
      case 'AI': return <AlertCircle size={16} className="text-amber-500" />;
      case 'SYSTEM': return <Info size={16} className="text-emerald-500" />;
      default: return <AlertTriangle size={16} className="text-zinc-400" />;
    }
  };

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-950/20 border-red-900/30';
      case 'warning': return 'bg-amber-950/20 border-amber-900/30';
      case 'info': return 'bg-emerald-950/20 border-emerald-900/30';
      default: return 'bg-card border-border/50';
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase">Fault Analysis & Diagnostics</h1>
          <p className="text-xs font-mono tracking-widest text-zinc-500 mt-1">AI-DETECTED ANOMALY TIMELINE</p>
        </div>
        <div className="session-badge">Session Data</div>
      </div>

      <div className="panel flex-1 p-0 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        
        <div className="p-4 border-b border-border/50 bg-[#0f0f11] shrink-0">
          <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Event Timeline</div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          <AnimatePresence initial={false}>
            {[...faultEvents].reverse().map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 border rounded-sm flex gap-4 ${getBgColor(event.severity)}`}
              >
                <div className="mt-0.5 shrink-0">
                  {getIcon(event.type, event.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <div className="text-xs font-bold tracking-wider font-sans uppercase text-foreground">{event.type}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{event.timestamp}</div>
                  </div>
                  <div className="text-sm font-sans text-zinc-300">{event.message}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {faultEvents.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <ShieldAlert size={32} className="opacity-20" />
              <div className="text-sm font-mono tracking-wider">No faults detected in current session</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
