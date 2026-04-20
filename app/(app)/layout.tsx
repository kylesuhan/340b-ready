import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { trialDaysRemaining, hasActiveAccess, hasComplianceAccess } from '@/types/stripe'
import { NavLink } from '@/components/NavLink'
import { MobileNav } from '@/components/MobileNav'
import { UserDropdown } from '@/components/UserDropdown'

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
  const hasCompliance = hasComplianceAccess(sub)
  const userLabel = user.email ?? ''

  return (
    <div className="min-h-screen bg-brand-pale">
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 relative">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="shrink-0">
              <Image src="/logo.jpeg" alt="340B Ready Trainer" width={110} height={36} style={{ height: '34px', width: 'auto' }} className="object-contain" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/modules">Modules</NavLink>
              {hasCompliance
                ? <NavLink href="/compliance"><span className="text-brand-teal mr-1">⚕</span>Compliance</NavLink>
                : <Link href="/compliance-upgrade" className="text-sm font-medium px-3 py-1.5 rounded-lg text-brand-teal hover:bg-brand-cyan transition-colors border border-brand-teal/30">⚕ Compliance</Link>
              }
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
                className="hidden sm:inline-block text-xs bg-brand-teal text-white px-3 py-1.5 rounded-lg hover:bg-brand-teal-dark font-medium transition-colors"
              >
                Upgrade
              </Link>
            )}
            {/* Desktop user dropdown */}
            <UserDropdown label={user.email?.split('@')[0] ?? 'Account'} />

            {/* Mobile hamburger menu */}
            <MobileNav
              hasCompliance={hasCompliance}
              hasAccess={hasAccess}
              userLabel={userLabel}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            340B Ready is a study companion for educational purposes only. Not legal advice. Not official HRSA guidance.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
            <Link href="/terms" className="hover:text-slate-600">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
            <span>© {new Date().getFullYear()} Soul Tribe AI, LLC</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
