import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import { FiCheck, FiZap } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

// Feature lists are marketing copy, not prices — they stay in the page,
// keyed by plan id. Prices and credit amounts come from the API
// (GET /api/billing/packages), which reads the single source of truth
// in server/config/pricing.js.
const PAID_FEATURES = {
  starter: ['50 credits', 'All content types', 'Content history', 'Community support'],
  growth: ['120 credits', 'All content types', 'Content history', 'Priority support', 'RAG generation'],
  pro: ['300 credits', 'All content types', 'Content history', 'Priority support', 'RAG generation', 'Dedicated support'],
};

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPlans = async () => {
    setLoadingPlans(true);
    setLoadError('');
    try {
      const { data } = await api.get('/billing/packages');
      setPlans(data);
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load pricing. Please try again.');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

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

  // Free tier is not a paid package: it comes from the API's freeCredits
  // so the signup offer can never disagree with the server either.
  const displayPlans = plans
    ? [
        {
          id: 'free',
          name: 'Starter',
          price: 'Free',
          credits: plans.freeCredits,
          color: 'gray',
          features: [`${plans.freeCredits} credits on signup`, 'All content types', 'Content history', 'Community support'],
          cta: 'Get Started Free',
          free: true,
        },
        ...plans.packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          price: `$${(pkg.amount / 100).toFixed(2)}`,
          credits: pkg.credits,
          color: pkg.id === 'pro' ? 'accent' : 'brand',
          features: PAID_FEATURES[pkg.id] || [`${pkg.credits} credits`, 'All content types', 'Content history'],
          cta: 'Buy Now',
          popular: pkg.popular,
        })),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <span className="inline-block bg-brand-100 text-brand-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
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

        {loadingPlans ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm bg-red-50 inline-block px-4 py-2 rounded-lg mb-4">{loadError}</p>
            <div>
              <button
                onClick={loadPlans}
                className="py-2.5 px-6 rounded-xl font-semibold text-sm bg-brand-600 text-white hover:bg-brand-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-8 flex flex-col bg-white shadow-sm transition hover:shadow-md
                  ${plan.popular ? 'border-brand-500 ring-2 ring-brand-500' : 'border-gray-200'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
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
                    <FiZap className="text-brand-500" size={14} />
                    <span className="text-sm font-semibold text-brand-600">{plan.credits} credits</span>
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
                      ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md'
                      : plan.free
                        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-accent-600 text-white hover:bg-accent-700'
                    }`}
                >
                  {loadingPlan === plan.id ? <LoadingSpinner size="sm" /> : plan.cta}
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-10">
          Payments are processed securely by Stripe. Credits never expire.
        </p>
      </div>
    </div>
  );
}
