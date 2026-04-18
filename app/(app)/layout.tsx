import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { trialDaysRemaining, hasActiveAccess } from '@/types/stripe'
import { NavLink } from '@/components/NavLink'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const sub = subscription as SubscriptionRecord | null
  const daysLeft = trialDaysRemaining(sub)
  const hasAccess = hasActiveAccess(sub)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Disclaimer banner */}
      <div className="bg-brand-cyan border-b border-brand-cyan-dark px-4 py-2 text-center">
        <p className="text-xs text-brand-navy">
          <strong>Study companion only.</strong> Not legal advice or official HRSA guidance.
          Verify against current{' '}
          <a
            href="https://www.hrsa.gov/opa/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-teal"
          >
            HRSA source materials
          </a>
          .
        </p>
      </div>

      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="shrink-0">
              <Image src="/logo.jpeg" alt="340B Ready Trainer" width={110} height={36} className="object-contain" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/modules">Modules</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {daysLeft !== null && (
              <Link
                href="/account/billing"
                className="hidden sm:inline-block text-xs bg-brand-cyan text-brand-navy border border-brand-cyan-dark px-2.5 py-1 rounded-full hover:bg-brand-cyan-dark transition-colors"
              >
                {daysLeft === 0 ? 'Trial ends today' : `${daysLeft}d trial left`}
              </Link>
            )}
            {!hasAccess && sub === null && (
              <Link
                href="/upgrade"
                className="text-xs bg-brand-teal text-white px-3 py-1.5 rounded-lg hover:bg-brand-teal-dark font-medium transition-colors"
              >
                Upgrade
              </Link>
            )}
            <div className="relative group">
              <button className="text-sm text-slate-600 hover:text-brand-navy font-medium px-2 py-1 rounded-lg hover:bg-brand-cyan transition-colors">
                {user.email?.split('@')[0]}
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-20">
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
                >
                  Account
                </Link>
                <Link
                  href="/account/billing"
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
                >
                  Billing
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <form action="/api/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-brand-cyan hover:text-brand-navy"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs text-slate-400 text-center">
            340B Ready is a study companion for educational purposes only. Not legal advice. Not official HRSA guidance.
          </p>
        </div>
      </footer>
    </div>
  )
}
