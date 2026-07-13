import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from './LoadingSpinner.jsx';
import { FiTrash2, FiCopy, FiDownload, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi';

function HistoryItem({ item, index, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([item.output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.type}-${item._id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ boxShadow: '0 4px 16px rgba(99,102,241,0.08)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">{item.type}</span>
          {item.language && item.language !== 'english' && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full capitalize">{item.language.replace('_', ' ')}</span>
          )}
          <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
        </div>
        <motion.button
          onClick={() => onDelete(item._id)}
          className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiTrash2 size={14} />
        </motion.button>
      </div>

      <p className="text-sm text-gray-700 font-medium mt-2 mb-3 line-clamp-2">{item.prompt}</p>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
          whileTap={{ scale: 0.96 }}
        >
          {expanded ? <><FiChevronUp size={12} /> Hide output</> : <><FiChevronDown size={12} /> Show output</>}
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.18 }}
            >
              <motion.button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition"
                whileTap={{ scale: 0.95 }}
              >
                {copied ? <><FiCheck size={11} /> Copied</> : <><FiCopy size={11} /> Copy</>}
              </motion.button>
              <motion.button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition"
                whileTap={{ scale: 0.95 }}
              >
                <FiDownload size={11} /> Download
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {item.output}
              </div>
              {item.seoData?.title && (
                <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50 space-y-2">
                  <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">SEO Package</p>
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Title: </span>
                    <span className="text-xs text-gray-800">{item.seoData.title}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Description: </span>
                    <span className="text-xs text-gray-700">{item.seoData.description}</span>
                  </div>
                  {item.seoData.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.seoData.keywords.map((kw, i) => (
                        <span key={i} className="bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history').then(({ data }) => setItems(data.items)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/history/${id}`);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) return <LoadingSpinner />;
  if (!items.length) return (
    <motion.div
      className="text-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-gray-400 text-sm">No content generated yet.</p>
      <p className="text-gray-300 text-xs mt-1">Your generations will appear here.</p>
    </motion.div>
  );

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <HistoryItem key={item._id} item={item} index={index} onDelete={handleDelete} />
      ))}
    </div>
  );
}
