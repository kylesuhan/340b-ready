import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess, trialDaysRemaining, hasComplianceAccess } from '@/types/stripe'
import { xpToLevel, BADGES } from '@/lib/gamification'

const DIFFICULTY_COLORS: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
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
  const hasCompliance = hasComplianceAccess(sub)

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

  // Fetch gamification data
  const { data: gamRow } = await supabase
    .from('user_gamification')
    .select('xp, level, current_streak, longest_streak, leaderboard_opt_in')
    .eq('user_id', user.id)
    .single()

  const { data: badgeRows } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)

  const myLevel = xpToLevel(gamRow?.xp ?? 0)
  const earnedBadgeIds = new Set((badgeRows ?? []).map((b: { badge_id: string }) => b.badge_id))

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back{name ? `, ${name}` : ''}
        </h1>
        <p className="text-slate-500 mt-1 text-sm"><span className="text-brand-teal mr-1">⚕</span> Your 340B Learning Platform dashboard.</p>
      </div>

      {/* Subscription / trial notice */}
      {sub?.status === 'trialing' && daysLeft !== null && (
        <div className="bg-brand-pale border border-brand-pale-dark rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-brand-navy">
            <strong>Free trial active.</strong>{' '}
            {daysLeft === 0
              ? 'Your trial ends today.'
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`}
          </p>
          <Link
            href="/account/billing"
            className="text-xs font-medium text-brand-navy underline shrink-0"
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

      {/* Compliance Monitor teaser / CTA */}
      <div className={`rounded-xl p-5 border flex items-center justify-between gap-4 ${
        hasCompliance
          ? 'bg-brand-cyan border-brand-cyan-dark'
          : 'bg-white border-slate-200'
      }`}>
        <div>
          <p className="font-semibold text-brand-navy text-sm">
            <span className="text-brand-teal mr-1">⚕</span>
            {hasCompliance ? 'Compliance Monitor' : 'New: 340B Compliance Monitor'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {hasCompliance
              ? 'Track daily Federal Register updates and HRSA regulatory changes.'
              : 'Track regulatory changes automatically. Daily Federal Register scanning + AI summaries.'}
          </p>
        </div>
        <Link
          href={hasCompliance ? '/compliance' : '/compliance-upgrade'}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
            hasCompliance
              ? 'bg-brand-navy text-white hover:bg-brand-navy-dark'
              : 'bg-brand-teal text-white hover:bg-brand-teal-dark'
          }`}
        >
          {hasCompliance ? 'Open →' : 'Learn more →'}
        </Link>
      </div>

      {/* Continue learning */}
      {currentModule && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3"><span className="text-brand-teal mr-1.5">⚕</span>Continue learning</h2>
          <Link
            href={currentModule.isLocked ? '/upgrade' : `/modules/${currentModule.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-brand-teal hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-navy text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
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
                  <p className="text-xs text-brand-teal mt-2 font-medium">
                    {currentModule.lessonsCompleted} lesson{currentModule.lessonsCompleted !== 1 ? 's' : ''} completed
                  </p>
                )}
              </div>
              <span className="text-slate-300 text-lg">→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Gamification panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900"><span className="text-brand-teal mr-1.5">⚕</span>Your progress</h2>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="text-xs text-slate-500 hover:text-slate-700 underline">Leaderboard</Link>
            <Link href="/certificate" className="text-xs text-slate-500 hover:text-slate-700 underline">Certificate</Link>
          </div>
        </div>

        {/* XP + streak row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-brand-pale rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-brand-navy">{gamRow?.xp ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">XP earned</p>
          </div>
          <div className="bg-brand-pale rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-brand-teal">{myLevel.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">Level {myLevel.level}</p>
          </div>
          <div className="bg-brand-pale rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-orange-500">🔥 {gamRow?.current_streak ?? 0}</p>
            <p className="text-xs text-slate-500 mt-0.5">Day streak</p>
          </div>
        </div>

        {/* XP progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-slate-600">Level {myLevel.level} — {myLevel.label}</p>
            {myLevel.nextLevelXp && (
              <p className="text-xs text-slate-400">{gamRow?.xp ?? 0} / {myLevel.nextLevelXp} XP</p>
            )}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-brand-teal h-2 rounded-full transition-all"
              style={{ width: `${myLevel.progress}%` }}
            />
          </div>
        </div>

        {/* Earned badges */}
        {earnedBadgeIds.size > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Badges earned</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(BADGES).filter(b => earnedBadgeIds.has(b.id)).map(b => (
                <div key={b.id} title={b.description} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <span className="text-base">{b.icon}</span>
                  <span className="text-xs font-medium text-slate-700">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All modules */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3"><span className="text-brand-teal mr-1.5">⚕</span>All modules</h2>
        <div className="space-y-2">
          {moduleStatuses.map((m, idx) => (
            <Link
              key={m.id}
              href={m.isLocked ? (m.is_free ? `/modules/${m.id}` : '/upgrade') : `/modules/${m.id}`}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                m.quizPassed ? 'bg-green-100 text-green-700' : m.isLocked ? 'bg-slate-100 text-slate-400' : 'bg-brand-pale text-brand-teal'
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
