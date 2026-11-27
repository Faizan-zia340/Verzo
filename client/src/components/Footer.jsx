import { Link } from 'react-router-dom';

const columns = [
  {
    heading: 'Product',
    links: [
      { to: '/dashboard', label: 'Generator' },
      { to: '/pdf', label: 'PDF Analyzer' },
      { to: '/pricing', label: 'Pricing' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { to: '/blog', label: 'Blog' },
      { to: '/', label: 'Home' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { to: '/login', label: 'Sign in' },
      { to: '/register', label: 'Get started free' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-50 dark:bg-ink-page border-t border-gray-100 dark:border-slate-800">
      {/* pb-24 leaves clearance for the fixed Feedback button so it
          never covers the bottom row (copyright / tagline). */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/brand/penlix-mark.svg" alt="Penlix" className="h-8 w-auto dark:hidden" />
              <img src="/brand/penlix-mark-white.svg" alt="Penlix" className="h-8 w-auto hidden dark:block" />
              <span className="font-black text-gray-900 dark:text-white text-xl tracking-tight">Penlix</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Content, Generated Intelligently — blogs, emails, social posts and ads in minutes.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{column.heading}</h3>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-ink-link transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">© {year} Penlix. All rights reserved.</p>
          <p className="text-sm text-gray-400 dark:text-slate-500">Made for creators, marketers and teams.</p>
        </div>
      </div>
    </footer>
  );
}
