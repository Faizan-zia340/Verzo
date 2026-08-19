import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { FiCheck, FiZap } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    credits: 10,
    color: 'gray',
    features: ['10 credits on signup', 'All content types', 'Content history', 'Community support'],
    cta: 'Get Started Free',
    free: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    credits: 100,
    color: 'indigo',
    features: ['100 credits', 'All content types', 'Content history', 'Priority support', 'RAG generation'],
    cta: 'Buy Now',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$40',
    credits: 500,
    color: 'violet',
    features: ['500 credits', 'All content types', 'Content history', 'Priority support', 'RAG generation', 'Dedicated support'],
    cta: 'Buy Now',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  const handleBuy = async (plan) => {
    if (plan.free) { navigate('/register'); return; }
    if (!user) { navigate('/login'); return; }

    setLoadingPlan(plan.id);
    setError('');
    try {
      const { data } = await api.post('/billing/checkout', { planId: plan.id });
      window.location.href = data.url;
    } catch (err) {
      const message = err.response?.data?.message || 'Could not start checkout. Please try again.';
      setError(message);
      toast.error(message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Pricing
          </span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Buy credits once, use them whenever. No subscriptions, no surprises.
          </p>
          {error && (
            <p className="mt-4 text-red-500 text-sm bg-red-50 inline-block px-4 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col bg-white shadow-sm transition hover:shadow-md
                ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {!plan.free && <span className="text-gray-400 text-sm mb-1">one-time</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <FiZap className="text-indigo-500" size={14} />
                  <span className="text-sm font-semibold text-indigo-600">{plan.credits} credits</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" size={15} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuy(plan)}
                disabled={loadingPlan === plan.id}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2
                  ${plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                    : plan.free
                      ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
              >
                {loadingPlan === plan.id ? <LoadingSpinner size="sm" /> : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Payments are processed securely by Stripe. Credits never expire.
        </p>
      </div>
    </div>
  );
}
