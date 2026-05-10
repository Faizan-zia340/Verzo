import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import { useAuth } from '../context/AuthContext.js';
import DashboardStats from '../components/Dashboard.jsx';
import Generator from '../components/Generator.jsx';
import ContentHistory from '../components/ContentHistory.jsx';
import { FiZap, FiClock } from 'react-icons/fi';

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

export default function Dashboard() {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const [tab, setTab] = useState('generate');

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div {...fadeUp} className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hi, {user?.name} 👋</h1>
            <p className="text-gray-500 mt-1 text-sm">Your AI content workspace</p>
          </div>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
          <DashboardStats />
        </motion.div>

        {/* Tabs */}
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.1 }} className="flex gap-2 mb-6">
          {[
            { key: 'generate', label: 'Generate', icon: FiZap },
            { key: 'history', label: 'History', icon: FiClock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium transition ${
                tab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.15 }}>
          {tab === 'generate' ? <Generator /> : <ContentHistory />}
        </motion.div>
      </div>
    </div>
  );
}
