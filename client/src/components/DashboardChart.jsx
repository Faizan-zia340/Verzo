import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiActivity } from 'react-icons/fi';

export default function DashboardChart({ data }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FiActivity size={14} className="text-indigo-500" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Recent Usage</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-medium">Last {data.length}</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
          <Tooltip
            cursor={{ fill: '#f3f4f6', radius: 6 }}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
          />
          <Bar dataKey="used" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === data.length - 1 ? '#6366f1' : '#e0e7ff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}