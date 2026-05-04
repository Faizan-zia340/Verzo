import { useState } from 'react';
import { useCredits } from '../context/CreditContext.js';
import {
  FiZap, FiCopy, FiDownload, FiCheck, FiHome, FiSmartphone, FiMail,
  FiAlertCircle, FiRefreshCw,
} from 'react-icons/fi';

const TYPES = ['blog', 'social', 'email', 'ad', 'product'];
const TONES = ['professional', 'casual', 'formal', 'friendly', 'persuasive'];
const LENGTHS = ['short', 'medium', 'long'];
const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'roman_urdu', label: 'Roman Urdu' },
  { value: 'arabic', label: 'Arabic' },
];

const TEMPLATES = [
  {
    Icon: FiHome,
    label: 'Real Estate Blog',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    form: {
      type: 'blog', tone: 'professional', length: 'medium', language: 'english',
      prompt: 'Write a compelling blog post about why 2026 is the best year to invest in real estate. Include 3 bullet points on market trends, mention rising demand in suburban areas, and end with a strong call to action encouraging first-time investors to act now.',
    },
  },
  {
    Icon: FiSmartphone,
    label: 'Social Media Post',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    form: {
      type: 'social', tone: 'friendly', length: 'short', language: 'english',
      prompt: 'Create a high-engagement Instagram caption for a motivational business post. Use 2-3 relevant emojis, write a hook in the first line, and end with a question to drive comments. Target audience: entrepreneurs aged 25-40.',
    },
  },
  {
    Icon: FiMail,
    label: 'Cold Email',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    form: {
      type: 'email', tone: 'professional', length: 'short', language: 'english',
      prompt: 'Write a cold outreach email to a potential B2B SaaS client. Include a personalized opener, state the value proposition in 2 sentences, and close with a soft CTA to schedule a 15-minute discovery call. Keep it under 150 words.',
    },
  },
];

const TUNE_ACTIONS = [
  { key: 'shorten', label: '↓ Shorten' },
  { key: 'engaging', label: '⚡ More Engaging' },
  { key: 'professional', label: '✦ Professional Tone' },
];

export default function Generator() {
  const { deductCredit } = useCredits();
  const [form, setForm] = useState({ type: 'blog', prompt: '', tone: 'professional', length: 'medium', language: 'english' });
  const [output, setOutput] = useState('');
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tuning, setTuning] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const applyTemplate = (tpl) => {
    setForm(tpl.form);
    setOutput('');
    setSeoData(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOutput('');
    setSeoData(null);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setError(err.message || 'Generation failed. Please try again.');
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
              deductCredit(1);
              finished = true;
              setLoading(false);
            } else if (parsed.error) {
              setError(parsed.error);
              finished = true;
              setLoading(false);
            }
          } catch {}
        }
      }
      // Ensure loading always resets even if stream closes without done/error event
      if (!finished) setLoading(false);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleTune = async (action) => {
    if (!output || tuning || loading) return;
    setTuning(action);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/generate/tune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: output, action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Tune failed'); return; }
      setOutput(data.output);
      setSeoData(null);
    } catch {
      setError('Tune request failed. Please try again.');
    } finally {
      setTuning('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${form.type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRateLimit = error.toLowerCase().includes('rate limit');

  return (
    <div className="space-y-5">

      {/* Quick Templates */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Templates</p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map(({ Icon, label, color, bg, form: tplForm }) => (
            <button
              key={label}
              onClick={() => applyTemplate({ form: tplForm })}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-md transition group flex items-start gap-3"
            >
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 leading-tight">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">Quick template</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Generate Content</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'type', label: 'Type', options: TYPES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
              { name: 'tone', label: 'Tone', options: TONES.map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
              { name: 'length', label: 'Length', options: LENGTHS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) })) },
            ].map(({ name, label, options }) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <select
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
              <select
                name="language"
                value={form.language}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prompt</label>
            <textarea
              name="prompt"
              value={form.prompt}
              onChange={handleChange}
              rows={4}
              placeholder="Describe what you want to generate, or pick a quick template above..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none placeholder-gray-400"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm ${isRateLimit ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {isRateLimit ? <FiRefreshCw size={15} className="mt-0.5 flex-shrink-0 text-amber-500" /> : <FiAlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />}
              <div>
                <p className="font-medium">{isRateLimit ? 'Rate limit reached' : 'Error'}</p>
                <p className="text-xs mt-0.5 opacity-80">{error}{isRateLimit ? ' Wait 30–60 seconds then try again.' : ''}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <><FiZap size={15} /> Generate (1 credit)</>
            )}
          </button>
        </form>
      </div>

      {/* Output */}
      {output && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main output */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Generated Output</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy</>}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-lg transition font-medium"
                >
                  <FiDownload size={12} /> Download
                </button>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[140px]">
              {output}
              {loading && <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />}
            </div>

            {/* Tune buttons */}
            {!loading && output && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium mb-2">Refine output — no credits used</p>
                <div className="flex flex-wrap gap-2">
                  {TUNE_ACTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleTune(key)}
                      disabled={!!tuning}
                      className="text-xs border border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition disabled:opacity-40 font-medium"
                    >
                      {tuning === key ? (
                        <span className="flex items-center gap-1"><span className="animate-spin h-3 w-3 border border-indigo-400 border-t-transparent rounded-full" /> Rewriting...</span>
                      ) : label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FiZap size={13} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">SEO Package</h3>
            </div>

            {loading && !seoData && (
              <div className="space-y-3">
                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-4/5" />
                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-3/5" />
                <p className="text-xs text-gray-400 mt-3">Generating SEO metadata...</p>
              </div>
            )}

            {!loading && !seoData && (
              <p className="text-xs text-gray-400 leading-relaxed">SEO metadata will appear here after generation completes.</p>
            )}

            {seoData && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meta Title</p>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-800 font-medium">{seoData.title || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Meta Description</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-700 leading-relaxed">{seoData.description || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(seoData.keywords || []).map((kw, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
