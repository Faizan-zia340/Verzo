import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import {
  FiShield, FiUsers, FiZap, FiDatabase, FiEdit2, FiX, FiCheck,
  FiSearch, FiTrash2, FiPlus, FiBarChart2, FiSettings,
} from 'react-icons/fi';

// ── Credit Edit Modal ────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const num = parseInt(adjustment);
    if (isNaN(num) || num === 0) { setError('Enter a non-zero integer'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/admin/users/${user._id}/credits`, { credits: num });
      onSave(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credits');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Adjust Credits</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX size={18} /></button>
        </div>
        <p className="text-sm text-slate-400 mb-1">User: <span className="text-white font-medium">{user.name}</span></p>
        <p className="text-sm text-slate-400 mb-4">Balance: <span className="text-indigo-400 font-semibold">{user.credits} credits</span></p>
        <label className="block text-xs font-medium text-slate-400 mb-1">Adjustment (positive to add, negative to remove)</label>
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          placeholder="e.g. 50 or -10"
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
        />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-600 text-slate-300 py-2 rounded-lg text-sm hover:bg-slate-700 transition">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-1">
            {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FiCheck size={13} /> Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Overview Section ─────────────────────────────────────────────
function Overview({ stats, loadingStats }) {
  const cards = [
    { label: 'Total Users', value: stats?.userCount ?? '—', icon: <FiUsers size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Credits Distributed', value: stats?.totalCredits ?? '—', icon: <FiZap size={18} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Active RAG Contexts', value: stats?.contextCount ?? '—', icon: <FiDatabase size={18} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-white mb-5">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center ${c.color} mb-3`}>{c.icon}</div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{c.label}</p>
            {loadingStats
              ? <div className="h-7 w-16 bg-slate-700 rounded animate-pulse" />
              : <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString?.() ?? c.value}</p>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

// ── User Management Section ──────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const handleSave = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, credits: updated.credits } : u)));
    setEditTarget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">User Management</h2>
        <span className="text-slate-500 text-sm">{filtered.length} of {users.length} users</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
        />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <span className="animate-spin h-6 w-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-700/30 transition">
                    <td className="px-5 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-5 py-4 text-slate-400">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-indigo-400">{u.credits}</span>
                    </td>
                    <td className="px-5 py-4">
                      {u.isAdmin
                        ? <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">Admin</span>
                        : <span className="bg-slate-700 text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-full">User</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setEditTarget(u)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition"
                      >
                        <FiEdit2 size={12} /> Edit Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="text-center text-slate-600 py-10 text-sm">
                {search ? 'No users match your search.' : 'No users found.'}
              </p>
            )}
          </div>
        )}
      </div>

      {editTarget && <EditModal user={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />}
    </div>
  );
}

// ── System Settings (RAG Context) ────────────────────────────────
function SystemSettings() {
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', keywords: '', information: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchContexts = () => {
    api.get('/admin/contexts').then(({ data }) => setContexts(data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchContexts(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const { data } = await api.post('/admin/contexts', { ...form, keywords });
      setContexts((prev) => [data, ...prev]);
      setForm({ title: '', keywords: '', information: '' });
      setSuccess('Context added successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save context');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/contexts/${id}`);
    setContexts((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">System Settings</h2>

      {/* Add Context Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><FiPlus size={14} /> Add RAG Context Document</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Company FAQ"
              required
              className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Keywords <span className="text-slate-600">(comma-separated)</span></label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="e.g. pricing, refund, contact"
              className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Reference Information</label>
            <textarea
              value={form.information}
              onChange={(e) => setForm({ ...form, information: e.target.value })}
              rows={4}
              placeholder="Paste the trusted reference content the AI will use..."
              required
              className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-emerald-400 text-xs">{success}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiPlus size={13} />}
            Save Context
          </button>
        </form>
      </div>

      {/* Context List */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Saved Contexts</h3>
          <span className="text-slate-600 text-xs">{contexts.length} documents</span>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <span className="animate-spin h-5 w-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        ) : contexts.length === 0 ? (
          <p className="text-center text-slate-600 py-8 text-sm">No context documents yet.</p>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {contexts.map((ctx) => (
              <div key={ctx._id} className="px-5 py-4 hover:bg-slate-700/20 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ctx.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ctx.keywords?.map((kw, i) => (
                        <span key={i} className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{ctx.information}</p>
                  </div>
                  <button onClick={() => handleDelete(ctx._id)} className="text-slate-600 hover:text-red-400 transition flex-shrink-0 mt-0.5">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────
const NAV = [
  { key: 'overview', label: 'Overview', icon: <FiBarChart2 size={16} /> },
  { key: 'users', label: 'User Management', icon: <FiUsers size={16} /> },
  { key: 'settings', label: 'System Settings', icon: <FiSettings size={16} /> },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoadingStats(false));
  }, [user]);

  if (authLoading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <span className="animate-spin h-8 w-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
    </div>
  );

  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col py-6 px-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <FiShield size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Admin Panel</span>
        </div>

        <nav className="space-y-1">
          {NAV.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                section === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-600 px-2">Logged in as</p>
          <p className="text-xs text-slate-400 font-medium px-2 mt-0.5 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {section === 'overview' && <Overview stats={stats} loadingStats={loadingStats} />}
          {section === 'users' && <UserManagement />}
          {section === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}
