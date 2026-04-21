import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { awardXP, updateStreak, XP_VALUES } from '@/lib/gamification'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { lesson_id: string; module_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { lesson_id, module_id } = body
  if (!lesson_id || !module_id) {
    return NextResponse.json({ error: 'Missing lesson_id or module_id' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Fetch existing progress row
  const { data: existing } = await supabase
    .from('user_progress')
    .select('id, lessons_completed')
    .eq('user_id', user.id)
    .eq('module_id', module_id)
    .single()

  let isNew = false

  if (existing) {
    const current: string[] = existing.lessons_completed ?? []
    if (!current.includes(lesson_id)) {
      isNew = true
      await supabase
        .from('user_progress')
        .update({ lessons_completed: [...current, lesson_id], last_accessed_at: now })
        .eq('id', existing.id)
    }
  } else {
    isNew = true
    await supabase
      .from('user_progress')
      .insert({
        user_id: user.id,
        module_id,
        lessons_completed: [lesson_id],
        module_completed: false,
        quiz_passed: false,
        last_accessed_at: now,
      })
  }

  // Award XP + update streak for new lesson completions
  if (isNew) {
    try {
      const serviceClient = await createServiceClient()
      await Promise.all([
        awardXP(serviceClient, user.id, XP_VALUES.lesson_complete),
        updateStreak(serviceClient, user.id),
      ])
    } catch (err) {
      console.warn('Gamification update failed (lesson):', err)
    }
  }

  return NextResponse.json({ success: true })
}
