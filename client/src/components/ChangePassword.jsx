import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';

// Change password while signed in. The server sets passwordChangedAt, so
// every session — including this one — is invalidated; the user signs in
// again with the new password right after saving.
export default function ChangePassword() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current || !next || !confirm) { setError('Please fill in all three fields.'); return; }
    if (next.length < 6) { setError('Your new password must be at least 6 characters.'); return; }
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/user/change-password', { currentPassword: current, newPassword: next });
      toast.success(data.message || 'Password changed.');
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change your password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Change password</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-md leading-relaxed">
        You will be signed out and asked to sign in again with your new password.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password"
            className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">New password</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password"
            className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password"
            className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500" />
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-ink-raised px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <button type="submit" disabled={saving}
          className="bg-teak-600 hover:bg-teak-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition">
          {saving ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
