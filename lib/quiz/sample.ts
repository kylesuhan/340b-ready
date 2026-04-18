import type { ServedQuestion } from '@/types/quiz'
import { shuffleArray } from '@/lib/utils'

const QUIZ_COUNTS: Record<number, number> = {
  1: 8,
  2: 8,
  3: 10,
  4: 10,
  5: 12,
}

interface RawDBQuestion {
  id: string
  question_text: string
  answers: Array<{ id: string; text: string; is_correct: boolean }>
  explanation: string | null
  difficulty_tag: string | null
}

export function sampleQuiz(
  allQuestions: RawDBQuestion[],
  moduleOrderIndex: number
): ServedQuestion[] {
  const count = QUIZ_COUNTS[moduleOrderIndex] ?? 8
  const shuffledPool = shuffleArray(allQuestions)
  const selected = shuffledPool.slice(0, Math.min(count, shuffledPool.length))

  return selected.map((q) => ({
    question_id: q.id,
    question_text: q.question_text,
    answers: shuffleArray(q.answers.map(({ id, text }) => ({ id, text }))),
    explanation: q.explanation,
  }))
}
