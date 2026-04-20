import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess } from '@/types/stripe'
import { CheckoutButton } from '@/components/CheckoutButton'

export default async function UpgradePage() {
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

  // Already subscribed — redirect to billing
  if (hasActiveAccess(sub)) {
    redirect('/account/billing')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900"><span className="text-brand-teal mr-2">⚕</span>Unlock 340B Ready</h1>
        <p className="text-slate-500 text-sm mt-1">
          Start your free trial to access all five modules.
        </p>
      </div>

      <div className="bg-white border-2 border-brand-pale-dark rounded-xl p-7 space-y-5">
        <div>
          <p className="text-3xl font-bold text-slate-900">
            $9.99<span className="text-lg font-normal text-slate-500">/month</span>
          </p>
          <p className="text-sm text-green-600 font-medium mt-0.5">3-day free trial included</p>
        </div>

        <ul className="space-y-2 text-sm text-slate-700">
          {[
            'Access to all 5 learning modules',
            'Quiz gating with shuffled retries',
            'Progress tracking across sessions',
            'Content updated as standards evolve',
            'Cancel any time',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <CheckoutButton />

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          No charge for 3 days. After your trial, you will be billed <strong>$9.99/month</strong> automatically until you cancel. Cancel anytime from your billing settings.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Study companion only.</strong> 340B Ready supports certification prep but is not an
          official HRSA product, not legal advice, and not a substitute for formal training or
          professional counsel.
        </p>
      </div>

      <p className="text-center text-sm">
        <Link href="/modules" className="text-slate-500 hover:text-slate-700">
          ← Back to modules
        </Link>
      </p>
    </div>
  )
}
