import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — 340B Ready',
}

const EFFECTIVE_DATE = 'April 18, 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-pale">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-brand-navy">340B Ready</Link>
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mt-1">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            This Privacy Policy explains how <strong>Soul Tribe AI, LLC</strong> ("Company", "we", "us", or "our") collects, uses, and protects information about users of 340B Ready ("Service"). By using the Service, you agree to the practices described here.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">1. Information We Collect</h2>
            <p className="text-sm text-slate-600 font-medium">Information you provide directly:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Email address and password (used for authentication)</li>
              <li>Full name (optional, for personalization)</li>
              <li>Payment information (processed by Stripe — we do not store card numbers)</li>
            </ul>
            <p className="text-sm text-slate-600 font-medium mt-3">Information collected automatically:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Learning progress (modules completed, lessons read, quiz scores)</li>
              <li>Session data via authentication cookies (managed by Supabase)</li>
              <li>General usage patterns (no advertising tracking or third-party analytics)</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>To authenticate you and maintain your session</li>
              <li>To track and display your learning progress</li>
              <li>To process subscription payments via Stripe</li>
              <li>To send transactional emails (account confirmation, password reset)</li>
              <li>To improve the Service based on aggregate usage patterns</li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              We do not sell your personal information. We do not use your data for advertising purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">3. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li><strong>Supabase</strong> — Authentication and database hosting. Your account data and progress are stored on Supabase infrastructure. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Supabase Privacy Policy</a></li>
              <li><strong>Stripe</strong> — Payment processing. Card details are handled directly by Stripe and are never stored on our servers. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Stripe Privacy Policy</a></li>
              <li><strong>Vercel</strong> — Application hosting. Requests may be logged at the infrastructure level. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-teal underline">Vercel Privacy Policy</a></li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">4. Cookies and Sessions</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We use authentication cookies to maintain your logged-in session. These are first-party, essential cookies required for the Service to function. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">5. Data Retention</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We retain your account data for as long as your account is active. If you delete your account, your personal data will be removed within 30 days, except where retention is required by law or for fraud prevention purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">6. Your Rights</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to or restrict certain processing of your data</li>
            </ul>
            <p className="text-sm text-slate-600 mt-2">
              To exercise these rights, contact us at <a href="mailto:privacy@340bready.com" className="text-brand-teal underline">privacy@340bready.com</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">7. Security</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We implement industry-standard security measures including encrypted connections (HTTPS), row-level security on our database, and secure session management. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">8. Children's Privacy</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Service is not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">9. Changes to This Policy</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes by email or by notice on the Service. The effective date at the top of this page reflects the most recent revision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Soul Tribe AI, LLC<br />
              Privacy inquiries: <a href="mailto:privacy@340bready.com" className="text-brand-teal underline">privacy@340bready.com</a>
            </p>
          </section>

          <div className="pt-4 border-t border-slate-100">
            <Link href="/" className="text-sm text-brand-teal hover:text-brand-teal-dark">← Back to home</Link>
          </div>
        </div>
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Soul Tribe AI, LLC. All rights reserved.
      </footer>
    </div>
  )
}
