import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';

// Privacy Policy — plain language, and truthful to what Penlix actually
// does. Every claim below matches the code: what is stored, where it is
// stored, and what happens when an account is deleted.
export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-ink-page">
      <Seo
        title="Privacy Policy — Penlix"
        description="How Penlix collects, uses and protects your data, and your rights to download or delete it."
        path="/privacy"
      />
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Last updated: 27 November 2026</p>

        <div className="mt-8 space-y-8 text-gray-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">What Penlix is</h2>
            <p>
              Penlix is an AI content generator. You sign up, you get credits, and you use those credits to
              generate blogs, emails, social posts, ads and other content. This policy explains what data we
              collect when you use it, why we need it, and what you can do about it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Account details:</strong> your name and
                email address, and your password, which is stored only as a one-way hash. We never store your
                password in readable form and we never see it.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Your generations:</strong> the prompts you
                write and the content Penlix generates for you, kept as your history so you can find it again.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Credits and plan:</strong> your credit
                balance, your plan (free, basic or pro), and a record of credit use.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Uploads:</strong> images or audio you
                upload are stored so they can be attached to your content. Images you send with a generation
                and PDF files you analyse are held in memory only while they are processed, then discarded.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Feedback and suggestions:</strong> messages
                you send through the feedback form, and translation suggestions you submit for the glossary.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Verification details:</strong> whether your
                email is verified, and hashed tokens for email verification and password reset. The tokens
                themselves are never stored.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">How we use it</h2>
            <p>
              Your data runs the service: signing you in, generating your content, tracking your credits, and
              showing your history. We use feedback and suggestions to fix bugs and improve the product. We do
              not sell your data, and we do not share it with anyone except the services listed below, which
              are needed to run Penlix.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cookies</h2>
            <p>
              Penlix sets one cookie: a sign-in cookie that keeps you logged in for up to 7 days. It is
              httpOnly, which means JavaScript in the browser cannot read it. We do not set advertising or
              tracking cookies ourselves.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Services we use</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-gray-800 dark:text-slate-100">MongoDB Atlas:</strong> stores your account, generations, credits and history.</li>
              <li><strong className="text-gray-800 dark:text-slate-100">Render:</strong> hosts the Penlix server.</li>
              <li><strong className="text-gray-800 dark:text-slate-100">Vercel:</strong> hosts the Penlix website.</li>
              <li><strong className="text-gray-800 dark:text-slate-100">Resend:</strong> sends verification and password-reset emails.</li>
              <li><strong className="text-gray-800 dark:text-slate-100">Cloudinary:</strong> stores images and audio you upload.</li>
              <li><strong className="text-gray-800 dark:text-slate-100">Google Gemini:</strong> the AI service that generates your content. Your prompts and uploaded files are sent to it to produce the result you asked for.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advertising</h2>
            <p>
              Penlix shows ads served by Google (Google AdSense). Google may use cookies to show ads based on
              your browsing. You can opt out of personalised ads at any time in your Google Ads Settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">How long we keep it</h2>
            <p>
              We keep your data while your account is active. Your history stays until you delete your
              account. When your account is deleted, your profile, your generations and your credit records
              are deleted with it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your rights</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Download your data:</strong> from your{' '}
                <Link to="/dashboard" className="text-indigo-600 dark:text-ink-link underline">Dashboard</Link>,
                use &ldquo;Download my data&rdquo; to get everything Penlix stores about you as one file.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Delete your account:</strong> use the
                Feedback button on any page (category &ldquo;Other&rdquo;) and ask for your account to be
                deleted. We will delete your profile, generations and credit records.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-slate-100">Fix your details:</strong> you can update
                your name from your account, and change your password from the sign-in page.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Changes to this policy</h2>
            <p>
              If this policy changes, we will update the date at the top of this page. If a change affects how
              your data is used, we will say so here before it takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Contact</h2>
            <p>
              Questions about this policy or your data? Use the Feedback button on any page and choose the
              &ldquo;Other&rdquo; category.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
