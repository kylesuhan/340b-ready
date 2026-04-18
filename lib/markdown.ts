/**
 * Minimal markdown renderer for lesson content.
 * Handles the subset of markdown used in lesson files.
 * Server-side only.
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

function processInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}
