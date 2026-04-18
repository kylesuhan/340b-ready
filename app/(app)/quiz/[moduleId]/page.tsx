'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ServedQuestion } from '@/types/quiz'

interface QuizData {
  attempt_id: string
  module_id: string
  module_title: string
  questions: ServedQuestion[]
  pass_threshold: number
  total_questions: number
}

interface QuizResultData {
  score: number
  passed: boolean
  correct_count: number
  total_count: number
  pass_threshold: number
  results: Array<{
    question_id: string
    question_text: string
    selected_answer_id: string
    correct_answer_id: string
    is_correct: boolean
    explanation: string | null
  }>
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.moduleId as string

  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResultData | null>(null)
  const [showReview, setShowReview] = useState(false)

  const loadQuiz = useCallback(async () => {
    setLoading(true)
    setError(null)
    setAnswers({})
    setCurrentIndex(0)
    setResult(null)
    setShowReview(false)
    try {
      const res = await fetch(`/api/quiz/${moduleId}`)
      if (!res.ok) {
        const data = await res.json()
        if (data.error === 'subscription_required') {
          router.push('/upgrade')
          return
        }
        setError(data.error ?? 'Failed to load quiz')
        return
      }
      const data = await res.json()
      setQuiz(data)
    } catch {
      setError('Failed to load quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [moduleId, router])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  async function handleSubmit() {
    if (!quiz) return
    setSubmitting(true)

    const submittedAnswers = quiz.questions.map((q) => ({
      question_id: q.question_id,
      selected_answer_id: answers[q.question_id] ?? '',
    }))

    try {
      const res = await fetch(`/api/quiz/${moduleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: quiz.attempt_id,
          answers: submittedAnswers,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const currentQuestion = quiz?.questions[currentIndex]
  const allAnswered = quiz
    ? quiz.questions.every((q) => answers[q.question_id])
    : false
  const isLastQuestion = quiz ? currentIndex === quiz.questions.length - 1 : false

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Preparing your quiz…</p>
      </div>
    )
  }

  // ── Error ──
  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-600 font-medium mb-3">{error ?? 'Quiz not available.'}</p>
        <Link href={`/modules/${moduleId}`} className="text-sm text-blue-600 underline">
          Back to module
        </Link>
      </div>
    )
  }

  // ── Results ──
  if (result) {
    const pct = Math.round(result.score * 100)
    const passPct = Math.round(result.pass_threshold * 100)

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score card */}
        <div className={`rounded-xl border-2 p-7 text-center ${
          result.passed
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-5xl font-bold mb-2 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
            {pct}%
          </div>
          <p className={`font-semibold text-lg mb-1 ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
            {result.passed ? '✓ Quiz passed!' : '✗ Not quite'}
          </p>
          <p className={`text-sm ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
            {result.correct_count} of {result.total_count} correct · {passPct}% required to pass
          </p>
          {result.passed && (
            <p className="text-green-700 text-xs mt-2">
              The next module is now unlocked.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href={`/modules/${moduleId}`}
            className="text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Back to module
          </Link>
          {result.passed ? (
            <Link
              href="/modules"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              View next module →
            </Link>
          ) : (
            <button
              onClick={loadQuiz}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              Retry with new questions
            </button>
          )}
          <button
            onClick={() => setShowReview(!showReview)}
            className="text-sm text-slate-500 hover:text-slate-700 underline px-2 py-2.5"
          >
            {showReview ? 'Hide review' : 'Review answers'}
          </button>
        </div>

        {/* Answer review */}
        {showReview && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Answer Review</h2>
            {result.results.map((r, i) => (
              <div
                key={r.question_id}
                className={`rounded-xl border p-4 ${r.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
              >
                <p className="text-sm font-medium text-slate-900 mb-2">
                  {i + 1}. {r.question_text}
                </p>
                {quiz.questions
                  .find((q) => q.question_id === r.question_id)
                  ?.answers.map((a) => (
                    <div
                      key={a.id}
                      className={`text-xs px-3 py-1.5 rounded-lg mb-1 ${
                        a.id === r.correct_answer_id
                          ? 'bg-green-200 text-green-900 font-medium'
                          : a.id === r.selected_answer_id && !r.is_correct
                          ? 'bg-red-200 text-red-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {a.id === r.correct_answer_id ? '✓ ' : a.id === r.selected_answer_id && !r.is_correct ? '✗ ' : ''}
                      {a.text}
                    </div>
                  ))}
                {r.explanation && (
                  <p className="text-xs text-slate-600 mt-2 italic">{r.explanation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Quiz in progress ──
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/modules/${moduleId}`}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back to module
        </Link>
        <span className="text-sm text-slate-500">
          Question {currentIndex + 1} of {quiz.questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Module title */}
      <h1 className="text-lg font-bold text-slate-900">{quiz.module_title} — Quiz</h1>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <p className="text-base font-medium text-slate-900 leading-relaxed">
            {currentIndex + 1}. {currentQuestion.question_text}
          </p>

          <div className="space-y-2">
            {currentQuestion.answers.map((a) => {
              const selected = answers[currentQuestion.question_id] === a.id
              return (
                <button
                  key={a.id}
                  onClick={() =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.question_id]: a.id,
                    }))
                  }
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold mr-2 text-slate-400 uppercase">{a.id}.</span>
                  {a.text}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(quiz.questions.length - 1, i + 1))}
            disabled={!answers[currentQuestion?.question_id ?? '']}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Next →
          </button>
        )}
      </div>

      {!allAnswered && isLastQuestion && (
        <p className="text-xs text-amber-600 text-center">
          Answer all questions before submitting.
        </p>
      )}
    </div>
  )
}
