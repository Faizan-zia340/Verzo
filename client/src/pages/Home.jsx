import { Link } from 'react-router-dom';
import { FiZap, FiEdit3, FiTrendingUp } from 'react-icons/fi';

export default function Home() {
  return (
    <main className="bg-gradient-to-br from-indigo-50 to-white min-h-screen">
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <span className="inline-block bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">AI-Powered Content Generation</span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">Create great content <br className="hidden sm:block" /><span className="text-indigo-600">in seconds</span></h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Generate blog posts, social media captions, emails, ads, and product descriptions with the power of AI.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-md">Start for free</Link>
          <Link to="/pricing" className="border border-indigo-300 text-indigo-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition">View pricing</Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: FiZap, title: 'Fast Generation', desc: 'Get high-quality content in under 10 seconds.' },
          { icon: FiEdit3, title: '5 Content Types', desc: 'Blog, social, email, ads, and product copy.' },
          { icon: FiTrendingUp, title: 'Credit System', desc: 'Pay only for what you use with flexible credit packs.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4"><Icon size={22} className="text-indigo-600" /></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-sm">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
