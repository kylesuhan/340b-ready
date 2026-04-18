'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [profile, setProfile] = useState<{ full_name: string | null; email: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      if (p) {
        setProfile(p)
        setFullName(p.full_name ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-slate-500 text-sm py-8">Loading…</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account settings.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            Saved successfully.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <p className="text-sm text-slate-700">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Subscription</h2>
        <Link
          href="/account/billing"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Manage subscription →
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Sign out</h2>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            Sign out of all devices
          </button>
        </form>
      </div>
    </div>
  )
}
