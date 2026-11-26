import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { FiArrowLeft, FiClock, FiArrowRight } from 'react-icons/fi';
import { getPostBySlug, readingTime } from '../content/blog/index.js';
import { setPageMeta } from '../utils/pageMeta.js';
import FontPicker from '../components/FontPicker.jsx';
import SuggestTranslation from '../components/SuggestTranslation.jsx';
import { scriptOf, useContentFont } from '../utils/fonts.js';

// Posts are repo-authored, but raw HTML in Markdown is never rendered —
// a hand-written <script> or <iframe> in a .md file renders as nothing.
const renderer = new marked.Renderer();
renderer.html = () => '';

marked.use({ renderer, gfm: true, breaks: false });

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function BlogPost() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  const html = useMemo(
    () => (post ? marked.parse(post.body) : ''),
    [post]
  );

  useEffect(() => {
    if (post) {
      setPageMeta(`${post.title} | Penlix Blog`, post.description);
      window.scrollTo(0, 0);
    }
  }, [post]);

  // Content font for the post's language (persisted per script).
  const script = scriptOf(post?.language || 'english');
  const { font, setFont, stack, dir, lineHeight } = useContentFont(script);

  if (!post) {
    return (
      <main className="bg-white dark:bg-gray-950 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md py-20">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Post not found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This blog post doesn&apos;t exist — it may have moved or the link may be wrong.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
          >
            <FiArrowLeft size={14} /> Back to all posts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white dark:bg-gray-950 min-h-screen">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            <FiArrowLeft size={14} /> All posts
          </Link>
          <FontPicker script={script} value={font} onChange={setFont} />
        </div>

        <div dir={dir} style={{ fontFamily: stack, lineHeight }}>
          <span className="inline-block bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
            {post.keyword}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-10">
            <FiClock size={13} /> {readingTime(post.body)} min read · {formatDate(post.date)} · By M. Faizan, Founder, Penlix
          </p>

          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        <SuggestTranslation postLanguage={post.language} />

        <div className="mt-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Try it yourself — free</h2>
          <p className="text-indigo-100 mb-6">
            Write your first blog, email or ad with Penlix. Free signup includes 20 credits — no card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-50 transition"
            >
              Get started free <FiArrowRight size={14} />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 border border-indigo-300 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition"
            >
              See pricing
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
