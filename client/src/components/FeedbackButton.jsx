import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiCheck, FiSend } from 'react-icons/fi';
import api from '../services/api.js';

const CATEGORIES = ['Bug', 'Suggestion', 'Other'];

// Auth pages are vertically centered, so bottom padding cannot guarantee the
// fixed pill clears the submit button on every viewport height — hide it here.
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

// Floating feedback button on every page (temporary, for testing):
// a tester — logged in or not — reports an issue from the page they are on.
// The page is auto-filled from the current route; no credit is charged.
export default function FeedbackButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('Bug');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const openForm = () => { setSent(false); setError(''); setOpen(true); };

  if (AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write your feedback before sending.'); return; }
    setSending(true); setError('');
    try {
      await api.post('/feedback', { page: pathname, category, message: message.trim(), name: name.trim() });
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send feedback. Please try again.');
    } finally { setSending(false); }
  };

  return (
    <>
      <button onClick={openForm}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 bg-teak-600 hover:bg-teak-700 text-white pl-3.5 pr-4 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-teak-900/25 transition">
        <FiMessageSquare size={15} /> Feedback
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white dark:bg-ink-card rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Send feedback</h3>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-ink-raised text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition">
                  <FiX size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">
                Found something wrong or have an idea? Tell us — it helps improve Penlix.
              </p>

              {sent ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-ink-raised rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">Thanks! Your feedback was sent.</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-5">We read every report.</p>
                  <button onClick={() => setOpen(false)}
                    className="bg-teak-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-teak-700 transition">
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                    Page: <span className="font-mono text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-ink-raised px-1.5 py-0.5 rounded">{pathname}</span>
                  </p>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Type</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500 focus:bg-white dark:focus:bg-ink-raised transition mb-4">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                    Your name <span className="text-gray-400 dark:text-slate-500 font-normal normal-case">(optional)</span>
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ali"
                    maxLength={100}
                    className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500 focus:bg-white dark:focus:bg-ink-raised transition mb-4" />
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">What happened?</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={2000} rows={4}
                    placeholder="Describe the issue or your suggestion..."
                    className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-ink-page rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500 focus:bg-white dark:focus:bg-ink-raised transition resize-none mb-1" />
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-right mb-3">{message.length}/2000</p>
                  {error && <p className="text-red-500 text-xs mb-3 bg-red-50 dark:bg-ink-raised px-3 py-2 rounded-lg border border-red-100">{error}</p>}
                  <button type="submit" disabled={sending}
                    className="w-full bg-teak-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-teak-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm">
                    {sending
                      ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      : <><FiSend size={13} /> Send feedback</>}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
