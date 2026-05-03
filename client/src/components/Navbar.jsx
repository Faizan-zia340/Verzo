import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useCredits } from '../context/CreditContext.js';
import { FiZap, FiLogOut, FiUser } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <FiZap /> AI Content
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/pricing" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">Pricing</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center gap-1"><FiUser /> Dashboard</Link>
              <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">{credits ?? user.credits} credits</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 flex items-center gap-1 text-sm"><FiLogOut /> Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
