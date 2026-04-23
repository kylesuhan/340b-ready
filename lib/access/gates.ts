import { SupabaseClient } from '@supabase/supabase-js'

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: 'subscription_required' | 'previous_module_quiz_required' | 'not_found' }

export async function canAccessModule(
  userId: string,
  moduleOrderIndex: number,
  supabase: SupabaseClient
): Promise<AccessResult> {
  // Module 1 is always accessible (free tier)
  if (moduleOrderIndex <= 1) {
    return { allowed: true }
  }

  // Check subscription for modules 2-5
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_end, current_period_end')
    .eq('user_id', userId)
    .single()

  const hasAccess =
    sub &&
    ['trialing', 'active'].includes(sub.status) &&
    (sub.status === 'active' ||
      (sub.trial_end && new Date(sub.trial_end) > new Date()))

  if (!hasAccess) {
    return { allowed: false, reason: 'subscription_required' }
  }

  // Check quiz gating — previous module's quiz must be passed
  const { data: prevModule } = await supabase
    .from('modules')
    .select('id')
    .eq('order_index', moduleOrderIndex - 1)
    .single()

  if (!prevModule) {
    return { allowed: false, reason: 'not_found' }
  }

  const { data: prevProgress } = await supabase
    .from('user_progress')
    .select('quiz_passed')
    .eq('user_id', userId)
    .eq('module_id', prevModule.id)
    .maybeSingle()

  if (!prevProgress?.quiz_passed) {
    return { allowed: false, reason: 'previous_module_quiz_required' }
  }

  return { allowed: true }
}
