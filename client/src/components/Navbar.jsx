import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { FiLogOut, FiGrid, FiShield, FiFileText, FiZap, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('penlix-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const themeButton = (
    <button
      onClick={() => setDarkMode((value) => !value)}
      className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
    </button>
  );

  const linkClass = 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition';

  return (
    <>
      <nav className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px]">

          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-8 w-auto dark:hidden" />
            <img src="/brand/penlix-mark-white.svg" alt="Penlix" className="h-8 w-auto hidden dark:block" />
            <span className="font-black text-gray-900 dark:text-white text-xl tracking-tight">Penlix</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {themeButton}
            <Link to="/pricing" className={linkClass}>
              Pricing
            </Link>
            <Link to="/blog" className={linkClass}>
              Blog
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" className={`${linkClass} flex items-center gap-1.5`}>
                  <FiGrid size={13} /> Dashboard
                </Link>
                <Link to="/pdf" className={`${linkClass} flex items-center gap-1.5`}>
                  <FiFileText size={13} /> PDF Analyzer
                </Link>
                {user.isAdmin && (
                  <Link to="/admin" className="text-violet-600 hover:text-violet-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-violet-50 transition flex items-center gap-1.5">
                    <FiShield size={13} /> Admin
                  </Link>
                )}
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg mx-1">
                  <FiZap size={11} className="text-indigo-500" />
                  <span className="text-sm font-bold">{credits ?? user.credits}</span>
                  <span className="text-xs text-indigo-400 font-medium">credits</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition font-medium"
                >
                  <FiLogOut size={13} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                  Sign in
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm ml-1">
                  Get started free
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            {themeButton}
            <button
              onClick={() => setMenuOpen((value) => !value)}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer (right side) ───────────────────────────────
          Rendered outside <nav>: the nav's backdrop-blur would trap the
          fixed positioning. Same drawer pattern as the Admin sidebar:
          backdrop closes on tap, links close via the pathname effect. */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <div className={`fixed inset-y-0 right-0 z-[70] md:hidden w-72 max-w-[85vw] bg-white dark:bg-gray-950 shadow-2xl flex flex-col transition-transform duration-300 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-7 w-auto dark:hidden" />
            <img src="/brand/penlix-mark-white.svg" alt="Penlix" className="h-7 w-auto hidden dark:block" />
            <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">Penlix</span>
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <FiX size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          <Link to="/pricing" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Pricing
          </Link>
          <Link to="/blog" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Blog
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FiGrid size={14} /> Dashboard
              </Link>
              <Link to="/pdf" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <FiFileText size={14} /> PDF Analyzer
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 text-violet-600 hover:text-violet-800 text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950 transition">
                  <FiShield size={14} /> Admin
                </Link>
              )}
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg">
                <FiZap size={12} className="text-indigo-500" />
                <span className="text-sm font-bold">{credits ?? user.credits}</span>
                <span className="text-xs text-indigo-400 font-medium">credits</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 text-sm px-3 py-2.5 rounded-lg transition font-medium"
              >
                <FiLogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                Sign in
              </Link>
              <Link to="/register" className="block bg-indigo-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm text-center">
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
