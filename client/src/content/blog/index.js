// Blog posts live as Markdown files in this folder. Each file starts with
// frontmatter (title, description, slug, date, keyword) between --- lines.
// Vite bundles the .md files as raw text (?raw), so no server round-trip
// is needed to read them.
import romanUrduBlogWriter from './roman-urdu-blog-writer.md?raw';
import freeAiEmailGenerator from './free-ai-email-generator.md?raw';
import urduContentGenerator from './urdu-content-generator.md?raw';
import aiContentSeo from './does-ai-generated-content-hurt-seo.md?raw';
import aiContentUrdu from './ai-content-generator-in-urdu.md?raw';
import aiBlogWriterRomanUrdu from './ai-blog-writer-in-roman-urdu.md?raw';

// Minimal frontmatter parser — only the flat `key: value` lines we author.
// Posts are repo-authored, so no need for a full YAML dependency.
export function parsePost(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Blog post is missing frontmatter (--- block)');
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  for (const key of ['title', 'description', 'slug', 'date', 'keyword']) {
    if (!meta[key]) throw new Error(`Blog post is missing frontmatter field: ${key}`);
  }
  return { ...meta, body: match[2].trim() };
}

const SOURCES = [romanUrduBlogWriter, freeAiEmailGenerator, urduContentGenerator, aiContentSeo, aiContentUrdu, aiBlogWriterRomanUrdu];

export const POSTS = SOURCES.map(parsePost).sort(
  (a, b) => new Date(b.date) - new Date(a.date)
);

export const getPostBySlug = (slug) => POSTS.find((post) => post.slug === slug);

// Rough reading time at 200 words/minute, minimum 1 minute.
export const readingTime = (body) => Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
