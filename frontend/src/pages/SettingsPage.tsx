import { useStore } from '../store/useStore';
import { ToggleLeft, ToggleRight, Settings as SettingsIcon } from 'lucide-react';

export function SettingsPage() {
  const settings = useStore(s => s.settings);
  const updateSettings = useStore(s => s.updateSettings);
  const isConnected = useStore(s => s.isConnected);

  const Toggle = ({ label, value, onChange, description }: { label: string, value: boolean, onChange: (v: boolean) => void, description: string }) => (
    <div className="flex items-center justify-between py-4 border-b border-border/50">
      <div>
        <div className="text-sm font-sans font-medium text-foreground">{label}</div>
        <div className="text-xs font-sans text-zinc-500 mt-1">{description}</div>
      </div>
      <button 
        onClick={() => onChange(!value)}
        className={`p-1 rounded-full transition-colors ${value ? 'text-cyan-400' : 'text-zinc-600'}`}
      >
        {value ? <ToggleRight size={32} strokeWidth={1} /> : <ToggleLeft size={32} strokeWidth={1} />}
      </button>
    </div>
  );

  return (
    <div className="page-container max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase">System Configuration</h1>
          <p className="text-xs font-mono tracking-widest text-zinc-500 mt-1">USER PREFERENCES & DATALINK SETTINGS</p>
        </div>
        <SettingsIcon size={24} className="text-zinc-600" />
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
          
          <div className="py-4 border-b border-border/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-sm font-sans font-medium text-foreground">Animation Intensity</div>
                <div className="text-xs font-sans text-zinc-500 mt-1">Control vibration and reaction scale in the 3D viewer.</div>
              </div>
              <div className="text-xs font-mono text-cyan-400">{(settings.animationIntensity * 100).toFixed(0)}%</div>
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={settings.animationIntensity} 
              onChange={(e) => updateSettings({ animationIntensity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="panel p-6 mt-2">
        <h3 className="section-header mb-4">Datalink Connection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">WebSocket URL (Read-only)</label>
            <div className="px-4 py-2 bg-black border border-border/50 rounded-sm text-sm font-mono text-zinc-400">
              ws://localhost:8000/ws/telemetry
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest block mb-2">Connection Status</label>
            <div className={`px-4 py-2 border rounded-sm text-sm font-mono flex items-center gap-3 ${isConnected ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-400' : 'bg-red-950/20 border-red-900/50 text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isConnected ? 'CONNECTED & RECEIVING' : 'DISCONNECTED'}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
