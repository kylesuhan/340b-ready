'use client'

import { useState } from 'react'

export function ComplianceCheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/compliance-checkout', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to start checkout')
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
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          {error}
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Redirecting to checkout…' : 'Start Compliance Pro Trial'}
      </button>
    </div>
  )
}
