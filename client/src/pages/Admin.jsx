import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FiShield, FiUsers, FiZap, FiDatabase, FiEdit2, FiX, FiCheck,
  FiSearch, FiTrash2, FiPlus, FiBarChart2, FiSettings, FiArrowLeft,
  FiActivity, FiMail, FiGlobe, FiEdit3, FiMessageSquare,
  FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import DrawerIcon from '../components/DrawerIcon.jsx';
import Seo from '../components/Seo.jsx';

// ── Credit Edit Modal ──────────────────────────────────────────────
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
      toast.success(`Credits updated for ${user.name}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update credits');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-ink-card rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Adjust Credits</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-ink-raised text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition">
            <FiX size={16} />
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-ink-page rounded-xl p-4 mb-5 border border-gray-100 dark:border-slate-800">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <FiZap size={11} className="text-indigo-500 dark:text-ink-link" />
            <span className="text-xs text-indigo-600 dark:text-ink-link font-bold">{user.credits} credits currently</span>
          </div>
        </div>
        <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
          Adjustment <span className="text-gray-400 dark:text-slate-500 font-normal normal-case">(positive to add, negative to remove)</span>
        </label>
        <input
          type="number" value={adjustment} onChange={(e) => setAdjustment(e.target.value)}
          placeholder="e.g. 50 or -10" autoFocus
          className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-ink-raised transition mb-3"
        />
        {error && <p className="text-red-500 text-xs mb-3 bg-red-50 dark:bg-ink-raised px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-ink-raised transition">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm">
            {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FiCheck size={13} /> Save</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete User Confirmation Modal ───────────────────────────────
// In-app replacement for window.confirm: native confirms are
// auto-dismissed by automated browsers (so the delete never ran)
// and are fragile UX. Follows the EditModal pattern above.
function DeleteUserModal({ user, deleting, error, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-ink-card rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete User</h3>
          <button onClick={onClose} disabled={deleting} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-ink-raised text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition disabled:opacity-60">
            <FiX size={16} />
          </button>
        </div>
        <div className="bg-gray-50 dark:bg-ink-page rounded-xl p-4 mb-5 border border-gray-100 dark:border-slate-800">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{user.email}</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
          This permanently removes the account and all of its content and credit history. This cannot be undone.
        </p>
        {error && <p className="text-red-500 text-xs mb-3 bg-red-50 dark:bg-ink-raised px-3 py-2 rounded-lg border border-red-100">{error}</p>}
        <div className="flex gap-2.5">
          <button onClick={onClose} disabled={deleting} className="flex-1 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-ink-raised transition disabled:opacity-60">Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm">
            {deleting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FiTrash2 size={13} /> Delete</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon, loading, gradient, iconBg }) {
  return (
    <motion.div whileHover={{ y: -2 }}
      className={`${gradient} rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md`}>
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">{label}</p>
      {loading
        ? <div className="h-8 w-24 bg-white/20 dark:bg-ink-card/20 rounded-lg animate-pulse" />
        : <p className="text-3xl font-black text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      }
    </motion.div>
  );
}

// ── Overview + Activity Feed ───────────────────────────────────────
function Overview({ stats, loadingStats }) {
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    api.get('/admin/activity')
      .then(({ data }) => setActivity(Array.isArray(data) ? data : []))
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false));
  }, []);

  const TYPE_COLORS = {
    blog: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    social: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
    email: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    ad: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    product: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  };

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.userCount ?? 0, icon: <FiUsers size={18} className="text-blue-300" />, gradient: 'bg-gradient-to-br from-blue-600 to-blue-700', iconBg: 'bg-blue-500/20' },
    { label: 'Total Credits', value: stats?.totalCredits ?? 0, icon: <FiZap size={18} className="text-indigo-200" />, gradient: 'bg-gradient-to-br from-indigo-600 to-indigo-700', iconBg: 'bg-indigo-500/20' },
    { label: 'Total Generations', value: stats?.totalGenerations ?? 0, icon: <FiBarChart2 size={18} className="text-violet-200" />, gradient: 'bg-gradient-to-br from-violet-600 to-violet-700', iconBg: 'bg-violet-500/20' },
    { label: 'RAG Contexts', value: stats?.contextCount ?? 0, icon: <FiDatabase size={18} className="text-emerald-200" />, gradient: 'bg-gradient-to-br from-emerald-600 to-teal-600', iconBg: 'bg-emerald-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">Overview</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Platform stats at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((c) => (
          <StatCard key={c.label} {...c} loading={loadingStats} />
        ))}
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Live Activity Feed</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-ink-raised px-2.5 py-1 rounded-full font-medium">Last 20</span>
        </div>
        {loadingActivity ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-16 h-6 bg-gray-100 dark:bg-ink-raised rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-2.5 bg-gray-100 dark:bg-ink-raised rounded w-3/4" />
                  <div className="h-2 bg-gray-100 dark:bg-ink-raised rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !activity.length ? (
          <div className="py-16 text-center">
            <FiActivity size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {activity.map((item) => (
              <div key={item._id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50/80 dark:hover:bg-ink-raised/80 transition">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${TYPE_COLORS[item.type] || 'bg-gray-100 dark:bg-ink-raised text-gray-600 dark:text-slate-400'}`}>
                  {item.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 dark:text-slate-100 line-clamp-1 font-medium">{item.prompt}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <FiUsers size={9} />
                    <span>{item.user?.name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{item.user?.email || ''}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    {item.language && item.language !== 'english_us' && (
                      <><FiGlobe size={9} /> <span>{item.language.replace(/_/g, ' ')}</span></>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Grant Credits by Email ─────────────────────────────────────────
function GrantCreditsForm() {
  const [email, setEmail] = useState('');
  const [credits, setCredits] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGrant = async (e) => {
    e.preventDefault();
    const num = parseInt(credits);
    if (!email || isNaN(num) || num === 0) { toast.error('Enter a valid email and credit amount.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/admin/grant-credits', { email, credits: num });
      toast.success(`Granted ${num} credits to ${data.user.email} (new balance: ${data.user.credits})`);
      setEmail(''); setCredits('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant credits');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
          <FiMail size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Grant Credits by Email</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">Add or remove credits for any user</p>
        </div>
      </div>
      <form onSubmit={handleGrant} className="flex gap-3 flex-wrap">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com" required
          className="flex-1 min-w-0 border border-indigo-200 bg-white dark:bg-ink-card rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm"
        />
        <input
          type="number" value={credits} onChange={(e) => setCredits(e.target.value)}
          placeholder="Amount (e.g. 100)" required
          className="w-44 border border-indigo-200 bg-white dark:bg-ink-card rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-slate-500 shadow-sm"
        />
        <button type="submit" disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center gap-2 shadow-sm">
          {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FiZap size={13} /> Grant</>}
        </button>
      </form>
    </div>
  );
}

// ── User Management ────────────────────────────────────────────────
function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  const handleSave = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, credits: updated.credits } : u)));
    setEditTarget(null);
  };

  const handleDelete = async (target) => {
    const isSelf = String(target._id) === String(currentUser?._id);
    if (target.isAdmin || isSelf) return; // backend also enforces this
    setDeletingId(target._id);
    setDeleteError('');
    try {
      const { data } = await api.delete(`/admin/users/${target._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== target._id));
      setDeleteTarget(null);
      toast.success(`Deleted ${data.email || target.email}`);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">User Management</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">{users.length} registered users</p>
      </div>

      <GrantCreditsForm />

      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
        <input
          type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-ink-card text-gray-800 dark:text-slate-100 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder-gray-400 dark:placeholder-slate-500"
        />
        {search && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500 font-medium">
            {filtered.length} of {users.length}
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <span className="animate-spin h-7 w-7 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-ink-page border-b border-gray-100 dark:border-slate-800">
                  {['User', 'Credits', 'Role', 'Joined', 'Action'].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/80 dark:hover:bg-ink-raised/80 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 dark:text-ink-link text-xs font-black flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-ink-raised border border-indigo-100 text-indigo-700 dark:text-ink-link text-xs font-bold px-3 py-1.5 rounded-lg">
                        <FiZap size={10} /> {u.credits}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.isAdmin
                        ? <span className="bg-violet-100 dark:bg-ink-raised text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit"><FiShield size={9} /> Admin</span>
                        : <span className="bg-gray-100 dark:bg-ink-raised text-gray-500 dark:text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full">User</span>
                      }
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditTarget(u)}
                          className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-sm">
                          <FiEdit2 size={11} /> Edit Credits
                        </button>
                        {u.isAdmin || String(u._id) === String(currentUser?._id) ? (
                          <button disabled
                            title={u.isAdmin ? 'Admin accounts cannot be deleted' : 'You cannot delete your own account'}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised text-gray-400 dark:text-slate-500 px-3 py-1.5 rounded-lg font-semibold cursor-not-allowed">
                            <FiTrash2 size={11} /> Delete
                          </button>
                        ) : (
                          <button onClick={() => { setDeleteError(''); setDeleteTarget(u); }} disabled={deletingId === u._id}
                            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold transition shadow-sm disabled:opacity-60">
                            <FiTrash2 size={11} /> {deletingId === u._id ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && (
              <div className="text-center py-16">
                <FiUsers size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-slate-500">{search ? 'No users match your search.' : 'No users found.'}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {editTarget && <EditModal user={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          deleting={deletingId === deleteTarget._id}
          error={deleteError}
          onClose={() => { if (deletingId !== deleteTarget._id) { setDeleteTarget(null); setDeleteError(''); } }}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

// ── System Settings (RAG) ──────────────────────────────────────────
function SystemSettings() {
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', keywords: '', information: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/contexts')
      .then(({ data }) => setContexts(Array.isArray(data) ? data : []))
      .catch(() => setContexts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const keywords = form.keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const { data } = await api.post('/admin/contexts', { ...form, keywords });
      setContexts((prev) => [data, ...prev]);
      setForm({ title: '', keywords: '', information: '' });
      toast.success('Context document saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save context');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/contexts/${id}`);
      setContexts((prev) => prev.filter((c) => c._id !== id));
      toast('Context removed.', { icon: '🗑️' });
    } catch { toast.error('Delete failed.'); }
  };

  const inputClass = 'w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page text-gray-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-ink-raised transition placeholder-gray-400 dark:placeholder-slate-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">System Settings</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Manage RAG context documents the AI references when generating</p>
      </div>

      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-ink-raised rounded-xl flex items-center justify-center">
            <FiPlus size={16} className="text-indigo-600 dark:text-ink-link" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Context Document</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">AI references this when users mention matching keywords</p>
          </div>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Company Pricing FAQ" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                Keywords <span className="text-gray-400 dark:text-slate-500 font-normal normal-case">(comma-separated)</span>
              </label>
              <input type="text" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="pricing, refund, plan" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Reference Information</label>
            <textarea value={form.information} onChange={(e) => setForm({ ...form, information: e.target.value })}
              rows={4} placeholder="Paste trusted reference content that the AI should use..." required
              className={`${inputClass} resize-none`} />
          </div>
          <button type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-6 py-3 rounded-xl font-bold transition disabled:opacity-60 flex items-center gap-2 shadow-sm">
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <FiPlus size={14} />}
            Save Context Document
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiDatabase size={14} className="text-indigo-500 dark:text-ink-link" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Saved Context Documents</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-ink-raised px-2.5 py-1 rounded-full font-medium">{contexts.length} total</span>
        </div>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading...</p>
          </div>
        ) : !contexts.length ? (
          <div className="text-center py-16">
            <FiDatabase size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No context documents yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {contexts.map((ctx) => (
              <div key={ctx._id} className="px-6 py-4 hover:bg-gray-50/80 dark:hover:bg-ink-raised/80 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{ctx.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ctx.keywords?.map((kw, i) => (
                        <span key={i} className="bg-indigo-100 dark:bg-ink-raised text-indigo-700 dark:text-ink-link border border-indigo-200 text-xs px-2.5 py-0.5 rounded-full font-medium">{kw}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{ctx.information}</p>
                  </div>
                  <button onClick={() => handleDelete(ctx._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 dark:text-slate-500 hover:text-red-500 transition flex-shrink-0 border border-transparent hover:border-red-100">
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

// ── Translation Suggestions (user-submitted glossary terms) ───────
// Approving does NOT edit glossary.json (a repo file) — the response
// carries the exact JSON snippet, shown below for the admin to copy in.
function TranslationSuggestions() {
  const [status, setStatus] = useState('pending');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [snippet, setSnippet] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/glossary/suggestions', { params: { status } })
      .then(({ data }) => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [status]);

  const decide = async (id, action) => {
    setActingId(id);
    try {
      const { data } = await api.post(`/glossary/suggestions/${id}/${action}`);
      setSuggestions((prev) => prev.map((s) => (s._id === id ? { ...s, status: data.status } : s)));
      if (action === 'approve' && data.glossary) {
        setSnippet(data.glossary);
        toast.success('Approved — copy the snippet into glossary.json.');
      } else {
        toast('Suggestion rejected.', { icon: '🗑️' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update suggestion');
    } finally {
      setActingId(null);
    }
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet.snippet);
      toast.success('Snippet copied');
    } catch { toast.error('Copy failed — select the text manually'); }
  };

  const statusBadge = (s) => ({
    pending: 'bg-amber-100 dark:bg-ink-raised text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    approved: 'bg-emerald-100 dark:bg-ink-raised text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    rejected: 'bg-red-100 dark:bg-ink-raised text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
  }[s] || 'bg-gray-100 dark:bg-ink-raised text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">Translation Suggestions</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Users suggest better words — approve to add them to the dictionary</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition ${
              status === s ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-ink-card text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-ink-raised'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {snippet && (
        <div className="bg-white dark:bg-ink-card border border-emerald-200 dark:border-emerald-900 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Copy into glossary.json (under terms)</h3>
            <button onClick={copySnippet}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">
              Copy snippet
            </button>
          </div>
          <pre className="bg-gray-900 text-gray-100 text-xs rounded-xl p-4 overflow-x-auto">{snippet.snippet}</pre>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">{snippet.hint}</p>
        </div>
      )}

      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiGlobe size={14} className="text-indigo-500 dark:text-ink-link" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm capitalize">{status} suggestions</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-ink-raised px-2.5 py-1 rounded-full font-medium">{suggestions.length} total</span>
        </div>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading...</p>
          </div>
        ) : !suggestions.length ? (
          <div className="text-center py-16">
            <FiGlobe size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No {status} suggestions.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {suggestions.map((s) => (
              <div key={s._id} className="px-6 py-4 hover:bg-gray-50/80 dark:hover:bg-ink-raised/80 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {s.word} <span className="text-gray-400 dark:text-slate-500 font-medium">→</span>{' '}
                      <span className="text-indigo-700 dark:text-ink-link">{s.suggestedTranslation}</span>{' '}
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">({s.language})</span>
                    </p>
                    {s.note && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{s.note}</p>}
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                      by {s.suggestedBy?.name || s.suggestedBy?.email || 'unknown'} ·{' '}
                      {s.createdAt ? formatDistanceToNow(new Date(s.createdAt), { addSuffix: true }) : ''}
                      {s.status !== 'pending' && ` · ${s.status}`}
                      {s.rejectReason && ` · reason: ${s.rejectReason}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border capitalize ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => decide(s._id, 'approve')} disabled={actingId === s._id}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition disabled:opacity-50">
                          <FiCheck size={12} /> Approve
                        </button>
                        <button onClick={() => decide(s._id, 'reject')} disabled={actingId === s._id}
                          className="inline-flex items-center gap-1 bg-white dark:bg-ink-card border border-red-200 dark:border-red-900 hover:bg-red-50 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg font-semibold transition disabled:opacity-50">
                          <FiX size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Testing Feedback (temporary) ───────────────────────────────────
// Reports from the floating Feedback button — newest first, newest 100.
function FeedbackList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feedback')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const categoryBadge = (category) => ({
    Bug: 'bg-red-100 dark:bg-ink-raised text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
    Suggestion: 'bg-indigo-100 dark:bg-ink-raised text-indigo-700 dark:text-ink-link border-indigo-200',
    Other: 'bg-gray-100 dark:bg-ink-raised text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800',
  }[category] || 'bg-gray-100 dark:bg-ink-raised text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-0.5">Feedback</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Tester reports from the floating Feedback button — newest first</p>
      </div>

      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiMessageSquare size={14} className="text-indigo-500 dark:text-ink-link" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">All feedback</h3>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-ink-raised px-2.5 py-1 rounded-full font-medium">{items.length} total</span>
        </div>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <p className="text-sm text-gray-400 dark:text-slate-500">Loading...</p>
          </div>
        ) : !items.length ? (
          <div className="text-center py-16">
            <FiMessageSquare size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-slate-500">No feedback yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-800">
            {items.map((item) => (
              <li key={item._id} className="px-6 py-4">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryBadge(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="font-mono text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-ink-raised px-1.5 py-0.5 rounded">{item.page}</span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap">{item.message}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  {item.name || 'Anonymous'}
                  {item.user?.email ? ` · ${item.user.email}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Sidebar Nav ────────────────────────────────────────────────────
const NAV = [
  { key: 'overview', label: 'Overview', icon: FiBarChart2 },
  { key: 'users', label: 'User Management', icon: FiUsers },
  { key: 'suggestions', label: 'Translation Suggestions', icon: FiGlobe },
  { key: 'feedback', label: 'Feedback', icon: FiMessageSquare },
  { key: 'settings', label: 'System Settings', icon: FiSettings },
];

// ── Main Admin Page ────────────────────────────────────────────────
export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setLoadingStats(false));
  }, [user]);

  if (authLoading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <span className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-page flex">
      <Seo title="Penlix Admin" description="Penlix admin panel — users, credits and activity." path="/admin" noindex />

      {/* ── Dark Sidebar ────────────────────────────────────── */}
      {/* Mobile: hidden drawer (overlay), opened from the top bar.
          md+: normal fixed sidebar, exactly as before. */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 max-w-[70vw] bg-gray-900 flex flex-col py-6 px-3 flex-shrink-0 shadow-xl overflow-y-auto transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} ${sidebarCollapsed ? 'md:hidden' : ''}`}>
        <div className="flex items-center justify-between px-3 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiEdit3 size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">Penlix</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close menu"
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
            <FiX size={18} />
          </button>
        </div>

        <p className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
        <nav className="space-y-0.5 flex-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setSection(key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                section === key
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/8'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="px-3 mb-3">
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-0.5">Signed in as</p>
            <p className="text-xs font-semibold text-gray-300 truncate">{user?.email}</p>
          </div>
          <Link to="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-500 dark:text-slate-400 hover:text-white hover:bg-white/10 transition font-medium">
            <FiArrowLeft size={13} /> Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="bg-white dark:bg-ink-card border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button onClick={() => setSidebarOpen(true)} aria-label="Open menu"
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-ink-raised transition flex-shrink-0">
              <DrawerIcon size={18} />
            </button>
            {/* Desktop: collapse / expand the sidebar so it can be closed when not needed. */}
            <button onClick={() => setSidebarCollapsed((value) => !value)}
              aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-ink-raised transition flex-shrink-0">
              {sidebarCollapsed ? <FiChevronsRight size={18} /> : <FiChevronsLeft size={18} />}
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-gray-900 dark:text-white text-lg truncate">{NAV.find((n) => n.key === section)?.label}</h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">Penlix Admin · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs bg-violet-100 dark:bg-ink-raised text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-900 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <FiShield size={10} /> Admin Access
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-7 pb-24">
          {section === 'overview' && <Overview stats={stats} loadingStats={loadingStats} />}
          {section === 'users' && <UserManagement />}
          {section === 'suggestions' && <TranslationSuggestions />}
          {section === 'feedback' && <FeedbackList />}
          {section === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}
