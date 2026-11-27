import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiZap, FiEdit3, FiTrendingUp, FiGlobe, FiFileText,
  FiImage, FiDownload, FiShare2, FiArrowRight, FiCheck, FiStar,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.js';
import Seo from '../components/Seo.jsx';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const FEATURES = [
  { icon: FiZap, title: 'Streaming AI Generation', desc: 'Watch your content appear word-by-word in real time — powered by Penlix AI with dual-agent quality scoring.', color: 'text-indigo-600 dark:text-ink-link', bg: 'bg-indigo-50 dark:bg-ink-raised', border: 'border-indigo-100' },
  { icon: FiGlobe, title: '23 Languages & Dialects', desc: 'English, Karachi/Lahore Urdu, Gulf Arabic, French, German, Hindi, Chinese, Japanese and many more.', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-ink-raised', border: 'border-violet-100 dark:border-slate-800' },
  { icon: FiEdit3, title: 'One-Click Tuning', desc: 'Shorten, boost engagement, add professionalism or reduce hype — refine any output without spending credits.', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-ink-raised', border: 'border-sky-100 dark:border-slate-800' },
  { icon: FiTrendingUp, title: 'SEO Package Built-in', desc: 'Every generation includes a meta title, meta description, and 5 targeted keywords — automatically.', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-ink-raised', border: 'border-emerald-100 dark:border-slate-800' },
  { icon: FiFileText, title: 'PDF Deep Analyzer', desc: 'Upload any PDF — get structured study notes, chapter summaries, and a 10-question test bank instantly.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-ink-raised', border: 'border-amber-100 dark:border-slate-800' },
  { icon: FiImage, title: 'Inline Blog Images', desc: 'Real Unsplash photos downloaded, analyzed by Penlix Vision, and embedded at the perfect spots in your blog.', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-ink-raised', border: 'border-rose-100 dark:border-slate-800' },
  { icon: FiDownload, title: 'One-Click Export', desc: 'Download your content as PDF, DOCX or TXT — or copy it to the clipboard — with one click.', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-ink-raised', border: 'border-teal-100 dark:border-slate-800' },
  { icon: FiShare2, title: 'Social Share', desc: 'Share directly to LinkedIn or Twitter/X without copying and pasting anything. One button.', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-ink-raised', border: 'border-pink-100 dark:border-slate-800' },
  { icon: FiStar, title: 'Reality Check Scoring', desc: 'Reality Check scores every output out of 10 on human-ness, punchiness and clichés — so you see what to trust before you publish.', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-ink-raised', border: 'border-amber-100 dark:border-slate-800' },
];

const STATS = [
  { value: '23', label: 'Languages' },
  { value: '5', label: 'Content types' },
  { value: '4', label: 'Export formats' },
  { value: '10s', label: 'Avg. gen time' },
];

const TRUST = [
  'Real-time streaming output',
  'Dual-agent quality scoring',
  'Auto-generated SEO metadata',
  'No credit card required',
];

export default function Home() {
  const { user, loading } = useAuth();
  const loggedIn = !loading && !!user;

  return (
    <main className="bg-white dark:bg-ink-card min-h-screen overflow-hidden">
      <Seo title="Penlix — AI Content That Converts" description="Penlix is an AI content generator that writes, refines and organises marketing content — blogs, emails, social posts and ads — in minutes." path="/" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white pt-20 pb-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-2 bg-white dark:bg-ink-card border border-indigo-200 text-indigo-700 dark:text-ink-link text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Powered by Penlix AI · Dual-agent scoring
            </span>
          </motion.div>

          <motion.h1 {...fade(0.07)} className="text-6xl sm:text-7xl font-black text-gray-950 dark:text-white leading-[1.04] mb-6 tracking-tight">
            Write content that<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              actually converts
            </span>
          </motion.h1>

          <motion.p {...fade(0.14)} className="text-lg sm:text-xl text-gray-500 dark:text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
            AI-powered blog posts, emails, ads, social content and product descriptions in 23 languages —
            with built-in SEO, Reality Check scoring, and inline images.
          </motion.p>

          <motion.div {...fade(0.2)} className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            {!loading && (loggedIn ? (
              <Link to="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-base transition shadow-xl shadow-indigo-200/60">
                Go to Dashboard <FiArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-base transition shadow-xl shadow-indigo-200/60">
                  Start free — 20 credits <FiArrowRight size={16} />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center justify-center border-2 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 text-gray-700 dark:text-slate-200 px-8 py-4 rounded-xl font-bold text-base bg-white dark:bg-ink-card transition">
                  Sign in
                </Link>
              </>
            ))}
          </motion.div>

          <motion.div {...fade(0.26)} className="flex flex-wrap justify-center gap-5">
            {TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
                <FiCheck size={13} className="text-emerald-500 flex-shrink-0" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
              className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition"
            >
              <p className="text-4xl font-black text-indigo-600 dark:text-ink-link mb-1.5">{value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-black text-gray-950 dark:text-white mb-4 tracking-tight">
            Everything in one platform
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto text-base leading-relaxed">
            From idea to published in seconds. Every feature is designed to save you time and produce content that performs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.04 }}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}
              className={`bg-white dark:bg-ink-card rounded-2xl border ${border} shadow-sm p-6 flex flex-col gap-4 cursor-default transition-shadow`}
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 leading-snug">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="relative bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 rounded-3xl p-12 shadow-2xl shadow-indigo-300/40 text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-500/30 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Ready to write smarter?</h2>
            {!loading && (loggedIn ? (
              <>
                <p className="text-indigo-200 mb-8 max-w-xs mx-auto">Your dashboard is waiting — pick up where you left off.</p>
                <Link to="/dashboard"
                  className="inline-flex items-center gap-2 bg-white dark:bg-ink-card text-indigo-700 dark:text-ink-link font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-ink-raised transition shadow-lg text-sm">
                  Go to Dashboard <FiArrowRight size={15} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-indigo-200 mb-8 max-w-xs mx-auto">Get 20 free credits instantly. No credit card required.</p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-white dark:bg-ink-card text-indigo-700 dark:text-ink-link font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-ink-raised transition shadow-lg text-sm">
                  Create free account <FiArrowRight size={15} />
                </Link>
              </>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
