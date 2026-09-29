import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function MissionReliabilityPage() {
  const telemetry = useStore(s => s.throttledTelemetry);

  if (!telemetry) return null;

  const isSafe = telemetry.status === 'HEALTHY';

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] uppercase">Mission Reliability</h1>
          <p className="text-xs font-mono tracking-widest text-[#667085] mt-1">FLIGHT READINESS ASSESSMENT</p>
        </div>
        <div className="prototype-badge">Simulated / Prototype</div>
      </div>

      <div className="bg-[#FFFBEB] border border-[#D97706]/30 p-4 rounded-lg flex items-start gap-4 shrink-0">
        <Shield className="text-[#D97706] mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-sans font-semibold text-[#D97706] mb-1">Prototype Module</h4>
          <p className="text-xs font-sans text-[#D97706]/80 leading-relaxed">
            Mission profiles and historical reliability models are not connected to backend data in this environment. 
            The readiness assessment below is simulated using current live telemetry thresholds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="panel p-6">
          <h3 className="section-header mb-6">Current Mission Profile</h3>
          <div className="space-y-6">
            <div>
              <div className="text-[10px] text-[#667085] font-mono tracking-widest mb-1 uppercase">Mission ID</div>
              <div className="text-sm font-mono text-[#1F2933]">SURVEILLANCE-07 (SIMULATED)</div>
            </div>
            <div>
              <div className="text-[10px] text-[#667085] font-mono tracking-widest mb-1 uppercase">Duration</div>
              <div className="text-sm font-mono text-[#1F2933]">04:30:00</div>
            </div>
            <div>
              <div className="text-[10px] text-[#667085] font-mono tracking-widest mb-1 uppercase">Required Confidence</div>
              <div className="text-sm font-mono text-[#1F2933]">99.9%</div>
            </div>
            <div>
              <div className="text-[10px] text-[#667085] font-mono tracking-widest mb-1 uppercase">Operating Environment</div>
              <div className="text-sm font-mono text-[#1F2933]">HIGH ALTITUDE / LOW TEMP</div>
            </div>
          </div>
        </div>

        <div className="panel p-6 flex flex-col">
          <h3 className="section-header mb-6">Readiness Assessment</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className={`p-6 rounded-full border ${isSafe ? 'border-[#2E7D32]/30 bg-[#EAF4EC]' : 'border-[#DC2626]/30 bg-[#FEF2F2]'}`}>
              {isSafe ? (
                <CheckCircle size={64} className="text-[#2E7D32]" strokeWidth={1.5} />
              ) : (
                <XCircle size={64} className="text-[#DC2626]" strokeWidth={1.5} />
              )}
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold font-sans tracking-widest mb-2 ${isSafe ? 'text-[#2E7D32]' : 'text-[#DC2626]'}`}>
                {isSafe ? 'GO FOR FLIGHT' : 'NO-GO / ABORT'}
              </div>
              <p className="text-sm font-sans text-[#667085]">
                {isSafe 
                  ? 'All telemetry parameters within acceptable margins for mission duration.' 
                  : 'Engine anomaly detected. Risk of failure exceeds mission safety thresholds.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
