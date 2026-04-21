'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

interface ResourceLink {
  label: string
  url: string
}

interface ComplianceItem {
  id: string
  source_id: string
  source_type: string
  source_url: string
  source_label: string
  title: string
  raw_summary: string | null
  ai_summary: string | null
  urgency: 'informational' | 'action-required' | 'deadline'
  affected_entities: string[]
  resources: ResourceLink[]
  publication_date: string | null
  effective_date: string | null
  detected_at: string
  review: {
    status: 'unread' | 'reviewed' | 'actioned' | 'dismissed'
    notes: string | null
    reviewed_at: string | null
  } | null
}

type UrgencyFilter = 'all' | 'action-required' | 'deadline' | 'informational'
type ReviewStatus = 'unread' | 'reviewed' | 'actioned' | 'dismissed'
type ViewTab = 'list' | 'calendar'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function UrgencyBadge({ urgency }: { urgency: ComplianceItem['urgency'] }) {
  if (urgency === 'action-required') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        ⚠ Action Required
      </span>
    )
  }
  if (urgency === 'deadline') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        📅 Deadline
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-pale text-brand-navy border border-brand-pale-dark">
      ℹ Informational
    </span>
  )
}

function ReviewBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    unread: 'bg-slate-100 text-slate-500',
    reviewed: 'bg-blue-100 text-blue-700',
    actioned: 'bg-green-100 text-green-700',
    dismissed: 'bg-slate-100 text-slate-400',
  }
  const labels: Record<ReviewStatus, string> = {
    unread: 'Unread',
    reviewed: 'Reviewed',
    actioned: 'Actioned',
    dismissed: 'Dismissed',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="h-5 w-24 bg-slate-100 rounded-full shrink-0" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-5/6" />
      <div className="flex gap-2 pt-1">
        <div className="h-7 w-28 bg-slate-100 rounded-lg" />
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
        <div className="h-7 w-20 bg-slate-100 rounded-lg" />
      </div>
    </div>
  )
}

