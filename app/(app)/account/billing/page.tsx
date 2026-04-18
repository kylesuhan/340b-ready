import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess, trialDaysRemaining } from '@/types/stripe'
import { formatDate } from '@/lib/utils'
import { PortalButton } from '@/components/PortalButton'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  trialing: { label: 'Trial active', className: 'bg-brand-pale text-brand-navy' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  past_due: { label: 'Payment overdue', className: 'bg-red-100 text-red-700' },
  canceled: { label: 'Canceled', className: 'bg-slate-100 text-slate-500' },
  unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-700' },
  incomplete: { label: 'Incomplete', className: 'bg-yellow-100 text-yellow-700' },
  incomplete_expired: { label: 'Expired', className: 'bg-slate-100 text-slate-500' },
  paused: { label: 'Paused', className: 'bg-yellow-100 text-yellow-700' },
}

export default async function BillingPage() {
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
  const hasAccess = hasActiveAccess(sub)
  const daysLeft = trialDaysRemaining(sub)
  const statusInfo = sub ? STATUS_LABELS[sub.status] : null

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription.</p>
      </div>

      {sub ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">340B Ready Pro</h2>
            {statusInfo && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {sub.status === 'trialing' && sub.trial_end && (
              <div className="flex justify-between text-slate-600">
                <span>Trial ends</span>
                <span className="font-medium">
                  {formatDate(sub.trial_end)}
                  {daysLeft !== null && daysLeft <= 1 && (
                    <span className="ml-1 text-amber-600">(soon)</span>
                  )}
                </span>
              </div>
            )}
            {sub.status === 'active' && sub.current_period_end && (
              <div className="flex justify-between text-slate-600">
                <span>Next billing date</span>
                <span className="font-medium">{formatDate(sub.current_period_end)}</span>
              </div>
            )}
            {sub.cancel_at_period_end && (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs">
                Your subscription will cancel at the end of the current period.
              </div>
            )}
          </div>

          <PortalButton />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-center">
          <p className="text-slate-600 text-sm">No active subscription.</p>
          <Link
            href="/upgrade"
            className="inline-block bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Start free trial
          </Link>
        </div>
      )}

      {!hasAccess && sub && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800 font-medium mb-1">Access expired</p>
          <p className="text-xs text-amber-700 mb-3">Your trial or subscription has ended. Resubscribe to regain access.</p>
          <Link
            href="/upgrade"
            className="inline-block bg-amber-800 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors"
          >
            Resubscribe
          </Link>
        </div>
      )}
    </div>
  )
}
