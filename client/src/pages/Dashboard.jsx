import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import { useAuth } from '../context/AuthContext.js';
import AccountOverview from '../components/AccountOverview.jsx';
import ChangePassword from '../components/ChangePassword.jsx';
import Generator from '../components/Generator.jsx';
import ContentHistory from '../components/ContentHistory.jsx';
import { Link } from 'react-router-dom';
import { FiZap, FiClock, FiFileText, FiEdit3, FiMail, FiDownload, FiUser } from 'react-icons/fi';
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
  const { user, toggleTwoFactor } = useAuth();
  const { fetchCredits, credits } = useCredits();
  const [tab, setTab] = useState('overview');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Two-step verification switch. The initial state comes from the user
  // profile (formatUser exposes twoFactorEnabled) and is re-synced when
  // the profile loads, so an already-enabled account shows as on.
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  useEffect(() => {
    setTwoFactorEnabled(user?.twoFactorEnabled === true);
  }, [user?.twoFactorEnabled]);

  const handleToggleTwoFactor = async () => {
    setTwoFactorLoading(true);
    try {
      const data = await toggleTwoFactor(!twoFactorEnabled);
      setTwoFactorEnabled(data.twoFactorEnabled === true);
      toast.success(data.twoFactorEnabled
        ? 'Two-step verification enabled. Signing in will now also need a code sent to your email.'
        : 'Two-step verification disabled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update two-step verification. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification');
      toast.success(data?.message || 'Verification email sent.');
      setResent(true);
      // Re-enable after 60s so the user can resend if the email never arrived.
      setTimeout(() => setResent(false), 60000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Download everything Penlix stores about you as one JSON file.
  // The server answers with a blob; on error (e.g. the 5/hour limit) the
  // error body is also a blob, so read its text before showing the message.
  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/user/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `penlix-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Your data has been downloaded.');
    } catch (err) {
      let message = 'Could not download your data. Please try again.';
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          if (parsed?.message) message = parsed.message;
        } catch {
          // Keep the generic message when the error body is not JSON.
        }
      } else if (data?.message) {
        message = data.message;
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-ink-page">
      <Seo title="Penlix Dashboard — Your Content" description="Your Penlix dashboard — generate content, track credits and view your history." path="/dashboard" noindex />

      {/* ── Welcome banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teak-600 via-teak-600 to-teak-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-teak-100 text-sm font-medium">{greet()}</p>
            <h1 className="text-xl font-black text-white tracking-tight">{user?.name}</h1>
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

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="flex gap-1 p-1 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm mb-6 w-fit max-w-full overflow-x-auto"
        >
          {[
            { key: 'overview', label: 'Overview', icon: FiUser },
            { key: 'generate', label: 'Generate', icon: FiEdit3 },
            { key: 'history', label: 'History', icon: FiClock },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-teak-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-ink-raised'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </motion.div>

        {/* Tab content — stats now live inside Overview, so Generate and
            History get the full width to themselves. */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          {tab === 'overview' ? <AccountOverview onNavigate={setTab} /> : tab === 'generate' ? <Generator /> : <ContentHistory />}
        </motion.div>

        {/* Your data — download everything Penlix stores about you. */}
        <div className="mt-8 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Your data</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
              Download everything Penlix stores about you — your profile, generations, uploads, feedback and
              glossary suggestions — as one JSON file. See the{' '}
              <Link to="/privacy" className="text-indigo-600 dark:text-ink-link underline">Privacy Policy</Link>{' '}
              for details.
            </p>
          </div>
          <button
            onClick={handleDownloadData}
            disabled={downloading}
            className="bg-teak-600 hover:bg-teak-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 flex-shrink-0"
          >
            <FiDownload size={14} />
            {downloading ? 'Preparing…' : 'Download my data'}
          </button>
        </div>

        {/* Security — two-step verification (email OTP). */}
        <div className="mt-4 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Two-step verification</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
              When on, signing in also needs a 6-digit code sent to your email.
              {user?.isAdmin ? ' Required for admin accounts and cannot be turned off.' : ''}
            </p>
          </div>
          <button
            onClick={handleToggleTwoFactor}
            disabled={twoFactorLoading || user?.isAdmin === true}
            className={`text-sm font-bold px-4 py-2.5 rounded-xl transition flex-shrink-0 disabled:opacity-60 ${
              twoFactorEnabled
                ? 'bg-teak-600 hover:bg-teak-700 text-white'
                : 'bg-gray-100 dark:bg-ink-raised hover:bg-gray-200 dark:hover:bg-ink-raised text-gray-700 dark:text-slate-200'
            }`}
          >
            {twoFactorLoading
              ? 'Saving…'
              : twoFactorEnabled
                ? user?.isAdmin ? 'Enabled' : 'Enabled — turn off'
                : 'Enable'}
          </button>
        </div>

        {/* Security — change password while signed in. */}
        <ChangePassword />
      </div>
    </div>
  );
}
