import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreQuiz } from '@/lib/quiz/score'

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
    .select('id, user_id, module_id, questions_served, submitted_at')
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

  // Get the question IDs that were served
  const servedIds: string[] = (attempt.questions_served as Array<{ question_id: string }>).map(
    (q) => q.question_id
  )

  // Fetch questions WITH is_correct for scoring
  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, question_text, answers, explanation')
    .in('id', servedIds)

  if (qError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  // Fetch module for pass threshold
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('quiz_pass_threshold')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const result = scoreQuiz(questions, answers, module.quiz_pass_threshold)

  const submittedAt = new Date().toISOString()

  // Update quiz attempt with score
  await supabase
    .from('quiz_attempts')
    .update({
      answers_submitted: answers,
      score: result.score,
      passed: result.passed,
      submitted_at: submittedAt,
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

  return NextResponse.json({
    attempt_id,
    ...result,
  })
}
