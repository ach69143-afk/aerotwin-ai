import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useTelemetrySocket } from '../../hooks/useTelemetrySocket';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { WS_TELEMETRY_URL } from '../../config/api';

export function AppLayout() {
  // Single WebSocket connection for the entire app
  useTelemetrySocket(WS_TELEMETRY_URL);
  const isReady = useStore((s) => s.telemetry !== null);
  const settings = useStore((s) => s.settings);
  const location = useLocation();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const openMobileDrawer = useCallback(() => setIsMobileDrawerOpen(true), []);
  const closeMobileDrawer = useCallback(() => setIsMobileDrawerOpen(false), []);

  // Show loading screen while waiting for first telemetry frame
  if (!isReady) {
    return (
      <MotionConfig reducedMotion={settings.animationsEnabled ? 'never' : 'always'}>
      <div className={`flex flex-col items-center justify-center h-screen w-screen bg-[#09090b] text-cyan-500 font-mono gap-4 overflow-hidden ${settings.animationsEnabled ? '' : 'animations-disabled'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Activity size={32} className="text-cyan-500" />
        </motion.div>
        INITIALIZING AEROTWIN AI DATALINK...
      </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={settings.animationsEnabled ? 'never' : 'always'}>
    <div className={`flex h-screen w-full bg-[#09090b] text-foreground overflow-hidden selection:bg-cyan-900 selection:text-cyan-50 ${settings.compactMode ? 'compact-mode' : ''} ${settings.animationsEnabled ? '' : 'animations-disabled'}`}>
      {/* Sidebar — always visible on md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen} 
        onClose={closeMobileDrawer}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={openMobileDrawer} />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </MotionConfig>
  );
}
