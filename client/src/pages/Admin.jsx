import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import { FiEdit2, FiX, FiCheck, FiShield } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function EditModal({ user, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const num = parseInt(adjustment);
    if (isNaN(num) || num === 0) {
      setError('Enter a non-zero number (positive to add, negative to remove)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put(`/admin/users/${user._id}/credits`, { credits: num });
      onSave(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Adjust Credits</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          User: <span className="font-semibold text-gray-800">{user.name}</span>
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Current balance: <span className="font-semibold text-indigo-600">{user.credits} credits</span>
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adjustment (e.g. +50 or -10)
        </label>
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          placeholder="e.g. 50 or -10"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {loading ? <LoadingSpinner size="sm" /> : <><FiCheck size={14} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/users')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading) return <LoadingSpinner />;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  const handleSave = (updated) => {
    setUsers((prev) => prev.map((u) => u._id === updated._id ? { ...u, credits: updated.credits } : u));
    setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FiShield className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage users and credit balances</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">All Users</h2>
            <span className="text-sm text-gray-400">{users.length} total</span>
          </div>

          {loading ? (
            <div className="py-16"><LoadingSpinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-indigo-600">{u.credits}</span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isAdmin
                          ? <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">Admin</span>
                          : <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">User</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditTarget(u)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition"
                        >
                          <FiEdit2 size={13} /> Edit Credits
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users.length && (
                <p className="text-center text-gray-400 py-10 text-sm">No users found.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <EditModal user={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
      )}
    </div>
  );
}
