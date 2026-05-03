import { useEffect } from 'react';
import { useCredits } from '../context/CreditContext.js';
import { useAuth } from '../context/AuthContext.js';
import DashboardStats from '../components/Dashboard.jsx';
import Generator from '../components/Generator.jsx';
import ContentHistory from '../components/ContentHistory.jsx';
import CreditsDisplay from '../components/CreditsDisplay.jsx';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const [tab, setTab] = useState('generate');

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hi, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Here's your content dashboard.</p>
        </div>
        <CreditsDisplay />
        <DashboardStats />
        <div className="flex gap-2 mb-6">
          {['generate', 'history'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {tab === 'generate' ? <Generator /> : <ContentHistory />}
      </div>
    </div>
  );
}
