export interface QuizAnswer {
  id: string
  text: string
  is_correct?: boolean // omitted when serving to users
}

export interface QuizQuestion {
  id: string
  module_id: string
  question_text: string
  answers: QuizAnswer[]
  explanation: string | null
  difficulty_tag: string | null
  active: boolean
}

export interface ServedQuestion {
  question_id: string
  question_text: string
  answers: Omit<QuizAnswer, 'is_correct'>[]
  explanation?: string | null
}

export interface QuizSession {
  attempt_id: string
  module_id: string
  questions: ServedQuestion[]
  total_questions: number
}

export interface QuizSubmission {
  attempt_id: string
  answers: Array<{
    question_id: string
    selected_answer_id: string
  }>
}

export interface QuizResult {
  attempt_id: string
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

export interface QuizAttempt {
  id: string
  user_id: string
  module_id: string
  questions_served: Array<{ question_id: string; answer_ids_order: string[] }>
  answers_submitted: Array<{ question_id: string; selected_answer_id: string }> | null
  score: number | null
  passed: boolean | null
  started_at: string
  submitted_at: string | null
  time_taken_seconds: number | null
}
