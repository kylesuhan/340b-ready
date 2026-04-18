'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'

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
      <div className="h-3 bg-slate-100 rounded w-4/6" />
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
  onReview: (id: string, status: ReviewStatus) => Promise<void>
}) {
  const [reviewing, setReviewing] = useState<ReviewStatus | null>(null)
  const currentStatus = item.review?.status ?? 'unread'

  async function handleReview(status: ReviewStatus) {
    if (reviewing) return
    setReviewing(status)
    try {
      await onReview(item.id, status)
    } finally {
      setReviewing(null)
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
            <span
              key={entity}
              className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full"
            >
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

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 flex-wrap">
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

export default function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [filter, setFilter] = useState<UrgencyFilter>('all')

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
      // silently fail; items will remain empty
    } finally {
      setLoading(false)
    }
  }, [])

  // Call loadItems on mount
  useEffect(() => {
    loadItems()
  }, [loadItems])

  async function handleReview(id: string, status: ReviewStatus) {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              review: {
                status,
                notes: item.review?.notes ?? null,
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
        body: JSON.stringify({ status }),
      })
    } catch {
      // If the request fails, reload to get the correct server state
      await loadItems()
    }
  }

  const filteredItems =
    filter === 'all' ? items : items.filter((i) => i.urgency === filter)

  const totalCount = items.length
  const actionRequiredCount = items.filter((i) => i.urgency === 'action-required').length
  const unreadCount = items.filter((i) => !i.review || i.review.status === 'unread').length

  const filterButtons: { value: UrgencyFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'action-required', label: '⚠ Action Required' },
    { value: 'deadline', label: '📅 Deadline' },
    { value: 'informational', label: 'ℹ Informational' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-brand-teal mr-2">⚕</span>Compliance Monitor
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Track 340B regulatory changes from the Federal Register and HRSA.
        </p>
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
          {/* Summary stats skeleton */}
          <div className="grid grid-cols-3 gap-3 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="h-6 w-8 bg-slate-200 rounded mb-1" />
                <div className="h-3 w-20 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
          {/* Card skeletons */}
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      )}

      {/* Loaded state */}
      {!loading && !upgradeRequired && (
        <>
          {/* Summary stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-brand-navy">{totalCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total items</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-600">{actionRequiredCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Action required</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-2xl font-bold text-brand-teal">{unreadCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Unread</p>
            </div>
          </div>

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

          {/* Empty state */}
          {items.length === 0 && (
            <div className="border-2 border-brand-teal border-dashed rounded-xl p-8 text-center">
              <p className="text-brand-teal text-2xl mb-3">⚕</p>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                No regulatory changes detected yet. The scanner runs daily and will surface new 340B-related Federal Register documents here.
              </p>
            </div>
          )}

          {/* Filtered empty state */}
          {items.length > 0 && filteredItems.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-400 text-sm">
                No items match the selected filter.
              </p>
            </div>
          )}

          {/* Items list */}
          {filteredItems.length > 0 && (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <ComplianceCard key={item.id} item={item} onReview={handleReview} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
