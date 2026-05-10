import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { FiZap, FiLogOut, FiUser, FiShield, FiFileText } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <FiZap /> AI Content
        </Link>
        <div className="flex items-center gap-5">
          <Link to="/pricing" className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition">Pricing</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center gap-1.5 transition">
                <FiUser size={13} /> Dashboard
              </Link>
              <Link to="/pdf" className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center gap-1.5 transition">
                <FiFileText size={13} /> PDF Analyzer
              </Link>
              {user.isAdmin && (
                <Link to="/admin" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1.5 transition">
                  <FiShield size={13} /> Admin
                </Link>
              )}
              <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                <FiZap size={11} /> {credits ?? user.credits}
              </span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm transition">
                <FiLogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 text-sm font-medium transition">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
