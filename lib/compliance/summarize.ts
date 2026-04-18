/**
 * Claude-powered summarization and classification for regulatory changes.
 */
import Anthropic from '@anthropic-ai/sdk'

export interface ComplianceSummary {
  ai_summary: string
  urgency: 'informational' | 'action-required' | 'deadline'
  affected_entities: string[]
}

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export async function summarizeRegulatoryChange(
  title: string,
  rawContent: string,
  documentType: string,
  sourceLabel: string
): Promise<ComplianceSummary> {
  const client = getClient()

  const prompt = `You are a 340B Drug Pricing Program compliance expert. Analyze this regulatory document and respond with a JSON object only — no markdown, no explanation, just raw JSON.

Document Type: ${documentType}
Source: ${sourceLabel}
Title: ${title}
Content: ${rawContent.slice(0, 3000)}

Respond with exactly this JSON structure:
{
  "ai_summary": "2-3 plain English sentences explaining what changed and why it matters to 340B covered entities. Be specific and actionable.",
  "urgency": "one of: informational | action-required | deadline",
  "affected_entities": ["array of applicable: covered-entity, manufacturer, contract-pharmacy, tpa, all"]
}

Urgency guide:
- "informational": Background updates, clarifications, guidance with no immediate action required
- "action-required": Changes that require covered entities to update policies, procedures, or registrations
- "deadline": Contains specific compliance deadlines or comment periods that require timely response`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text.trim()) as ComplianceSummary
    return {
      ai_summary: parsed.ai_summary ?? 'Summary unavailable.',
      urgency: ['informational', 'action-required', 'deadline'].includes(parsed.urgency)
        ? parsed.urgency
        : 'informational',
      affected_entities: Array.isArray(parsed.affected_entities)
        ? parsed.affected_entities
        : ['all'],
    }
  } catch {
    // Fallback if Claude returns non-JSON
    return {
      ai_summary: rawContent.slice(0, 300),
      urgency: 'informational',
      affected_entities: ['all'],
    }
  }
}
