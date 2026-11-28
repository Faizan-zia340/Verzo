import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import { apiUrl } from '../services/apiUrl.js';
import toast from 'react-hot-toast';
import FontPicker from './FontPicker.jsx';
import { scriptOf, googleFontsUrl, useContentFont } from '../utils/fonts.js';
import {
  FiZap, FiCopy, FiDownload, FiCheck, FiHome, FiSmartphone, FiMail,
  FiAlertCircle, FiRefreshCw, FiSliders, FiFileText, FiShare2, FiImage,
  FiMic, FiX, FiBriefcase, FiDatabase,
  FiVolume2, FiPlay, FiPause, FiSquare,
} from 'react-icons/fi';
import { FaXTwitter, FaLinkedinIn, FaFacebookF } from 'react-icons/fa6';

const TYPES = [
  { value: 'blog', label: 'Blog' },
  { value: 'social', label: 'Social' },
  { value: 'email', label: 'Email' },
  { value: 'ad', label: 'Ad' },
  { value: 'product', label: 'Product' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'resume_summary', label: 'Resume Summary' },
  { value: 'linkedin', label: 'LinkedIn' },
];
const TONES = ['professional', 'casual', 'formal', 'friendly', 'persuasive', 'urgent', 'empathetic'];
const READING_LEVELS = ['simple', 'standard', 'professional'];
// Purpose sub-types per content type — mirrors server/config/contentTypes.js.
// The server is the authority (validators.js enforces the required fields);
// this copy only drives the dropdown and the dynamic required-fields UI.
const PURPOSES = {
  blog: [
    { value: 'how-to', label: 'How-to' },
    { value: 'listicle', label: 'Listicle' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'case-study', label: 'Case study' },
    { value: 'seo-article', label: 'SEO article' },
  ],
  social: [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'x-twitter', label: 'X / Twitter' },
    { value: 'instagram-caption', label: 'Instagram caption' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'whatsapp-broadcast', label: 'WhatsApp broadcast' },
  ],
  email: [
    { value: 'cold-outreach', label: 'Cold outreach' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'job-posting', label: 'Job posting' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'apology', label: 'Apology' },
    { value: 'payment-reminder', label: 'Payment reminder' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'thank-you', label: 'Thank-you' },
    { value: 'meeting-request', label: 'Meeting request' },
  ],
  ad: [
    { value: 'google-search', label: 'Google search ad' },
    { value: 'facebook-instagram', label: 'Facebook / Instagram ad' },
    { value: 'product-launch', label: 'Product launch' },
  ],
  product: [
    { value: 'ecommerce-description', label: 'E-commerce description' },
    { value: 'app-store-description', label: 'App store description' },
    { value: 'feature-announcement', label: 'Feature announcement' },
  ],
};
// Required fields per purpose — same keys/labels as the server config.
// Only the fields that differ from the per-type defaults are listed here;
// a purpose not listed falls back to REQUIRED_FIELDS for its type.
const PURPOSE_FIELDS = {
  'cold-outreach': ['company', 'senderName', 'audience', 'applyLink', 'contact'],
  'follow-up': ['company', 'senderName', 'contact'],
  'job-posting': ['company', 'role', 'location', 'senderName', 'applyLink', 'contact'],
  complaint: ['company', 'senderName', 'topic', 'contact'],
  apology: ['company', 'senderName', 'topic'],
  'payment-reminder': ['company', 'senderName', 'deadline', 'contact'],
  newsletter: ['topic', 'audience', 'senderName'],
  announcement: ['topic', 'audience', 'company'],
  'thank-you': ['senderName', 'recipient', 'topic'],
  'meeting-request': ['senderName', 'recipient', 'topic', 'contact'],
  'how-to': ['topic', 'audience'],
  listicle: ['topic', 'audience'],
  opinion: ['topic', 'audience'],
  'case-study': ['topic', 'audience', 'company'],
  'seo-article': ['topic', 'audience'],
  linkedin: ['topic', 'audience'],
  'x-twitter': ['topic', 'audience'],
  'instagram-caption': ['topic', 'audience', 'product'],
  facebook: ['topic', 'audience'],
  'whatsapp-broadcast': ['topic', 'audience', 'contact'],
  'google-search': ['product', 'audience', 'cta'],
  'facebook-instagram': ['product', 'audience', 'cta'],
  'product-launch': ['product', 'audience', 'cta'],
  'ecommerce-description': ['product', 'audience'],
  'app-store-description': ['product', 'audience'],
  'feature-announcement': ['product', 'audience'],
};
// Email categories — each gets its own structure on the server.
const EMAIL_SUBTYPES = [
  { value: 'general', label: 'General Email' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'apology', label: 'Apology' },
  { value: 'job_application', label: 'Job Application' },
  { value: 'thank_you', label: 'Thank-you' },
  { value: 'meeting_request', label: 'Meeting Request' },
];
const SOCIAL_SUBTYPES = [
  { value: 'post', label: 'Post' },
  { value: 'captions', label: 'Captions (3 options)' },
];
// Speech-recognition locale per output language (Web Speech API).
const SPEECH_LANG = {
  english_us: 'en-US', english_uk: 'en-GB',
  roman_urdu_karachi: 'ur-PK', roman_urdu_lahore: 'ur-PK',
  arabic_msa: 'ar-SA', arabic_gulf: 'ar-AE',
  spanish_latam: 'es-MX', spanish_spain: 'es-ES',
  french: 'fr-FR', german: 'de-DE', portuguese_brazil: 'pt-BR',
  italian: 'it-IT', dutch: 'nl-NL', russian: 'ru-RU', hindi: 'hi-IN',
  chinese_simplified: 'zh-CN', japanese: 'ja-JP', korean: 'ko-KR',
  bengali: 'bn-BD', turkish: 'tr-TR', indonesian: 'id-ID',
  persian: 'fa-IR', swahili: 'sw-KE',
};
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SITE_URL = 'https://verzo-ecru.vercel.app';
// Gender is shown only when the voice name states it plainly.
const voiceGender = (name) => (/female/i.test(name) ? 'Female' : /male/i.test(name) ? 'Male' : '');
const LENGTHS = ['short', 'medium', 'long'];
const FORMATS = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'bullets', label: 'Bullet Points' },
  { value: 'headings', label: 'Headings' },
];
const LANGUAGES = [
  { group: 'English', options: [
    { value: 'english_us', label: '🇺🇸 English (US)' },
    { value: 'english_uk', label: '🇬🇧 English (UK)' },
  ]},
  { group: 'Urdu', options: [
    { value: 'roman_urdu_karachi', label: '🇵🇰 Roman Urdu (Karachi)' },
    { value: 'roman_urdu_lahore', label: '🇵🇰 Roman Urdu (Lahore)' },
  ]},
  { group: 'Arabic', options: [
    { value: 'arabic_msa', label: '🌍 Arabic (Modern Standard)' },
    { value: 'arabic_gulf', label: '🇦🇪 Arabic (Gulf)' },
  ]},
  { group: 'European', options: [
    { value: 'spanish_latam', label: '🇲🇽 Spanish (Latin America)' },
    { value: 'spanish_spain', label: '🇪🇸 Spanish (Spain)' },
    { value: 'french', label: '🇫🇷 French' },
    { value: 'german', label: '🇩🇪 German' },
    { value: 'portuguese_brazil', label: '🇧🇷 Portuguese (Brazil)' },
    { value: 'italian', label: '🇮🇹 Italian' },
    { value: 'dutch', label: '🇳🇱 Dutch' },
    { value: 'russian', label: '🇷🇺 Russian' },
  ]},
  { group: 'Asian', options: [
    { value: 'hindi', label: '🇮🇳 Hindi' },
    { value: 'chinese_simplified', label: '🇨🇳 Chinese (Simplified)' },
    { value: 'japanese', label: '🇯🇵 Japanese' },
    { value: 'korean', label: '🇰🇷 Korean' },
    { value: 'bengali', label: '🇧🇩 Bengali' },
    { value: 'turkish', label: '🇹🇷 Turkish' },
    { value: 'indonesian', label: '🇮🇩 Indonesian' },
    { value: 'persian', label: '🇮🇷 Persian (Farsi)' },
  ]},
  { group: 'Other', options: [
    { value: 'swahili', label: '🌍 Swahili' },
  ]},
];

