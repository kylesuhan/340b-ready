import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreQuiz } from '@/lib/quiz/score'
import { awardXP, updateStreak, checkAndAwardBadges, XP_VALUES } from '@/lib/gamification'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { attempt_id: string; answers: Array<{ question_id: string; selected_answer_id: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { attempt_id, answers } = body
  if (!attempt_id || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'Missing attempt_id or answers' }, { status: 400 })
  }

  // Verify the attempt belongs to this user and module and is unsubmitted
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('id, user_id, module_id, questions_served, submitted_at, started_at')
    .eq('id', attempt_id)
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }
  if (attempt.user_id !== user.id || attempt.module_id !== moduleId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (attempt.submitted_at) {
    return NextResponse.json({ error: 'Attempt already submitted' }, { status: 409 })
  }

  const servedIds: string[] = (attempt.questions_served as Array<{ question_id: string }>).map(
    (q) => q.question_id
  )

  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, question_text, answers, explanation')
    .in('id', servedIds)

  if (qError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('quiz_pass_threshold, order_index')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const result = scoreQuiz(questions, answers, module.quiz_pass_threshold)
  const submittedAt = new Date().toISOString()

  // Calculate time taken
  const timeTakenSeconds = attempt.started_at
    ? Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000)
    : null

  // Update quiz attempt with score
  await supabase
    .from('quiz_attempts')
    .update({
      answers_submitted: answers,
      score: result.score,
      passed: result.passed,
      submitted_at: submittedAt,
      time_taken_seconds: timeTakenSeconds,
    })
    .eq('id', attempt_id)

  // If passed, upsert user_progress
  if (result.passed) {
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id, lessons_completed')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single()

    if (existingProgress) {
      await supabase
        .from('user_progress')
        .update({
          quiz_passed: true,
          quiz_passed_at: submittedAt,
          module_completed: true,
          last_accessed_at: submittedAt,
        })
        .eq('id', existingProgress.id)
    } else {
      await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          lessons_completed: [],
          module_completed: true,
          quiz_passed: true,
          quiz_passed_at: submittedAt,
          last_accessed_at: submittedAt,
        })
    }
  }

  // ── Gamification ─────────────────────────────────────────────────────────
  let newBadges: string[] = []
  try {
    const serviceClient = await createServiceClient()

    // Always update streak on quiz submit
    await updateStreak(serviceClient, user.id)

    if (result.passed) {
      // Count how many prior attempts on this module (to detect first_pass vs comeback)
      const { count: priorCount } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .eq('passed', false)
        .not('submitted_at', 'is', null)

      const attemptNumber = (priorCount ?? 0) + 1

      // Count total modules passed
      const { count: modulesCompleted } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('quiz_passed', true)

      // Award XP
      let xp = XP_VALUES.quiz_pass
      if (result.score === 1) xp += XP_VALUES.quiz_perfect - XP_VALUES.quiz_pass
      if (attemptNumber === 1) xp += XP_VALUES.quiz_first_try
      if ((modulesCompleted ?? 0) >= 5) xp += XP_VALUES.all_modules_complete

      await awardXP(serviceClient, user.id, xp)

      newBadges = await checkAndAwardBadges(serviceClient, user.id, {
        quizPassed: true,
        score: result.score,
        attemptNumber,
        timeTakenSeconds: timeTakenSeconds ?? undefined,
        moduleOrderIndex: module.order_index,
        totalModulesCompleted: (modulesCompleted ?? 0) + 1,
      })
    }
  } catch (err) {
    console.warn('Gamification update failed (quiz):', err)
  }

  return NextResponse.json({
    attempt_id,
    ...result,
    time_taken_seconds: timeTakenSeconds,
    new_badges: newBadges,
  })
}
