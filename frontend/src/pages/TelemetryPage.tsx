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
          <h1 className="text-xl font-bold font-sans tracking-widest text-[#1F2933] uppercase">Raw Telemetry Feed</h1>
          <p className="text-xs font-mono tracking-widest text-[#667085] mt-1">10Hz MULTIPLEXED DATA STREAM</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#2E7D32]' : 'bg-[#DC2626]'}`} />
          <span className={isConnected ? 'text-[#2E7D32]' : 'text-[#DC2626]'}>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* Multi-variable Chart */}
      <div className="panel p-4 h-[300px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2DC" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#667085" fontSize={10} tick={{fontFamily: 'monospace'}} minTickGap={30} />
            <YAxis yAxisId="rpm" stroke="#2563EB" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} orientation="left" />
            <YAxis yAxisId="cht" stroke="#DC2626" fontSize={10} tick={{fontFamily: 'monospace'}} domain={['auto', 'auto']} orientation="right" />
            <Tooltip 
              contentStyle={{backgroundColor: '#FFFFFF', border: '1px solid #D9E2DC', borderRadius: '0.5rem', fontFamily: 'monospace', fontSize: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)'}} 
            />
            <Legend wrapperStyle={{fontSize: '12px', fontFamily: 'monospace'}} />
            <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#2563EB" dot={false} isAnimationActive={false} name="RPM" />
            <Line yAxisId="cht" type="monotone" dataKey="cht" stroke="#DC2626" dot={false} isAnimationActive={false} name="CHT (°C)" />
            <Line yAxisId="cht" type="monotone" dataKey="vibration" stroke="#D97706" dot={false} isAnimationActive={false} name="Vibration" />
            <Line yAxisId="cht" type="monotone" dataKey="oilPressure" stroke="#2E7D32" dot={false} isAnimationActive={false} name="Oil Press" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="panel flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono whitespace-nowrap">
            <thead className="text-[10px] uppercase tracking-widest text-[#667085] bg-[#F4F8F4] sticky top-0 border-b border-[#D9E2DC]">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">RPM</th>
                <th className="px-4 py-3 font-medium text-right">MAP (inHg)</th>
                <th className="px-4 py-3 font-medium text-right">Turbo RPM</th>
                <th className="px-4 py-3 font-medium text-right">Thr (%)</th>
                <th className="px-4 py-3 font-medium text-right">CHT (°C)</th>
                <th className="px-4 py-3 font-medium text-right">Cyl2 EGT (°C)</th>
                <th className="px-4 py-3 font-medium text-right">Cyl2 CHT (°C)</th>
                <th className="px-4 py-3 font-medium text-right">Oil (BAR)</th>
                <th className="px-4 py-3 font-medium text-right">Volt A</th>
                <th className="px-4 py-3 font-medium text-right">Volt B</th>
                <th className="px-4 py-3 font-medium text-right">Vib (mm/s)</th>
                <th className="px-4 py-3 font-medium text-right">Anomaly Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2DC]/50 text-xs">
              {tableData.map((row, i) => (
                <tr key={`${row.timestamp}-${i}`} className="hover:bg-[#F4F8F4] transition-colors">
                  <td className="px-4 py-2.5 text-[#667085]">{row.timestamp}</td>
                  <td className={`px-4 py-2.5 ${row.status === 'HEALTHY' ? 'text-[#2E7D32]' : 'text-[#D97706]'}`}>{row.status}</td>
                  <td className="px-4 py-2.5 text-right text-[#2563EB]">{row.rpm.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.mapPressure.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.turboRpm.toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.throttle.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.cht.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.cyl2Egt.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.cyl2Cht.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.oilPressure.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.voltageLaneA.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.voltageLaneB.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-[#1F2933]">{row.vibration.toFixed(3)}</td>
                  <td className="px-4 py-2.5 text-right text-[#667085]">{row.anomalyScore.toFixed(4)}</td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-[#667085]">Waiting for telemetry data...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
