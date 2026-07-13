import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FiZap, FiPackage, FiActivity, FiTrendingUp } from 'react-icons/fi';

const PLAN_COLORS = {
  free: 'text-gray-600 bg-gray-100',
  pro: 'text-indigo-700 bg-indigo-100',
  enterprise: 'text-violet-700 bg-violet-100',
};

export default function DashboardStats() {
  const { user } = useAuth();
  const { creditLogs } = useCredits();

  const safeLogs = Array.isArray(creditLogs) ? creditLogs : [];
  const usageLogs = safeLogs.filter((l) => l.type === 'usage');
  const totalUsed = usageLogs.length;
  const plan = user?.subscription || 'free';

  const usageData = usageLogs.slice(0, 7).map((l, i) => ({
    label: `#${usageLogs.length - i}`,
    used: Math.abs(l.amount),
  })).reverse();

  const STATS = [
    {
      icon: FiPackage,
      label: 'Plan',
      value: plan.charAt(0).toUpperCase() + plan.slice(1),
      sub: 'Current plan',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      valueCls: `font-black capitalize text-2xl ${PLAN_COLORS[plan]?.split(' ')[0] || 'text-gray-900'}`,
    },
    {
      icon: FiZap,
      label: 'Credits',
      value: user?.credits ?? '—',
      sub: 'Available to use',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      valueCls: 'font-black text-2xl text-indigo-600',
    },
    {
      icon: FiTrendingUp,
      label: 'Generated',
      value: totalUsed,
      sub: 'Total pieces',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueCls: 'font-black text-2xl text-gray-900',
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {STATS.map(({ icon: Icon, label, value, sub, iconBg, iconColor, valueCls }) => (
          <motion.div
            key={label}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={iconColor} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{sub}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={valueCls}>{value}</p>
          </motion.div>
        ))}
      </div>

      {usageData.length > 0 && (
        <motion.div
          whileHover={{ y: -1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiActivity size={14} className="text-indigo-500" />
              <p className="text-sm font-bold text-gray-900">Recent Usage</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">Last {usageData.length}</span>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={usageData} barSize={28}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                cursor={{ fill: '#f3f4f6', radius: 6 }}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="used" radius={[6, 6, 0, 0]}>
                {usageData.map((_, i) => (
                  <Cell key={i} fill={i === usageData.length - 1 ? '#6366f1' : '#e0e7ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
