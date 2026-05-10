import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCredits } from '../context/CreditContext.js';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import {
  FiZap, FiCopy, FiDownload, FiCheck, FiHome, FiSmartphone, FiMail,
  FiAlertCircle, FiRefreshCw, FiSliders, FiFileText, FiShare2, FiImage,
} from 'react-icons/fi';

const TYPES = ['blog', 'social', 'email', 'ad', 'product'];
const TONES = ['professional', 'casual', 'formal', 'friendly', 'persuasive'];
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
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    form: {
      type: 'blog', tone: 'professional', length: 'medium', language: 'english_us', format: 'headings',
      prompt: 'Write a compelling blog post about why 2026 is the best year to invest in real estate. Include 3 bullet points on market trends, mention rising demand in suburban areas, and end with a strong call to action encouraging first-time investors to act now.',
    },
  },
  {
    Icon: FiSmartphone,
    label: 'Social Media Post',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    form: {
      type: 'social', tone: 'friendly', length: 'short', language: 'english_us', format: 'paragraphs',
      prompt: 'Create a high-engagement Instagram caption for a motivational business post. Use 2-3 relevant emojis, write a hook in the first line, and end with a question to drive comments. Target audience: entrepreneurs aged 25-40.',
    },
  },
  {
    Icon: FiMail,
    label: 'Cold Email',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    form: {
      type: 'email', tone: 'professional', length: 'short', language: 'english_us', format: 'paragraphs',
      prompt: 'Write a cold outreach email to a potential B2B SaaS client. Include a personalized opener, state the value proposition in 2 sentences, and close with a soft CTA to schedule a 15-minute discovery call. Keep it under 150 words.',
    },
  },
];

const TUNE_ACTIONS = [
  { key: 'shorten', label: '↓ Shorten' },
  { key: 'engaging', label: '⚡ More Engaging' },
  { key: 'professional', label: '✦ Professional' },
  { key: 'reduce_hype', label: '🎯 Reduce Hype' },
];

const selectClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

