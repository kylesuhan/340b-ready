import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchFederalRegister340B } from '@/lib/compliance/federal-register'
import { fetchHrsaUpdates } from '@/lib/compliance/hrsa-sources'
import { summarizeRegulatoryChange } from '@/lib/compliance/summarize'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = await createServiceClient()
  const results: Array<{ source_id: string; status: string; error?: string }> = []

  // ── Federal Register ──────────────────────────────────────────────────────
  try {
    const docs = await fetchFederalRegister340B(30)

    for (const doc of docs) {
      const sourceId = `fr-${doc.document_number}`

      const { data: existing } = await serviceClient
        .from('compliance_items')
        .select('id')
        .eq('source_id', sourceId)
        .single()

      if (existing) {
        results.push({ source_id: sourceId, status: 'already_exists' })
        continue
      }

      const rawContent = [doc.title, doc.abstract ?? ''].join('\n\n')
      let summary: { ai_summary: string; urgency: 'informational' | 'action-required' | 'deadline'; affected_entities: string[] } = {
        ai_summary: doc.abstract ?? doc.title,
        urgency: 'informational',
        affected_entities: ['all'],
      }

      try {
        summary = await summarizeRegulatoryChange(
          doc.title,
          rawContent,
          doc.document_type,
          'Federal Register'
        )
      } catch (err) {
        console.warn(`Claude summarization failed for ${sourceId}:`, err)
      }

      const { error: insertError } = await serviceClient
        .from('compliance_items')
        .insert({
          source_id: sourceId,
          source_type: 'federal_register',
          source_url: doc.html_url,
          source_label: 'Federal Register',
          title: doc.title,
          raw_summary: doc.abstract,
          ai_summary: summary.ai_summary,
          urgency: summary.urgency,
          affected_entities: summary.affected_entities,
          publication_date: doc.publication_date,
          effective_date: doc.effective_on ?? null,
          detected_at: new Date().toISOString(),
          published: true,
        })

      if (insertError) {
        results.push({ source_id: sourceId, status: 'insert_error', error: insertError.message })
      } else {
        results.push({ source_id: sourceId, status: 'inserted' })
      }
    }
  } catch (err) {
    results.push({ source_id: 'federal_register_batch', status: 'error', error: String(err) })
  }

  // ── HRSA & OIG Sources ────────────────────────────────────────────────────
  try {
    const hrsaDocs = await fetchHrsaUpdates()

    for (const doc of hrsaDocs) {
      const { data: existing } = await serviceClient
        .from('compliance_items')
        .select('id')
        .eq('source_id', doc.source_id)
        .single()

      if (existing) {
        results.push({ source_id: doc.source_id, status: 'already_exists' })
        continue
      }

      let summary: { ai_summary: string; urgency: 'informational' | 'action-required' | 'deadline'; affected_entities: string[] } = {
        ai_summary: doc.abstract ?? doc.title,
        urgency: 'informational',
        affected_entities: ['all'],
      }

      try {
        summary = await summarizeRegulatoryChange(
          doc.title,
          doc.abstract ?? doc.title,
          doc.document_type,
          doc.source_label
        )
      } catch (err) {
        console.warn(`Claude summarization failed for ${doc.source_id}:`, err)
      }

      const { error: insertError } = await serviceClient
        .from('compliance_items')
        .insert({
          source_id: doc.source_id,
          source_type: doc.source_type,
          source_url: doc.source_url,
          source_label: doc.source_label,
          title: doc.title,
          raw_summary: doc.abstract,
          ai_summary: summary.ai_summary,
          urgency: summary.urgency,
          affected_entities: summary.affected_entities,
          publication_date: doc.publication_date,
          effective_date: doc.effective_on ?? null,
          detected_at: new Date().toISOString(),
          published: true,
        })

      if (insertError) {
        results.push({ source_id: doc.source_id, status: 'insert_error', error: insertError.message })
      } else {
        results.push({ source_id: doc.source_id, status: 'inserted' })
      }
    }
  } catch (err) {
    results.push({ source_id: 'hrsa_batch', status: 'error', error: String(err) })
  }

  return NextResponse.json({
    scanned_at: new Date().toISOString(),
    results,
    total_new: results.filter((r) => r.status === 'inserted').length,
  })
}
