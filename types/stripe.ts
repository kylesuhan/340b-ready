export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export interface SubscriptionRecord {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: SubscriptionStatus
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export function hasActiveAccess(sub: SubscriptionRecord | null | undefined): boolean {
  if (!sub) return false
  if (!['trialing', 'active'].includes(sub.status)) return false
  if (sub.status === 'trialing' && sub.trial_end) {
    return new Date(sub.trial_end) > new Date()
  }
  if (sub.status === 'active' && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date()
  }
  return true
}

export function trialDaysRemaining(sub: SubscriptionRecord | null | undefined): number | null {
  if (!sub || sub.status !== 'trialing' || !sub.trial_end) return null
  const diff = new Date(sub.trial_end).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
