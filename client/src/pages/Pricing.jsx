import PricingCards from '../components/Pricing.jsx';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Buy credits, use them whenever you want. No subscription required.</p>
        </div>
        <PricingCards />
      </div>
    </div>
  );
}
