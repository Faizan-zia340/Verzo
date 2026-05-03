import { Link } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$4.99', credits: 50, features: ['50 credits', 'All content types', 'Email support'] },
  { id: 'growth', name: 'Growth', price: '$9.99', credits: 120, features: ['120 credits', 'All content types', 'Priority support', 'Content history'], popular: true },
  { id: 'pro', name: 'Pro', price: '$19.99', credits: 300, features: ['300 credits', 'All content types', 'Priority support', 'Content history', 'API access'] },
];

export default function PricingCards({ onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {PLANS.map((plan) => (
        <div key={plan.id} className={`relative rounded-2xl border p-6 ${plan.popular ? 'border-indigo-500 shadow-lg' : 'border-gray-200'}`}>
          {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>}
          <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
          <p className="text-3xl font-extrabold text-indigo-600 mb-4">{plan.price}</p>
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><FiCheck className="text-green-500 flex-shrink-0" />{f}</li>
            ))}
          </ul>
          {onSelect ? (
            <button onClick={() => onSelect(plan.id)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm">Select {plan.name}</button>
          ) : (
            <Link to="/register" className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition text-sm">Get Started</Link>
          )}
        </div>
      ))}
    </div>
  );
}
