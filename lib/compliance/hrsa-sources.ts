/**
 * HRSA and supplementary source scrapers for 340B compliance monitoring.
 * These supplement the Federal Register scanner with HRSA-specific content.
 */

export interface HrsaDoc {
  source_id: string
  source_type: 'hrsa' | 'oig'
  source_url: string
  source_label: string
  title: string
  abstract: string | null
  document_type: string
  publication_date: string | null
  effective_on: string | null
}

// ── HRSA 340B Program Notices ─────────────────────────────────────────────────
// HRSA publishes program notices, policy releases, and guidance letters here.
// We fetch the page and parse anchor links to identify new documents.

const HRSA_SOURCES = [
  {
    url: 'https://www.hrsa.gov/opa/updates/index.html',
    label: 'HRSA 340B Program Updates',
    source_type: 'hrsa' as const,
  },
  {
    url: 'https://www.hrsa.gov/opa/integrity/index.html',
    label: 'HRSA 340B Integrity',
    source_type: 'hrsa' as const,
  },
  {
    url: 'https://oig.hhs.gov/reports-and-publications/workplan/summary/?component=all&category=all&search=340B',
    label: 'OIG Work Plan — 340B',
    source_type: 'oig' as const,
  },
]

interface ScrapedLink {
  title: string
  url: string
  source_type: 'hrsa' | 'oig'
  source_label: string
}

/**
 * Lightly scrapes HRSA/OIG pages for links that contain "340B" in their text
 * or nearby context. Returns candidate documents for review.
 * Note: This is best-effort — page structure changes can break parsing.
 */
export async function fetchHrsaUpdates(): Promise<HrsaDoc[]> {
  const docs: HrsaDoc[] = []

  await Promise.all(
    HRSA_SOURCES.map(async ({ url, label, source_type }) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': '340B-Ready Compliance Monitor/1.0 (compliance monitoring)',
          },
          signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) return

        const html = await res.text()
        const links = extractRelevantLinks(html, url, label, source_type)

        docs.push(
          ...links.map((link) => ({
            source_id: `${source_type}-${hashString(link.url)}`,
            source_type: link.source_type,
            source_url: link.url,
            source_label: link.source_label,
            title: link.title,
            abstract: null,
            document_type: 'Guidance',
            publication_date: null,
            effective_on: null,
          }))
        )
      } catch (err) {
        console.warn(`HRSA source fetch failed for ${url}:`, err)
      }
    })
  )

  return docs
}

/**
 * Extracts anchor links from HTML that are likely 340B-related.
 * Looks for links containing "340b", "340-b", or nearby heading text.
 */
function extractRelevantLinks(
  html: string,
  baseUrl: string,
  sourceLabel: string,
  sourceType: 'hrsa' | 'oig'
): ScrapedLink[] {
  const links: ScrapedLink[] = []
  const seen = new Set<string>()

  // Match <a href="...">text</a> patterns
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = anchorRegex.exec(html)) !== null) {
    const [, href, rawText] = match
    const text = rawText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

    if (!text || text.length < 5) continue

    // Only include links that mention 340B
    const is340B =
      text.toLowerCase().includes('340b') ||
      text.toLowerCase().includes('340-b') ||
      href.toLowerCase().includes('340b')

    if (!is340B) continue

    // Resolve relative URLs
    let absoluteUrl: string
    try {
      absoluteUrl = new URL(href, baseUrl).toString()
    } catch {
      continue
    }

    // Skip anchors, mailto, javascript
    if (
      absoluteUrl.startsWith('mailto:') ||
      absoluteUrl.startsWith('javascript:') ||
      absoluteUrl.includes('#')
    ) continue

    if (seen.has(absoluteUrl)) continue
    seen.add(absoluteUrl)

    links.push({ title: text, url: absoluteUrl, source_type: sourceType, source_label: sourceLabel })

    if (links.length >= 10) break // cap per source
  }

  return links
}

/** Simple deterministic hash for URL-based source IDs */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
