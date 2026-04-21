'use client'

import { useState } from 'react'

export function LeaderboardOptIn({ optedIn }: { optedIn: boolean }) {
  const [enabled, setEnabled] = useState(optedIn)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const next = !enabled
    try {
      await fetch('/api/gamification/leaderboard-opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opt_in: next }),
      })
      setEnabled(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-900">Appear on leaderboard</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {enabled ? 'Your name and XP are visible to other users.' : 'Opt in to show your progress publicly.'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
          enabled ? 'bg-brand-teal' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
