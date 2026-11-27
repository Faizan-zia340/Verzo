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
import writeBlogFromPhoto from './write-blog-from-a-photo.md?raw';
import bolKarContentLikhein from './bol-kar-content-likhein.md?raw';
import urduProfessionalEmail from './urdu-mein-professional-email-kaise-likhein.md?raw';
import formalBritishEnglishEmails from './formal-british-english-emails.md?raw';
import arabicBlogWriting from './arabic-blog-writing.md?raw';
import gulfArabicSocialCaptions from './gulf-arabic-social-captions.md?raw';
import blogEnEspanolLatinoamericano from './blog-en-espanol-latinoamericano.md?raw';
import anunciosEnEspanolDeEspana from './anuncios-en-espanol-de-espana.md?raw';
import emailsProfessionnelsEnFrancais from './emails-professionnels-en-francais.md?raw';
import blogAufDeutschSchreiben from './blog-auf-deutsch-schreiben.md?raw';
import postsParaRedesSociaisEmPortugues from './posts-para-redes-sociais-em-portugues.md?raw';
import scrivereUnBlogInItaliano from './scrivere-un-blog-in-italiano.md?raw';
import professioneleEmailsSchrijven from './professionele-e-mails-schrijven.md?raw';
import kakPisatBlogNaRusskom from './kak-pisat-blog-na-russkom.md?raw';
import hindiMeinSocialMediaContent from './hindi-mein-social-media-content.md?raw';
import xieZhongwenGuanggaoWenan from './xie-zhongwen-guanggao-wenan.md?raw';
import bijinesuMeiruNoKakikata from './bijinesu-meiru-no-kakikata.md?raw';
import koreanSocialMediaContent from './korean-social-media-content.md?raw';
import bengaliBlogWriting from './bengali-blog-writing.md?raw';
import turkishProfessionalEmails from './turkish-professional-emails.md?raw';
import indonesianBlogWriting from './indonesian-blog-writing.md?raw';
import persianSocialMediaContent from './persian-social-media-content.md?raw';
import swahiliAdCopy from './swahili-ad-copy.md?raw';
import lahoriRomanUrduSocialPosts from './lahori-roman-urdu-social-posts.md?raw';

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

const SOURCES = [romanUrduBlogWriter, freeAiEmailGenerator, urduContentGenerator, aiContentSeo, aiContentUrdu, aiBlogWriterRomanUrdu, writeBlogFromPhoto, bolKarContentLikhein, urduProfessionalEmail, formalBritishEnglishEmails, arabicBlogWriting, gulfArabicSocialCaptions, blogEnEspanolLatinoamericano, anunciosEnEspanolDeEspana, emailsProfessionnelsEnFrancais, blogAufDeutschSchreiben, postsParaRedesSociaisEmPortugues, scrivereUnBlogInItaliano, professioneleEmailsSchrijven, kakPisatBlogNaRusskom, hindiMeinSocialMediaContent, xieZhongwenGuanggaoWenan, bijinesuMeiruNoKakikata, koreanSocialMediaContent, bengaliBlogWriting, turkishProfessionalEmails, indonesianBlogWriting, persianSocialMediaContent, swahiliAdCopy, lahoriRomanUrduSocialPosts];

export const POSTS = SOURCES.map(parsePost).sort(
  (a, b) => new Date(b.date) - new Date(a.date)
);

export const getPostBySlug = (slug) => POSTS.find((post) => post.slug === slug);

// Rough reading time at 200 words/minute, minimum 1 minute.
export const readingTime = (body) => Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
