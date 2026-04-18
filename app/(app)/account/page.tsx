'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const [profile, setProfile] = useState<{ full_name: string | null; email: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setProfileError(null)
    setProfileSuccess(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSuccess(true)
    }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    setPasswordSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordSaving(false)
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

      {/* Profile */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        {profileSuccess && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            Saved successfully.
          </div>
        )}
        {profileError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{profileError}</div>
        )}
        <form onSubmit={handleSaveProfile} className="space-y-4">
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="Your name"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
        {passwordSuccess && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg">
            Password updated successfully.
          </div>
        )}
        {passwordError && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{passwordError}</div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              placeholder="Repeat your new password"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="bg-brand-navy hover:bg-brand-navy-dark disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {passwordSaving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Subscription</h2>
        <Link
          href="/account/billing"
          className="text-sm text-brand-teal hover:text-brand-teal-dark font-medium"
        >
          Manage subscription →
        </Link>
      </div>

      {/* Sign out */}
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
