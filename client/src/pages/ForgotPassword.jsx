import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiArrowLeft, FiMail } from 'react-icons/fi';
import Seo from '../components/Seo.jsx';

const inputClass = 'w-full bg-gray-50 dark:bg-ink-page border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500 focus:bg-white dark:focus:bg-ink-raised transition placeholder-gray-400 dark:placeholder-slate-500';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success(data.message || 'Reset link sent');
    } catch (err) {
      const message = err.response?.data?.message || 'Could not send the reset link. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-ink-card">
      <Seo title="Reset Your Penlix Password" description="Forgot your Penlix password? Request a reset link and set a new password in minutes." path="/forgot-password" noindex />
      <div className="w-full max-w-[360px]">
        <h1 className="text-3xl font-black text-gray-950 dark:text-white mb-1 tracking-tight">Forgot password</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          Enter the email you signed up with and we will send you a link to set a new password.
        </p>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 dark:bg-ink-raised border border-red-100 text-red-700 dark:text-red-300 text-sm px-4 py-3.5 rounded-xl mb-5">
            <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {sent ? (
          <div className="bg-teak-50 dark:bg-ink-raised border border-teak-100 text-teak-800 dark:text-teak-400 text-sm px-4 py-3.5 rounded-xl mb-5">
            If an account exists with that email, a password reset link has been sent. Please check your inbox (and spam folder) — the link expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teak-600 hover:bg-teak-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-md shadow-teak-900/20 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <FiMail size={14} />
              )}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-sm">
          <Link to="/login" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 flex items-center gap-1 transition">
            <FiArrowLeft size={12} /> Back to sign in
          </Link>
          <span className="text-gray-500 dark:text-slate-400">
            No account?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-ink-link hover:text-indigo-800 dark:hover:text-ink-link font-semibold transition">
              Sign up free
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
