import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { CONTENT_SOURCES } from '@/lib/content/sources'
import { fetchAndHash } from '@/lib/content/scanner'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()
  const results: Array<{ source_id: string; status: string; error?: string }> = []

  for (const source of CONTENT_SOURCES) {
    try {
      // Fetch the latest known hash for this source
      const { data: lastEvent } = await serviceClient
        .from('update_events')
        .select('content_hash_new')
        .eq('source_url', source.url)
        .order('detected_at', { ascending: false })
        .limit(1)
        .single()

      const previousHash = lastEvent?.content_hash_new ?? null

      // Fetch and hash current content
      const { text, hash, error: fetchError } = await fetchAndHash(source.url)

      if (fetchError || !hash) {
        results.push({ source_id: source.id, status: 'fetch_error', error: fetchError })
        continue
      }

      // If unchanged, skip
      if (hash === previousHash) {
        results.push({ source_id: source.id, status: 'unchanged' })
        continue
      }

      // Content changed — insert pending update_event
      const { error: insertError } = await serviceClient
        .from('update_events')
        .insert({
          source_url: source.url,
          source_label: source.label,
          content_hash_previous: previousHash,
          content_hash_new: hash,
          raw_content_snapshot: text.slice(0, 5000),
          status: 'pending',
          detected_at: new Date().toISOString(),
        })

      if (insertError) {
        results.push({ source_id: source.id, status: 'insert_error', error: insertError.message })
      } else {
        results.push({ source_id: source.id, status: 'change_detected' })
      }
    } catch (err) {
      results.push({ source_id: source.id, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ scanned_at: new Date().toISOString(), results })
}
