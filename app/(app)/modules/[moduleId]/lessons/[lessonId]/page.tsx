import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessModule } from '@/lib/access/gates'
import { renderMarkdown } from '@/lib/markdown'
import { NextLessonButton } from '@/components/NextLessonButton'

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>
}) {
  const { moduleId, lessonId } = await params
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
    .single()

  if (!module) notFound()

  // Check access
  const access = await canAccessModule(user.id, module.order_index, supabase)
  if (!access.allowed) redirect(`/modules/${moduleId}`)

  // Fetch lesson
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .eq('module_id', moduleId)
    .single()

  if (!lesson) notFound()

  // Fetch all lessons in module for navigation
  const { data: allLessons } = await supabase
    .from('lessons')
    .select('id, order_index, title')
    .eq('module_id', moduleId)
    .eq('published', true)
    .order('order_index')

  const currentIndex = (allLessons ?? []).findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? (allLessons ?? [])[currentIndex - 1] : null
  const nextLesson = currentIndex < (allLessons ?? []).length - 1 ? (allLessons ?? [])[currentIndex + 1] : null
  const isLastLesson = !nextLesson

  // Fetch progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('lessons_completed, quiz_passed')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const lessonsCompleted: string[] = progress?.lessons_completed ?? []
  const isCompleted = lessonsCompleted.includes(lessonId)

  // Render markdown content
  const contentHtml = lesson.content_md ? renderMarkdown(lesson.content_md) : ''

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <Link href="/modules" className="hover:text-slate-600">Modules</Link>
        <span>›</span>
        <Link href={`/modules/${moduleId}`} className="hover:text-slate-600 max-w-[200px] truncate">{module.title}</Link>
        <span>›</span>
        <span className="text-slate-600 max-w-[200px] truncate">{lesson.title}</span>
      </div>

      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400 font-medium">Lesson {lesson.order_index}</span>
          {lesson.reading_time_minutes && (
            <span className="text-xs text-slate-400">· {lesson.reading_time_minutes} min read</span>
          )}
          {isCompleted && (
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              ✓ Completed
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900"><span className="text-brand-teal mr-2">⚕</span>{lesson.title}</h1>
      </div>

      {/* Lesson content */}
      <div
        className="lesson-prose bg-white border border-slate-100 rounded-xl p-6 sm:p-8 mb-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 italic mb-6 px-1">
        This content is for 340B learning purposes only. Not legal advice. Verify against current HRSA guidance.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {prevLesson && (
            <Link
              href={`/modules/${moduleId}/lessons/${prevLesson.id}`}
              className="text-sm text-slate-600 border border-slate-200 px-4 py-2 rounded-lg hover:bg-brand-pale transition-colors"
            >
              ← Previous
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {nextLesson ? (
            isCompleted ? (
              <Link
                href={`/modules/${moduleId}/lessons/${nextLesson.id}`}
                className="text-sm bg-brand-navy hover:bg-brand-navy-dark text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </Link>
            ) : (
              <NextLessonButton
                lessonId={lessonId}
                moduleId={moduleId}
                nextHref={`/modules/${moduleId}/lessons/${nextLesson.id}`}
                label="Next →"
              />
            )
          ) : (
            isCompleted ? (
              <Link
                href={`/modules/${moduleId}`}
                className="text-sm bg-brand-navy hover:bg-brand-navy-dark text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {progress?.quiz_passed ? 'Back to module' : 'Take module quiz →'}
              </Link>
            ) : (
              <NextLessonButton
                lessonId={lessonId}
                moduleId={moduleId}
                nextHref={`/modules/${moduleId}`}
                label={progress?.quiz_passed ? 'Back to module' : 'Take module quiz →'}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
