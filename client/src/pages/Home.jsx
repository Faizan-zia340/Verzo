import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiZap, FiEdit3, FiTrendingUp, FiGlobe, FiFileText,
  FiImage, FiShield, FiArrowRight,
} from 'react-icons/fi';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

const FEATURES = [
  { icon: FiZap, title: 'Streaming AI Generation', desc: 'Watch content appear word-by-word in real time. Powered by Gemini with dual-agent quality review.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: FiGlobe, title: '23 Languages & Dialects', desc: 'Generate in US/UK English, Karachi/Lahore Urdu, Gulf Arabic, French, German, Hindi, Japanese and more.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: FiEdit3, title: 'Output Tuning', desc: 'Shorten, boost engagement, add professionalism or reduce hype — refine content without spending credits.', color: 'text-sky-600', bg: 'bg-sky-50' },
  { icon: FiTrendingUp, title: 'Full SEO Package', desc: 'Every generation includes a meta title, meta description, and 5 targeted keywords automatically.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: FiFileText, title: 'PDF Deep Analyzer', desc: 'Upload any PDF and get structured study notes, chapter summaries, and a 10-question test bank.', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: FiImage, title: 'Unsplash Stock Photos', desc: 'Relevant high-quality images are automatically matched to your content via Unsplash API.', color: 'text-rose-600', bg: 'bg-rose-50' },
  { icon: FiShield, title: 'Export PDF & DOCX', desc: 'Download your content as a formatted PDF or DOCX file with one click — ready to publish.', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: FiArrowRight, title: 'Instant Social Share', desc: 'Share directly to LinkedIn or Twitter/X without copying and pasting anything.', color: 'text-pink-600', bg: 'bg-pink-50' },
];

const STATS = [
  { value: '23', label: 'Languages & Dialects' },
  { value: '5', label: 'Content Types' },
  { value: '4', label: 'Export Formats' },
  { value: '10s', label: 'Avg. Generation Time' },
];

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-slate-50 via-indigo-50/40 to-white min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center">
        <motion.div {...fadeUp(0)}>
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-7">
            <FiZap size={13} /> AI-Powered · Dual-Agent Quality Review
          </span>
        </motion.div>

        <motion.h1 {...fadeUp(0.08)} className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
          Create great content<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">in seconds, not hours</span>
        </motion.h1>

        <motion.p {...fadeUp(0.14)} className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Generate blog posts, social media captions, emails, ads and product descriptions in 23 languages — with built-in SEO, image matching, and export.
        </motion.p>

        <motion.div {...fadeUp(0.2)} className="flex gap-4 justify-center flex-wrap">
          <Link to="/register" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 transition shadow-md flex items-center gap-2">
            Start for free <FiArrowRight size={16} />
          </Link>
          <Link to="/pricing" className="border border-indigo-200 text-indigo-700 px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-50 transition bg-white">
            View pricing
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
        className="max-w-3xl mx-auto px-4 pb-20"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-indigo-600 mb-1">{value}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-4 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to create great content</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            From idea to published in seconds. Every feature is designed to save you time and produce content that actually performs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 + i * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3 cursor-default"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
        className="max-w-2xl mx-auto px-4 pb-28 text-center"
      >
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to write faster?</h2>
          <p className="text-indigo-200 text-sm mb-7 max-w-sm mx-auto">Create your free account and get 10 credits instantly. No credit card required.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition shadow-md text-sm">
            Get started free <FiArrowRight size={15} />
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
