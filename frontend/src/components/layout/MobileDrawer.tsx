import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { navItems } from './Sidebar';
import { AIAssistant } from '../AIAssistant';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const isConnected = useStore((s) => s.isConnected);
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col"
            style={{
              width: '280px',
              backgroundColor: '#102F4F',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 20px 16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    color: '#FFFFFF',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    margin: 0,
                  }}
                >
                  AeroTwin AI
                </h1>
                <p
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: '4px',
                    color: '#B8C7D6',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Engine Digital Twin &amp; Health Monitoring
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#B8C7D6',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav
              style={{
                flex: 1,
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                overflowY: 'auto',
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        height: '48px',
                        padding: '0 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease',
                        backgroundColor: isActive ? '#2E7D32' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#B8C7D6',
                        boxSizing: 'border-box',
                        border: isActive
                          ? '1px solid rgba(255,255,255,0.12)'
                          : '1px solid transparent',
                      }}
                    >
                      <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '13px',
                          letterSpacing: '0.04em',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </NavLink>
                );
              })}
            </nav>

            {/* ── AI Assistant ────────────────────────────────── */}
            <AIAssistant />

            {/* Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isConnected ? '#4ADE80' : '#F87171',
                  }}
                />
                <span
                  style={{
                    fontSize: '9px',
                    letterSpacing: '0.1em',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: '#8FA4B8',
                  }}
                >
                  {isConnected ? 'DATALINK ACTIVE' : 'DATALINK OFFLINE'}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
