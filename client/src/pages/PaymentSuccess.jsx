import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Seo from '../components/Seo.jsx';
import api from '../services/api.js';
import { useCredits } from '../context/CreditContext.js';

// Payment Success verifies the Stripe checkout session (?session_id=)
// before claiming anything: success is shown only when the session is
// paid AND the webhook has already credited the purchase. A paid session
// whose webhook hasn't landed yet shows "still processing" — never a
// false "your credits have been added".
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { fetchCredits } = useCredits();
  // verifying | granted | processing | failed | no-session
  const [state, setState] = useState(sessionId ? 'verifying' : 'no-session');
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api.get(`/billing/session/${sessionId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setCredits(data.credits);
        if (data.paymentStatus === 'paid' && data.creditsGranted) {
          setState('granted');
          toast.success('Payment successful — your credits are ready!');
          fetchCredits();
        } else if (data.paymentStatus === 'paid') {
          // Paid, but the webhook hasn't credited the purchase yet.
          setState('processing');
        } else {
          setState('failed');
          setError('This payment did not complete. No credits were charged to your account.');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setState('failed');
        setError(err.response?.data?.message || 'Could not verify your payment yet. Please check your Dashboard — your credits will appear shortly.');
      });
    return () => { cancelled = true; };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = {
    verifying: {
      icon: <span className="animate-spin h-14 w-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4 block" />,
      title: 'Verifying your payment…',
      text: 'Please wait while we confirm your payment with Stripe.',
    },
    granted: {
      icon: <FiCheckCircle size={56} className="text-green-500 mx-auto mb-4" />,
      title: 'Payment Successful!',
      text: credits
        ? `${credits} credits have been added to your account. Start generating content now.`
        : 'Your credits have been added to your account. Start generating content now.',
    },
    processing: {
      icon: <FiClock size={56} className="text-amber-500 mx-auto mb-4" />,
      title: 'Payment received — credits on the way',
      text: 'Your payment went through and we are still adding your credits. They will appear on your Dashboard shortly — check back in a minute or refresh your credits there.',
    },
    failed: {
      icon: <FiAlertCircle size={56} className="text-red-500 mx-auto mb-4" />,
      title: 'We could not confirm this payment',
      text: error || 'We could not confirm this payment. Check your Dashboard — if your credits appear there, you are all set.',
    },
    'no-session': {
      icon: <FiAlertCircle size={56} className="text-amber-500 mx-auto mb-4" />,
      title: 'No payment to verify',
      text: 'This page needs a payment session to check. If you just paid, open it from the link Stripe sent you, or check your Dashboard.',
    },
  }[state];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-page flex items-center justify-center px-4">
      <Seo title="Payment Successful — Penlix" description="Your Penlix payment was successful and your credits are ready to use." path="/payment-success" noindex />
      <div className="bg-white dark:bg-ink-card rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
        {copy.icon}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{copy.title}</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{copy.text}</p>
        <Link to="/dashboard" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition inline-block">Go to Dashboard</Link>
        {state === 'failed' && (
          <div className="mt-3">
            <Link to="/pricing" className="text-sm text-indigo-600 dark:text-ink-link font-medium hover:underline">Back to Pricing</Link>
          </div>
        )}
      </div>
    </div>
  );
}
