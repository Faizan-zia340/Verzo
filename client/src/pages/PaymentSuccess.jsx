import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useCredits } from '../context/CreditContext.js';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const { fetchCredits } = useCredits();
  const [state, setState] = useState({ status: 'loading', creditsAdded: 0, planId: null });

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) { setState({ status: 'missing', creditsAdded: 0, planId: null }); return; }
    let cancelled = false;
    api.get(`/billing/session/${sessionId}`)
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.paid) { setState({ status: 'unpaid', creditsAdded: 0, planId: null }); return; }
        setState({ status: data.credited ? 'credited' : 'processing', creditsAdded: data.creditsAdded, planId: data.planId });
        fetchCredits();
        if (data.credited) toast.success('Payment successful — your credits are ready!');
      })
      .catch(() => { if (!cancelled) setState({ status: 'error', creditsAdded: 0, planId: null }); });
    return () => { cancelled = true; };
  }, [params, fetchCredits]);

  const body = {
    loading: {
      icon: <span className="animate-spin h-14 w-14 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />,
      title: 'Verifying your payment…',
      text: 'Checking with Stripe — this only takes a moment.',
    },
    credited: {
      icon: <FiCheckCircle size={56} className="text-green-500 mx-auto mb-4" />,
      title: 'Payment Successful!',
      text: `${state.creditsAdded} credits have been added to your account. Start generating content now.`,
    },
    processing: {
      icon: <FiClock size={56} className="text-amber-500 mx-auto mb-4" />,
      title: 'Payment received — credits on the way',
      text: `Your payment went through for ${state.creditsAdded} credits. They usually appear within a minute — check your dashboard.`,
    },
    unpaid: {
      icon: <FiAlertCircle size={56} className="text-amber-500 mx-auto mb-4" />,
      title: 'Payment not completed',
      text: 'This checkout was not paid. No credits were added — you can try again from the pricing page.',
    },
    missing: {
      icon: <FiAlertCircle size={56} className="text-amber-500 mx-auto mb-4" />,
      title: 'No payment to verify',
      text: 'This page needs a checkout session. If you just paid and landed here, check your dashboard — or start a new checkout.',
    },
    error: {
      icon: <FiAlertCircle size={56} className="text-red-500 mx-auto mb-4" />,
      title: 'Could not verify payment',
      text: 'Something went wrong while checking with Stripe. Your payment may still have gone through — check your dashboard or try again.',
    },
  }[state.status];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-10 max-w-md w-full text-center">
        {body.icon}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{body.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{body.text}</p>
        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition inline-block">Go to Dashboard</Link>
          {(state.status === 'unpaid' || state.status === 'missing' || state.status === 'error') && (
            <Link to="/pricing" className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition inline-block">Back to Pricing</Link>
          )}
        </div>
      </div>
    </div>
  );
}
