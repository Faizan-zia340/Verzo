import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiArrowLeft, FiMail } from 'react-icons/fi';

const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition placeholder-gray-400';

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
    <div className="min-h-screen flex items-center justify-center p-8 bg-white">
      <div className="w-full max-w-[360px]">
        <h1 className="text-3xl font-black text-gray-950 mb-1 tracking-tight">Forgot password</h1>
        <p className="text-gray-500 text-sm mb-8">
          Enter the email you signed up with and we will send you a link to set a new password.
        </p>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3.5 rounded-xl mb-5">
            <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        {sent ? (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm px-4 py-3.5 rounded-xl mb-5">
            If an account exists with that email, a password reset link has been sent. Please check your inbox (and spam folder) — the link expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-lg shadow-indigo-200 mt-2 flex items-center justify-center gap-2"
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

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
          <Link to="/login" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
            <FiArrowLeft size={12} /> Back to sign in
          </Link>
          <span className="text-gray-500">
            No account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold transition">
              Sign up free
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
