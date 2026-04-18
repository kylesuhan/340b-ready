import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  if (existing) {
    const current: string[] = existing.lessons_completed ?? []
    if (!current.includes(lesson_id)) {
      await supabase
        .from('user_progress')
        .update({
          lessons_completed: [...current, lesson_id],
          last_accessed_at: now,
        })
        .eq('id', existing.id)
    }
  } else {
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

  return NextResponse.json({ success: true })
}