const TEMPLATES = [
  {
    Icon: FiHome,
    label: 'Real Estate Blog',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-ink-raised',
    form: {
      type: 'blog', tone: 'professional', length: 'medium', language: 'english_us', format: 'headings',
      prompt: 'Write a compelling blog post about why 2026 is the best year to invest in real estate. Include 3 bullet points on market trends, mention rising demand in suburban areas, and end with a strong call to action encouraging first-time investors to act now.',
      topic: 'Real estate investing in 2026', audience: 'First-time investors',
    },
  },
  {
    Icon: FiSmartphone,
    label: 'Social Media Post',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-ink-raised',
    form: {
      type: 'social', tone: 'friendly', length: 'short', language: 'english_us', format: 'paragraphs',
      prompt: 'Create a high-engagement Instagram caption for a motivational business post. Use 2-3 relevant emojis, write a hook in the first line, and end with a question to drive comments. Target audience: entrepreneurs aged 25-40.',
      topic: 'Motivational business post', audience: 'Entrepreneurs aged 25-40',
    },
  },
  {
    Icon: FiMail,
    label: 'Cold Email',
    color: 'text-teak-600 dark:text-teak-400',
    bg: 'bg-teak-50 dark:bg-ink-raised',
    form: {
      type: 'email', subtype: 'cold_outreach', tone: 'professional', length: 'short', language: 'english_us', format: 'paragraphs',
      prompt: 'Write a cold outreach email to a potential B2B SaaS client. Include a personalized opener, state the value proposition in 2 sentences, and close with a soft CTA to schedule a 15-minute discovery call. Keep it under 150 words.',
      purpose: 'cold-outreach',
    },
  },
  {
    Icon: FiBriefcase,
    label: 'Cover Letter',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-ink-raised',
    form: {
      type: 'cover_letter', tone: 'professional', length: 'medium', language: 'english_us', format: 'paragraphs',
      prompt: 'Write a cover letter for a frontend developer role. Highlight React and TypeScript experience and a passion for accessible, fast user interfaces.',
      company: 'Acme Corp', role: 'Frontend Developer', location: 'Toronto, ON',
      senderName: 'Faizan Zia', skills: 'React, TypeScript, accessibility, performance',
    },
  },
];

// Required detail fields per content type — mirrors REQUIRED_FIELDS in
// server/utils/validators.js. The server is the authority: it returns 400
// naming any missing field, and no AI call or credit is used. For email,
// an apply link OR a contact is enough (one of the two must be filled).
const REQUIRED_FIELDS = {
  blog: [
    { name: 'topic', label: 'Topic', placeholder: 'e.g. Why 2026 is the best year to invest in real estate' },
    { name: 'audience', label: 'Audience', placeholder: 'e.g. First-time investors' },
  ],
  social: [
    { name: 'topic', label: 'Topic', placeholder: 'e.g. Launch of our new summer collection' },
    { name: 'audience', label: 'Audience', placeholder: 'e.g. Entrepreneurs aged 25-40' },
  ],
  email: [
    { name: 'company', label: 'Company', placeholder: 'e.g. Acme Corp' },
    { name: 'role', label: 'Role', placeholder: 'e.g. Software Engineer' },
    { name: 'location', label: 'Location', placeholder: 'e.g. Toronto, ON' },
    { name: 'senderName', label: 'Sender name', placeholder: 'e.g. Faizan Zia' },
    { name: 'applyLink', label: 'Apply link', placeholder: 'e.g. https://company.com/careers/123' },
    { name: 'contact', label: 'Contact (if no apply link)', placeholder: 'e.g. careers@company.com' },
  ],
  ad: [
    { name: 'product', label: 'Product', placeholder: 'e.g. Noise-cancelling headphones' },
    { name: 'audience', label: 'Audience', placeholder: 'e.g. Remote workers' },
    { name: 'cta', label: 'Call to action (CTA)', placeholder: 'e.g. Shop now and save 20%' },
  ],
  product: [
    { name: 'product', label: 'Product', placeholder: 'e.g. Noise-cancelling headphones' },
    { name: 'audience', label: 'Audience', placeholder: 'e.g. Remote workers' },
  ],
  cover_letter: [
    { name: 'company', label: 'Company', placeholder: 'e.g. Acme Corp' },
    { name: 'role', label: 'Role (job title)', placeholder: 'e.g. Frontend Developer' },
    { name: 'location', label: 'Location', placeholder: 'e.g. Toronto, ON' },
    { name: 'senderName', label: 'Sender name', placeholder: 'e.g. Faizan Zia' },
    { name: 'skills', label: 'Key skills', placeholder: 'e.g. React, TypeScript, accessibility' },
  ],
  resume_summary: [
    { name: 'role', label: 'Role (job title)', placeholder: 'e.g. Frontend Developer' },
    { name: 'skills', label: 'Key skills', placeholder: 'e.g. React, TypeScript, accessibility' },
  ],
  linkedin: [
    { name: 'topic', label: 'Topic', placeholder: 'e.g. Lessons from launching my first product' },
    { name: 'audience', label: 'Audience', placeholder: 'e.g. Founders and product managers' },
  ],
};
// Extra detail fields used by some purposes (recipient, deadline).
const EXTRA_FIELDS = {
  recipient: { name: 'recipient', label: 'Recipient', placeholder: 'e.g. Sara Ahmed' },
  deadline: { name: 'deadline', label: 'Deadline', placeholder: 'e.g. 30 November 2026' },
};
// All detail fields by name, for the dynamic purpose field list.
const ALL_DETAIL_FIELDS = {
  ...Object.fromEntries(Object.values(REQUIRED_FIELDS).flat().map((f) => [f.name, f])),
  ...EXTRA_FIELDS,
};
// Required fields for the selected type + purpose. A purpose overrides the
// per-type list; with no purpose selected the per-type list is used.
const fieldsForForm = (form) => {
  if (form.purpose && PURPOSE_FIELDS[form.purpose]) {
    return PURPOSE_FIELDS[form.purpose].map((name) => ALL_DETAIL_FIELDS[name]).filter(Boolean);
  }
  return REQUIRED_FIELDS[form.type] || [];
};

