import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import {
  FiShield, FiUsers, FiZap, FiDatabase, FiEdit2, FiX, FiCheck,
  FiSearch, FiTrash2, FiPlus, FiBarChart2, FiSettings, FiArrowLeft,
} from 'react-icons/fi';

// ── Credit Edit Modal ─────────────────────────────────────────────
function EditModal({ user, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const num = parseInt(adjustment);
    if (isNaN(num) || num === 0) { setError('Enter a non-zero integer (e.g. 50 or -10)'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.put(`/admin/users/${user._id}/credits`, { credits: num });
      onSave(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credits');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900">Adjust Credits</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
            <FiX size={16} />
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500">User</p>
          <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          <p className="text-xs text-gray-500 mt-2">Current balance: <span className="text-indigo-600 font-bold">{user.credits} credits</span></p>
        </div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Credit adjustment <span className="text-gray-400">(positive to add, negative to remove)</span>
        </label>
        <input
          type="number"
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          placeholder="e.g. 50 or -10"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loading
              ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              : <><FiCheck size={13} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, loading, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      {loading
        ? <div className="h-7 w-20 bg-gray-100 rounded-lg animate-pulse" />
        : <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      }
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────
function Overview({ stats, loadingStats }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Overview</h2>
        <p className="text-sm text-gray-500">Platform stats at a glance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats?.userCount ?? 0} icon={<FiUsers size={18} />} loading={loadingStats} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Total Credits Distributed" value={stats?.totalCredits ?? 0} icon={<FiZap size={18} />} loading={loadingStats} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard label="Active RAG Contexts" value={stats?.contextCount ?? 0} icon={<FiDatabase size={18} />} loading={loadingStats} color="text-emerald-600" bg="bg-emerald-50" />
      </div>
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <h3 className="font-semibold text-indigo-900 text-sm mb-1">What is the Admin Panel?</h3>
        <p className="text-sm text-indigo-700 leading-relaxed">
          Manage all users, adjust credit balances manually, and configure RAG context documents that the AI uses to produce factual, up-to-date responses. Navigate using the sidebar.
        </p>
      </div>
    </div>
  );
}

// ── User Management ───────────────────────────────────────────────
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-0.5">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
        />
        {search && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {filtered.length} of {users.length}
          </span>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <span className="animate-spin h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Credits</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registered</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                        <FiZap size={10} /> {u.credits}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.isAdmin
                        ? <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
                        : <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">User</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setEditTarget(u)}
                        className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-medium transition"
                      >
                        <FiEdit2 size={11} /> Edit Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="text-center py-12">
                <FiUsers size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{search ? 'No users match your search.' : 'No users found.'}</p>
              </div>
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

  useEffect(() => {
    api.get('/admin/contexts').then(({ data }) => setContexts(data)).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const { data } = await api.post('/admin/contexts', { ...form, keywords });
      setContexts((prev) => [data, ...prev]);
      setForm({ title: '', keywords: '', information: '' });
      setSuccess('Context document added successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save context');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/contexts/${id}`);
      setContexts((prev) => prev.filter((c) => c._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-0.5">System Settings</h2>
        <p className="text-sm text-gray-500">Manage RAG (Retrieval-Augmented Generation) context documents</p>
      </div>

      {/* Add Form */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FiPlus size={15} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Add Context Document</h3>
            <p className="text-xs text-gray-500">The AI will reference this when users mention matching keywords</p>
          </div>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Company Pricing FAQ"
                required
                className="w-full border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Keywords <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="e.g. pricing, refund, plan"
                className="w-full border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Reference Information</label>
            <textarea
              value={form.information}
              onChange={(e) => setForm({ ...form, information: e.target.value })}
              rows={4}
              placeholder="Paste the trusted reference content the AI will use to answer questions factually..."
              required
              className="w-full border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-emerald-600 text-xs bg-emerald-50 px-3 py-2 rounded-lg">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition disabled:opacity-60 flex items-center gap-2 shadow-sm"
          >
            {saving
              ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              : <FiPlus size={14} />}
            Save Context Document
          </button>
        </form>
      </div>

      {/* Context list */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">Saved Context Documents</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{contexts.length} total</span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400">Loading contexts...</p>
          </div>
        ) : contexts.length === 0 ? (
          <div className="text-center py-14">
            <FiDatabase size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No context documents added yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add one above to enhance AI responses.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {contexts.map((ctx) => (
              <div key={ctx._id} className="px-6 py-4 hover:bg-gray-50/60 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{ctx.title}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ctx.keywords?.map((kw, i) => (
                        <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">{kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{ctx.information}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(ctx._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition flex-shrink-0 mt-0.5"
                  >
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

// ── Sidebar Nav ───────────────────────────────────────────────────
const NAV = [
  { key: 'overview', label: 'Overview', icon: FiBarChart2 },
  { key: 'users', label: 'User Management', icon: FiUsers },
  { key: 'settings', label: 'System Settings', icon: FiSettings },
];

// ── Main Admin Page ───────────────────────────────────────────────
export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoadingStats(false));
  }, [user]);

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <span className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col py-6 px-4 flex-shrink-0 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <FiShield size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Admin Panel</p>
            <p className="text-xs text-gray-400 leading-tight">AI Content</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                section === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="px-3 mb-3">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-xs font-semibold text-gray-700 truncate mt-0.5">{user?.email}</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition font-medium"
          >
            <FiArrowLeft size={13} /> Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900 text-base">
              {NAV.find((n) => n.key === section)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <FiShield size={10} /> Admin
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-7">
          {section === 'overview' && <Overview stats={stats} loadingStats={loadingStats} />}
          {section === 'users' && <UserManagement />}
          {section === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}
