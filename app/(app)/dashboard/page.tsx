import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess, trialDaysRemaining } from '@/types/stripe'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch modules
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .eq('published', true)
    .order('order_index')

  // Fetch user progress for all modules
  const { data: progressRows } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const sub = subscription as SubscriptionRecord | null
  const hasAccess = hasActiveAccess(sub)
  const daysLeft = trialDaysRemaining(sub)

  const progressMap = new Map(
    (progressRows ?? []).map((p) => [p.module_id, p])
  )

  // Build module status array
  const moduleStatuses = (modules ?? []).map((m, idx) => {
    const progress = progressMap.get(m.id)
    const prevPassed = idx === 0 || progressMap.get((modules ?? [])[idx - 1]?.id)?.quiz_passed
    const subscriptionLocked = !m.is_free && !hasAccess
    const quizLocked = !m.is_free && idx > 0 && !prevPassed
    const isLocked = subscriptionLocked || (idx > 0 && !prevPassed && !m.is_free)
    const lessonsCompleted = progress?.lessons_completed?.length ?? 0
    const quizPassed = progress?.quiz_passed ?? false

    return { ...m, progress, isLocked: subscriptionLocked || (idx > 0 && !(progressMap.get((modules ?? [])[idx - 1]?.id)?.quiz_passed)), lessonsCompleted, quizPassed }
  })

  // Find the current recommended module
  const currentModule = moduleStatuses.find(m => !m.isLocked && !m.quizPassed) ?? moduleStatuses[0]

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name ? profile.full_name.split(' ')[0] : user.email?.split('@')[0]

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{name ? `, ${name}` : ''}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Your 340B certification prep dashboard.</p>
      </div>

      {/* Subscription / trial notice */}
      {sub?.status === 'trialing' && daysLeft !== null && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-800">
            <strong>Free trial active.</strong>{' '}
            {daysLeft === 0
              ? 'Your trial ends today.'
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`}
          </p>
          <Link
            href="/account/billing"
            className="text-xs font-medium text-blue-700 underline shrink-0"
          >
            Manage
          </Link>
        </div>
      )}

      {!hasAccess && !sub && (
        <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Unlock all 5 modules</p>
            <p className="text-slate-300 text-xs mt-0.5">Start your 3-day free trial. No card required until trial ends.</p>
          </div>
          <Link
            href="/upgrade"
            className="bg-white text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            Start trial
          </Link>
        </div>
      )}

      {/* Continue learning */}
      {currentModule && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Continue learning</h2>
          <Link
            href={currentModule.isLocked ? '/upgrade' : `/modules/${currentModule.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                {currentModule.order_index}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{currentModule.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[currentModule.difficulty] ?? 'bg-slate-100 text-slate-700'}`}>
                    {currentModule.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{currentModule.description}</p>
                {currentModule.lessonsCompleted > 0 && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    {currentModule.lessonsCompleted} lesson{currentModule.lessonsCompleted !== 1 ? 's' : ''} completed
                  </p>
                )}
              </div>
              <span className="text-slate-300 text-lg">→</span>
            </div>
          </Link>
        </div>
      )}

      {/* All modules */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">All modules</h2>
        <div className="space-y-2">
          {moduleStatuses.map((m, idx) => (
            <Link
              key={m.id}
              href={m.isLocked ? (m.is_free ? `/modules/${m.id}` : '/upgrade') : `/modules/${m.id}`}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                m.quizPassed ? 'bg-green-100 text-green-700' : m.isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'
              }`}>
                {m.quizPassed ? '✓' : m.isLocked ? '🔒' : m.order_index}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-slate-900">{m.title}</span>
                <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[m.difficulty] ?? ''}`}>
                  {m.difficulty}
                </span>
              </div>
              <div className="text-xs text-slate-400 shrink-0">
                {m.quizPassed ? (
                  <span className="text-green-600 font-medium">Passed</span>
                ) : m.lessonsCompleted > 0 ? (
                  `${m.lessonsCompleted} done`
                ) : m.isLocked ? (
                  m.is_free ? '' : !hasAccess ? 'Requires subscription' : 'Prev quiz required'
                ) : (
                  'Start'
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
