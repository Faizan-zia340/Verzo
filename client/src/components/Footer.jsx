import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

export default function Footer() {
  const { user, loading } = useAuth();
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-5 w-auto" />
          © 2026 Penlix
        </p>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</Link>
          <Link to="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Blog</Link>
          <Link to="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Pricing</Link>
          {!loading && (user ? (
            <>
              <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Dashboard</Link>
              <Link to="/pdf" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">PDF Analyzer</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Sign in</Link>
              <Link to="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Get started free</Link>
            </>
          ))}
        </nav>
      </div>
    </footer>
  );
}
