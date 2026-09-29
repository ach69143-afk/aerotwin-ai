import { useStore } from '../store/useStore';
import { ToggleLeft, ToggleRight, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { WS_TELEMETRY_URL } from '../config/api';

export function SettingsPage() {
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const isConnected = useStore(s => s.isConnected);

  const Toggle = ({ label, value, onChange, description }: { label: string, value: boolean, onChange: (v: boolean) => void, description: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#D9E2DC]">
      <div>
        <div className="text-sm font-sans font-medium text-[#1F2933]">{label}</div>
        <div className="text-xs font-sans text-[#667085] mt-1">{description}</div>
      </div>
      <button 
        onClick={() => onChange(!value)}
        className={`p-1 rounded-full transition-colors ${value ? 'text-[#2E7D32]' : 'text-[#667085]'}`}
      >
        {value ? <ToggleRight size={32} strokeWidth={1} /> : <ToggleLeft size={32} strokeWidth={1} />}
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] uppercase">System Configuration</h1>
          <p className="text-xs font-mono tracking-widest text-[#667085] mt-1">USER PREFERENCES & DATALINK SETTINGS</p>
        </div>
        <SettingsIcon size={24} className="text-[#667085]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel p-6 flex flex-col">
          <h3 className="section-header mb-2">Display & UX</h3>
          
          <Toggle 
            label="Enable UI Animations" 
            description="Toggle motion and transition effects across the dashboard."
            value={settings.animationsEnabled} 
            onChange={(v) => updateSettings({ animationsEnabled: v })} 
          />
          <Toggle 
            label="Compact Mode" 
            description="Reduce padding and increase data density on complex views."
            value={settings.compactMode} 
            onChange={(v) => updateSettings({ compactMode: v })} 
          />
          <Toggle 
            label="Telemetry Overlay" 
            description="Show heads-up display of telemetry over the 3D digital twin."
            value={settings.showTelemetryOverlay} 
            onChange={(v) => updateSettings({ showTelemetryOverlay: v })} 
          />
        </div>

        <div className="panel p-6 flex flex-col">
          <h3 className="section-header mb-2">3D Digital Twin</h3>
          
          <Toggle 
            label="Auto-Rotation" 
            description="Continuously rotate the 3D model for full inspection."
            value={settings.autoRotation} 
            onChange={(v) => updateSettings({ autoRotation: v })} 
          />
          <Toggle 
            label="Component Labels" 
            description="Render HTML annotations floating next to 3D engine components."
            value={settings.showComponentLabels} 
            onChange={(v) => updateSettings({ showComponentLabels: v })} 
          />
          
          <div className="py-4 border-b border-[#D9E2DC]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-sm font-sans font-medium text-[#1F2933]">Animation Intensity</div>
                <div className="text-xs font-sans text-[#667085] mt-1">Control vibration and reaction scale in the 3D viewer.</div>
              </div>
              <div className="text-xs font-mono text-[#2E7D32]">{(settings.animationIntensity * 100).toFixed(0)}%</div>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={settings.animationIntensity} 
              onChange={(e) => updateSettings({ animationIntensity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-[#D9E2DC] rounded-full appearance-none cursor-pointer accent-[#2E7D32]"
            />
          </div>
        </div>
      </div>

      <div className="panel p-6 mt-2">
        <h3 className="section-header mb-4">Datalink Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-mono text-[#667085] uppercase tracking-widest block mb-2">WebSocket URL (Read-only)</label>
            <div className="px-4 py-2 bg-[#F4F8F4] border border-[#D9E2DC] rounded-lg text-sm font-mono text-[#667085]">
              {WS_TELEMETRY_URL}
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-[#667085] uppercase tracking-widest block mb-2">Connection Status</label>
            <div className={`px-4 py-2 border rounded-lg text-sm font-mono flex items-center gap-3 ${isConnected ? 'bg-[#EAF4EC] border-[#2E7D32]/20 text-[#2E7D32]' : 'bg-[#FEF2F2] border-[#DC2626]/20 text-[#DC2626]'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2E7D32]' : 'bg-[#DC2626]'}`} />
              {isConnected ? 'CONNECTED & RECEIVING' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
}
