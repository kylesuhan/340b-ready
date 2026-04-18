'use client'

import { useState } from 'react'

export function PortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to open billing portal')
        setLoading(false)
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-2 text-xs text-red-600">{error}</div>
      )}
      <button
        onClick={handlePortal}
        disabled={loading}
        className="text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Opening portal…' : 'Manage subscription →'}
      </button>
    </div>
  )
}
