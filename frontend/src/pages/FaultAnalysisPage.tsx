import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, ShieldAlert, Thermometer, Vibrate, CheckCircle } from 'lucide-react';

export function FaultAnalysisPage() {
  const faultEvents = useStore(s => s.faultEvents);
  const telemetry = useStore(s => s.throttledTelemetry);

  const getIcon = (type: string, severity: string) => {
    switch (type) {
      case 'THERMAL': return <Thermometer size={16} className={severity === 'critical' ? 'text-[#DC2626]' : 'text-[#D97706]'} />;
      case 'VIBRATION': return <Vibrate size={16} className={severity === 'critical' ? 'text-[#DC2626]' : 'text-[#D97706]'} />;
      case 'MISSION': return <ShieldAlert size={16} className="text-[#DC2626]" />;
      case 'AI': return <AlertCircle size={16} className="text-[#D97706]" />;
      case 'SYSTEM': return <Info size={16} className="text-[#2E7D32]" />;
      default: return <AlertTriangle size={16} className="text-[#667085]" />;
    }
  };

  const getBgColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[#FEF2F2] border-[#DC2626]/20';
      case 'warning': return 'bg-[#FFFBEB] border-[#D97706]/20';
      case 'info': return 'bg-[#EAF4EC] border-[#2E7D32]/20';
      default: return 'bg-white border-[#D9E2DC]';
    }
  };

  const isFaultActive = telemetry?.faultActive && telemetry?.faultType !== 'NONE';
  const activeFaultName = telemetry?.faultType?.replace(/_/g, ' ') || 'NONE';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-end mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] uppercase">Fault Analysis & Diagnostics</h1>
          <p className="text-xs font-mono tracking-widest text-[#667085] mt-1">REAL-TIME ANOMALY DETECTION</p>
        </div>
        <div className="session-badge">Session Data</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Left Column: Active Fault Details */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="panel p-0 flex flex-col flex-1 overflow-hidden">
            <div className="p-4 border-b border-[#D9E2DC] bg-[#F4F8F4] shrink-0">
              <div className="text-[10px] font-semibold tracking-[0.15em] text-[#667085] uppercase">Active Diagnosis</div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col overflow-y-auto">
              {isFaultActive ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#FEF2F2] border border-[#DC2626]/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={24} className="text-[#DC2626]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#DC2626] tracking-tight">{activeFaultName}</h2>
                      <p className="text-xs text-[#667085] font-mono mt-1">Severity: {(telemetry.faultSeverity! * 100).toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-[#667085] mb-1">AI Recommendation</div>
                      <div className="p-3 bg-[#FFFBEB] border border-[#D97706]/20 rounded-md">
                        <p className="text-sm text-[#1F2933]">{telemetry.recommendation}</p>
                        <p className="text-xs text-[#D97706] font-medium mt-2">Priority: {telemetry.recommendationPriority}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.15em] text-[#667085] mb-1">Isolation Forest Score</div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-mono text-[#1F2933] font-medium">
                          {telemetry?.anomalyScore?.toFixed(3)}
                        </span>
                        <span className="text-xs text-[#667085] mb-1">(&gt; 0 = Anomaly)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-[#E4E7EC]">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[#667085] mb-2">Impacted Subsystems</div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded text-xs text-[#4B5563] font-mono">
                        {telemetry.faultType?.includes('TURBO') || telemetry.faultType?.includes('MAP') ? 'AIR_INTAKE' :
                         telemetry.faultType?.includes('OIL') ? 'LUBRICATION' :
                         telemetry.faultType?.includes('INJECTOR') ? 'FUEL_SYSTEM' :
                         telemetry.faultType?.includes('ALTERNATOR') ? 'ELECTRICAL' : 'GENERAL'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#EAF4EC] border border-[#2E7D32]/20 flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-[#2E7D32]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#2E7D32] mb-2">No Active Faults</h2>
                  <p className="text-sm text-[#667085]">The AI diagnostic models indicate nominal operating conditions.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Event Timeline */}
        <div className="lg:col-span-2 panel flex-1 p-0 overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-[#D9E2DC] bg-[#F4F8F4] shrink-0">
            <div className="text-[10px] font-semibold tracking-[0.15em] text-[#667085] uppercase">Event Timeline</div>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
            <AnimatePresence initial={false}>
              {[...faultEvents].reverse().map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border rounded-lg flex gap-4 ${getBgColor(event.severity)}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(event.type, event.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <div className="text-xs font-bold tracking-wider font-sans uppercase text-[#1F2933]">{event.type}</div>
                      <div className="text-[10px] font-mono text-[#667085]">{event.timestamp}</div>
                    </div>
                    <div className="text-sm font-sans text-[#1F2933]">{event.message}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {faultEvents.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-[#667085] space-y-4">
                <ShieldAlert size={32} className="opacity-20" />
                <div className="text-sm font-mono tracking-wider">No faults detected in current session</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
