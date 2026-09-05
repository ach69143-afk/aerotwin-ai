
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Radio, Cpu, Shield } from 'lucide-react';

export function TopBar() {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const isConnected = useStore((s) => s.isConnected);

  const systemStatus = !telemetry
    ? 'OFFLINE'
    : telemetry.status === 'HEALTHY'
    ? 'NOMINAL'
    : telemetry.risk === 'CRITICAL'
    ? 'CRITICAL'
    : 'DEGRADED';

  const statusColor =
    systemStatus === 'NOMINAL'
      ? 'text-emerald-400'
      : systemStatus === 'DEGRADED'
      ? 'text-amber-400'
      : systemStatus === 'CRITICAL'
      ? 'text-red-400'
      : 'text-zinc-500';



  const items = [
    { label: 'MISSION', value: 'SURVEILLANCE-07', icon: Shield, color: 'text-cyan-400' },
    { label: 'UAV', value: 'AIRBORNE', icon: Plane, color: 'text-emerald-400' },
    { label: 'DATALINK', value: isConnected ? 'ACTIVE' : 'OFFLINE', icon: Radio, color: isConnected ? 'text-emerald-400' : 'text-red-400' },
    { label: 'SYSTEM', value: systemStatus, icon: Cpu, color: statusColor },
  ];

  return (
    <div className="h-10 border-b border-border/30 bg-[#0c0c0e]/80 flex items-center px-5 gap-6 shrink-0 select-none">
      <div className="flex items-center gap-5 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-2">
              <Icon size={11} className="text-zinc-600" strokeWidth={1.5} />
              <span className="text-[9px] text-zinc-600 tracking-[0.15em] font-mono">
                {item.label}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={item.value}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className={`text-[9px] tracking-[0.15em] font-mono font-medium ${item.color}`}
                >
                  {item.value}
                </motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Right side: time */}
      <div className="text-[9px] text-zinc-600 font-mono tracking-wider">
        {telemetry?.timestamp || '--:--:--'}
      </div>
    </div>
  );
}
