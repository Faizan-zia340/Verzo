import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardStats() {
  const { user } = useAuth();
  const { creditLogs } = useCredits();

  const usageData = creditLogs
    .filter((l) => l.type === 'usage')
    .slice(0, 7)
    .map((l, i) => ({ day: `Day ${i + 1}`, used: Math.abs(l.amount) }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Plan</p>
        <p className="text-xl font-bold text-gray-900 capitalize">{user?.subscription}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Credits</p>
        <p className="text-xl font-bold text-indigo-600">{user?.credits}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">Items Generated</p>
        <p className="text-xl font-bold text-gray-900">{creditLogs.filter((l) => l.type === 'usage').length}</p>
      </div>
      {usageData.length > 0 && (
        <div className="col-span-1 md:col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-4">Recent Usage</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={usageData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="used" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