const DETAILS_DEFAULTS = {
  topic: '', audience: '', company: '', role: '', location: '',
  senderName: '', applyLink: '', contact: '', product: '', cta: '',
  recipient: '', deadline: '', purpose: '', readingLevel: 'standard', writingSample: '', skills: '',
};

// Returns { missing: [labels], errors: { fieldName: message } } for the
// required fields of the selected type + purpose that are still blank.
const validateDetails = (form) => {
  const fields = fieldsForForm(form);
  const errors = {};
  const missing = [];
  const isBlank = (name) => !form[name] || !form[name].trim();
  for (const field of fields) {
    if (field.name === 'applyLink' || field.name === 'contact') continue; // handled as a pair below
    if (isBlank(field.name)) {
      errors[field.name] = `${field.label} is required.`;
      missing.push(field.label);
    }
  }
  const needsLinkOrContact = fields.some((f) => f.name === 'applyLink' || f.name === 'contact');
  if (needsLinkOrContact && isBlank('applyLink') && isBlank('contact')) {
    errors.applyLink = 'An apply link or a contact is required.';
    missing.push('Apply link or contact');
  }
  return { missing, errors };
};

const TUNE_ACTIONS = [
  { key: 'shorten', label: '↓ Shorten' },
  { key: 'engaging', label: '⚡ More Engaging' },
  { key: 'professional', label: '✦ Professional' },
  { key: 'reduce_hype', label: '🎯 Reduce Hype' },
];

const selectClass = 'w-full border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500';

const stripMarkers = (text) => text.replace(/\[IMAGE:\d+\]/g, '').replace(/\n{3,}/g, '\n\n').trim();

const hasInlineImages = (text) => /\[IMAGE:\d+\]/.test(text);

