import { DigitalTwin } from '../components/DigitalTwin';
import { EngineControlBar } from '../components/EngineControlBar';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Activity, Thermometer, Droplets, Radio, Zap, Gauge, Wind, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

export function OverviewPage() {
  const telemetry = useStore((s) => s.throttledTelemetry);

  const isStarting = telemetry?.engineState === 'STARTING';
  const startupPct = isStarting ? Math.min(100, ((telemetry?.rpm ?? 0) / 5000) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="page-container"
    >
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-1">
        <div>
          <h1 className="text-lg font-semibold font-sans tracking-[0.08em] text-[#1F2933] uppercase">
            Engine Overview
          </h1>
          <p className="text-[10px] font-sans tracking-[0.12em] text-[#667085] mt-0.5 uppercase">
            Rotax 915 iS — Real-Time Telemetry Dashboard
          </p>
        </div>
        <EngineControlBar />
      </div>

      {/* ── Engine Intelligence Cards ────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="panel p-4 flex flex-col justify-center items-center border-l-4 border-l-[#2E7D32]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} className="text-[#2E7D32]" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              System Health
            </span>
          </div>
          <div className="text-3xl font-mono font-bold text-[#2E7D32] tracking-tight">
            {telemetry?.healthPct?.toFixed(1) ?? '100.0'}%
          </div>
        </div>

        <div className={`panel p-4 flex flex-col justify-center items-center border-l-4 ${telemetry?.risk === 'HIGH' ? 'border-l-[#DC2626]' : telemetry?.risk === 'MEDIUM' ? 'border-l-[#D97706]' : 'border-l-[#2563EB]'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className={telemetry?.risk === 'HIGH' ? 'text-[#DC2626]' : telemetry?.risk === 'MEDIUM' ? 'text-[#D97706]' : 'text-[#2563EB]'} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Risk Level
            </span>
          </div>
          <div className={`text-2xl font-mono font-bold tracking-widest ${telemetry?.risk === 'HIGH' ? 'text-[#DC2626]' : telemetry?.risk === 'MEDIUM' ? 'text-[#D97706]' : 'text-[#2563EB]'}`}>
            {telemetry?.risk ?? 'NORMAL'}
          </div>
        </div>

        <div className="panel p-4 flex flex-col justify-center items-center border-l-4 border-l-[#667085]">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-[#667085]" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Remaining Useful Life
            </span>
          </div>
          <div className="text-2xl font-mono font-bold text-[#1F2933] tracking-tight">
            {telemetry?.rul ?? '--'}
          </div>
        </div>
      </div>

      {/* ── Live Telemetry Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* RPM */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className={isStarting ? 'text-[#2563EB]' : 'text-[#2563EB]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              RPM
            </span>
          </div>
          <div className="text-2xl font-mono font-medium text-[#2563EB] tracking-tight">
            {telemetry?.rpm?.toFixed(0) ?? '--'}
            {isStarting && (
              <span className="text-sm text-[#667085] font-normal ml-1">/ 5,000</span>
            )}
          </div>
          {isStarting ? (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${startupPct}%` }}
                />
              </div>
              <div className="text-[9px] font-sans text-[#2563EB] mt-1 tracking-wider">
                STARTING — {startupPct.toFixed(0)}%
              </div>
            </div>
          ) : (
            <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">REV / MIN</div>
          )}
        </div>

        {/* MAP Pressure */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Gauge size={14} className="text-[#2563EB]" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              MAP Pressure
            </span>
          </div>
          <div className="text-2xl font-mono font-medium text-[#1F2933] tracking-tight">
            {telemetry?.mapPressure?.toFixed(1) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">INHG</div>
        </div>

        {/* Turbo RPM */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Wind size={14} className="text-[#2563EB]" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Turbo RPM
            </span>
          </div>
          <div className="text-2xl font-mono font-medium text-[#1F2933] tracking-tight">
            {telemetry?.turboRpm?.toFixed(0) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">REV / MIN</div>
        </div>

        {/* Voltage Lane A */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className={telemetry && telemetry.voltageLaneA < 12 ? 'text-[#D97706]' : 'text-[#2E7D32]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Voltage Lane A
            </span>
          </div>
          <div className={`text-2xl font-mono font-medium tracking-tight ${telemetry && telemetry.voltageLaneA < 12 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
            {telemetry?.voltageLaneA?.toFixed(1) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">VOLTS</div>
        </div>

        {/* CHT */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer size={14} className={telemetry && telemetry.cht > 165 ? 'text-[#D97706]' : 'text-[#2E7D32]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Cyl Head Temp
            </span>
          </div>
          <div className={`text-2xl font-mono font-medium tracking-tight ${telemetry && telemetry.cht > 165 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
            {telemetry?.cht?.toFixed(1) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">°C</div>
        </div>
        
        {/* Cyl2 EGT */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer size={14} className={telemetry && telemetry.cyl2Egt > 900 ? 'text-[#D97706]' : 'text-[#2E7D32]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Cyl2 EGT
            </span>
          </div>
          <div className={`text-2xl font-mono font-medium tracking-tight ${telemetry && telemetry.cyl2Egt > 900 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
            {telemetry?.cyl2Egt?.toFixed(1) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">°C</div>
        </div>

        {/* Oil Pressure */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Droplets size={14} className={telemetry && telemetry.oilPressure < 3.5 ? 'text-[#D97706]' : 'text-[#2E7D32]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Oil Pressure
            </span>
          </div>
          <div className={`text-2xl font-mono font-medium tracking-tight ${telemetry && telemetry.oilPressure < 3.5 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
            {telemetry?.oilPressure?.toFixed(2) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">BAR</div>
        </div>

        {/* Vibration */}
        <div className="panel p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={14} className={telemetry && telemetry.vibration > 0.4 ? 'text-[#D97706]' : 'text-[#2E7D32]'} />
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium">
              Vibration
            </span>
          </div>
          <div className={`text-2xl font-mono font-medium tracking-tight ${telemetry && telemetry.vibration > 0.4 ? 'text-[#D97706]' : 'text-[#2E7D32]'}`}>
            {telemetry?.vibration?.toFixed(3) ?? '--'}
          </div>
          <div className="text-[9px] font-sans text-[#667085] mt-1 tracking-wider">MM / S</div>
        </div>
      </div>

      {/* ── Digital Twin + Status ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* 3D Digital Twin */}
        <div className="lg:col-span-2 min-h-[340px] md:min-h-[400px]">
          <DigitalTwin />
        </div>

        {/* Status Panel */}
        <div className="flex flex-col gap-4">
          {/* Engine Diagnostics */}
          <div className="panel p-5 flex flex-col flex-1 min-h-[250px]">
            <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#667085] font-medium mb-4">
              Diagnostic Summary
            </span>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center border-b border-[#E4E7EC] pb-2">
                <span className="text-[11px] font-sans text-[#667085]">Engine Status</span>
                <span className="text-[11px] font-mono font-medium text-[#1F2933]">
                  {telemetry?.status ?? 'STANDBY'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#E4E7EC] pb-2">
                <span className="text-[11px] font-sans text-[#667085]">Anomaly Score</span>
                <span className="text-[11px] font-mono font-medium text-[#1F2933]">
                  {telemetry?.anomalyScore?.toFixed(3) ?? '0.000'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[#E4E7EC] pb-2">
                <span className="text-[11px] font-sans text-[#667085]">Active Fault</span>
                <span className="text-[11px] font-mono font-medium text-[#1F2933]">
                  {telemetry?.faultType && telemetry.faultType !== 'NONE' ? telemetry.faultType.replace(/_/g, ' ') : 'NONE'}
                </span>
              </div>
            </div>

            {/* MAINTENANCE ADVISORY */}
            <div className={`mt-auto p-4 border rounded-md flex flex-col gap-2 ${
              !telemetry || telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY' 
                ? 'bg-[#EAF4EC] border-[#2E7D32]/20' 
                : telemetry.recommendationPriority === 'CRITICAL' 
                  ? 'bg-[#FEF2F2] border-[#DC2626]/20' 
                  : 'bg-[#FFFBEB] border-[#D97706]/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !telemetry || telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY'
                    ? 'bg-[#2E7D32]'
                    : telemetry.recommendationPriority === 'CRITICAL'
                      ? 'bg-[#DC2626]'
                      : 'bg-[#D97706]'
                }`} />
                <span className="text-[9px] uppercase tracking-[0.15em] font-sans text-[#1F2933] font-bold">
                  Engineering Advisory
                </span>
              </div>
              
              {(!telemetry || telemetry.status === 'HEALTHY' || telemetry.status === 'STANDBY') ? (
                <div>
                  <p className="text-[11px] font-bold text-[#2E7D32] mb-1">No action required.</p>
                  <p className="text-[10px] font-sans text-[#667085] leading-relaxed">
                    Engine parameters are within normal operating conditions.
                  </p>
                </div>
              ) : (
                <div>
                  <p className={`text-[11px] font-bold mb-2 ${
                    telemetry.recommendationPriority === 'CRITICAL' ? 'text-[#DC2626]' : 'text-[#D97706]'
                  }`}>
                    {telemetry.recommendationReason || (telemetry.faultType && telemetry.faultType !== 'NONE' ? telemetry.faultType.replace(/_/g, ' ') : 'Abnormal condition detected.')}
                  </p>
                  <div className="border-t border-[#E4E7EC]/50 pt-2 mt-1">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#667085] mb-0.5">Recommended Action:</p>
                    <p className="text-[10px] font-sans text-[#1F2933] leading-relaxed">
                      {telemetry.recommendation || 'Inspect engine components and reduce load.'}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-[#667085]">Priority:</p>
                    <p className={`text-[10px] font-bold ${
                      telemetry.recommendationPriority === 'CRITICAL' ? 'text-[#DC2626]' : 'text-[#D97706]'
                    }`}>
                      {telemetry.recommendationPriority || 'HIGH'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
