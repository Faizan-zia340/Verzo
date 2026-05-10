import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiZap, FiPackage, FiActivity } from 'react-icons/fi';

const Card = ({ children, className = '' }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}
  >
    {children}
  </motion.div>
);

export default function DashboardStats() {
  const { user } = useAuth();
  const { creditLogs } = useCredits();

  const usageData = creditLogs
    .filter((l) => l.type === 'usage')
    .slice(0, 7)
    .map((l, i) => ({ day: `#${i + 1}`, used: Math.abs(l.amount) }));

  const totalUsed = creditLogs.filter((l) => l.type === 'usage').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
            <FiPackage size={16} className="text-violet-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Plan</p>
        </div>
        <p className="text-2xl font-bold text-gray-900 capitalize">{user?.subscription || 'free'}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FiZap size={16} className="text-indigo-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Credits</p>
        </div>
        <p className="text-2xl font-bold text-indigo-600">{user?.credits ?? '—'}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FiActivity size={16} className="text-emerald-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Generated</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">{totalUsed}</p>
      </Card>

      {usageData.length > 0 && (
        <Card className="col-span-1 md:col-span-3">
          <p className="text-sm font-semibold text-gray-700 mb-4">Recent Usage</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={usageData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="used" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
