// check-blog-language.mjs — Language-consistency guard for Penlix blog posts.
//
// Every non-English blog post must be written entirely in its own language.
// AI generation once left English template labels and whole English blocks
// inside non-English posts (see fix/blog-language-consistency), so this
// check fails loudly instead of letting it recur.
//
// Usage: node scripts/check-blog-language.mjs
//        npm run check:blog-language
// Exit 0 = all posts clean. Exit 1 = violations listed below.
//
// What it checks (non-English posts only; the 3 English posts are skipped):
//   1. English "## FAQ" heading            (must be translated, e.g. "Häufig gestellte Fragen")
//   2. English "## Example N" heading     (must be translated, e.g. "Misaal 1")
//   3. English "**Step N:**" label        (must be translated, e.g. "Marhala 1")
//   4. Untranslated "Reality Check" name or its English criteria
//      ("Human-ness", "Punchiness", "No-Cliché")
//   5. A block of 2+ consecutive English lines (e.g. a whole example email
//      left in English inside a non-English post — an email is typically
//      two long English paragraphs, so 2 is the right threshold).
//
// The English-block check is a heuristic: a prose line counts as English
// when it carries 3+ common English function words and no marker word of
// the post's own language. Roman Urdu posts are Latin-script, so they are
// protected by their Urdu marker words (hai, karein, mein, se, aur, ...).
// Frontmatter, code fences and URLs are never counted.

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'client', 'src', 'content', 'blog');

// The only posts allowed to be in English (by filename, without .md).
const ENGLISH_POSTS = new Set([
  'does-ai-generated-content-hurt-seo',
  'formal-british-english-emails',
  'write-blog-from-a-photo',
]);

// Common English function words. A prose line with 3+ of these and no
// own-language marker word is treated as English.
const ENGLISH_WORDS = new Set(
  ('the a an is are was were be been being am you your yours he she it we they ' +
   'this that these those with for and or but to of in on at by from as not no ' +
   'if then so because when where how what why who which can could will would ' +
   'should have has had do does did your my his her our their its this that ' +
   'there here more most some any all each every other another first second ' +
   'also just only even still already yet now today tomorrow yesterday').split(' ')
);

// Marker words of the non-English languages, in Latin script where the
// language is written that way. A line containing any of these is NOT
// counted as English. (Non-Latin-script posts — Urdu, Arabic, Bengali,
// Hindi, Russian, Korean, Chinese, Japanese, Persian — are protected
// automatically, since their prose has no Latin-script English words.)
// Note: deliberately EXCLUDES "is", "in", "us", "do", "teen" — those
// spellings are both Roman Urdu words and English words, so they cannot
// tell the two apart; Roman Urdu lines carry other markers
// (hai, karein, mein...).
const OWN_LANGUAGE_MARKERS = new Set(
  ('hai hain karein karein kare karo karna karne likhein likhna likho aap aapka ' +
   'tum tumhara tumhari yeh ye wo woh ke ki ka mein se aur par ko ne bhi nahi ' +
   'kya kaise kyun kab kahan jab toh phir ab mera meri mere tera ' +
   'teri tere hamara hamari aapki kuch sab har aik ek chaar paanch ' +
   'chahiye hota hoti hote jata jati jate raha rahi rahe gaya gayi gaye ' +
   'misaal marhala sawalat pooche aksar behtar asaan mukhtasar email blog ' +
   'janay wale janay janay').split(' ')
);

const violations = [];

function fail(file, lineNo, rule, text) {
  violations.push({ file, lineNo, rule, text: text.trim().slice(0, 120) });
}

function stripMarkdown(line) {
  return line
    .replace(/^#+\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`[^`]*`/g, '')
    .replace(/^>\s*/, '')
    .trim();
}

function wordsOf(line) {
  return stripMarkdown(line)
    .toLowerCase()
    .replace(/[^a-z\u00c0-\u024f\u1e00-\u1eff'’-]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function isEnglishLine(line) {
  const words = wordsOf(line);
  if (words.length < 4) return false;
  let english = 0;
  for (const w of words) {
    if (OWN_LANGUAGE_MARKERS.has(w)) return false;
    if (ENGLISH_WORDS.has(w)) english += 1;
  }
  return english >= 3;
}

for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).sort()) {
  const slug = file.replace(/\.md$/, '');
  if (ENGLISH_POSTS.has(slug)) continue;

  const lines = readFileSync(join(BLOG_DIR, file), 'utf8').split('\n');
  let inFrontmatter = false;
  let inCodeFence = false;
  let englishRun = 0;
  let englishRunStart = 0;

  const flushRun = (endLine) => {
    if (englishRun >= 2) {
      fail(file, englishRunStart, 'english-block', `${englishRun} consecutive English lines (starting here)`);
    }
    englishRun = 0;
  };

  lines.forEach((raw, idx) => {
    const lineNo = idx + 1;
    const line = raw.trim();

    // Frontmatter: skip everything between the leading --- markers.
    if (idx === 0 && line === '---') { inFrontmatter = true; return; }
    if (inFrontmatter) {
      if (line === '---') inFrontmatter = false;
      return;
    }
    // Code fences: skip.
    if (line.startsWith('```')) { inCodeFence = !inCodeFence; return; }
    if (inCodeFence) return;
    // URLs / links alone are not prose.
    if (/^https?:\/\//.test(line)) { flushRun(lineNo); return; }
    // A line that is only a blockquote marker (">") is a paragraph break
    // inside the same blockquote — it neither counts as English nor ends
    // a run. A truly empty line ends the current block.
    if (line.replace(/^>\s*/, '') === '') {
      if (line.startsWith('>')) return;
      flushRun(lineNo);
      return;
    }

    // Rule 1: English FAQ heading.
    if (/^## FAQ\s*$/.test(line)) {
      fail(file, lineNo, 'english-faq-heading', line);
    }
    // Rule 2: English Example heading.
    if (/^## Example \d+/.test(line)) {
      fail(file, lineNo, 'english-example-heading', line);
    }
    // Rule 3: English Step label.
    if (/^\*\*Step \d+:/.test(line)) {
      fail(file, lineNo, 'english-step-label', line);
    }
    // Rule 4: untranslated Reality Check name or English criteria.
    if (/reality check/i.test(line)) {
      fail(file, lineNo, 'untranslated-reality-check', line);
    }
    if (/\bhuman-ness\b/i.test(line) || /\bpunchiness\b/i.test(line) || /\bno-clich[eé]\b/i.test(line)) {
      fail(file, lineNo, 'english-reality-check-criteria', line);
    }

    // Rule 5: 3+ consecutive English prose lines. Short lines (a greeting,
    // a closing, a name) are neutral — they neither count as English nor
    // break a run, so an English email is caught as one block.
    const wordCount = wordsOf(line).length;
    if (wordCount < 4) return;
    if (isEnglishLine(line)) {
      if (englishRun === 0) englishRunStart = lineNo;
      englishRun += 1;
    } else {
      flushRun(lineNo);
    }
  });
  flushRun(lines.length);
}

if (violations.length === 0) {
  console.log('✓ Blog language check passed — all non-English posts are in their own language.');
  process.exit(0);
}

console.error(`✗ Blog language check FAILED — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.lineNo} [${v.rule}] ${v.text}`);
}
console.error(
  '\nFix: translate the flagged heading/label into the post\'s own language, ' +
  'or rewrite the flagged English block in that language, then re-run ' +
  '`npm run check:blog-language`.'
);
process.exit(1);
