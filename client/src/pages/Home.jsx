import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiZap, FiEdit3, FiTrendingUp, FiGlobe, FiFileText,
  FiImage, FiDownload, FiShare2, FiArrowRight, FiCheck,
} from 'react-icons/fi';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const FEATURES = [
  { icon: FiZap, title: 'Streaming AI Generation', desc: 'Watch your content appear word-by-word in real time — powered by Gemini with dual-agent quality scoring.', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { icon: FiGlobe, title: '23 Languages & Dialects', desc: 'English, Karachi/Lahore Urdu, Gulf Arabic, French, German, Hindi, Chinese, Japanese and many more.', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { icon: FiEdit3, title: 'One-Click Tuning', desc: 'Shorten, boost engagement, add professionalism or reduce hype — refine any output without spending credits.', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  { icon: FiTrendingUp, title: 'SEO Package Built-in', desc: 'Every generation includes a meta title, meta description, and 5 targeted keywords — automatically.', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: FiFileText, title: 'PDF Deep Analyzer', desc: 'Upload any PDF — get structured study notes, chapter summaries, and a 10-question test bank instantly.', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { icon: FiImage, title: 'Inline Blog Images', desc: 'Real Unsplash photos downloaded, analyzed by Gemini Vision, and embedded at the perfect spots in your blog.', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { icon: FiDownload, title: 'PDF & DOCX Export', desc: 'Download your content as a formatted PDF or Word document — images and all — with one click.', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  { icon: FiShare2, title: 'Social Share', desc: 'Share directly to LinkedIn or Twitter/X without copying and pasting anything. One button.', color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
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
  return (
    <main className="bg-white min-h-screen overflow-hidden">

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white pt-20 pb-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div {...fade(0)}>
            <span className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Powered by Google Gemini · Dual-agent scoring
            </span>
          </motion.div>

          <motion.h1 {...fade(0.07)} className="text-6xl sm:text-7xl font-black text-gray-950 leading-[1.04] mb-6 tracking-tight">
            Write content that<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
              actually converts
            </span>
          </motion.h1>

          <motion.p {...fade(0.14)} className="text-lg sm:text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            AI-powered blog posts, emails, ads, and social content in 23 languages —
            with built-in SEO, Reality Check scoring, and inline images.
          </motion.p>

          <motion.div {...fade(0.2)} className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-base transition shadow-xl shadow-indigo-200/60">
              Start free — 10 credits <FiArrowRight size={16} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-bold text-base bg-white transition">
              Sign in
            </Link>
          </motion.div>

          <motion.div {...fade(0.26)} className="flex flex-wrap justify-center gap-5">
            {TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
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
              className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition"
            >
              <p className="text-4xl font-black text-indigo-600 mb-1.5">{value}</p>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
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
          <h2 className="text-4xl font-black text-gray-950 mb-4 tracking-tight">
            Everything in one platform
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed">
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
              className={`bg-white rounded-2xl border ${border} shadow-sm p-6 flex flex-col gap-4 cursor-default transition-shadow`}
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
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
            <p className="text-indigo-200 mb-8 max-w-xs mx-auto">Get 10 free credits instantly. No credit card required.</p>
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition shadow-lg text-sm">
              Create free account <FiArrowRight size={15} />
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
