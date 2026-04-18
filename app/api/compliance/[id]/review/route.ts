import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasComplianceAccess } from '@/types/stripe'
import type { SubscriptionRecord } from '@/types/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!hasComplianceAccess(subscription as SubscriptionRecord | null)) {
    return NextResponse.json({ error: 'compliance_subscription_required' }, { status: 403 })
  }

  let body: { status: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const validStatuses = ['unread', 'reviewed', 'actioned', 'dismissed']
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('user_compliance_reviews')
    .upsert(
      {
        user_id: user.id,
        compliance_item_id: id,
        status: body.status,
        notes: body.notes ?? null,
        reviewed_at: body.status !== 'unread' ? now : null,
      },
      { onConflict: 'user_id,compliance_item_id' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
