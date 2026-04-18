'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
        <p className="text-sm text-slate-600 mb-4">
          Password reset link sent to <strong>{email}</strong>.
        </p>
        <Link href="/login" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Reset password</h2>
      <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send a reset link.</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-blue-600 hover:text-blue-500">Back to sign in</Link>
      </p>
    </div>
  )
}
