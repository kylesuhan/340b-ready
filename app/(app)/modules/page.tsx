import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess } from '@/types/stripe'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-blue-100 text-blue-700 border-blue-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-orange-100 text-orange-700 border-orange-200',
  expert: 'bg-red-100 text-red-700 border-red-200',
}

export default async function ModulesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('published', true)
    .order('order_index')

  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const sub = subscription as SubscriptionRecord | null
  const hasAccess = hasActiveAccess(sub)
  const progressMap = new Map((progressRows ?? []).map((p) => [p.module_id, p]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900"><span className="text-brand-teal mr-2">⚕</span>Modules</h1>
        <p className="text-slate-500 text-sm mt-1">
          Five progressive modules from foundational to exam-ready. Complete each quiz to unlock the next.
        </p>
      </div>

      <div className="grid gap-4">
        {(modules ?? []).map((m, idx) => {
          const progress = progressMap.get(m.id)
          const prevModule = idx > 0 ? (modules ?? [])[idx - 1] : null
          const prevProgress = prevModule ? progressMap.get(prevModule.id) : null
          const subscriptionLocked = !m.is_free && !hasAccess
          const quizGateLocked = idx > 0 && !prevProgress?.quiz_passed
          const isLocked = subscriptionLocked || (idx > 0 && quizGateLocked && !hasAccess)
          const quizPassed = progress?.quiz_passed ?? false
          const lessonsCompleted = progress?.lessons_completed?.length ?? 0

          let lockReason = ''
          if (subscriptionLocked) lockReason = 'Requires active subscription'
          else if (idx > 0 && quizGateLocked) lockReason = `Complete Module ${idx} quiz first`

          return (
            <div
              key={m.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                    quizPassed ? 'bg-green-100 text-green-700' : isLocked ? 'bg-slate-100 text-slate-400' : 'bg-brand-navy text-white'
                  }`}>
                    {quizPassed ? '✓' : isLocked ? '🔒' : m.order_index}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="font-semibold text-slate-900">{m.title}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[m.difficulty] ?? ''}`}>
                        {m.difficulty}
                      </span>
                      {m.is_free && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Free
                        </span>
                      )}
                      {quizPassed && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{m.description}</p>

                    {lockReason && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                        🔒 {lockReason}
                      </p>
                    )}

                    {lessonsCompleted > 0 && !quizPassed && !isLocked && (
                      <p className="mt-2 text-xs text-brand-teal font-medium">
                        {lessonsCompleted} lesson{lessonsCompleted !== 1 ? 's' : ''} completed
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-3 bg-brand-pale flex items-center justify-between">
                {isLocked ? (
                  <Link
                    href={subscriptionLocked ? '/upgrade' : '/modules'}
                    className="text-sm text-slate-500"
                  >
                    {subscriptionLocked ? 'Unlock with subscription →' : 'Complete previous module first'}
                  </Link>
                ) : (
                  <Link
                    href={`/modules/${m.id}`}
                    className="text-sm font-medium text-brand-teal hover:text-brand-teal-dark"
                  >
                    {quizPassed ? 'Review module →' : lessonsCompleted > 0 ? 'Continue →' : 'Start module →'}
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
