import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { token: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const serviceClient = await createServiceClient()

  const { data: member } = await serviceClient
    .from('compliance_org_members')
    .select('id, org_id, invited_email, status')
    .eq('invite_token', body.token)
    .single()

  if (!member) return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 })
  if (member.status === 'active') return NextResponse.json({ error: 'Invite already used' }, { status: 400 })

  // Activate the member
  const { error } = await serviceClient
    .from('compliance_org_members')
    .update({
      user_id: user.id,
      status: 'active',
      joined_at: new Date().toISOString(),
      invite_token: null, // invalidate token
    })
    .eq('id', member.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
