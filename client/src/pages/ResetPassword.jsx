import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const inputClass = 'w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition placeholder-gray-400';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      toast.success(data.message || 'Password reset successfully');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-950">
      <div className="w-full max-w-[360px]">
        <h1 className="text-3xl font-black text-gray-950 dark:text-white mb-1 tracking-tight">Set a new password</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Choose a new password for your account. It must be at least 6 characters.</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-300 text-sm px-4 py-3.5 rounded-xl mb-5 flex items-start gap-3">
            <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
            <p className="text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">New password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Confirm new password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-lg shadow-indigo-200 mt-2"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-sm">
          <Link to="/login" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition">
            <FiArrowLeft size={12} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
