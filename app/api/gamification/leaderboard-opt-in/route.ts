import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureGamificationRow } from '@/lib/gamification'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { opt_in: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const serviceClient = await createServiceClient()
  await ensureGamificationRow(serviceClient, user.id)
  await serviceClient
    .from('user_gamification')
    .update({ leaderboard_opt_in: body.opt_in })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