export default function Generator() {
  const { deductCredit, credits } = useCredits();
  const [form, setForm] = useState({ type: 'blog', prompt: '', tone: 'professional', length: 'medium', language: 'english_us', format: 'paragraphs' });
  const [output, setOutput] = useState('');
  const [seoData, setSeoData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tuning, setTuning] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showImages, setShowImages] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const applyTemplate = (tpl) => {
    setForm(tpl.form);
    setOutput(''); setSeoData(null); setImages([]); setError('');
    toast('Template applied', { icon: '📋' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (credits !== null && credits < 1) {
      toast.error('Not enough credits. Please buy more.');
      return;
    }
    setLoading(true); setError(''); setOutput(''); setSeoData(null); setImages([]);

    const token = localStorage.getItem('token');
    const genToast = toast.loading('Generating content...');
    try {
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
            } else if (parsed.done) {
              setSeoData(parsed.seoData || null);
              setImages(parsed.images || []);
              deductCredit(1);
              finished = true;
              setLoading(false);
              toast.success('1 credit used — content ready!', { id: genToast });
            } else if (parsed.error) {
              setError(parsed.error);
              toast.error(parsed.error, { id: genToast });
              finished = true;
              setLoading(false);
            }
          } catch {}
        }
      }
      if (!finished) {
        setLoading(false);
        toast.dismiss(genToast);
      }
    } catch {
      const msg = 'Network error. Please check your connection.';
      setError(msg);
      toast.error(msg, { id: genToast });
      setLoading(false);
    }
  };

  const handleTune = async (action) => {
    if (!output || tuning || loading) return;
    setTuning(action);
    setError('');
    const token = localStorage.getItem('token');
    const tuneToast = toast.loading('Rewriting...');
    try {
      const res = await fetch('/api/generate/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: output, action }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || 'Tune failed', { id: tuneToast }); return; }
      setOutput(data.output);
      setSeoData(null);
      toast.success('Content refined!', { id: tuneToast });
    } catch {
      toast.error('Tune request failed.', { id: tuneToast });
    } finally {
      setTuning('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${form.type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Downloaded as TXT', { icon: '📄' });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${form.type.toUpperCase()} — AI Generated`, margin, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Prompt: ${form.prompt.slice(0, 100)}`, margin, 30);
    doc.setTextColor(0);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(output, pageWidth);
    doc.text(lines, margin, 42);
    if (seoData?.title) {
      const y = Math.min(42 + lines.length * 5 + 10, 270);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229);
      doc.text('SEO: ' + seoData.title, margin, y);
    }
    doc.save(`content-${form.type}-${Date.now()}.pdf`);
    toast.success('Exported as PDF!');
  };

  const handleDownloadDocx = () => {
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.6;margin:2cm;} h1{color:#4f46e5;} p{margin:0.5em 0;}</style></head><body><h1>${form.type.toUpperCase()} Content</h1><p><b>Prompt:</b> ${form.prompt}</p><hr/>${output.replace(/\n/g, '<br/>')}</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${form.type}-${Date.now()}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as DOCX!');
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(output.slice(0, 700));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?mini=true&summary=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(output.slice(0, 260) + '...');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const isRateLimit = error.toLowerCase().includes('rate limit');

  return (
    <div className="space-y-5">
      {/* Quick Templates */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Templates</p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map(({ Icon, label, color, bg, form: tplForm }) => (
            <motion.button
              key={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => applyTemplate({ form: tplForm })}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-md transition flex items-start gap-3"
            >
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">Quick template</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Generate Content</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Type, Tone, Length, Format */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'type', label: 'Type', options: TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
              { name: 'tone', label: 'Tone', options: TONES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
              { name: 'length', label: 'Length', options: LENGTHS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })) },
              { name: 'format', label: 'Format', options: FORMATS },
            ].map(({ name, label, options }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <select name={name} value={form[name]} onChange={handleChange} className={selectClass}>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Row 2: Language (grouped) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Language & Dialect <span className="text-gray-400 font-normal">(23 options)</span></label>
            <select name="language" value={form.language} onChange={handleChange} className={selectClass}>
              {LANGUAGES.map(({ group, options }) => (
                <optgroup key={group} label={group}>
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prompt</label>
            <textarea
              name="prompt" value={form.prompt} onChange={handleChange} rows={4} required
              placeholder="Describe what you want to generate, or pick a quick template above..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder-gray-400"
            />
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${
              isRateLimit ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'
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
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {loading
              ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />Generating...</>
              : <><FiZap size={15} /> Generate (1 credit)</>
            }
          </motion.button>
        </form>
      </div>

      {/* Output */}
      <AnimatePresence>
        {output && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Main output */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-900">Generated Output</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-lg transition font-medium">
                    {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy</>}
                  </button>
                  <button onClick={handleDownloadTxt} className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiDownload size={12} /> TXT
                  </button>
                  <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiFileText size={12} /> PDF
                  </button>
                  <button onClick={handleDownloadDocx} className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiFileText size={12} /> DOCX
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                {output}
                {loading && <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />}
              </div>

              {/* Social Share */}
              {!loading && output && (
                <div className="mt-3 flex gap-2">
                  <button onClick={handleShareLinkedIn} className="flex items-center gap-1.5 text-xs bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] px-3 py-1.5 rounded-lg transition font-medium">
                    <FiShare2 size={11} /> LinkedIn
                  </button>
                  <button onClick={handleShareTwitter} className="flex items-center gap-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-600 px-3 py-1.5 rounded-lg transition font-medium">
                    <FiShare2 size={11} /> Twitter/X
                  </button>
                </div>
              )}

              {/* Tune buttons */}
              {!loading && output && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                    <FiSliders size={11} /> Refine output — no credits used
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TUNE_ACTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleTune(key)}
                        disabled={!!tuning}
                        className="text-xs border border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition disabled:opacity-40 font-medium"
                      >
                        {tuning === key
                          ? <span className="flex items-center gap-1"><span className="animate-spin h-3 w-3 border border-indigo-400 border-t-transparent rounded-full" /> Rewriting...</span>
                          : label
                        }
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel: SEO + Images */}
            <div className="space-y-4">
              {/* SEO Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FiZap size={13} className="text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">SEO Package</h3>
                </div>

                {loading && !seoData && (
                  <div className="space-y-2.5">
                    {[1, 0.8, 0.6].map((w, i) => (
                      <div key={i} className={`h-2.5 bg-gray-100 rounded-full animate-pulse`} style={{ width: `${w * 100}%` }} />
                    ))}
                    <p className="text-xs text-gray-400 mt-2">Generating SEO metadata...</p>
                  </div>
                )}

                {!loading && !seoData && (
                  <p className="text-xs text-gray-400">SEO metadata appears here after generation.</p>
                )}

                {seoData && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Meta Title</p>
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <p className="text-sm text-gray-800 font-medium">{seoData.title || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Meta Description</p>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-700 leading-relaxed">{seoData.description || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(seoData.keywords || []).map((kw, i) => (
                          <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Images Panel */}
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FiImage size={13} className="text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">Stock Photos</h3>
                    </div>
                    <button onClick={() => setShowImages(!showImages)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      {showImages ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showImages && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        {images.map((img, i) => (
                          <a key={i} href={img.photographerUrl} target="_blank" rel="noopener noreferrer" className="block group">
                            <img src={img.thumb} alt={img.alt} className="w-full h-24 object-cover rounded-lg group-hover:opacity-90 transition" />
                            <p className="text-xs text-gray-400 mt-1">📷 {img.photographer} · Unsplash</p>
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!showImages && (
                    <p className="text-xs text-gray-400">{images.length} photos matched your content.</p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
