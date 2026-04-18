import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canAccessModule } from '@/lib/access/gates'
import { sampleQuiz } from '@/lib/quiz/sample'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch module
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, title, order_index, quiz_pass_threshold, published')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  // Access gate
  const access = await canAccessModule(user.id, module.order_index, supabase)
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: 403 })
  }

  // Fetch active questions
  const { data: questions, error: qError } = await supabase
    .from('quiz_questions')
    .select('id, question_text, answers, explanation, difficulty_tag')
    .eq('module_id', moduleId)
    .eq('active', true)

  if (qError || !questions || questions.length === 0) {
    return NextResponse.json({ error: 'No questions available' }, { status: 404 })
  }

  const servedQuestions = sampleQuiz(questions, module.order_index)

  // Build questions_served snapshot (order of answers as served)
  const questionsServed = servedQuestions.map((q) => ({
    question_id: q.question_id,
    answer_ids_order: q.answers.map((a) => a.id),
  }))

  // Create quiz attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: user.id,
      module_id: moduleId,
      questions_served: questionsServed,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (attemptError || !attempt) {
    return NextResponse.json({ error: 'Failed to create quiz attempt' }, { status: 500 })
  }

  return NextResponse.json({
    attempt_id: attempt.id,
    module_id: moduleId,
    module_title: module.title,
    pass_threshold: module.quiz_pass_threshold,
    questions: servedQuestions,
    total_questions: servedQuestions.length,
  })
}
