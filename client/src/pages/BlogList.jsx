import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiEdit3 } from 'react-icons/fi';
import { POSTS, readingTime } from '../content/blog/index.js';
import { setPageMeta } from '../utils/pageMeta.js';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BlogList() {
  useEffect(() => {
    setPageMeta(
      'Blog — Penlix | AI Content Guides',
      'Practical guides to writing blogs, emails and more with AI — in Roman Urdu, Urdu and English. Real examples, no filler.'
    );
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="bg-white dark:bg-ink-page min-h-screen">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-2 bg-teak-50 dark:bg-teak-950 border border-teak-100 dark:border-teak-900 text-teak-700 dark:text-teak-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <FiEdit3 size={12} /> Penlix Blog
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
            Learn to write with AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300">
            Practical guides — Roman Urdu blogs, professional emails, Urdu content —
            with real examples you can copy, not generic advice.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-teak-300 dark:hover:border-teak-700 hover:shadow-md dark:hover:shadow-none transition flex flex-col"
            >
              <span className="self-start bg-teak-50 dark:bg-teak-950 text-teak-700 dark:text-teak-300 text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
                {post.keyword}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-teak-700 dark:group-hover:text-teak-300 transition">
                {post.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mb-5 flex-1">
                {post.description}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <FiClock size={12} /> {readingTime(post.body)} min read · {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  Read <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-14">
          More guides coming every week — starting with the Roman Urdu and Urdu series.
        </p>
      </section>
    </main>
  );
}
