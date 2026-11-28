import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiRefreshCw, FiCheck, FiArrowLeft, FiShield } from 'react-icons/fi';
import Seo from '../components/Seo.jsx';

const DB_ERROR_KEYWORDS = ['database', 'unreachable', 'temporarily', 'buffering'];

const FEATURES = [
  'AI streaming — watch content appear live',
  '23 languages including Roman Urdu & Arabic',
  'Reality Check scoring on every output',
  'SEO package included with every generation',
  'Inline images with Penlix Vision analysis',
];

const TRUST = [
  'Protected by login lockout and two-step verification',
  'Your data stays yours — download it anytime',
  '20 free credits after email verification',
];

export default function Login() {
  const { login, verifyTwoFactor, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Two-step sign-in: after a password login that requires it, the form
  // switches to the 6-digit code step instead of signing the user in.
  const [step, setStep] = useState('password');
  const [code, setCode] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await login(form.email, form.password);
      if (data.requires2FA) {
        setTwoFactorEmail(data.email || form.email);
        setCode('');
        setStep('code');
        return;
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
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

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await verifyTwoFactor(twoFactorEmail, code);
      toast.success('Welcome back!');
      navigate(data.user?.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Digits only, max 6 — the code the server emailed is 6 digits.
  const handleCodeChange = (e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6));

  const isDbError = DB_ERROR_KEYWORDS.some((k) => error.toLowerCase().includes(k));

  const inputClass = 'w-full bg-gray-50 dark:bg-ink-page border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500 focus:bg-white dark:focus:bg-ink-raised transition placeholder-gray-400 dark:placeholder-slate-500';

  return (
    <div className="min-h-screen flex">
      <Seo title="Log in to Penlix — AI Content Generator" description="Log in to Penlix to generate blogs, emails, social posts and ads in 23 languages." path="/login" noindex />

      {/* ── Left: Feature panel ──────────────────────────────── */}
      <div className="hidden lg:flex w-[44%] bg-gradient-to-br from-gray-950 via-teak-950 to-gray-900 flex-col justify-between p-12 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/brand/penlix-mark-white.svg" alt="Penlix" className="h-9 w-auto" />
          <span className="text-white font-black text-2xl tracking-tight">Penlix</span>
        </Link>

        <div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Write content<br />that sounds human.
          </h2>
          <p className="text-teak-300 text-sm mb-8 leading-relaxed">
            The AI platform that writes with precision, sells with psychology, and thinks like your best copywriter.
          </p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-teak-500/20 border border-teak-400/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={10} className="text-teak-400" />
                </div>
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* Trust — security and data promises, Asan Tijarat sign-in pattern. */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
            {TRUST.map((t) => (
              <div key={t} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                  <FiShield size={10} className="text-emerald-400" />
                </div>
                <span className="text-gray-400 text-xs">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 dark:bg-ink-card/5 border border-white/10 rounded-2xl p-5">
          <p className="text-gray-300 text-sm leading-relaxed">
            I built Penlix because AI writing kept sounding like a robot. Every word it
            generates is checked to sound human — that is the whole point.
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teak-500 to-teak-600 flex items-center justify-center text-white text-xs font-bold">F</div>
            <div>
              <p className="text-white text-xs font-semibold">M. Faizan</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs">Founder, Penlix</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ─────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-ink-card">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-8 w-auto dark:hidden" />
            <img src="/brand/penlix-mark-white.svg" alt="Penlix" className="h-8 w-auto hidden dark:block" />
            <span className="font-black text-gray-900 dark:text-white text-xl">Penlix</span>
          </Link>

          <h1 className="text-3xl font-black text-gray-950 dark:text-white mb-1 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Sign in to continue writing</p>

          {error && (
            <div className={`text-sm px-4 py-3.5 rounded-xl mb-6 flex items-start gap-3 ${
              isDbError
                ? 'bg-amber-50 dark:bg-ink-raised border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                : 'bg-red-50 dark:bg-ink-raised border border-red-100 dark:border-red-900 text-red-700 dark:text-red-300'
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

          {step === 'code' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">Sign-in code</label>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={handleCodeChange} required
                  placeholder="123456" className={`${inputClass} tracking-[0.5em] text-center font-bold`} />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 leading-relaxed">
                  We sent a 6-digit sign-in code to {twoFactorEmail}. It expires in 10 minutes.
                </p>
              </div>

              <button type="submit" disabled={loading || code.length !== 6}
                className="w-full bg-teak-600 hover:bg-teak-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-md shadow-teak-900/20 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Verifying...
                  </span>
                ) : 'Verify code'}
              </button>

              <button type="button" onClick={() => { setStep('password'); setError(''); }}
                className="w-full text-center text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 transition">
                Back to sign in
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email"
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password"
                placeholder="••••••••" className={inputClass} />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-indigo-600 dark:text-ink-link hover:text-indigo-800 dark:hover:text-ink-link font-semibold text-sm transition">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-teak-600 hover:bg-teak-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-md shadow-teak-900/20 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-sm">
            <Link to="/" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 flex items-center gap-1 transition">
              <FiArrowLeft size={12} /> Home
            </Link>
            <span className="text-gray-500 dark:text-slate-400">
              No account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-ink-link hover:text-indigo-800 dark:hover:text-ink-link font-semibold transition">
                Sign up free
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
