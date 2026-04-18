import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — 340B Ready',
}

const EFFECTIVE_DATE = 'April 18, 2026'

export default function TermsPage() {
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
            <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-500 mt-1">Effective date: {EFFECTIVE_DATE}</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            These Terms of Service ("Terms") govern your use of 340B Ready, a certification prep study companion operated by <strong>Soul Tribe AI, LLC</strong> ("Company", "we", "us", or "our"). By creating an account or using the Service, you agree to these Terms.
          </p>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">1. Description of Service</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              340B Ready is an educational study companion designed to help healthcare professionals prepare for 340B Drug Pricing Program certification examinations. The Service includes learning modules, quizzes, and progress tracking.
            </p>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              The Service is for educational purposes only. It is not legal advice, not official guidance from the Health Resources and Services Administration (HRSA), and not a substitute for formal professional training or qualified legal counsel. Always verify information against current HRSA source materials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">2. Accounts and Eligibility</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You must be at least 18 years old to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">3. Subscriptions and Billing</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Module 1 is available free of charge. Access to Modules 2–5 requires an active paid subscription.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li><strong>Free Trial:</strong> New subscribers receive a 3-day free trial. No charge is made during the trial period.</li>
              <li><strong>Recurring Billing:</strong> After your trial ends, you will be automatically charged the then-current monthly subscription fee ($9.99/month as of the effective date) on a recurring monthly basis until you cancel.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your Billing settings. Cancellation takes effect at the end of the current billing period. You will retain access to paid content through that date.</li>
              <li><strong>Refunds:</strong> Subscription fees are non-refundable except where required by applicable law. Unused time in a billing period is not refunded upon cancellation.</li>
              <li><strong>Price Changes:</strong> We may change subscription pricing with at least 30 days' notice to your registered email address.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">4. Acceptable Use</h2>
            <p className="text-sm text-slate-600 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Share your account credentials with others</li>
              <li>Reproduce, distribute, or resell any content from the Service</li>
              <li>Attempt to reverse-engineer, scrape, or extract content or questions in bulk</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to circumvent subscription or access controls</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">5. Intellectual Property</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              All content, design, and code in the Service are the property of Soul Tribe AI, LLC and are protected by applicable copyright and intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes only.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">6. Disclaimer of Warranties</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE CONTENT IS ACCURATE, COMPLETE, UP-TO-DATE, OR SUITABLE FOR ANY PARTICULAR PURPOSE. REGULATORY STANDARDS CHANGE FREQUENTLY — ALWAYS VERIFY AGAINST CURRENT HRSA GUIDANCE.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">7. Limitation of Liability</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOUL TRIBE AI, LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">8. Changes to Terms</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by email or by prominent notice on the Service. Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">9. Governing Law</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              These Terms are governed by the laws of the State of Texas, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Soul Tribe AI, LLC<br />
              For questions about these Terms, contact us at: <a href="mailto:legal@340bready.com" className="text-brand-teal underline">legal@340bready.com</a>
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
