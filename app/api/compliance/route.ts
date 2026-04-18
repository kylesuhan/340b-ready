import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasComplianceAccess } from '@/types/stripe'
import type { SubscriptionRecord } from '@/types/stripe'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check compliance subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!hasComplianceAccess(subscription as SubscriptionRecord | null)) {
    return NextResponse.json({ error: 'compliance_subscription_required' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const urgency = searchParams.get('urgency')
  const sourceType = searchParams.get('source_type')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // Fetch compliance items
  let query = supabase
    .from('compliance_items')
    .select('*')
    .eq('published', true)
    .order('detected_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (urgency) query = query.eq('urgency', urgency)
  if (sourceType) query = query.eq('source_type', sourceType)

  const { data: items, error: itemsError } = await query

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }

  // Fetch user's review state for these items
  const itemIds = (items ?? []).map((i) => i.id)
  const { data: reviews } = await supabase
    .from('user_compliance_reviews')
    .select('compliance_item_id, status, notes, reviewed_at')
    .eq('user_id', user.id)
    .in('compliance_item_id', itemIds.length > 0 ? itemIds : ['none'])

  const reviewMap = new Map(
    (reviews ?? []).map((r) => [r.compliance_item_id, r])
  )

  const enriched = (items ?? []).map((item) => ({
    ...item,
    review: reviewMap.get(item.id) ?? null,
  }))

  return NextResponse.json({ items: enriched, total: enriched.length })
}
