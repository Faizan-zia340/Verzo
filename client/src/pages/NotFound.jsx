import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import Seo from '../components/Seo.jsx';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Seo title="Page Not Found — Penlix" description="The page you are looking for does not exist or was moved." noindex />
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-teak-600 dark:text-teak-400 tracking-tight">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400 leading-relaxed">
          The page you are looking for does not exist or was moved. Check the address, or head back home to keep creating.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-teak-700 transition shadow-sm"
        >
          <FiHome size={15} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
