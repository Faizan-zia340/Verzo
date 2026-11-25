import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <img src="/brand/logo-mark.svg" alt="Verzo" className="h-5 w-auto" />
          © 2026 Verzo
        </p>
        <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
          <Link to="/pricing" className="hover:text-indigo-600 transition">Pricing</Link>
          <Link to="/login" className="hover:text-indigo-600 transition">Sign in</Link>
          <Link to="/register" className="hover:text-indigo-600 transition">Get started free</Link>
        </nav>
      </div>
    </footer>
  );
}
