import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { useCredits } from '../context/CreditContext.js';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from './LoadingSpinner.jsx';
import {
  FiTrash2, FiCopy, FiDownload, FiCheck, FiChevronDown, FiChevronUp,
  FiStar, FiRefreshCw, FiFileText,
} from 'react-icons/fi';

function HistoryItem({ item, index, onDelete, onFavorite, onRegenerate, regenerating }) {
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            onClick={() => onFavorite(item._id, !item.favorite)}
            className={item.favorite ? 'text-amber-400 hover:text-amber-500 transition' : 'text-gray-300 hover:text-amber-400 transition'}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <FiStar size={15} fill={item.favorite ? 'currentColor' : 'none'} />
          </motion.button>
          <motion.button
            onClick={() => onDelete(item._id)}
            className="text-gray-300 hover:text-red-400 transition"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title="Delete content"
            aria-label="Delete content"
          >
            <FiTrash2 size={14} />
          </motion.button>
        </div>
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
                onClick={() => onRegenerate(item._id)}
                disabled={regenerating}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition disabled:opacity-50"
                whileTap={{ scale: 0.95 }}
              >
                <FiRefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </motion.button>
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const { deductCredit } = useCredits();

  useEffect(() => {
    setLoading(true);
    api.get('/history', { params: { page: 1, limit: 10, ...(favoriteOnly ? { favorite: true } : {}) } })
      .then(({ data }) => {
        setItems(Array.isArray(data.items) ? data.items : []);
        setPage(data.page || 1);
        setPages(data.pages || 1);
      })
      .catch(() => {
        setItems([]);
        toast.error('Could not load your content history');
      })
      .finally(() => setLoading(false));
  }, [favoriteOnly]);

  const handleLoadMore = async () => {
    if (loadingMore || page >= pages) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get('/history', {
        params: { page: page + 1, limit: 10, ...(favoriteOnly ? { favorite: true } : {}) },
      });
      setItems((prev) => [...prev, ...(Array.isArray(data.items) ? data.items : [])]);
      setPage(data.page || page + 1);
      setPages(data.pages || pages);
    } catch (_) {
      toast.error('Could not load more history');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Content deleted');
    } catch (_) {
      toast.error('Could not delete this content');
    }
  };

  const handleFavorite = async (id, favorite) => {
    try {
      const { data } = await api.patch(`/history/${id}/favorite`, { favorite });
      if (favoriteOnly && !favorite) {
        setItems((prev) => prev.filter((item) => item._id !== id));
      } else {
        setItems((prev) => prev.map((item) => (item._id === id ? data.content : item)));
      }
    } catch (_) {
      toast.error('Could not update favorite');
    }
  };

  const handleRegenerate = async (id) => {
    setRegeneratingId(id);
    try {
      const { data } = await api.post(`/history/${id}/regenerate`);
      setItems((prev) => prev.map((item) => (item._id === id ? data.content : item)));
      deductCredit(1);
      toast.success('Content regenerated in the same history entry');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not regenerate this content');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleExport = async (format) => {
    try {
      const { data } = await api.get('/history/export', {
        params: { format, ...(favoriteOnly ? { favorite: true } : {}) },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `verzo-history${favoriteOnly ? '-favorites' : ''}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`History exported as ${format.toUpperCase()}`);
    } catch (_) {
      toast.error('Could not export your content history');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavoriteOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${!favoriteOnly ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            All content
          </button>
          <button
            onClick={() => setFavoriteOnly(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${favoriteOnly ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <FiStar size={12} fill={favoriteOnly ? 'currentColor' : 'none'} /> Favorites
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">
            <FiDownload size={12} /> CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition">
            <FiFileText size={12} /> PDF
          </button>
        </div>
      </div>

      {!items.length ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-gray-400 text-sm">{favoriteOnly ? 'No favorite content yet.' : 'No content generated yet.'}</p>
          <p className="text-gray-300 text-xs mt-1">{favoriteOnly ? 'Star content to find it quickly here.' : 'Your generations will appear here.'}</p>
        </motion.div>
      ) : (
        <>
          {items.map((item, index) => (
            <HistoryItem
              key={item._id}
              item={item}
              index={index}
              onDelete={handleDelete}
              onFavorite={handleFavorite}
              onRegenerate={handleRegenerate}
              regenerating={regeneratingId === item._id}
            />
          ))}
          {page < pages && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mx-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-semibold transition disabled:opacity-60"
            >
              {loadingMore && <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />}
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
