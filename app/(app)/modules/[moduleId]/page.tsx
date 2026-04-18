import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessModule } from '@/lib/access/gates'
import type { SubscriptionRecord } from '@/types/stripe'
import { hasActiveAccess } from '@/types/stripe'

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch module
  const { data: module } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .eq('published', true)
    .single()

  if (!module) notFound()

  // Check access
  const access = await canAccessModule(user.id, module.order_index, supabase)

  // Fetch lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, order_index, reading_time_minutes')
    .eq('module_id', moduleId)
    .eq('published', true)
    .order('order_index')

  // Fetch progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  // Fetch best quiz attempt
  const { data: bestAttempt } = await supabase
    .from('quiz_attempts')
    .select('score, passed, submitted_at')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .eq('passed', true)
    .limit(1)
    .maybeSingle()

  const lessonsCompleted: string[] = progress?.lessons_completed ?? []
  const quizPassed = progress?.quiz_passed ?? false
  const totalLessons = lessons?.length ?? 0

  return (
    <div className="max-w-3xl space-y-8">
      {/* Back */}
      <Link href="/modules" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Modules
      </Link>

      {/* Module header */}
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Module {module.order_index}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[module.difficulty] ?? 'bg-slate-100 text-slate-700'}`}>
            {module.difficulty}
          </span>
          {quizPassed && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              ✓ Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2"><span className="text-brand-teal mr-2">⚕</span>{module.title}</h1>
        <p className="text-slate-600 text-sm leading-relaxed">{module.description}</p>
      </div>

      {/* Access gate */}
      {!access.allowed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-900 text-sm mb-1">
            {access.reason === 'subscription_required' ? 'Subscription required' : 'Complete previous module first'}
          </p>
          <p className="text-amber-700 text-xs mb-3">
            {access.reason === 'subscription_required'
              ? 'Start your 3-day free trial to access Modules 2–5.'
              : 'You must pass the previous module quiz before unlocking this module.'}
          </p>
          {access.reason === 'subscription_required' && (
            <Link href="/upgrade" className="inline-block bg-amber-800 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors">
              Start free trial
            </Link>
          )}
        </div>
      )}

      {/* Lessons list */}
      {access.allowed && (
        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-3">Lessons</h2>
          <div className="space-y-2">
            {(lessons ?? []).map((lesson) => {
              const done = lessonsCompleted.includes(lesson.id)
              return (
                <Link
                  key={lesson.id}
                  href={`/modules/${moduleId}/lessons/${lesson.id}`}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-teal hover:shadow-sm transition-all"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {done ? '✓' : lesson.order_index}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-slate-900">{lesson.title}</span>
                    {lesson.reading_time_minutes && (
                      <span className="ml-2 text-xs text-slate-400">{lesson.reading_time_minutes} min</span>
                    )}
                  </div>
                  <span className="text-slate-300 text-sm">→</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Quiz section */}
      {access.allowed && (
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Module Quiz</h2>
          <p className="text-sm text-slate-500 mb-4">
            Score {Math.round(module.quiz_pass_threshold * 100)}% or higher to unlock the next module.
            Failed attempts regenerate with fresh questions and shuffled answers.
          </p>

          {quizPassed ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800 text-sm">Quiz passed ✓</p>
                <p className="text-green-600 text-xs">Next module unlocked.</p>
              </div>
              <Link
                href={`/quiz/${moduleId}`}
                className="text-xs text-green-700 underline"
              >
                Retake
              </Link>
            </div>
          ) : lessonsCompleted.length < Math.min(1, totalLessons) ? (
            <div className="bg-brand-pale border border-slate-200 rounded-xl p-4">
              <p className="text-slate-600 text-sm">
                Start with the lessons above to prepare for the quiz.
              </p>
            </div>
          ) : (
            <Link
              href={`/quiz/${moduleId}`}
              className="inline-block bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Take module quiz →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
