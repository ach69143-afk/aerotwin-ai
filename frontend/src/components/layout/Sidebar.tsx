
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  AlertTriangle,
  Wrench,
  Map,
  Settings,
  Box,
  Database,
} from 'lucide-react';


export const navItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Engine', path: '/engine-health', icon: Cpu },
  { label: 'Digital Twin', path: '/digital-twin', icon: Box },
  { label: 'Telemetry', path: '/telemetry', icon: Radio },
  { label: 'Diagnostics', path: '/fault-analysis', icon: AlertTriangle },
  { label: 'Maintenance', path: '/rul-prediction', icon: Wrench },
  { label: 'Mission Replay', path: '/mission-reliability', icon: Map },
  { label: 'Historical Data', path: '/historical-data', icon: Database },
  { label: 'System', path: '/settings', icon: Settings },
];

export function Sidebar() {
  const isConnected = useStore((s) => s.isConnected);
  const location = useLocation();
  const systemStatus = useStore((s) => {
    const t = s.throttledTelemetry;
    if (!t) return 'OFFLINE';
    if (t.status === 'HEALTHY') return 'ONLINE';
    if (t.risk === 'CRITICAL') return 'CRITICAL';
    return 'WARNING';
  });

  const statusColor =
    systemStatus === 'ONLINE'
      ? '#4ADE80'
      : systemStatus === 'WARNING'
      ? '#FBBF24'
      : systemStatus === 'CRITICAL'
      ? '#F87171'
      : '#94A3B8';

  return (
    <div
      className="flex flex-col shrink-0 z-20 select-none h-full"
      style={{
        width: '256px',
        backgroundColor: '#102F4F',
      }}
    >
      {/* ── Branding ─────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 20px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
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
            marginTop: '6px',
            color: '#B8C7D6',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.5,
          }}
        >
          Engine Digital Twin &amp;<br />
          Health Monitoring
        </p>
      </div>

      {/* ── System Status ────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <p
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#8FA4B8',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500,
            marginBottom: '8px',
          }}
        >
          SYSTEM STATUS
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ opacity: isConnected ? [1, 0.4, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 500,
              color: statusColor,
            }}
          >
            {systemStatus}
          </span>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
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
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                height: '48px',
                padding: '0 16px',
                borderRadius: '10px',
                transition: 'background-color 150ms ease, color 150ms ease',
                backgroundColor: isActive ? '#2E7D32' : 'transparent',
                color: isActive ? '#FFFFFF' : '#B8C7D6',
                boxSizing: 'border-box',
                border: isActive
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1F5A3A';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#B8C7D6';
                }
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
            </NavLink>
          );
        })}
      </nav>



      {/* ── Footer ───────────────────────────────────────── */}
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
              flexShrink: 0,
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
    </div>
  );
}
