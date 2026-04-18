import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasComplianceAccess } from '@/types/stripe'
import { ComplianceCheckoutButton } from '@/components/ComplianceCheckoutButton'

export default async function ComplianceUpgradePage() {
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

  // Already has compliance access — redirect to compliance dashboard
  if (hasComplianceAccess(sub)) {
    redirect('/compliance')
  }

  const features = [
    'Daily Federal Register scanning for 340B-related rules, notices & proposed rules',
    'Claude AI plain-English summaries of every regulatory change',
    'Urgency classification (informational / action-required / deadline)',
    'Per-item review tracking (reviewed / actioned / dismissed)',
    'Affected entity tagging (covered entity, manufacturer, TPA, contract pharmacy)',
    'Everything in the Certification Prep plan (Modules 1–5)',
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-teal mr-2">⚕</span>340B Compliance Monitor
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Stay ahead of regulatory changes. Built for covered entities, contract pharmacies, and
          compliance officers.
        </p>
      </div>

      <div className="bg-white border-2 border-brand-pale-dark rounded-xl p-7 space-y-5">
        <div>
          <p className="text-3xl font-bold text-slate-900">
            $49<span className="text-lg font-normal text-slate-500">/month</span>
          </p>
          <p className="text-sm text-green-600 font-medium mt-0.5">Includes 3-day free trial</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            What&apos;s included
          </p>
          <ul className="space-y-2 text-sm text-slate-700">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ComplianceCheckoutButton />

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          No charge for 3 days. After trial, $49/month billed automatically until cancelled.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Study companion only.</strong> 340B Ready surfaces regulatory changes for
          awareness but is not a legal compliance service. Always verify with qualified 340B
          compliance counsel.
        </p>
      </div>

      <p className="text-center text-sm">
        <Link href="/modules" className="text-slate-500 hover:text-slate-700">
          Already have Cert Prep? ← Back to modules
        </Link>
      </p>
    </div>
  )
}