function ComplianceCard({
  item,
  onReview,
}: {
  item: ComplianceItem
  onReview: (id: string, status: ReviewStatus, notes?: string) => Promise<void>
}) {
  const [reviewing, setReviewing] = useState<ReviewStatus | null>(null)
  const [notes, setNotes] = useState(item.review?.notes ?? '')
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const currentStatus = item.review?.status ?? 'unread'

  async function handleReview(status: ReviewStatus) {
    if (reviewing) return
    setReviewing(status)
    try {
      await onReview(item.id, status, notes || undefined)
    } finally {
      setReviewing(null)
    }
  }

  async function saveNotes() {
    setNotesSaving(true)
    try {
      await onReview(item.id, currentStatus, notes)
    } finally {
      setNotesSaving(false)
    }
  }

  const actionButtons: { status: ReviewStatus; label: string }[] = [
    { status: 'reviewed', label: 'Mark Reviewed' },
    { status: 'actioned', label: 'Actioned' },
    { status: 'dismissed', label: 'Dismiss' },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 hover:border-slate-300 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1 min-w-0">
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-navy text-sm hover:text-brand-teal transition-colors leading-snug block"
          >
            {item.title}
          </a>
          <p className="text-xs text-slate-400">
            {item.source_label}
            {item.publication_date ? ` · ${formatDate(item.publication_date)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <UrgencyBadge urgency={item.urgency} />
          <ReviewBadge status={currentStatus} />
        </div>
      </div>

      {/* Affected entities */}
      {item.affected_entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.affected_entities.map((entity) => (
            <span key={entity} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {entity}
            </span>
          ))}
        </div>
      )}

      {/* AI summary */}
      {item.ai_summary && (
        <p className="text-sm text-slate-600 leading-relaxed">{item.ai_summary}</p>
      )}

      {/* Effective date note */}
      {item.effective_date && (
        <p className="text-xs text-amber-700 font-medium">
          Effective {formatDate(item.effective_date)}
        </p>
      )}

      {/* Resource links */}
      {item.resources?.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Resources</p>
          <div className="flex flex-wrap gap-2">
            {item.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal bg-brand-pale border border-brand-pale-dark px-3 py-1.5 rounded-lg hover:bg-brand-cyan transition-colors"
              >
                {r.label} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes section */}
      <div className="border-t border-slate-100 pt-3">
        <button
          onClick={() => setNotesOpen((o) => !o)}
          className="text-xs text-slate-400 hover:text-brand-navy transition-colors flex items-center gap-1"
        >
          {notesOpen ? '▲' : '▼'}{' '}
          {item.review?.notes ? 'Internal notes (saved)' : 'Add internal notes'}
        </button>
        {notesOpen && (
          <div className="mt-2 space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record internal actions taken, assigned to, follow-up needed…"
              rows={3}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 text-slate-700 placeholder-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-brand-teal"
            />
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="text-xs bg-brand-pale border border-brand-pale-dark text-brand-navy font-medium px-3 py-1.5 rounded-lg hover:bg-brand-cyan transition-colors disabled:opacity-60"
            >
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {actionButtons.map(({ status, label }) => {
          const isActive = currentStatus === status
          const isLoading = reviewing === status
          return (
            <button
              key={status}
              onClick={() => handleReview(status)}
              disabled={!!reviewing}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                isActive
                  ? 'bg-brand-navy text-white'
                  : 'bg-brand-pale text-brand-navy border border-brand-pale-dark hover:bg-brand-pale-dark'
              }`}
            >
              {isLoading ? '…' : label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ items }: { items: ComplianceItem[] }) {
  const dated = items
    .filter((i) => i.effective_date || i.publication_date)
    .map((i) => ({ ...i, sortDate: i.effective_date ?? i.publication_date! }))
    .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())

  // Group by month
  const groups: Record<string, typeof dated> = {}
  for (const item of dated) {
    const key = new Date(item.sortDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }

  if (dated.length === 0) {
    return (
      <div className="border-2 border-dashed border-brand-teal rounded-xl p-8 text-center">
        <p className="text-brand-teal text-2xl mb-3">📅</p>
        <p className="text-slate-500 text-sm">No items with dates yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([month, monthItems]) => (
        <div key={month}>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-teal inline-block" />
            {month}
          </h3>
          <div className="space-y-2 pl-4 border-l-2 border-brand-pale-dark">
            {monthItems.map((item) => {
              const isDeadline = item.urgency === 'deadline'
              const isAction = item.urgency === 'action-required'
              return (
                <div
                  key={item.id}
                  className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${
                    isDeadline ? 'border-amber-200' : isAction ? 'border-red-200' : 'border-slate-100'
                  }`}
                >
                  <div className={`shrink-0 text-center min-w-[42px] rounded-lg p-1.5 ${
                    isDeadline ? 'bg-amber-50' : isAction ? 'bg-red-50' : 'bg-brand-pale'
                  }`}>
                    <p className="text-lg font-bold leading-none text-slate-900">
                      {new Date(item.sortDate).getDate()}
                    </p>
                    <p className="text-xs text-slate-400 uppercase">
                      {new Date(item.sortDate).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand-navy hover:text-brand-teal transition-colors leading-snug"
                      >
                        {item.title}
                      </a>
                      <UrgencyBadge urgency={item.urgency} />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.effective_date ? 'Effective' : 'Published'} {formatDate(item.sortDate)}
                      {item.source_label ? ` · ${item.source_label}` : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Export helper ─────────────────────────────────────────────────────────────

function downloadCSV(items: ComplianceItem[]) {
  const headers = [
    'Title',
    'Source',
    'Urgency',
    'Affected Entities',
    'Publication Date',
    'Effective Date',
    'Review Status',
    'Review Date',
    'Notes',
    'Source URL',
  ]

  const escape = (val: string | null | undefined) => {
    if (!val) return ''
    return `"${val.replace(/"/g, '""')}"`
  }

  const rows = items.map((i) => [
    escape(i.title),
    escape(i.source_label),
    escape(i.urgency),
    escape(i.affected_entities.join(', ')),
    escape(i.publication_date),
    escape(i.effective_date),
    escape(i.review?.status ?? 'unread'),
    escape(i.review?.reviewed_at ?? null),
    escape(i.review?.notes ?? null),
    escape(i.source_url),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `340b-compliance-audit-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [filter, setFilter] = useState<UrgencyFilter>('all')
  const [tab, setTab] = useState<ViewTab>('list')

  const loadItems = useCallback(async () => {
    setLoading(true)
    setUpgradeRequired(false)
    try {
      const res = await fetch('/api/compliance')
      if (res.status === 403) {
        const data = await res.json()
        if (data?.error === 'compliance_subscription_required') {
          setUpgradeRequired(true)
          return
        }
      }
      if (!res.ok) return
      const data = await res.json()
      setItems(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  async function handleReview(id: string, status: ReviewStatus, notes?: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              review: {
                status,
                notes: notes ?? item.review?.notes ?? null,
                reviewed_at: new Date().toISOString(),
              },
            }
          : item
      )
    )
    try {
      await fetch(`/api/compliance/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: notes ?? null }),
      })
    } catch {
      await loadItems()
    }
  }

  const filteredItems = filter === 'all' ? items : items.filter((i) => i.urgency === filter)
  const totalCount = items.length
  const actionRequiredCount = items.filter((i) => i.urgency === 'action-required').length
  const unreadCount = items.filter((i) => !i.review || i.review.status === 'unread').length
  const deadlineCount = items.filter((i) => i.urgency === 'deadline').length

  const filterButtons: { value: UrgencyFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'action-required', label: '⚠ Action Required' },
    { value: 'deadline', label: '📅 Deadline' },
    { value: 'informational', label: 'ℹ Informational' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            <span className="text-brand-teal mr-2">⚕</span>Compliance Monitor
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Automatically tracks 340B regulatory changes daily from three sources:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { icon: '📋', label: 'Federal Register', desc: 'Rules, proposed rules & notices' },
              { icon: '🏛', label: 'HRSA OPA', desc: 'Program updates & integrity notices' },
              { icon: '🔍', label: 'OIG Work Plan', desc: 'Audit targets & compliance reports' },
            ].map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">
                <span>{s.icon}</span>
                <strong>{s.label}</strong>
                <span className="text-slate-400">— {s.desc}</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Scanner runs daily at 10am UTC. Items are summarized by Claude AI and classified by urgency.
          </p>
        </div>
        {!loading && !upgradeRequired && items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSV(items)}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-brand-pale hover:border-brand-pale-dark transition-colors flex items-center gap-1.5"
            >
              ⬇ Export audit CSV
            </button>
            <Link
              href="/compliance/team"
              className="text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-brand-pale hover:border-brand-pale-dark transition-colors"
            >
              👥 Team
            </Link>
          </div>
        )}
      </div>

      {/* Upgrade prompt */}
      {upgradeRequired && (
        <div className="bg-white border-2 border-brand-pale-dark rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">⚕</div>
          <h2 className="font-semibold text-brand-navy text-lg">
            Compliance Monitoring Requires an Upgrade
          </h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Get real-time 340B regulatory alerts from the Federal Register and HRSA, with plain-English summaries powered by AI.
          </p>
          <Link
            href="/compliance-upgrade"
            className="inline-block bg-brand-navy text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-navy-dark transition-colors"
          >
            View upgrade options
          </Link>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !upgradeRequired && (
        <>
          <div className="grid grid-cols-4 gap-3 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="h-6 w-8 bg-slate-200 rounded mb-1" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (<SkeletonCard key={i} />))}
          </div>
        </>
      )}

      {/* Loaded state */}
      {!loading && !upgradeRequired && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-brand-navy">{totalCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total items</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-600">{actionRequiredCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Action required</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-500">{deadlineCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Deadlines</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-brand-teal">{unreadCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Unread</p>
            </div>
          </div>

          {/* View tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {(['list', 'calendar'] as ViewTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-medium px-4 py-2.5 border-b-2 transition-colors capitalize ${
                  tab === t
                    ? 'border-brand-teal text-brand-navy'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'list' ? '☰ List' : '📅 Calendar'}
              </button>
            ))}
          </div>

          {/* Calendar view */}
          {tab === 'calendar' && <CalendarView items={items} />}

          {/* List view */}
          {tab === 'list' && (
            <>
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                {filterButtons.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      filter === value
                        ? 'bg-brand-navy text-white'
                        : 'bg-white text-brand-navy border border-brand-pale-dark hover:bg-brand-pale'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {items.length === 0 && (
                <div className="border-2 border-brand-teal border-dashed rounded-xl p-8 text-center">
                  <p className="text-brand-teal text-2xl mb-3">⚕</p>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                    No regulatory changes detected yet. The scanner runs daily and will surface new 340B-related Federal Register documents here.
                  </p>
                </div>
              )}

              {items.length > 0 && filteredItems.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-slate-400 text-sm">No items match the selected filter.</p>
                </div>
              )}

              {filteredItems.length > 0 && (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <ComplianceCard key={item.id} item={item} onReview={handleReview} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
