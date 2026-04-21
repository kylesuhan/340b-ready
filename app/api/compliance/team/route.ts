import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hasComplianceAccess } from '@/types/stripe'
import type { SubscriptionRecord } from '@/types/stripe'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).single()
  if (!hasComplianceAccess(subscription as SubscriptionRecord | null)) {
    return NextResponse.json({ error: 'compliance_subscription_required' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  // Get or create org for this user
  let { data: org } = await serviceClient
    .from('compliance_orgs')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!org) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name, email').eq('id', user.id).single()
    const orgName = profile?.full_name ? `${profile.full_name}'s Team` : '340B Compliance Team'

    const { data: newOrg } = await serviceClient
      .from('compliance_orgs')
      .insert({ owner_id: user.id, name: orgName, seat_limit: 3 })
      .select()
      .single()
    org = newOrg

    // Add owner as first member
    if (org) {
      await serviceClient.from('compliance_org_members').insert({
        org_id: org.id,
        user_id: user.id,
        invited_email: user.email ?? '',
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      })
    }
  }

  if (!org) return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })

  const { data: members } = await serviceClient
    .from('compliance_org_members')
    .select('id, invited_email, role, status, joined_at, invited_at')
    .eq('org_id', org.id)
    .order('invited_at', { ascending: true })

  return NextResponse.json({
    id: org.id,
    name: org.name,
    seat_limit: org.seat_limit,
    members: members ?? [],
  })
}
