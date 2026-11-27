import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { FiCheck, FiAlertCircle, FiArrowLeft, FiZap } from 'react-icons/fi';
import Seo from '../components/Seo.jsx';

export default function VerifyEmail() {
  const { token } = useParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | done | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        if (cancelled) return;
        if (data.user) setUser(data.user);
        setMessage(data.message || 'Email verified. Your 20 free credits are ready.');
        setStatus('done');
        toast.success('Email verified');
      })
      .catch((err) => {
        if (cancelled) return;
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
        setStatus('failed');
      });
    return () => { cancelled = true; };
  }, [token, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white dark:bg-ink-card">
      <Seo title="Verify Your Penlix Email" description="Verify your Penlix email address to get your 20 free credits." path="/verify-email" noindex />
      <div className="w-full max-w-[360px] text-center">
        {status === 'verifying' && (
          <>
            <span className="inline-block animate-spin h-8 w-8 border-2 border-teak-500 border-t-transparent rounded-full mb-6" />
            <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Verifying your email…</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2">This only takes a moment.</p>
          </>
        )}

        {status === 'done' && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
              <FiCheck size={24} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Email verified</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">{message}</p>
            <Link
              to="/dashboard"
              className="mt-8 w-full bg-teak-600 hover:bg-teak-700 text-white py-3.5 rounded-xl font-bold transition text-sm shadow-lg shadow-teak-200 flex items-center justify-center gap-2"
            >
              <FiZap size={14} /> Start generating
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-200 flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle size={24} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white tracking-tight">Link did not work</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">{message}</p>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
              Sign in and request a fresh verification email from your dashboard.
            </p>
            <Link
              to="/login"
              className="mt-8 w-full bg-teak-600 hover:bg-teak-700 text-white py-3.5 rounded-xl font-bold transition text-sm shadow-lg shadow-teak-200 flex items-center justify-center gap-2"
            >
              Back to sign in
            </Link>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center text-sm">
          <Link to="/" className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 flex items-center gap-1 transition">
            <FiArrowLeft size={12} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
