import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Radio, Cpu, Shield, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
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
    { label: 'MISSION', shortLabel: 'MSN', value: 'SURVEILLANCE-07', icon: Shield, color: 'text-cyan-400' },
    { label: 'UAV', shortLabel: 'UAV', value: 'AIRBORNE', icon: Plane, color: 'text-emerald-400' },
    { label: 'DATALINK', shortLabel: 'LINK', value: isConnected ? 'ACTIVE' : 'OFFLINE', icon: Radio, color: isConnected ? 'text-emerald-400' : 'text-red-400' },
    { label: 'SYSTEM', shortLabel: 'SYS', value: systemStatus, icon: Cpu, color: statusColor },
  ];

  return (
    <div className="relative h-12 md:h-10 border-b border-border/30 bg-[#0c0c0e]/80 flex items-center pl-[64px] pr-3 md:px-5 gap-2 md:gap-6 shrink-0 select-none z-50 pointer-events-auto">
      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:hidden absolute left-[12px] top-0 w-[48px] h-[48px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-sm shrink-0 z-50 pointer-events-auto transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Title (hidden on md and above) */}
      <div className="flex md:hidden items-center gap-2 text-[10px] tracking-[0.15em] font-mono font-medium text-zinc-300 truncate">
        <span>AEROTWIN AI</span>
        <span className="text-zinc-600">•</span>
        <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
          {isConnected ? 'LINK ACTIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Desktop Detailed Status (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-4 md:gap-5 flex-1 min-w-max">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <Icon size={11} className="text-zinc-600 hidden sm:block" strokeWidth={1.5} />
              <span className="text-[9px] text-zinc-600 tracking-[0.15em] font-mono">
                <span className="hidden lg:inline">{item.label}</span>
                <span className="inline lg:hidden">{item.shortLabel}</span>
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
      <div className="text-[9px] text-zinc-600 font-mono tracking-wider shrink-0 ml-auto hidden sm:block">
        {telemetry?.timestamp || '--:--:--'}
      </div>
    </div>
  );
}
