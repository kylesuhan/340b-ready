'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface TeamMember {
  id: string
  invited_email: string
  role: 'owner' | 'member'
  status: 'pending' | 'active'
  joined_at: string | null
  invited_at: string
}

interface TeamOrg {
  id: string
  name: string
  seat_limit: number
  members: TeamMember[]
}

export default function ComplianceTeamPage() {
  const [org, setOrg] = useState<TeamOrg | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const loadTeam = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/compliance/team')
      if (!res.ok) return
      const data = await res.json()
      setOrg(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTeam() }, [loadTeam])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)

    try {
      const res = await fetch('/api/compliance/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invite')
      } else {
        setInviteSuccess(true)
        setInviteEmail('')
        await loadTeam()
      }
    } catch {
      setInviteError('Something went wrong. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    try {
      await fetch(`/api/compliance/team/members/${memberId}`, { method: 'DELETE' })
      await loadTeam()
    } finally {
      setRemovingId(null)
    }
  }

  const activeCount = org?.members.filter((m) => m.status === 'active').length ?? 0
  const pendingCount = org?.members.filter((m) => m.status === 'pending').length ?? 0
  const seatsUsed = activeCount + pendingCount
  const seatsLeft = (org?.seat_limit ?? 3) - seatsUsed

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/compliance" className="text-slate-400 hover:text-slate-600 text-sm">← Compliance</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-teal mr-2">⚕</span>Team Management
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Invite colleagues to share the compliance dashboard.
        </p>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-white border border-slate-200 rounded-xl" />
          <div className="h-40 bg-white border border-slate-200 rounded-xl" />
        </div>
      )}

      {!loading && org && (
        <>
          {/* Seat summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-slate-900">{org.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {seatsUsed} of {org.seat_limit} seats used
                  {seatsLeft > 0
                    ? ` · ${seatsLeft} available`
                    : ' · Seat limit reached'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-navy">{seatsUsed}</p>
                <p className="text-xs text-slate-400">/ {org.seat_limit} seats</p>
              </div>
            </div>
            {/* Seat bar */}
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-brand-teal h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (seatsUsed / org.seat_limit) * 100)}%` }}
              />
            </div>
          </div>

          {/* Invite form */}
          {seatsLeft > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-3">Invite a team member</h2>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@hospital.org"
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="text-sm font-medium bg-brand-navy text-white px-4 py-2 rounded-lg hover:bg-brand-navy-dark transition-colors disabled:opacity-60 shrink-0"
                >
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              </form>
              {inviteError && (
                <p className="text-xs text-red-600 mt-2">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-xs text-green-600 mt-2">Invite sent successfully.</p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                They will receive an email with a link to join your compliance dashboard.
              </p>
            </div>
          )}

          {seatsLeft === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800">
                <strong>Seat limit reached.</strong> Your plan includes {org.seat_limit} seats.
                Contact support to add more seats.
              </p>
            </div>
          )}

          {/* Members list */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">
                Members
                {pendingCount > 0 && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {org.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-3 gap-3">
                  <div>
                    <p className="text-sm text-slate-900">{member.invited_email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {member.role === 'owner' ? 'Owner' : 'Member'}
                      {' · '}
                      {member.status === 'pending'
                        ? 'Invite pending'
                        : `Joined ${new Date(member.joined_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {removingId === member.id ? '…' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !org && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">Unable to load team information.</p>
        </div>
      )}
    </div>
  )
}
