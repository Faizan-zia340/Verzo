import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import { useAuth } from '../context/AuthContext.js';
import DashboardStats from '../components/Dashboard.jsx';
import Generator from '../components/Generator.jsx';
import ContentHistory from '../components/ContentHistory.jsx';
import { Link } from 'react-router-dom';
import { FiZap, FiClock, FiFileText, FiEdit3, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import Seo from '../components/Seo.jsx';

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const { fetchCredits, credits, loading: creditsLoading } = useCredits();
  const [tab, setTab] = useState('generate');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const dashboardLoading = creditsLoading;

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification');
      toast.success(data?.message || 'Verification email sent.');
      setResent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-ink-page">
      <Seo title="Penlix Dashboard — Your Content" description="Your Penlix dashboard — generate content, track credits and view your history." path="/dashboard" noindex />

      {/* ── Welcome banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-4">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-indigo-200 text-sm font-medium">{greet()}</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="flex items-center gap-3">
            <div className="bg-white/10 dark:bg-ink-card/10 border border-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <FiZap size={13} className="text-yellow-300" />
              {credits ?? user?.credits ?? 0} credits
            </div>
            <Link to="/pdf"
              className="bg-white/10 dark:bg-ink-card/10 border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition">
              <FiFileText size={13} /> PDF Analyzer
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-7">

        {/* Email verification — only new unverified accounts see this.
            Existing accounts are treated as verified, so they never see it. */}
        {user?.isEmailVerified === false && (
          <div className="bg-amber-50 dark:bg-ink-raised border border-amber-200 dark:border-amber-900/50 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <FiMail size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Verify your email to get your 20 free credits</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  We sent a verification link to {user.email}. Your credits arrive as soon as you click it.
                </p>
              </div>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending || resent}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition flex-shrink-0"
            >
              {resent ? 'Email sent — check your inbox' : resending ? 'Sending…' : 'Resend email'}
            </button>
          </div>
        )}

        {/* Stats */}
        {dashboardLoading ? (
          <div className="mb-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((card) => (
                <div key={card} className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 p-5 h-[145px]">
                  <div className="flex justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-ink-raised" />
                    <div className="w-20 h-3 rounded bg-gray-200 dark:bg-ink-raised" />
                  </div>
                  <div className="w-16 h-3 rounded bg-gray-200 dark:bg-ink-raised mb-3" />
                  <div className="w-24 h-7 rounded bg-gray-200 dark:bg-ink-raised" />
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 p-5 h-[200px]">
              <div className="w-32 h-4 rounded bg-gray-200 dark:bg-ink-raised mb-6" />
              <div className="h-28 rounded-lg bg-gray-100 dark:bg-ink-raised" />
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
            <DashboardStats />
          </motion.div>
        )}

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="flex gap-1 p-1 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm mb-6 w-fit max-w-full overflow-x-auto"
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
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-ink-raised'
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
