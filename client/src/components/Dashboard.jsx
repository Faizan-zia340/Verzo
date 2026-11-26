import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiPackage, FiTrendingUp } from 'react-icons/fi';

const DashboardChart = lazy(() => import('./DashboardChart.jsx'));

const PLAN_COLORS = {
  free: 'text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-ink-raised',
  pro: 'text-indigo-700 dark:text-ink-link bg-indigo-100 dark:bg-ink-raised',
  enterprise: 'text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-ink-raised',
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
      iconBg: 'bg-violet-100 dark:bg-ink-raised',
      iconColor: 'text-violet-600 dark:text-violet-400',
      valueCls: `font-black capitalize text-2xl ${PLAN_COLORS[plan]?.split(' ')[0] || 'text-gray-900 dark:text-white'}`,
    },
    {
      icon: FiZap,
      label: 'Credits',
      value: user?.credits ?? '—',
      sub: 'Available to use',
      iconBg: 'bg-indigo-100 dark:bg-ink-raised',
      iconColor: 'text-indigo-600 dark:text-ink-link',
      valueCls: 'font-black text-2xl text-indigo-600 dark:text-ink-link',
    },
    {
      icon: FiTrendingUp,
      label: 'Generated',
      value: totalUsed,
      sub: 'Total pieces',
      iconBg: 'bg-emerald-100 dark:bg-ink-raised',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      valueCls: 'font-black text-2xl text-gray-900 dark:text-white',
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {STATS.map(({ icon: Icon, label, value, sub, iconBg, iconColor, valueCls }) => (
          <motion.div
            key={label}
            whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
            className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon size={17} className={iconColor} />
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">{sub}</span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={valueCls}>{value}</p>
          </motion.div>
        ))}
      </div>

      {usageData.length > 0 && (
        <Suspense fallback={<div className="h-[200px] rounded-2xl bg-gray-100 dark:bg-ink-raised animate-pulse" />}>
          <DashboardChart data={usageData} />
        </Suspense>
      )}
    </div>
  );
}
