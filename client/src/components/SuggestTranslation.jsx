import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSend } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { SUGGESTION_LANGUAGES } from '../utils/suggestionLanguages.js';

// "Suggest a better translation" — lives on blog posts. A suggestion is
// free, costs no credit, and goes to the admin review queue; it only
// reaches the glossary after an admin approves it.
const inputClass = 'w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-ink-raised focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function SuggestTranslation({ postLanguage }) {
  const { user } = useAuth();
  const defaultLanguage = postLanguage === 'urdu' ? 'urdu' : 'english_us';
  const [form, setForm] = useState({ word: '', language: defaultLanguage, suggestedTranslation: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="mt-14 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">Suggest a better translation</h3>
        <p className="text-sm text-gray-600 dark:text-slate-300">
          Know a better word in your language?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Sign in
          </Link>{' '}
          to suggest it — approved suggestions go into our dictionary.
        </p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.word.trim() || !form.suggestedTranslation.trim()) {
      toast.error('Word and translation are both required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/glossary/suggest', form);
      toast.success('Thanks! Your suggestion is pending review.');
      setForm({ word: '', language: defaultLanguage, suggestedTranslation: '', note: '' });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send your suggestion. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-14 bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1">Suggest a better translation</h3>
      <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
        Know a better word in your language? Suggest it — an admin reviews it first, and approved
        suggestions go into our dictionary.
      </p>
      {done && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2 mb-4">
          Suggestion received — it is pending review.
        </p>
      )}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            value={form.word}
            onChange={(e) => setForm({ ...form, word: e.target.value })}
            placeholder="Word (e.g. topic)"
            maxLength={50}
            className={inputClass}
          />
          <select
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className={inputClass}
          >
            {SUGGESTION_LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <input
          value={form.suggestedTranslation}
          onChange={(e) => setForm({ ...form, suggestedTranslation: e.target.value })}
          placeholder="Your translation"
          maxLength={100}
          className={inputClass}
        />
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Note (optional) — why this word fits"
          maxLength={300}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <FiSend size={14} /> {saving ? 'Sending…' : 'Send suggestion'}
        </button>
      </form>
    </div>
  );
}
