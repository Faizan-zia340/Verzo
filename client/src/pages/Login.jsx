import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import toast from 'react-hot-toast';
import { FiEdit3, FiAlertCircle, FiRefreshCw, FiCheck, FiArrowLeft } from 'react-icons/fi';

const DB_ERROR_KEYWORDS = ['database', 'unreachable', 'temporarily', 'buffering'];

const FEATURES = [
  'AI streaming — watch content appear live',
  '23 languages including Roman Urdu & Arabic',
  'Reality Check scoring on every output',
  'SEO package included with every generation',
  'Inline images with Gemini Vision analysis',
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(data.user?.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isDbError = DB_ERROR_KEYWORDS.some((k) => error.toLowerCase().includes(k));

  const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition placeholder-gray-400';

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Feature panel ──────────────────────────────── */}
      <div className="hidden lg:flex w-[44%] bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900 flex-col justify-between p-12 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
            <FiEdit3 size={17} className="text-white" />
          </div>
          <span className="text-white font-black text-2xl tracking-tight">Verzo</span>
        </Link>

        <div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Write content<br />that sounds human.
          </h2>
          <p className="text-indigo-300 text-sm mb-8 leading-relaxed">
            The AI platform that writes with precision, sells with psychology, and thinks like your best copywriter.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={10} className="text-indigo-400" />
                </div>
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-gray-300 text-sm italic leading-relaxed">
            "Verzo generates content my readers actually want to read. The Reality Check scoring changed how I write."
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">A</div>
            <div>
              <p className="text-white text-xs font-semibold">Ahmad Raza</p>
              <p className="text-gray-400 text-xs">Content Marketer</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
              <FiEdit3 size={14} className="text-white" />
            </div>
            <span className="font-black text-gray-900 text-xl">Verzo</span>
          </Link>

          <h1 className="text-3xl font-black text-gray-950 mb-1 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue writing</p>

          {error && (
            <div className={`text-sm px-4 py-3.5 rounded-xl mb-6 flex items-start gap-3 ${
              isDbError
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-red-50 border border-red-100 text-red-700'
            }`}>
              {isDbError
                ? <FiRefreshCw size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
                : <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
              }
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide mb-0.5">
                  {isDbError ? 'Database reconnecting' : 'Sign-in failed'}
                </p>
                <p className="text-xs opacity-80">
                  {isDbError
                    ? 'The server is reconnecting to the database. Please wait a moment and try again.'
                    : error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email"
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password"
                placeholder="••••••••" className={inputClass} />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-lg shadow-indigo-200 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
            <Link to="/" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
              <FiArrowLeft size={12} /> Home
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
    </div>
  );
}
