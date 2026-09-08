import { useStore } from '../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

export function TelemetryPage() {
  const history = useStore(s => s.throttledHistory);
  const isConnected = useStore(s => s.isConnected);

  // We only want to show the last 100 points for the chart to keep it performant
  const chartData = history.slice(-100);
  
  // For the table, show the most recent 20, reversed so newest is on top
  const tableData = [...history].reverse().slice(0, 20);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="page-container">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-xl font-bold font-sans tracking-widest text-cyan-400 uppercase">Raw Telemetry Feed</h1>
          <p className="text-xs font-mono tracking-widest text-zinc-500 mt-1">10Hz MULTIPLEXED DATA STREAM</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* Multi-variable Chart */}
      <div className="panel p-4 h-[300px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#52525b" fontSize={10} tick={{fontFamily: 'monospace'}} minTickGap={30} />
            <YAxis yAxisId="rpm" stroke="#06b6d4" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} orientation="left" />
            <YAxis yAxisId="cht" stroke="#ef4444" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} orientation="right" />
            <Tooltip 
              contentStyle={{backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '2px', fontFamily: 'monospace', fontSize: '12px'}} 
            />
            <Legend wrapperStyle={{fontSize: '12px', fontFamily: 'monospace'}} />
            <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#06b6d4" dot={false} isAnimationActive={false} name="RPM" />
            <Line yAxisId="cht" type="monotone" dataKey="cht" stroke="#ef4444" dot={false} isAnimationActive={false} name="CHT (°C)" />
            <Line yAxisId="cht" type="monotone" dataKey="vibration" stroke="#f59e0b" dot={false} isAnimationActive={false} name="Vibration" />
            <Line yAxisId="cht" type="monotone" dataKey="oilPressure" stroke="#34d399" dot={false} isAnimationActive={false} name="Oil Press" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="panel flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono whitespace-nowrap">
            <thead className="text-[10px] uppercase tracking-widest text-zinc-500 bg-[#0f0f11] sticky top-0 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">RPM</th>
                <th className="px-4 py-3 font-medium text-right">CHT (°C)</th>
                <th className="px-4 py-3 font-medium text-right">Oil (BAR)</th>
                <th className="px-4 py-3 font-medium text-right">Vib (mm/s)</th>
                <th className="px-4 py-3 font-medium text-right">Anomaly Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {tableData.map((row, i) => (
                <tr key={`${row.timestamp}-${i}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-zinc-400">{row.timestamp}</td>
                  <td className={`px-4 py-2.5 ${row.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'}`}>{row.status}</td>
                  <td className="px-4 py-2.5 text-right text-cyan-400">{row.rpm.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">{row.cht.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">{row.oilPressure.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-300">{row.vibration.toFixed(3)}</td>
                  <td className="px-4 py-2.5 text-right text-zinc-400">{row.anomalyScore.toFixed(4)}</td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-600">Waiting for telemetry data...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