export default function Generator() {
  const { deductCredit, credits } = useCredits();
  const [form, setForm] = useState({ type: 'blog', subtype: '', prompt: '', tone: 'professional', length: 'medium', language: 'english_us', format: 'paragraphs', ...DETAILS_DEFAULTS });
  const [output, setOutput] = useState('');
  const [seoData, setSeoData] = useState(null);
  const [images, setImages] = useState([]);
  const [imageOptions, setImageOptions] = useState([]);
  const [displayImages, setDisplayImages] = useState([]);
  const [contentId, setContentId] = useState(null);
  const [realityCheck, setRealityCheck] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [tuning, setTuning] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showImages, setShowImages] = useState(false);
  // RAG: answer from the admin's saved context documents instead of the
  // general templates. 1 credit, same as a normal generation.
  const [useRag, setUseRag] = useState(false);
  const [ragKeywords, setRagKeywords] = useState('');
  // Voice input (Web Speech API) + image upload state
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  // PDF attach: pages are rendered to images in the browser (pdf.js, loaded
  // only when a PDF is attached) and the picked page becomes the image.
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPages, setPdfPages] = useState([]); // [{ n, thumb, file }]
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  // Listen (text-to-speech): reads the output aloud with device voices.
  const [ttsSupported, setTtsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [ttsState, setTtsState] = useState('idle'); // idle | playing | paused
  const [ttsRate, setTtsRate] = useState(1);
  const [ttsVoice, setTtsVoice] = useState('');

  useEffect(() => {
    setVoiceSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Images actually shown (picker swaps update displayImages; images[] is the
  // original embedded set). Downloads and rendering use shownImages.
  const shownImages = displayImages.length ? displayImages : images;

  // Content font for the selected language's script (persisted per script).
  const script = scriptOf(form.language);
  const { font, setFont, stack, dir, lineHeight } = useContentFont(script);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Switching type resets the purpose and subtype (both belong to one type).
    setForm((prev) => (name === 'type' ? { ...prev, type: value, purpose: '', subtype: '' } : { ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // ── Voice input ─────────────────────────────────────────────
  // Browser-native speech recognition (Chrome/Edge). Transcribed words are
  // appended to the prompt — no audio is sent to any server.
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    if (listening) { stopVoice(); return; }
    const rec = new SR();
    rec.lang = SPEECH_LANG[form.language] || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let finalTxt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTxt += e.results[i][0].transcript;
      }
      if (finalTxt.trim()) {
        setForm((prev) => ({ ...prev, prompt: (prev.prompt ? `${prev.prompt} ` : '') + finalTxt.trim() }));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        toast.error('Voice input failed. Please try again.');
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      toast.error('Voice input could not start. Please try again.');
    }
  };
  const stopVoice = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  // ── Listen (text-to-speech) ───────────────────────────────────
  // Free system voices from the browser/device (Web Speech API).
  // Urdu voices first, then voices matching the output language.
  const langTag = SPEECH_LANG[form.language] || 'en-US';
  const voiceRank = (v) => (v.lang === langTag ? 0 : v.lang?.startsWith(langTag.slice(0, 2)) ? 1 : v.lang?.startsWith('ur') ? 2 : 3);
  const sortedVoices = [...voices].sort((a, b) => voiceRank(a) - voiceRank(b));
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    setTtsSupported(true);
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('voiceschanged', load);
    };
  }, []);
  const stopListen = () => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setTtsState('idle');
  };
  const speak = (rate = ttsRate) => {
    if (!ttsSupported || !output) return;
    const synth = window.speechSynthesis;
    if (ttsState === 'paused') { synth.resume(); setTtsState('playing'); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(stripMarkers(output));
    u.lang = langTag;
    u.rate = rate;
    const v = voices.find((x) => x.voiceURI === ttsVoice) || sortedVoices[0];
    if (v) u.voice = v;
    u.onend = () => setTtsState('idle');
    // 'canceled' fires when we stop/restart — not a real failure.
    u.onerror = (e) => { if (e.error !== 'canceled' && e.error !== 'interrupted') setTtsState('idle'); };
    synth.speak(u);
    setTtsState('playing');
  };
  const pauseListen = () => { window.speechSynthesis.pause(); setTtsState('paused'); };
  const changeRate = (r) => { setTtsRate(r); if (ttsState === 'playing') speak(r); };

  // ── Image upload (context for the generation) ───────────────
  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      toast.error('Use a JPG, PNG or WebP image.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Maximum is 5 MB.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setPdfFile(null); setPdfPages([]); setPdfPageCount(0); // a direct image replaces any PDF
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };
  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview('');
  };

  // ── PDF attach — pages become images ──────────────────────────
  // Renders the first 10 pages to JPEGs (pdf.js, dynamically imported so
  // the main bundle stays small). The picked page is sent as the image
  // through the existing with-image flow — no server change needed.
  const MAX_PDF_PAGES = 10;
  const handlePdfSelect = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Use a PDF file.'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('PDF is too large. Maximum is 10 MB.'); return; }
    setPdfLoading(true);
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
      const pdf = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const pages = [];
      for (let n = 1; n <= Math.min(pdf.numPages, MAX_PDF_PAGES); n++) {
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
        pages.push({ n, thumb: canvas.toDataURL('image/jpeg', 0.7), file: new File([blob], `${f.name.replace(/\.pdf$/i, '')}-p${n}.jpg`, { type: 'image/jpeg' }) });
      }
      setPdfFile(f); setPdfPages(pages); setPdfPageCount(pdf.numPages);
      setImageFile(pages[0].file); setImagePreview(pages[0].thumb); // page 1 by default
      if (pdf.numPages > MAX_PDF_PAGES) toast(`Showing the first ${MAX_PDF_PAGES} of ${pdf.numPages} pages — pick one.`);
    } catch {
      toast.error('Could not read this PDF. Try another file.');
    }
    setPdfLoading(false);
  };
  const clearPdf = () => { setPdfFile(null); setPdfPages([]); setPdfPageCount(0); clearImage(); };

  // ── Blog image picker ───────────────────────────────────────
  const handlePickImage = async (slot, optionIndex) => {
    const prev = shownImages;
    const next = prev.map((img, i) => (i === slot ? imageOptions[optionIndex] : img));
    setDisplayImages(next);
    if (!contentId) return;
    try {
      const res = await fetch(apiUrl(`/api/history/${contentId}/images`), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, optionIndex }),
      });
      if (!res.ok) {
        setDisplayImages(prev);
        toast.error('Could not save the new image. Please try again.');
      }
    } catch {
      setDisplayImages(prev);
      toast.error('Could not save the new image. Please try again.');
    }
  };

  const applyTemplate = (tpl) => {
    stopListen();
    setForm({ ...DETAILS_DEFAULTS, subtype: '', ...tpl.form });
    setOutput(''); setSeoData(null); setImages([]); setImageOptions([]); setDisplayImages([]); setContentId(null); setError('');
    setQualityReport(null); setFieldErrors({});
    toast('Template applied', { icon: '📋' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side required-field check: block before any AI call or credit use.
    // With an image attached the photo is the topic, so no prompt and no
    // details are needed — the server supplies neutral defaults.
    // RAG is free-form Q&A, so it only needs the prompt, not the type details.
    if (!imageFile && !useRag) {
      const { missing, errors } = validateDetails(form);
      if (missing.length) {
        setFieldErrors(errors);
        toast.error(`Missing required fields: ${missing.join(', ')}`);
        return;
      }
    }
    setFieldErrors({});
    if (credits !== null && credits < 1) {
      toast.error('Not enough credits. Please buy more.');
      return;
    }
    stopListen();
    setLoading(true); setFetchingImages(false); setError(''); setOutput(''); setSeoData(null); setImages([]); setImageOptions([]); setDisplayImages([]); setContentId(null); setRealityCheck(null); setQualityReport(null);

    // RAG generation: POST /api/generate/rag with the prompt (and optional
    // topic keywords for the keyword fallback). Exactly 1 credit, and the
    // server saves the answer to History (type 'rag').
    if (useRag) {
      const ragToast = toast.loading('Generating with your saved knowledge...');
      try {
        const topicKeywords = ragKeywords.split(',').map((k) => k.trim()).filter(Boolean);
        const response = await fetch(apiUrl('/api/generate/rag'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userPrompt: form.prompt, topicKeywords }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data.message || 'RAG generation failed. Please try again.';
          setError(msg);
          toast.error(msg, { id: ragToast });
          setLoading(false);
          return;
        }
        setOutput(data.response || '');
        setContentId(data.contentId || null);
        setRealityCheck(data.realityCheck || null);
        setQualityReport(data.qualityReport || null);
        deductCredit(1);
        setLoading(false);
        toast.success(data.contextUsed ? '1 credit used — answered from your saved knowledge!' : '1 credit used — content ready!', { id: ragToast });
      } catch {
        const msg = 'Network error. Please check your connection.';
        setError(msg);
        toast.error(msg, { id: ragToast });
        setLoading(false);
      }
      return;
    }

    // With an uploaded image the request goes to /with-image as multipart
    // form data (non-streaming, still exactly 1 credit).
    if (imageFile) {
      const genToast = toast.loading('Generating content from your image...');
      try {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
        fd.append('image', imageFile);
        const response = await fetch(apiUrl('/api/generate/with-image'), {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data.message || 'Generation failed. Please try again.';
          setError(msg);
          toast.error(msg, { id: genToast });
          setLoading(false);
          return;
        }
        setOutput(data.content?.output || '');
        setSeoData(data.content?.seoData || null);
        setImages(data.content?.images || []);
        setImageOptions(data.content?.imageOptions || []);
        setDisplayImages(data.content?.images || []);
        setContentId(data.content?._id || null);
        setRealityCheck(data.realityCheck || null);
        setQualityReport(data.qualityReport || null);
        deductCredit(1);
        setLoading(false);
        toast.success('1 credit used — content ready!', { id: genToast });
      } catch {
        const msg = 'Network error. Please check your connection.';
        setError(msg);
        toast.error(msg, { id: genToast });
        setLoading(false);
      }
      return;
    }

    const genToast = toast.loading('Generating content...');
    try {
      const response = await fetch(apiUrl('/api/generate/stream'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.message || 'Generation failed. Please try again.';
        setError(msg);
        toast.error(msg, { id: genToast });
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finished = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.token) {
              setOutput((prev) => prev + parsed.token);
            } else if (parsed.status) {
              setFetchingImages(true);
              toast.loading(parsed.status, { id: genToast });
            } else if (parsed.done) {
              setSeoData(parsed.seoData || null);
              setImages(parsed.images || []);
              setImageOptions(parsed.imageOptions || []);
              setDisplayImages(parsed.images || []);
              setContentId(parsed.contentId || null);
              setRealityCheck(parsed.realityCheck || null);
              setQualityReport(parsed.qualityReport || null);
              if (parsed.contentWithImages) setOutput(parsed.contentWithImages);
              setFetchingImages(false);
              deductCredit(1);
              finished = true;
              setLoading(false);
              toast.success('1 credit used — content ready!', { id: genToast });
            } else if (parsed.error) {
              setError(parsed.error);
              toast.error(parsed.error, { id: genToast });
              finished = true;
              setLoading(false);
              setFetchingImages(false);
            }
          } catch {}
        }
      }
      if (!finished) {
        setLoading(false);
        setFetchingImages(false);
        toast.dismiss(genToast);
      }
    } catch {
      const msg = 'Network error. Please check your connection.';
      setError(msg);
      toast.error(msg, { id: genToast });
      setLoading(false);
      setFetchingImages(false);
    }
  };

  const handleTune = async (action) => {
    if (!output || tuning || loading) return;
    stopListen();
    // A tune costs 1 credit (reserved server-side by /tune) — same as a
    // generation. Never tune on an empty balance.
    if (credits !== null && credits < 1) {
      toast.error('Not enough credits. Please buy more.');
      return;
    }
    setTuning(action);
    setError('');
    const tuneToast = toast.loading('Rewriting...');
    try {
      const res = await fetch(apiUrl('/api/generate/tune'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stripMarkers(output), action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Tune failed', { id: tuneToast }); return; }
      setOutput(data.output);
      setImages([]);
      setImageOptions([]);
      setDisplayImages([]);
      setSeoData(null);
      setRealityCheck(data.realityCheck || null);
      setQualityReport(null); // tuned text has not been quality-checked
      deductCredit(1);
      // Save the tuned version to History: update the existing entry so
      // History shows the tuned text, not the original un-tuned version.
      // contentId is deliberately kept — clearing it orphaned the entry.
      if (contentId) {
        try {
          const saveRes = await fetch(apiUrl(`/api/history/${contentId}`), {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ output: data.output }),
          });
          if (!saveRes.ok) toast.error('Refined, but the tuned version could not be saved to History.');
        } catch {
          toast.error('Refined, but the tuned version could not be saved to History.');
        }
      }
      toast.success('Content refined! 1 credit used.', { id: tuneToast });
    } catch {
      toast.error('Tune request failed.', { id: tuneToast });
    } finally {
      setTuning('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(stripMarkers(output));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([stripMarkers(output)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${form.type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded as TXT', { icon: '📄' });
  };

  // Export body: generated text with inline images, as HTML.
  const exportBodyHtml = () => {
    if (shownImages.length && hasInlineImages(output)) {
      let body = '';
      for (const part of output.split(/(\[IMAGE:\d+\])/)) {
        const match = part.match(/\[IMAGE:(\d+)\]/);
        if (match) {
          const img = shownImages[parseInt(match[1])];
          if (img?.dataUrl) {
            body += `<div style="margin:14px 0;page-break-inside:avoid;">`;
            body += `<img src="${img.dataUrl}" style="max-width:100%;border-radius:4px;" alt="${img.alt || ''}"/>`;
            body += `<p style="font-size:8pt;color:#999;margin:3px 0;">${img.credit || ''}</p>`;
            if (img.extractedText) body += `<p style="font-size:8pt;color:#666;font-style:italic;">Text in image (EN): "${img.extractedText}"</p>`;
            body += `</div>`;
          }
        } else {
          body += `<span>${part.replace(/\n/g, '<br/>')}</span>`;
        }
      }
      return body;
    }
    return stripMarkers(output).replace(/\n/g, '<br/>');
  };

  // Full export document in the chosen content font, with the right text
  // direction. Shared by the PDF (print) and DOCX downloads.
  const exportDocHtml = () => {
    const fontLink = font ? `<link rel="stylesheet" href="${googleFontsUrl(font)}">` : '';
    const seoLine = seoData?.title ? `<hr/><p style="color:#8b6f47;"><b>SEO:</b> ${seoData.title}</p>` : '';
    return `<html><head><meta charset="utf-8">${fontLink}<style>body{font-family:${stack};font-size:11pt;line-height:${lineHeight || 1.6};margin:2cm;} h1{color:#8b6f47;} p{margin:0.5em 0;}</style></head><body dir="${dir}"><h1>${form.type.toUpperCase()} Content</h1><p><b>Prompt:</b> ${form.prompt}</p><hr/>${exportBodyHtml()}${seoLine}</body></html>`;
  };

  // jsPDF's built-in fonts are Latin-only and it cannot shape Arabic-script
  // or Indic text, so a PDF made that way renders Urdu/Hindi as broken
  // glyphs. The browser's print-to-PDF shapes the text properly and honours
  // the chosen webfont — the user picks "Save as PDF" in the print dialog.
  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups to export a PDF.'); return; }
    win.document.write(exportDocHtml());
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
    toast('Choose "Save as PDF" in the print dialog', { icon: '🖨️' });
  };

  const handleDownloadDocx = () => {
    const blob = new Blob([exportDocHtml()], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${form.type}-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as DOCX with images!');
  };

  // LinkedIn's dialog takes a link, not text — open it with the site link
  // and copy the output so the user can paste it into the post.
  const handleShareLinkedIn = () => {
    navigator.clipboard.writeText(stripMarkers(output));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?mini=true&url=${encodeURIComponent(SITE_URL)}`, '_blank');
    toast('Text copied — paste it into your LinkedIn post');
  };

  const handleShareGmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent('Content generated with Penlix')}&body=${encodeURIComponent(stripMarkers(output))}`;
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`, '_blank');
  };

  const handleNativeShare = async () => {
    const text = stripMarkers(output);
    if (navigator.share) {
      try { await navigator.share({ text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard — share it anywhere!');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(stripMarkers(output).slice(0, 260) + '...');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  // Render content with inline [IMAGE:N] markers replaced by actual images
  const renderContent = () => {
    if (!output) return null;
    if (!shownImages.length || !hasInlineImages(output)) {
      return (
        <span className="whitespace-pre-wrap">{output}</span>
      );
    }

    const parts = output.split(/(\[IMAGE:\d+\])/);
    return (
      <>
        {parts.map((part, i) => {
          const match = part.match(/\[IMAGE:(\d+)\]/);
          if (match) {
            const img = shownImages[parseInt(match[1])];
            if (!img) return null;
            return (
              <div key={i} className="my-5 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm">
                <img
                  src={img.dataUrl || img.url}
                  alt={img.alt}
                  className="w-full object-cover max-h-72"
                  loading="lazy"
                />
                <div className="bg-gray-50 dark:bg-ink-page px-3 py-2 space-y-0.5">
                  {img.extractedText && (
                    <p className="text-xs text-gray-600 dark:text-slate-400 italic">
                      📝 <span className="font-medium">Text in image (EN):</span> "{img.extractedText}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    📷{' '}
                    <a href={img.creditUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-gray-600 dark:hover:text-slate-400 transition">
                      {img.credit}
                    </a>
                  </p>
                </div>
              </div>
            );
          }
          return part ? <span key={i} className="whitespace-pre-wrap">{part}</span> : null;
        })}
      </>
    );
  };

  const isRateLimit = error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('penlix is busy');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
      {/* Quick Templates */}
      <div className="lg:col-span-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Quick Templates</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TEMPLATES.map(({ Icon, label, color, bg, form: tplForm }) => (
            <motion.button
              key={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => applyTemplate({ form: tplForm })}
              className="bg-white dark:bg-ink-card border border-gray-200 dark:border-slate-800 rounded-xl p-4 text-left hover:border-teak-300 hover:shadow-md transition flex items-start gap-3 min-w-0"
            >
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={16} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Quick template</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Generator Form — sticky studio panel on desktop */}
      <div className="lg:col-span-2 bg-white dark:bg-ink-card rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Generate Content</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Type, Tone, Length, Format — 2 columns: the form panel is
              narrow, 4 across truncated the values ("Profi", "Med", "Para"). */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'type', label: 'Type', options: TYPES },
              { name: 'tone', label: 'Tone', options: TONES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
              { name: 'length', label: 'Length', options: LENGTHS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })) },
              { name: 'format', label: 'Format', options: FORMATS },
            ].map(({ name, label, options }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">{label}</label>
                <select name={name} value={form[name]} onChange={handleChange} className={selectClass}>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Purpose + Reading level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Purpose <span className="text-gray-400 dark:text-slate-500 font-normal">(optional — sets the structure and required details)</span></label>
              <select name="purpose" value={form.purpose || ''} onChange={handleChange} className={selectClass}>
                <option value="">General {form.type}</option>
                {(PURPOSES[form.type] || []).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Reading level</label>
              <select name="readingLevel" value={form.readingLevel || 'standard'} onChange={handleChange} className={selectClass}>
                {READING_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Writing sample — voice matching (optional, max 1500 chars) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Writing sample <span className="text-gray-400 dark:text-slate-500 font-normal">(optional — the AI matches its voice, never copies its content)</span></label>
            <textarea
              name="writingSample" value={form.writingSample || ''} onChange={handleChange} rows={2} maxLength={1500}
              placeholder="Paste a paragraph you wrote, in your own voice..."
              className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500 resize-none placeholder-gray-400 dark:placeholder-slate-500"
            />
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">{(form.writingSample || '').length} / 1500 characters</div>
          </div>

          {/* Row 2: Language (grouped) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Language & Dialect <span className="text-gray-400 dark:text-slate-500 font-normal">(23 options)</span></label>
            <select name="language" value={form.language} onChange={handleChange} className={selectClass}>
              {LANGUAGES.map(({ group, options }) => (
                <optgroup key={group} label={group}>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Category / style — email categories and social captions */}
          {form.type === 'email' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Email Category</label>
              <select name="subtype" value={form.subtype || 'general'} onChange={handleChange} className={selectClass}>
                {EMAIL_SUBTYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          {form.type === 'social' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Social Style</label>
              <select name="subtype" value={form.subtype || 'post'} onChange={handleChange} className={selectClass}>
                {SOCIAL_SUBTYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          {/* Prompt — image attach + voice input live INSIDE the box (ChatGPT-style) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Prompt</label>
            <div className="border border-gray-200 dark:border-slate-800 rounded-lg bg-white dark:bg-ink-card focus-within:ring-2 focus-within:ring-teak-500 focus-within:border-teak-500">
              {imagePreview && (
                <div className="flex items-center gap-2 px-3 pt-2.5">
                  <img src={imagePreview} alt="Upload preview" className="w-14 h-10 object-cover rounded-md border border-gray-200 dark:border-slate-800" />
                  <span className="text-xs text-gray-600 dark:text-slate-400 truncate flex-1">{imageFile?.name}</span>
                  <button type="button" onClick={clearImage} className="text-red-600 dark:text-red-400 hover:text-red-800 flex-shrink-0" title="Remove image">
                    <FiX size={14} />
                  </button>
                </div>
              )}
              <textarea
                name="prompt" value={form.prompt} onChange={handleChange} rows={4} required={!imageFile}
                placeholder="Describe what you want to generate, or pick a quick template above... (or tap Speak and say it — with a photo attached, you can leave this blank)"
                className="w-full px-3 py-2.5 text-sm text-gray-800 dark:text-slate-100 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none placeholder-gray-400 dark:placeholder-slate-500"
              />
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1">
                  <label title="JPG, PNG or WebP, max 5 MB" className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-ink-raised transition">
                    <FiImage size={14} /> {imagePreview && !pdfFile ? 'Change image' : 'Add image'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                  </label>
                  <label title="PDF, max 10 MB — its pages become images, pick one" className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium cursor-pointer text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-ink-raised transition">
                    <FiFileText size={14} /> {pdfFile ? 'Change PDF' : 'Add PDF'}
                    <input type="file" accept="application/pdf" onChange={handlePdfSelect} className="hidden" />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={startVoice}
                  disabled={loading}
                  title={voiceSupported ? (listening ? 'Tap to stop listening' : 'Tap and speak your prompt') : 'Voice input is not supported in this browser — try Chrome'}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                    listening
                      ? 'bg-red-100 dark:bg-ink-raised text-red-700 dark:text-red-300 animate-pulse'
                      : 'bg-teak-50 dark:bg-ink-raised text-teak-700 dark:text-teak-400 hover:bg-teak-100 dark:hover:bg-ink-raised'
                  } disabled:opacity-40`}
                >
                  <FiMic size={12} /> {listening ? 'Listening… tap to stop' : 'Speak'}
                </button>
              </div>
              {pdfLoading && (
                <p className="px-3 pb-2.5 text-xs text-gray-500 dark:text-slate-400">Reading PDF pages…</p>
              )}
              {pdfFile && (
                <div className="px-3 pb-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{pdfFile.name} — pick a page ({pdfPageCount} pages)</p>
                    <button type="button" onClick={clearPdf} className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 font-medium flex-shrink-0 ml-2">
                      <FiX size={12} /> Remove PDF
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pdfPages.map((p) => (
                      <button
                        key={p.n} type="button" onClick={() => { setImageFile(p.file); setImagePreview(p.thumb); }}
                        className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition ${imageFile?.name === p.file.name ? 'border-teak-500' : 'border-gray-200 dark:border-slate-700 hover:border-teak-300'}`}
                        title={`Page ${p.n}`}
                      >
                        <img src={p.thumb} alt={`PDF page ${p.n}`} className="w-14 h-[74px] object-cover" />
                        <span className="block text-center text-[10px] text-gray-500 dark:text-slate-400 py-0.5 bg-white dark:bg-ink-card">p{p.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
           <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400 dark:text-slate-500">
             <span>{form.prompt.length.toLocaleString()} characters</span>
             <span>{form.prompt.trim() ? form.prompt.trim().split(/\s+/).length.toLocaleString() : 0} words</span>
           </div>
          </div>

          {/* RAG — answer from saved knowledge (admin context documents) */}
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2.5">
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-slate-100 cursor-pointer">
              <input type="checkbox" checked={useRag} onChange={(e) => setUseRag(e.target.checked)} disabled={loading} className="accent-teak-600 h-4 w-4" />
              <FiDatabase size={14} className="text-teak-600 dark:text-teak-400" />
              <span className="font-medium">Use saved knowledge (RAG)</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-normal">— 1 credit, answers from your saved context documents</span>
            </label>
            {useRag && (
              <div className="mt-2.5">
                <input
                  value={ragKeywords} onChange={(e) => setRagKeywords(e.target.value)} disabled={loading}
                  placeholder="Topic keywords (optional, comma-separated) — helps match the right document"
                  className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500 placeholder-gray-400 dark:placeholder-slate-500"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">RAG answers your prompt directly from saved knowledge, so it skips the type details below.</p>
              </div>
            )}
          </div>

          {/* Required details for the selected type + purpose */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
              Required details <span className="text-gray-400 dark:text-slate-500 font-normal">(for {form.purpose || form.type} — no placeholders are used, so these must be real)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fieldsForForm(form).map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    name={field.name} value={form[field.name] || ''} onChange={handleChange}
                    placeholder={field.placeholder}
                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-slate-100 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 focus:border-teak-500 placeholder-gray-400 dark:placeholder-slate-500 ${fieldErrors[field.name] ? 'border-red-400' : 'border-gray-200 dark:border-slate-800'}`}
                  />
                  {fieldErrors[field.name] && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
            {fieldsForForm(form).some((f) => f.name === 'applyLink' || f.name === 'contact') && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Apply link or contact — at least one of the two is required.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
              isRateLimit ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 dark:bg-ink-raised border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            }`}>
              {isRateLimit
                ? <FiRefreshCw size={15} className="mt-0.5 flex-shrink-0 text-amber-500" />
                : <FiAlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
              }
              <div className="flex-1">
                <p className="font-semibold">{isRateLimit ? 'Rate limit — try again in a moment' : 'Generation Error'}</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}

          <motion.button
            type="submit" disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-teak-600 text-white py-3 rounded-xl font-semibold hover:bg-teak-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {loading
              ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />{fetchingImages ? 'Analyzing images...' : 'Generating...'}</>
              : <><FiZap size={15} /> Generate (1 credit)</>
            }
          </motion.button>
        </form>
      </div>

      {/* RIGHT: output studio */}
      <div className="lg:col-span-3 space-y-4 min-w-0">
        {/* Loading skeleton — shown while waiting for first token */}
        <AnimatePresence>
          {loading && !output && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-3"
            >
              {[1, 0.7, 0.85, 0.55].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded-full bg-gray-100 dark:bg-ink-raised"
                  style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.4, 0.85, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                />
              ))}
              <div className="flex items-center gap-2 pt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-teak-400"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
                  />
                ))}
                <span className="text-xs text-gray-400 dark:text-slate-500 ml-1">AI is writing…</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence>
          {output && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Generated Output</h3>
                  {hasInlineImages(output) && shownImages.length > 0 && (
                    <span className="text-xs bg-emerald-100 dark:bg-ink-raised text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <FiImage size={10} /> {shownImages.length} images embedded
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <FontPicker script={script} value={font} onChange={setFont} />
                  <button onClick={handleDownloadTxt} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised hover:bg-gray-200 dark:hover:bg-ink-raised text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiDownload size={12} /> TXT
                  </button>
                  <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-ink-raised hover:bg-red-100 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiFileText size={12} /> PDF
                  </button>
                  <button onClick={handleDownloadDocx} className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-ink-raised hover:bg-blue-100 dark:hover:bg-ink-raised text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiFileText size={12} /> DOCX
                  </button>
                </div>
              </div>

              <div
                className="bg-gray-50 dark:bg-ink-page border border-gray-100 dark:border-slate-800 rounded-xl p-4 text-sm text-gray-800 dark:text-slate-100 leading-relaxed min-h-[140px] break-words"
                dir={dir}
                style={{ fontFamily: stack, lineHeight }}
              >
                {renderContent()}
                {loading && <span className="inline-block w-0.5 h-4 bg-teak-500 animate-pulse ml-0.5 align-middle" />}
              </div>

              {/* Quality check result */}
              {!loading && qualityReport && (
                qualityReport.passed ? (
                  <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-emerald-50 dark:bg-ink-raised border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300">
                    <FiCheck size={15} className="flex-shrink-0" />
                    <span className="font-semibold">Quality check passed</span>
                    {qualityReport.retried && <span className="text-xs opacity-80">(fixed on retry)</span>}
                  </div>
                ) : (
                  <div className="mt-3 px-4 py-3 rounded-xl text-sm bg-amber-50 dark:bg-ink-raised border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                    <p className="font-semibold flex items-center gap-2">
                      <FiAlertCircle size={15} /> Quality warnings{qualityReport.retried ? ' (still present after retry)' : ''}
                    </p>
                    <ul className="list-disc list-inside text-xs mt-1.5 space-y-0.5 break-words">
                      {qualityReport.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  </div>
                )
              )}

              {/* Share + Listen */}
              {!loading && output && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleShareTwitter} className="flex items-center gap-1.5 text-xs bg-sky-50 dark:bg-ink-raised hover:bg-sky-100 dark:hover:bg-ink-raised text-sky-600 dark:text-sky-400 px-3 py-1.5 rounded-lg transition font-medium">
                      <FaXTwitter size={11} /> X / Twitter
                    </button>
                    <button onClick={handleShareLinkedIn} className="flex items-center gap-1.5 text-xs bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] px-3 py-1.5 rounded-lg transition font-medium">
                      <FaLinkedinIn size={11} /> LinkedIn
                    </button>
                    <button onClick={handleShareGmail} className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-ink-raised hover:bg-red-100 dark:hover:bg-ink-raised text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition font-medium">
                      <FiMail size={11} /> Gmail
                    </button>
                    <button onClick={handleShareFacebook} className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-ink-raised hover:bg-blue-100 dark:hover:bg-ink-raised text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg transition font-medium">
                      <FaFacebookF size={11} /> Facebook
                    </button>
                    <button onClick={handleNativeShare} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised hover:bg-gray-200 dark:hover:bg-ink-raised text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-lg transition font-medium">
                      <FiShare2 size={11} /> Share
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised hover:bg-teak-50 dark:hover:bg-ink-raised hover:text-teak-700 dark:hover:text-teak-400 text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-lg transition font-medium">
                      {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Facebook and LinkedIn share a link — copy the text to paste it into your post.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={ttsState === 'playing' ? pauseListen : () => speak()} disabled={!ttsSupported} className="flex items-center gap-1.5 text-xs bg-teak-600 hover:bg-teak-700 text-white px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-40">
                      {ttsState === 'playing' ? <><FiPause size={12} /> Pause</> : ttsState === 'paused' ? <><FiPlay size={12} /> Resume</> : <><FiVolume2 size={12} /> Listen</>}
                    </button>
                    {ttsState !== 'idle' && (
                      <button onClick={stopListen} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised hover:bg-gray-200 dark:hover:bg-ink-raised text-gray-600 dark:text-slate-400 px-3 py-1.5 rounded-lg transition font-medium">
                        <FiSquare size={11} /> Stop
                      </button>
                    )}
                    <select value={ttsRate} onChange={(e) => changeRate(Number(e.target.value))} disabled={!ttsSupported} title="Listening speed" className="border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-slate-200 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 disabled:opacity-40">
                      {SPEEDS.map((r) => <option key={r} value={r}>{r}x</option>)}
                    </select>
                    {sortedVoices.length > 1 && (
                      <select value={ttsVoice || sortedVoices[0]?.voiceURI || ''} onChange={(e) => setTtsVoice(e.target.value)} title="Voice" className="border border-gray-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-slate-200 bg-white dark:bg-ink-card focus:outline-none focus:ring-2 focus:ring-teak-500 max-w-[220px]">
                        {sortedVoices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name}{voiceGender(v.name) ? ` (${voiceGender(v.name)})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {!ttsSupported && <p className="text-xs text-gray-400 dark:text-slate-500">Voice not supported in this browser</p>}
                  {ttsSupported && sortedVoices.length === 1 && <p className="text-xs text-gray-400 dark:text-slate-500">Only one voice available on this device</p>}
                  <p className="text-xs text-gray-400 dark:text-slate-500">Voice comes from your browser or device — free system voices, not a recorded human. Natural AI voices are a paid option for later.</p>
                </div>
              )}

              {/* Tune buttons */}
              {!loading && output && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <p className="text-xs text-gray-400 dark:text-slate-500 font-medium mb-2 flex items-center gap-1.5">
                    <FiSliders size={11} /> Refine output — 1 credit
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TUNE_ACTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleTune(key)}
                        disabled={!!tuning}
                        className="text-xs border border-gray-200 dark:border-slate-800 bg-white dark:bg-ink-card text-gray-700 dark:text-slate-200 hover:border-teak-400 hover:text-teak-600 dark:hover:text-teak-400 hover:bg-teak-50 dark:hover:bg-ink-raised px-3 py-1.5 rounded-lg transition disabled:opacity-40 font-medium"
                      >
                        {tuning === key
                          ? <span className="flex items-center gap-1"><span className="animate-spin h-3 w-3 border border-teak-400 border-t-transparent rounded-full" /> Rewriting...</span>
                          : label
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state — right panel before the first generation */}
        {!loading && !output && (
          <div className="bg-white dark:bg-ink-card rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 shadow-sm p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-teak-50 dark:bg-ink-raised rounded-xl flex items-center justify-center">
              <FiFileText size={20} className="text-teak-600 dark:text-teak-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Your content will appear here</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Fill in the form and hit Generate — the output, SEO package and Reality Check show up in this panel.</p>
          </div>
        )}

        {/* Right panels: SEO, Reality Check, Stock Photos */}
        <div className="space-y-4">
          {/* SEO Panel */}
          <div className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-teak-100 dark:bg-ink-raised rounded-lg flex items-center justify-center">
                <FiZap size={13} className="text-teak-600 dark:text-teak-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">SEO Package</h3>
            </div>

            {loading && !seoData && (
              <div className="space-y-2.5">
                {[1, 0.8, 0.6].map((w, i) => (
                  <div key={i} className="h-2.5 bg-gray-100 dark:bg-ink-raised rounded-full animate-pulse" style={{ width: `${w * 100}%` }} />
                ))}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Generating SEO metadata...</p>
              </div>
            )}

            {!loading && !seoData && (
              <p className="text-xs text-gray-400 dark:text-slate-500">SEO metadata appears here after generation.</p>
            )}

            {seoData && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Meta Title</p>
                  <div className="bg-teak-50 dark:bg-ink-raised border border-teak-100 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-800 dark:text-slate-100 font-medium">{seoData.title || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Meta Description</p>
                  <div className="bg-gray-50 dark:bg-ink-page border border-gray-100 dark:border-slate-800 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">{seoData.description || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(seoData.keywords || []).map((kw, i) => (
                      <span key={i} className="bg-teak-100 dark:bg-ink-raised text-teak-700 dark:text-teak-400 text-xs px-2.5 py-0.5 rounded-full font-medium">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reality Check Score Card */}
          {realityCheck && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-violet-100 dark:bg-ink-raised rounded-lg flex items-center justify-center">
                    <span className="text-xs">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Reality Check</h3>
                </div>
                {realityCheck.rating != null && (
                  <div className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                    realityCheck.rating >= 8 ? 'bg-emerald-100 dark:bg-ink-raised text-emerald-700 dark:text-emerald-300' :
                    realityCheck.rating >= 6 ? 'bg-amber-100 dark:bg-ink-raised text-amber-700 dark:text-amber-300' :
                    'bg-red-100 dark:bg-ink-raised text-red-700 dark:text-red-300'
                  }`}>
                    {realityCheck.rating}/10
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {realityCheck.pillars.map((pillar) => {
                  const pct = Math.round((pillar.score / 10) * 100);
                  const color = pillar.score >= 8 ? 'bg-emerald-500' : pillar.score >= 6 ? 'bg-amber-400' : 'bg-red-400';
                  const textColor = pillar.score >= 8 ? 'text-emerald-700 dark:text-emerald-300' : pillar.score >= 6 ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-400';
                  return (
                    <div key={pillar.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{pillar.name}</span>
                        <span className={`text-xs font-bold ${textColor}`}>{pillar.score}/10</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-ink-raised rounded-full overflow-hidden mb-1">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-slate-500 leading-snug">{pillar.verdict}</p>
                    </div>
                  );
                })}
              </div>
              {realityCheck.rating != null && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 text-center">
                  Avg score vs leading AI models
                </p>
              )}
            </motion.div>
          )}

          {/* Sidebar images — only for non-blog types (blog shows inline) */}
          {images.length > 0 && !hasInlineImages(output) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 dark:bg-ink-raised rounded-lg flex items-center justify-center">
                    <FiImage size={13} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Stock Photos</h3>
                </div>
                <button onClick={() => setShowImages(!showImages)} className="text-xs text-teak-600 dark:text-teak-400 hover:text-teak-800 dark:hover:text-teak-300 font-medium">
                  {showImages ? 'Hide' : 'Show'}
                </button>
              </div>
              <AnimatePresence>
                {showImages && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {images.map((img, i) => (
                      <a key={i} href={img.photographerUrl} target="_blank" rel="noopener noreferrer" className="block group">
                        <img src={img.thumb || img.url} alt={img.alt} className="w-full h-24 object-cover rounded-lg group-hover:opacity-90 transition" />
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">📷 {img.photographer} · Unsplash</p>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {!showImages && (
                <p className="text-xs text-gray-400 dark:text-slate-500">{images.length} photos matched your content.</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Blog image picker — swap any embedded photo for another suggestion */}
        {output && !loading && form.type === 'blog' && imageOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-emerald-100 dark:bg-ink-raised rounded-lg flex items-center justify-center">
                <FiImage size={13} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Choose blog images</h3>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Tap a photo to use it in that spot. Your choice is saved with this post.</p>
            <div className="space-y-4">
              {shownImages.map((current, slot) => (
                <div key={slot}>
                  <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Image {slot + 1} in your blog</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {imageOptions.map((opt, oi) => {
                      const selected = current.url === opt.url;
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => handlePickImage(slot, oi)}
                          title={opt.credit || opt.alt || 'Unsplash photo'}
                          className={`relative rounded-lg overflow-hidden border-2 transition ${selected ? 'border-teak-500 ring-2 ring-teak-200' : 'border-transparent hover:border-teak-300'}`}
                        >
                          <img src={opt.thumb || opt.url} alt={opt.alt || 'Blog image option'} className="w-full h-14 object-cover" loading="lazy" />
                          {selected && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-teak-600 rounded-full flex items-center justify-center">
                              <FiCheck size={9} className="text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">📷 {current.credit || current.photographer || 'Unsplash'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

