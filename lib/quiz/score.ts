import { QuizResult } from '@/types/quiz'

interface RawQuestion {
  id: string
  question_text: string
  answers: Array<{ id: string; text: string; is_correct: boolean }>
  explanation: string | null
}

interface SubmittedAnswer {
  question_id: string
  selected_answer_id: string
}

export function scoreQuiz(
  questions: RawQuestion[],
  submitted: SubmittedAnswer[],
  passThreshold: number
): Omit<QuizResult, 'attempt_id'> {
  const qMap = new Map(questions.map((q) => [q.id, q]))

  let correct = 0
  const results: QuizResult['results'] = []

  for (const answer of submitted) {
    const q = qMap.get(answer.question_id)
    if (!q) continue

    const correctAnswer = q.answers.find((a) => a.is_correct)
    const isCorrect = correctAnswer?.id === answer.selected_answer_id
    if (isCorrect) correct++

    results.push({
      question_id: q.id,
      question_text: q.question_text,
      selected_answer_id: answer.selected_answer_id,
      correct_answer_id: correctAnswer?.id ?? '',
      is_correct: isCorrect,
      explanation: q.explanation,
    })
  }

  const total = submitted.length
  const score = total > 0 ? correct / total : 0
  const passed = score >= passThreshold

  return {
    score,
    passed,
    correct_count: correct,
    total_count: total,
    pass_threshold: passThreshold,
    results,
  }
}
