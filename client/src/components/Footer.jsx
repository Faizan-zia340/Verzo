import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <img src="/logo.png" alt="Verzo logo" className="w-5 h-5 rounded" />
          © 2026 Verzo
        </p>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Home</Link>
          <Link to="/blog" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Blog</Link>
          <Link to="/pricing" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Pricing</Link>
          <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Sign in</Link>
          <Link to="/register" className="hover:text-brand-600 dark:hover:text-brand-400 transition">Get started free</Link>
        </nav>
      </div>
    </footer>
  );
}
