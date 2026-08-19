import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import toast from 'react-hot-toast';
import { FiEdit3, FiAlertCircle, FiCheck, FiArrowLeft, FiZap } from 'react-icons/fi';

const PERKS = [
  '10 free credits instantly — no card needed',
  'Stream AI content in 23 languages',
  'Reality Check scores every generation',
  'SEO package + inline images for blogs',
  'PDF Deep Analyzer included',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created — welcome to Verzo!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <FiZap size={11} /> 10 free credits — no credit card
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Your AI content<br />studio awaits.
          </h2>
          <p className="text-indigo-300 text-sm mb-8 leading-relaxed">
            Create an account in 30 seconds and start generating content that your audience actually reads.
          </p>
          <div className="space-y-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={10} className="text-emerald-400" />
                </div>
                <span className="text-gray-300 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[['23', 'Languages'], ['5', 'Content types'], ['10s', 'Avg. time']].map(([val, label]) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">{val}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
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

          <h1 className="text-3xl font-black text-gray-950 mb-1 tracking-tight">Create your account</h1>
          <p className="text-gray-500 text-sm mb-8">Get 10 free credits — no card needed</p>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3.5 rounded-xl mb-5">
              <FiAlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
              <p className="text-xs">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6}
                placeholder="Min. 6 characters" className={inputClass} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition disabled:opacity-60 text-sm shadow-lg shadow-indigo-200 mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Creating account...</>
              ) : (
                <><FiZap size={14} /> Create free account</>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            By creating an account you agree to our terms of service.
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between text-sm">
            <Link to="/" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
              <FiArrowLeft size={12} /> Home
            </Link>
            <span className="text-gray-500">
              Have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-semibold transition">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
