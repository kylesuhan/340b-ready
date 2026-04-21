import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = await createServiceClient()

  // Verify requester owns the org this member belongs to
  const { data: member } = await serviceClient
    .from('compliance_org_members')
    .select('org_id, role')
    .eq('id', memberId)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.role === 'owner') return NextResponse.json({ error: 'Cannot remove org owner' }, { status: 400 })

  const { data: org } = await serviceClient
    .from('compliance_orgs')
    .select('owner_id')
    .eq('id', member.org_id)
    .single()

  if (org?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await serviceClient.from('compliance_org_members').delete().eq('id', memberId)

  return NextResponse.json({ success: true })
}
