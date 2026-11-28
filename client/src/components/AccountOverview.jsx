import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiUser, FiMail, FiCheckCircle, FiAlertCircle, FiZap,
  FiFileText, FiEdit3, FiArrowRight, FiStar,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import api from '../services/api.js';
import DashboardStats from './Dashboard.jsx';

// Account overview: profile, credits, usage and recent generations in one
// place. History itself lives in the History tab — this only previews the
// last 3 items and links across, so there is no second history list.
export default function AccountOverview({ onNavigate }) {
  const { user } = useAuth();
  const { credits } = useCredits();
  const [recent, setRecent] = useState(null); // null = still loading
  const [total, setTotal] = useState(null);
  const [favorites, setFavorites] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get('/history', { params: { page: 1, limit: 3 } }),
      api.get('/history', { params: { page: 1, limit: 1, favorite: true } }),
    ])
      .then(([{ data: h }, { data: f }]) => {
        if (!alive) return;
        setRecent(Array.isArray(h.items) ? h.items : []);
        setTotal(typeof h.total === 'number' ? h.total : null);
        setFavorites(typeof f.total === 'number' ? f.total : null);
      })
      .catch(() => { if (alive) setRecent([]); });
    return () => { alive = false; };
  }, []);

  const balance = credits ?? user?.credits ?? 0;
  const verified = user?.isEmailVerified !== false;
  const plan = user?.subscription || 'free';

  return (
    <div className="space-y-6">
      <DashboardStats totalGenerated={total} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile */}
        <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-teak-600 text-white flex items-center justify-center text-lg font-black">
              {(user?.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate flex items-center gap-1">
                <FiMail size={11} /> {user?.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              verified
                ? 'bg-emerald-100 dark:bg-ink-raised text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-ink-raised text-amber-700 dark:text-amber-300'
            }`}>
              {verified ? <><FiCheckCircle size={12} /> Email verified</> : <><FiAlertCircle size={12} /> Email not verified</>}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teak-100 dark:bg-ink-raised text-teak-700 dark:text-teak-400 capitalize">
              <FiUser size={12} /> {plan} plan
            </span>
          </div>
        </div>

        {/* Credits */}
        <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Credits</p>
              <p className="font-black text-3xl text-teak-600 dark:text-teak-400 flex items-center gap-2">
                <FiZap size={20} /> {balance}
              </p>
            </div>
            <Link to="/pricing" className="text-xs font-semibold text-indigo-600 dark:text-ink-link hover:underline flex items-center gap-1 flex-shrink-0 mt-1">
              See plans <FiArrowRight size={12} />
            </Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-3 leading-relaxed">
            1 credit = 1 generation, tune, PDF analysis or RAG answer.
            Free accounts top up to 20 credits every night.
          </p>
        </div>
      </div>

      {/* Recent generations — preview only, full list lives in History */}
      <div className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Recent generations
            {favorites !== null && favorites > 0 && (
              <span className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                <FiStar size={11} fill="currentColor" /> {favorites} favorite{favorites === 1 ? '' : 's'}
              </span>
            )}
          </h2>
          <button onClick={() => onNavigate('history')} className="text-xs font-semibold text-indigo-600 dark:text-ink-link hover:underline flex items-center gap-1">
            View all history <FiArrowRight size={12} />
          </button>
        </div>
        {recent === null ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-ink-raised" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 dark:text-slate-500">No content generated yet.</p>
            <button onClick={() => onNavigate('generate')} className="mt-3 bg-teak-600 hover:bg-teak-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition inline-flex items-center gap-2">
              <FiEdit3 size={14} /> Generate your first piece
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((item) => (
              <button
                key={item._id}
                onClick={() => onNavigate('history')}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-ink-raised transition"
              >
                <span className="text-xs font-semibold bg-teak-100 dark:bg-ink-raised text-teak-700 dark:text-teak-400 px-2 py-0.5 rounded-full uppercase flex-shrink-0">{item.type}</span>
                <span className="text-sm text-gray-700 dark:text-slate-200 font-medium truncate flex-1">{item.prompt}</span>
                {item.favorite && <FiStar size={13} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
                <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0 hidden sm:inline">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => onNavigate('generate')} className="bg-teak-600 hover:bg-teak-700 text-white rounded-2xl p-4 text-left transition shadow-sm">
          <FiEdit3 size={18} className="mb-2" />
          <p className="text-sm font-bold">New generation</p>
          <p className="text-xs text-teak-100 mt-0.5">Write something new — 1 credit</p>
        </button>
        <Link to="/pdf" className="bg-white dark:bg-ink-card hover:bg-gray-50 dark:hover:bg-ink-raised border border-gray-100 dark:border-slate-800 rounded-2xl p-4 text-left transition shadow-sm">
          <FiFileText size={18} className="mb-2 text-teak-600 dark:text-teak-400" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">PDF Analyzer</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Ask questions about a PDF — 1 credit</p>
        </Link>
        <Link to="/pricing" className="bg-white dark:bg-ink-card hover:bg-gray-50 dark:hover:bg-ink-raised border border-gray-100 dark:border-slate-800 rounded-2xl p-4 text-left transition shadow-sm">
          <FiZap size={18} className="mb-2 text-teak-600 dark:text-teak-400" />
          <p className="text-sm font-bold text-gray-900 dark:text-white">Plans &amp; credits</p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">See what each plan includes</p>
        </Link>
      </div>
    </div>
  );
}
