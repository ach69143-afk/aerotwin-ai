import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const telemetry = useStore((s) => s.throttledTelemetry);
  const isConnected = useStore((s) => s.isConnected);

  const engineState = telemetry?.engineState || (isConnected ? 'CONNECTING' : 'OFFLINE');
  const healthPct = telemetry?.healthPct?.toFixed(1) ?? '--';
  const risk = telemetry?.risk ?? '--';

  const riskColor =
    risk === 'NORMAL' ? '#2E7D32' :
    risk === 'WARNING' ? '#D97706' :
    risk === 'CRITICAL' || risk === 'HIGH' ? '#DC2626' : '#667085';

  return (
    <div
      className="relative h-12 md:h-11 flex items-center pl-[56px] pr-4 md:px-6 gap-3 md:gap-6 shrink-0 select-none z-50"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E7EC',
      }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:hidden absolute left-[10px] top-0 w-[44px] h-[48px] flex items-center justify-center rounded-lg shrink-0 z-50 pointer-events-auto transition-colors"
        style={{ color: '#667085' }}
      >
        <Menu size={22} />
      </button>

      {/* Mobile Title */}
      <div className="flex md:hidden items-center gap-2 text-[11px] tracking-[0.06em] font-sans font-medium truncate"
        style={{ color: '#1F2933' }}
      >
        <span>AeroTwin AI</span>
        <span style={{ color: '#E4E7EC' }}>•</span>
        <span style={{ color: isConnected ? '#2E7D32' : '#DC2626' }}>
          {isConnected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Desktop Status Items */}
      <div className="hidden md:flex items-center gap-6 flex-1">
        {/* Engine State */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.1em] font-sans" style={{ color: '#667085' }}>
            ENGINE
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={engineState}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] tracking-[0.1em] font-sans font-semibold"
              style={{
                color: engineState === 'RUNNING' ? '#2E7D32' :
                       engineState === 'OFF' ? '#667085' :
                       engineState === 'STARTING' ? '#2563EB' : '#D97706'
              }}
            >
              {engineState}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Health */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.1em] font-sans" style={{ color: '#667085' }}>
            HEALTH
          </span>
          <span className="text-[10px] tracking-[0.1em] font-sans font-semibold" style={{ color: '#1F2933' }}>
            {healthPct}%
          </span>
        </div>

        {/* Risk */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.1em] font-sans" style={{ color: '#667085' }}>
            RISK
          </span>
          <span className="text-[10px] tracking-[0.1em] font-sans font-semibold" style={{ color: riskColor }}>
            {risk}
          </span>
        </div>

        {/* Connection */}
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isConnected ? '#2E7D32' : '#DC2626' }}
          />
          <span className="text-[10px] tracking-[0.1em] font-sans" style={{ color: isConnected ? '#2E7D32' : '#DC2626' }}>
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right side: time */}
      <div className="text-[10px] font-mono tracking-wider shrink-0 ml-auto hidden sm:block"
        style={{ color: '#667085' }}
      >
        {telemetry?.timestamp || '--:--:--'}
      </div>
    </div>
  );
}
