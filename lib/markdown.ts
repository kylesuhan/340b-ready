/**
 * Minimal markdown renderer for lesson content.
 * Handles the subset of markdown used in lesson files.
 * Server-side only. HTML entities are escaped before inline processing.
 */
export function renderMarkdown(md: string): string {
  if (!md) return ''

  const lines = md.split('\n')
  const output: string[] = []
  let inList = false
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headings
    if (line.startsWith('### ')) {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      output.push(`<h3>${processInline(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      output.push(`<h2>${processInline(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      output.push(`<h1>${processInline(line.slice(2))}</h1>`)
      continue
    }

    // Horizontal rule
    if (line.trim() === '---') {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      output.push('<hr />')
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      output.push(`<blockquote><p>${processInline(line.slice(2))}</p></blockquote>`)
      continue
    }

    // List item
    if (line.startsWith('- ') || line.match(/^\d+\. /)) {
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      if (!inList) { output.push('<ul>'); inList = true }
      const text = line.startsWith('- ') ? line.slice(2) : line.replace(/^\d+\. /, '')
      output.push(`<li>${processInline(text)}</li>`)
      continue
    }

    // Table
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) { output.push('</ul>'); inList = false }
      const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1)
      const isSeparator = cells.every(c => c.trim().match(/^[-:]+$/))
      if (isSeparator) continue
      if (!inTable) {
        output.push('<table><tbody>')
        inTable = true
        const row = cells.map(c => `<th>${processInline(c.trim())}</th>`).join('')
        output.push(`<tr>${row}</tr>`)
      } else {
        const row = cells.map(c => `<td>${processInline(c.trim())}</td>`).join('')
        output.push(`<tr>${row}</tr>`)
      }
      continue
    }

    // Empty line — close list/table
    if (line.trim() === '') {
      if (inList) { output.push('</ul>'); inList = false }
      if (inTable) { output.push('</tbody></table>'); inTable = false }
      continue
    }

    // Regular paragraph
    if (inList) { output.push('</ul>'); inList = false }
    if (inTable) { output.push('</tbody></table>'); inTable = false }
    output.push(`<p>${processInline(line)}</p>`)
  }

  if (inList) output.push('</ul>')
  if (inTable) output.push('</tbody></table>')

  return output.join('\n')
}

/** Escape HTML entities to prevent XSS from raw text content */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function processInline(text: string): string {
  // Extract markdown tokens before escaping so we can restore them
  // Pattern: process markdown syntax, then escape remaining text
  const segments: Array<{ type: 'raw' | 'html'; value: string }> = []

  // Split on markdown patterns while preserving them
  const pattern = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'raw', value: text.slice(last, match.index) })
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ type: 'html', value: `<strong>${escapeHtml(token.slice(2, -2))}</strong>` })
    } else if (token.startsWith('*') && token.endsWith('*')) {
      segments.push({ type: 'html', value: `<em>${escapeHtml(token.slice(1, -1))}</em>` })
    } else if (token.startsWith('`') && token.endsWith('`')) {
      segments.push({ type: 'html', value: `<code>${escapeHtml(token.slice(1, -1))}</code>` })
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        // Only allow http/https URLs in links
        const href = linkMatch[2].startsWith('http://') || linkMatch[2].startsWith('https://')
          ? linkMatch[2]
          : '#'
        segments.push({
          type: 'html',
          value: `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkMatch[1])}</a>`,
        })
      }
    }
    last = match.index + token.length
  }

  if (last < text.length) {
    segments.push({ type: 'raw', value: text.slice(last) })
  }

  return segments
    .map(s => s.type === 'raw' ? escapeHtml(s.value) : s.value)
    .join('')
}
