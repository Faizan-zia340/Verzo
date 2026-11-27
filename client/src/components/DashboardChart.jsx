import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiActivity } from 'react-icons/fi';

// Tooltip that follows the theme: the default Recharts tooltip is a
// white box, and the hover cursor highlight was a pale #f3f4f6 fill —
// in dark mode both showed up as big white rectangles over the chart.
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-700 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-gray-900 dark:text-white">{label}</p>
      <p className="text-gray-500 dark:text-slate-400">used: {payload[0].value}</p>
    </div>
  );
}

export default function DashboardChart({ data }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiActivity size={14} className="text-teak-600 dark:text-teak-400" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Recent Usage</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-ink-raised px-2.5 py-1 rounded-full font-medium">Last {data.length}</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(139,111,71,0.12)', radius: 6 }}
          />
          <Bar dataKey="used" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? '#8b6f47' : '#e2d2b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}