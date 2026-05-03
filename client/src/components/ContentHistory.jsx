import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from './LoadingSpinner.jsx';
import { FiTrash2 } from 'react-icons/fi';

export default function ContentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/history').then(({ data }) => setItems(data.items)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/history/${id}`);
    setItems((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) return <LoadingSpinner />;
  if (!items.length) return <p className="text-gray-500 text-sm text-center py-8">No content generated yet.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">{item.type}</span>
              <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            </div>
            <button onClick={() => handleDelete(item._id)} className="text-gray-400 hover:text-red-500 transition"><FiTrash2 size={14} /></button>
          </div>
          <p className="text-sm text-gray-700 font-medium mb-1">{item.prompt}</p>
          <button onClick={() => setExpanded(expanded === item._id ? null : item._id)} className="text-xs text-indigo-600 hover:underline">{expanded === item._id ? 'Hide output' : 'Show output'}</button>
          {expanded === item._id && <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{item.output}</p>}
        </div>
      ))}
    </div>
  );
}
