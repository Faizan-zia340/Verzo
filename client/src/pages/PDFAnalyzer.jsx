import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiX, FiDownload, FiCopy, FiCheck, FiBook, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiUrl } from '../services/apiUrl.js';
import { useCredits } from '../context/CreditContext.js';
import { jsPDF } from 'jspdf';
import Seo from '../components/Seo.jsx';

export default function PDFAnalyzer() {
  const { fetchCredits } = useCredits();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('notes');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Only PDF files are supported.'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File too large. Max size is 10MB.'); return; }
    setFile(f); setResult(null); setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null);
    const analyzeToast = toast.loading('Analyzing PDF — this may take a moment...');
    // Abort if the analysis stalls — fail visibly, never hang. 120s covers
    // large PDFs; analysis costs 1 credit, so refresh the balance on success.
    const controller = new AbortController();
    const analyzeTimer = setTimeout(() => controller.abort(), 120000);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetch(apiUrl('/api/pdf/analyze'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      setResult(data);
      fetchCredits();
      toast.success(`Analysis complete — ${data.pages} pages processed`, { id: analyzeToast });
      setTab('notes');
    } catch (err) {
      const msg = err?.name === 'AbortError' ? 'Analysis timed out. Please try again.' : err.message;
      setError(msg);
      toast.error(msg, { id: analyzeToast });
    } finally {
      clearTimeout(analyzeTimer);
      setLoading(false);
    }
  };

  const parseSection = (text, keywords) => {
    if (!text) return '';
    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Try each keyword variant
    for (const kw of keywords) {
      // Match any ## heading line that contains the keyword, capture everything until next ## heading or end
      const regex = new RegExp(
        `(?:^|\\n)#{1,3}[^\\n]*${kw}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s|$)`,
        'i'
      );
      const match = normalized.match(regex);
      if (match && match[1].trim()) return match[1].trim();
    }
    return '';
  };

  const studyNotes = result ? parseSection(result.analysis, ['STUDY NOTES', 'STUDY NOTE', 'KEY CONCEPTS', 'NOTES']) : '';
  const summaries = result ? parseSection(result.analysis, ['CHAPTER SUMMAR', 'SUMMAR', 'OVERVIEW', 'SECTION']) : '';
  const questions = result ? parseSection(result.analysis, ['TEST YOURSELF', 'TEST BANK', 'QUESTION', 'QUIZ']) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(result?.analysis || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('PDF Analysis Report', margin, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`File: ${file?.name} | ${result?.pages} pages | ${result?.wordCount?.toLocaleString()} words`, margin, 28);
    doc.setTextColor(0);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(result?.analysis || '', pageWidth);
    doc.text(lines, margin, 38);
    doc.save(`analysis-${file?.name?.replace('.pdf', '')}-${Date.now()}.pdf`);
    toast.success('Exported as PDF!');
  };

  const TABS = [
    { key: 'notes', label: 'Study Notes', icon: FiBook, content: studyNotes },
    { key: 'summaries', label: 'Summaries', icon: FiFileText, content: summaries },
    { key: 'questions', label: 'Test Yourself', icon: FiHelpCircle, content: questions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teak-50 via-white to-slate-50">
      <Seo title="Penlix PDF Analyzer — Study Notes & Tests" description="Upload a PDF and get structured study notes, chapter summaries and a 10-question test bank instantly." path="/pdf" noindex />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PDF Deep Analyzer</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1.5 text-sm">Upload any PDF — get structured study notes, chapter summaries, and a question bank instantly.</p>
          </div>

          {/* Upload area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${
              file ? 'border-teak-400 bg-teak-50' : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-ink-card hover:border-teak-300 hover:bg-teak-50/30 dark:hover:bg-ink-raised/30'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-teak-100 dark:bg-ink-raised rounded-xl flex items-center justify-center">
                  <FiFileText size={22} className="text-teak-600 dark:text-teak-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-ink-raised text-red-400 hover:bg-red-100 hover:text-red-600 transition"
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-teak-100 dark:bg-ink-raised rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiUpload size={24} className="text-teak-600 dark:text-teak-400" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-slate-200 mb-1">Drop your PDF here</p>
                <p className="text-sm text-gray-400 dark:text-slate-500">or click to browse · Max 10MB</p>
              </>
            )}
          </div>

          {file && !result && (
            <motion.button
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={handleAnalyze} disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full bg-teak-600 text-white py-3.5 rounded-xl font-semibold hover:bg-teak-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading
                ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Analyzing PDF...</>
                : <><FiBook size={16} /> Analyze PDF</>
              }
            </motion.button>
          )}

          {error && (
            <div className="mt-4 bg-red-50 dark:bg-ink-raised border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Pages', value: result.pages },
                    { label: 'Words', value: result.wordCount?.toLocaleString() },
                    { label: 'Chunks', value: result.chunks },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-ink-card border border-gray-100 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xl font-bold text-teak-600 dark:text-teak-400">{value}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-ink-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-100 dark:border-slate-800">
                    {TABS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition ${
                          tab === key ? 'bg-teak-600 text-white' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-ink-raised'
                        }`}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-gray-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed min-h-[200px]">
                      {TABS.find((t) => t.key === tab)?.content
                        ? TABS.find((t) => t.key === tab).content
                        : tab === 'notes' && result?.analysis
                          ? result.analysis
                          : <p className="text-gray-400 dark:text-slate-500 italic">No content found for this section.</p>
                      }
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-ink-raised hover:bg-gray-200 dark:hover:bg-ink-raised text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium transition">
                    {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy All</>}
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-ink-raised hover:bg-red-100 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium transition">
                    <FiDownload size={12} /> Export PDF
                  </button>
                  <button onClick={() => { setFile(null); setResult(null); }} className="flex items-center gap-1.5 text-xs bg-teak-50 dark:bg-ink-raised hover:bg-teak-100 dark:hover:bg-ink-raised text-teak-700 dark:text-teak-400 px-4 py-2 rounded-lg font-medium transition">
                    <FiUpload size={12} /> Analyze Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
