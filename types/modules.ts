export type ModuleDifficulty = 'easy' | 'moderate' | 'intermediate' | 'advanced' | 'expert'

export interface Module {
  id: string
  slug: string
  order_index: number
  title: string
  description: string
  difficulty: ModuleDifficulty
  is_free: boolean
  quiz_pass_threshold: number
  published: boolean
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  module_id: string
  order_index: number
  title: string
  content_html: string | null
  content_md: string | null
  reading_time_minutes: number | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface ModuleWithProgress extends Module {
  lessons: Lesson[]
  progress?: UserModuleProgress
  isLocked: boolean
}

export interface UserModuleProgress {
  id: string
  user_id: string
  module_id: string
  lessons_completed: string[]
  module_completed: boolean
  quiz_passed: boolean
  quiz_passed_at: string | null
  last_accessed_at: string
}
