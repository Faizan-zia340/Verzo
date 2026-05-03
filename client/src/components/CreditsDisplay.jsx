import { useCredits } from '../context/CreditContext.js';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function CreditsDisplay() {
  const { credits } = useCredits();
  return (
    <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FiZap className="text-indigo-600" />
        <span className="font-semibold text-indigo-800">{credits ?? '—'} credits remaining</span>
      </div>
      <Link to="/pricing" className="text-sm text-indigo-600 hover:underline font-medium">Buy more →</Link>
    </div>
  );
}
