import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { navItems } from './Sidebar';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
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

  // Close drawer when location changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border/30 bg-[#0c0c0e] flex flex-col shadow-2xl md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border/30">
              <div>
                <h1 className="text-base font-semibold tracking-[0.2em] text-cyan-400 font-sans">
                  AEROTWIN AI
                </h1>
                <p className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] mt-1 font-sans">
                  Digital Engine Intelligence
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
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
                    <div
                      className={`
                        relative flex items-center gap-3 px-3 py-3 text-[12px] tracking-wider font-sans
                        rounded-sm cursor-pointer transition-colors duration-150
                        ${
                          isActive
                            ? 'bg-cyan-950/30 text-cyan-400'
                            : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-300'
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-cyan-400 rounded-r" />
                      )}
                      <Icon size={16} strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>

            {/* System Status Footer */}
            <div className="px-4 py-4 border-t border-border/30 space-y-3 pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] font-mono">
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
              <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] font-mono">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
