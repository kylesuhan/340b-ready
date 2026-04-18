import crypto from 'crypto'

export interface ScanResult {
  text: string
  hash: string
  error?: string
}

export async function fetchAndHash(url: string): Promise<ScanResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15_000)

    const res = await fetch(url, {
      headers: {
        'User-Agent': '340B-Ready Content Monitor/1.0 (study app; not a scraper)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return { text: '', hash: '', error: `HTTP ${res.status}` }
    }

    const text = await res.text()
    const hash = crypto.createHash('sha256').update(text).digest('hex')
    return { text, hash }
  } catch (err) {
    return { text: '', hash: '', error: String(err) }
  }
}
