import { Database } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export function HistoricalDataPage() {
  const history = useStore(s => s.throttledHistory);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase">Historical Data</h1>
          <p className="text-xs font-mono tracking-widest text-zinc-500 mt-1">FLEET-WIDE TELEMETRY ARCHIVE</p>
        </div>
        <div className="prototype-badge">Session Data Only</div>
      </div>

      <div className="bg-cyan-950/20 border border-cyan-900/50 p-4 rounded-sm flex items-start gap-4 shrink-0">
        <Database className="text-cyan-500 mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-sans font-semibold text-cyan-500 mb-1">Volatile Storage</h4>
          <p className="text-xs font-sans text-cyan-500/80 leading-relaxed">
            There is no backend endpoint for persistent historical data in this environment. 
            The data shown below is retained in memory for the current session only (max 600 samples) and will be lost on refresh.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="panel p-6 flex flex-col justify-center">
          <h3 className="section-header mb-6">Session Archive Stats</h3>
          <div className="space-y-6">
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1 uppercase">Samples Retained</div>
              <div className="text-2xl font-mono text-cyan-400">{history.length}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1 uppercase">Time Window</div>
              <div className="text-2xl font-mono text-cyan-400">{(history.length * 0.1).toFixed(1)}s</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1 uppercase">Data Rate</div>
              <div className="text-2xl font-mono text-cyan-400">10 Hz</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 panel overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border/50 bg-[#0f0f11] shrink-0">
             <h3 className="section-header">Recent Session Samples</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm font-mono whitespace-nowrap">
              <thead className="text-[10px] uppercase tracking-widest text-zinc-500 sticky top-0 bg-[#121214]">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-right">RPM</th>
                  <th className="px-4 py-3 font-medium text-right">CHT</th>
                  <th className="px-4 py-3 font-medium text-right">Vib</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {[...history].reverse().slice(0, 50).map((row, i) => (
                  <tr key={`${row.timestamp}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 text-zinc-400">{row.timestamp}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">{row.rpm.toFixed(1)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">{row.cht.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-zinc-300">{row.vibration.toFixed(3)}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">No session data archived yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
