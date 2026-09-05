
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  HeartPulse,
  Box,
  Radio,
  AlertTriangle,
  Clock,
  Shield,
  Database,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Engine Health', path: '/engine-health', icon: HeartPulse },
  { label: 'Digital Twin', path: '/digital-twin', icon: Box },
  { label: 'Telemetry', path: '/telemetry', icon: Radio },
  { label: 'Fault Analysis', path: '/fault-analysis', icon: AlertTriangle },
  { label: 'RUL Prediction', path: '/rul-prediction', icon: Clock },
  { label: 'Mission Reliability', path: '/mission-reliability', icon: Shield },
  { label: 'Historical Data', path: '/historical-data', icon: Database },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const isConnected = useStore((s) => s.isConnected);
  const telemetry = useStore((s) => s.throttledTelemetry);
  const location = useLocation();

  const systemStatus = !telemetry
    ? 'OFFLINE'
    : telemetry.status === 'HEALTHY'
    ? 'NOMINAL'
    : telemetry.risk === 'CRITICAL'
    ? 'CRITICAL'
    : 'WARNING';

  const statusColor =
    systemStatus === 'NOMINAL'
      ? 'text-emerald-400'
      : systemStatus === 'WARNING'
      ? 'text-amber-400'
      : systemStatus === 'CRITICAL'
      ? 'text-red-400'
      : 'text-zinc-500';

  return (
    <div className="w-60 border-r border-border/30 bg-[#0c0c0e] flex flex-col shrink-0 z-20 select-none">
      {/* Branding */}
      <div className="px-5 pt-6 pb-4 border-b border-border/30">
        <h1 className="text-base font-semibold tracking-[0.2em] text-cyan-400 font-sans">
          AEROTWIN AI
        </h1>
        <p className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] mt-1 font-sans">
          Digital Engine Intelligence
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: 'tween', duration: 0.15 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-wider font-sans
                  rounded-sm cursor-pointer transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-cyan-950/30 text-cyan-400'
                      : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-[2px] bg-cyan-400 rounded-r"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon size={14} strokeWidth={1.5} />
                <span>{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="px-4 py-3 border-t border-border/30 space-y-2">
        <div className="flex items-center gap-2 text-[9px] tracking-[0.15em] font-mono">
          <motion.div
            animate={{ opacity: isConnected ? [1, 0.4, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
            }`}
          />
          <span className="text-zinc-500">
            {isConnected ? 'DATALINK ACTIVE' : 'DATALINK OFFLINE'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.15em] font-mono">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              systemStatus === 'NOMINAL'
                ? 'bg-emerald-500'
                : systemStatus === 'WARNING'
                ? 'bg-amber-400'
                : systemStatus === 'CRITICAL'
                ? 'bg-red-500'
                : 'bg-zinc-600'
            }`}
          />
          <span className={statusColor}>SYS: {systemStatus}</span>
        </div>
      </div>
    </div>
  );
}
