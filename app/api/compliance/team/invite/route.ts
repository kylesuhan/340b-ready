import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hasComplianceAccess } from '@/types/stripe'
import type { SubscriptionRecord } from '@/types/stripe'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).single()
  if (!hasComplianceAccess(subscription as SubscriptionRecord | null)) {
    return NextResponse.json({ error: 'compliance_subscription_required' }, { status: 403 })
  }

  let body: { email: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()

  // Get org owned by this user
  const { data: org } = await serviceClient
    .from('compliance_orgs').select('*').eq('owner_id', user.id).single()
  if (!org) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Check seat limit
  const { count } = await serviceClient
    .from('compliance_org_members')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.id)
  if ((count ?? 0) >= org.seat_limit) {
    return NextResponse.json({ error: 'Seat limit reached' }, { status: 400 })
  }

  // Check for existing invite
  const { data: existing } = await serviceClient
    .from('compliance_org_members')
    .select('id, status')
    .eq('org_id', org.id)
    .eq('invited_email', email)
    .single()
  if (existing) {
    return NextResponse.json(
      { error: existing.status === 'active' ? 'This person is already a member' : 'Invite already sent to this email' },
      { status: 400 }
    )
  }

  // Generate invite token
  const inviteToken = randomBytes(32).toString('hex')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const inviteUrl = `${siteUrl}/compliance/join?token=${inviteToken}`

  const { error: insertError } = await serviceClient
    .from('compliance_org_members')
    .insert({
      org_id: org.id,
      invited_email: email,
      role: 'member',
      status: 'pending',
      invite_token: inviteToken,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // TODO: send email via Resend/SendGrid in a future iteration
  // For now, log the invite URL so it can be shared manually
  console.log(`Compliance team invite for ${email}: ${inviteUrl}`)

  return NextResponse.json({ success: true, invite_url: inviteUrl })
}
