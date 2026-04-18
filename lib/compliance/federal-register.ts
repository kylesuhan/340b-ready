/**
 * Federal Register API client for 340B-related regulatory documents.
 * API docs: https://www.federalregister.gov/developers/documentation/api/v1
 */

export interface FederalRegisterDoc {
  document_number: string
  title: string
  abstract: string | null
  document_type: string      // 'Rule' | 'Proposed Rule' | 'Notice' | 'Presidential Document'
  publication_date: string   // YYYY-MM-DD
  effective_on: string | null
  html_url: string
  pdf_url: string | null
  agencies: Array<{ name: string }>
}

interface FederalRegisterResponse {
  count: number
  results: FederalRegisterDoc[]
}

const FR_API = 'https://www.federalregister.gov/api/v1/documents.json'

export async function fetchFederalRegister340B(
  daysBack = 30
): Promise<FederalRegisterDoc[]> {
  const since = new Date()
  since.setDate(since.getDate() - daysBack)
  const sinceStr = since.toISOString().slice(0, 10)

  const params = new URLSearchParams({
    'conditions[term]': '340B',
    'conditions[type][]': 'RULE',
    'conditions[publication_date][gte]': sinceStr,
    'per_page': '20',
    'order': 'newest',
    'fields[]': [
      'document_number',
      'title',
      'abstract',
      'document_type',
      'publication_date',
      'effective_on',
      'html_url',
      'pdf_url',
      'agencies',
    ].join(','),
  })

  // Fetch rules, proposed rules, and notices in parallel
  const types = ['RULE', 'PRORULE', 'NOTICE']
  const results: FederalRegisterDoc[] = []

  await Promise.all(
    types.map(async (type) => {
      const p = new URLSearchParams(params)
      p.set('conditions[type][]', type)

      try {
        const res = await fetch(`${FR_API}?${p.toString()}`, {
          headers: { 'User-Agent': '340B-Ready Compliance Monitor/1.0' },
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) return
        const data: FederalRegisterResponse = await res.json()
        results.push(...(data.results ?? []))
      } catch {
        // Non-fatal — log but continue
        console.warn(`Federal Register fetch failed for type ${type}`)
      }
    })
  )

  // Deduplicate by document_number
  const seen = new Set<string>()
  return results.filter((doc) => {
    if (seen.has(doc.document_number)) return false
    seen.add(doc.document_number)
    return true
  })
}
