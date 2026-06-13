import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFileText, FiX, FiDownload, FiCopy, FiCheck, FiBook, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiUrl } from '../services/apiUrl.js';
import { jsPDF } from 'jspdf';

export default function PDFAnalyzer() {
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
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/pdf/analyze'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      setResult(data);
      toast.success(`Analysis complete — ${data.pages} pages processed`, { id: analyzeToast });
      setTab('notes');
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { id: analyzeToast });
    } finally {
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDF Deep Analyzer</h1>
            <p className="text-gray-500 mt-1.5 text-sm">Upload any PDF — get structured study notes, chapter summaries, and a question bank instantly.</p>
          </div>

          {/* Upload area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${
              file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FiFileText size={22} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition"
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiUpload size={24} className="text-indigo-600" />
                </div>
                <p className="font-semibold text-gray-700 mb-1">Drop your PDF here</p>
                <p className="text-sm text-gray-400">or click to browse · Max 10MB</p>
              </>
            )}
          </div>

          {file && !result && (
            <motion.button
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              onClick={handleAnalyze} disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="mt-4 w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading
                ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Analyzing PDF...</>
                : <><FiBook size={16} /> Analyze PDF</>
              }
            </motion.button>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
                    <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xl font-bold text-indigo-600">{value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex border-b border-gray-100">
                    {TABS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition ${
                          tab === key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={14} /> {label}
                      </button>
                    ))}
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[200px]">
                      {TABS.find((t) => t.key === tab)?.content
                        ? TABS.find((t) => t.key === tab).content
                        : tab === 'notes' && result?.analysis
                          ? result.analysis
                          : <p className="text-gray-400 italic">No content found for this section.</p>
                      }
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition">
                    {copied ? <><FiCheck size={12} /> Copied!</> : <><FiCopy size={12} /> Copy All</>}
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition">
                    <FiDownload size={12} /> Export PDF
                  </button>
                  <button onClick={() => { setFile(null); setResult(null); }} className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium transition">
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
