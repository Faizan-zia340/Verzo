import { useState } from 'react';
import { useCredits } from '../context/CreditContext.js';
import { FiZap, FiCopy, FiDownload, FiCheck } from 'react-icons/fi';

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
    icon: '🏠',
    label: 'Real Estate Blog',
    form: {
      type: 'blog', tone: 'professional', length: 'medium', language: 'english',
      prompt: "Write a compelling blog post about why 2026 is the best year to invest in real estate. Include 3 bullet points on market trends, mention rising demand in suburban areas, and end with a strong call to action encouraging first-time investors to act now.",
    },
  },
  {
    icon: '📱',
    label: 'Social Media Post',
    form: {
      type: 'social', tone: 'friendly', length: 'short', language: 'english',
      prompt: "Create a high-engagement Instagram caption for a motivational business post. Use 2-3 relevant emojis, write a hook in the first line, and end with a question to drive comments. Target audience: entrepreneurs aged 25-40.",
    },
  },
  {
    icon: '✉️',
    label: 'Cold Email',
    form: {
      type: 'email', tone: 'professional', length: 'short', language: 'english',
      prompt: "Write a cold outreach email to a potential B2B SaaS client. Include a personalized opener, state the value proposition in 2 sentences, and close with a soft CTA to schedule a 15-minute discovery call. Keep it under 150 words.",
    },
  },
];

const TUNE_ACTIONS = [
  { key: 'shorten', label: 'Shorten' },
  { key: 'engaging', label: 'More Engaging' },
  { key: 'professional', label: 'Professional Tone' },
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
              setLoading(false);
            } else if (parsed.error) {
              setError(parsed.error);
              setLoading(false);
            }
          } catch {}
        }
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleTune = async (action) => {
    if (!output || tuning) return;
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
      setError('Tune request failed.');
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

  return (
    <div className="space-y-5">
      {/* Templates */}
      <div className="grid grid-cols-3 gap-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            onClick={() => applyTemplate(tpl)}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-400 hover:shadow-sm transition group"
          >
            <span className="text-xl mb-1 block">{tpl.icon}</span>
            <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">{tpl.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">Quick template</p>
          </button>
        ))}
      </div>

      {/* Generator form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-5">Generate Content</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
              <select name="tone" value={form.tone} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Length</label>
              <select name="length" value={form.length} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {LENGTHS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Language</label>
              <select name="language" value={form.language} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
              placeholder="Describe what you want to generate..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <><FiZap /> Generate (1 credit)</>
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
              <h3 className="font-semibold text-gray-800">Generated Output</h3>
              <div className="flex gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg transition font-medium">
                  {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy</>}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg transition font-medium">
                  <FiDownload size={12} /> Download
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[120px]">
              {output}
              {loading && <span className="animate-pulse text-indigo-400">▍</span>}
            </div>

            {/* Tune buttons */}
            {!loading && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs text-gray-400 self-center mr-1">Quick tune:</span>
                {TUNE_ACTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleTune(key)}
                    disabled={!!tuning}
                    className="text-xs border border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition disabled:opacity-50 font-medium"
                  >
                    {tuning === key ? 'Rewriting...' : label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SEO Panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">SEO Package</h3>
            {!seoData && !loading && (
              <p className="text-xs text-gray-400">SEO data generates after content completes.</p>
            )}
            {loading && !seoData && (
              <div className="space-y-3">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/5" />
              </div>
            )}
            {seoData && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meta Title</p>
                  <p className="text-sm text-gray-800 bg-indigo-50 rounded-lg px-3 py-2">{seoData.title || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meta Description</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{seoData.description || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(seoData.keywords || []).map((kw, i) => (
                      <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
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
