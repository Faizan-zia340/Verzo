import { useCredits } from '../context/CreditContext.js';
import { FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function CreditsDisplay() {
  const { credits } = useCredits();
  return (
    <div className="bg-teak-50 dark:bg-ink-raised rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FiZap className="text-teak-600 dark:text-teak-400" />
        <span className="font-semibold text-teak-800 dark:text-teak-400">{credits ?? '—'} credits remaining</span>
      </div>
      <Link to="/pricing" className="text-sm text-indigo-600 dark:text-ink-link hover:underline font-medium">Buy more →</Link>
    </div>
  );
}
