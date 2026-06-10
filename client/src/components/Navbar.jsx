import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { FiEdit3, FiLogOut, FiGrid, FiShield, FiFileText, FiZap } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px]">

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-indigo-200 group-hover:shadow-md transition-shadow">
            <FiEdit3 size={14} className="text-white" />
          </div>
          <span className="font-black text-gray-900 text-xl tracking-tight">Quillify</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/pricing" className="text-gray-500 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition">
            Pricing
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5">
                <FiGrid size={13} /> Dashboard
              </Link>
              <Link to="/pdf" className="text-gray-500 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5">
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
                <span className="text-xs text-indigo-400 font-medium">cr</span>
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
              <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                Sign in
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm ml-1">
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
