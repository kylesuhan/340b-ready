'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId: string
  moduleId: string
  nextHref: string
  label: string
}

export function NextLessonButton({ lessonId, moduleId, nextHref, label }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      await fetch('/api/progress/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, module_id: moduleId }),
      })
    } catch {
      // proceed even if the API call fails
    }
    router.push(nextHref)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg transition-colors"
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}
