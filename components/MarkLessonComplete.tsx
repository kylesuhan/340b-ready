'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId: string
  moduleId: string
}

export function MarkLessonComplete({ lessonId, moduleId }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      await fetch('/api/progress/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lessonId, module_id: moduleId }),
      })
      setDone(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-sm text-green-600 font-medium px-4 py-2">
        ✓ Marked complete
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm border border-green-300 text-green-700 hover:bg-green-50 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? 'Saving…' : 'Mark complete'}
    </button>
  )
}
