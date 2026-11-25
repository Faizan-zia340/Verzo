import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { FiLogOut, FiGrid, FiShield, FiFileText, FiZap, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';

const linkClass = 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { setMenuOpen(false); logout(); navigate('/'); };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('penlix-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Close the mobile menu on every navigation.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px]">

        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-8 w-auto dark:hidden" />
          <img src="/brand/penlix-icon.svg" alt="Penlix" className="h-8 w-8 hidden dark:block rounded-lg" />
          <span className="font-black text-gray-900 dark:text-white text-xl tracking-tight">Penlix</span>
        </Link>

        {/* ── Desktop links (lg and up — the logged-in row needs ~900px, so
               it stays hidden through tablet widths where it used to wrap) ── */}
        <div className="hidden lg:flex items-center gap-1">
          <Link to="/pricing" className={linkClass}>Pricing</Link>
          <Link to="/blog" className={linkClass}>Blog</Link>

          {user ? (
            <>
              <Link to="/dashboard" className={linkClass}><FiGrid size={13} /> Dashboard</Link>
              <Link to="/pdf" className={linkClass}><FiFileText size={13} /> PDF Analyzer</Link>
              {user.isAdmin && (
                <Link to="/admin" className="text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition flex items-center gap-1.5">
                  <FiShield size={13} /> Admin
                </Link>
              )}
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg mx-1">
                <FiZap size={11} className="text-amber-500" />
                <span className="text-sm font-bold">{credits ?? user.credits ?? '—'}</span>
                <span className="text-xs text-indigo-400 dark:text-indigo-400 font-medium">credits</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition font-medium"
              >
                <FiLogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                Sign in
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm ml-1">
                Get started free
              </Link>
            </>
          )}
        </div>

        {/* ── Right cluster: always visible (theme toggle + hamburger) ── */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setDarkMode((value) => !value)}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-lg transition"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="lg:hidden text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-lg transition"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu (below lg) ── */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          <Link to="/pricing" className={`${linkClass} w-full`}>Pricing</Link>
          <Link to="/blog" className={`${linkClass} w-full`}>Blog</Link>
          {user ? (
            <>
              <Link to="/dashboard" className={`${linkClass} w-full`}><FiGrid size={13} /> Dashboard</Link>
              <Link to="/pdf" className={`${linkClass} w-full`}><FiFileText size={13} /> PDF Analyzer</Link>
              {user.isAdmin && (
                <Link to="/admin" className="w-full text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-500/10 transition flex items-center gap-1.5">
                  <FiShield size={13} /> Admin
                </Link>
              )}
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg">
                <FiZap size={11} className="text-amber-500" />
                <span className="text-sm font-bold">{credits ?? user.credits ?? '—'}</span>
                <span className="text-xs text-indigo-400 font-medium">credits</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition font-medium"
              >
                <FiLogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`${linkClass} w-full`}>Sign in</Link>
              <Link to="/register" className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center justify-center">
                Get started free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
