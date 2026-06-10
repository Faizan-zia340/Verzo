import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import { useAuth } from '../context/AuthContext.js';
import DashboardStats from '../components/Dashboard.jsx';
import Generator from '../components/Generator.jsx';
import ContentHistory from '../components/ContentHistory.jsx';
import { Link } from 'react-router-dom';
import { FiZap, FiClock, FiFileText, FiEdit3 } from 'react-icons/fi';

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const { fetchCredits, credits } = useCredits();
  const [tab, setTab] = useState('generate');

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return (
    <div className="min-h-screen bg-gray-50/80">

      {/* ── Welcome banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-4">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-indigo-200 text-sm font-medium">{greet()}</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <FiZap size={13} className="text-yellow-300" />
              {credits ?? user?.credits ?? 0} credits
            </div>
            <Link to="/pdf"
              className="bg-white/10 border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition">
              <FiFileText size={13} /> PDF Analyzer
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-7">

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
          <DashboardStats />
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm mb-6 w-fit"
        >
          {[
            { key: 'generate', label: 'Generate', icon: FiEdit3 },
            { key: 'history', label: 'History', icon: FiClock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          {tab === 'generate' ? <Generator /> : <ContentHistory />}
        </motion.div>
      </div>
    </div>
  );
}
