import { MODEL_PRICING } from './wallet.service'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMRequest {
  model: string
  messages: Message[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface LLMResponse {
  content: string
  promptTokens: number
  completionTokens: number
  model: string
}

// ── Anthropic ─────────────────────────────────────────────────────────────────

async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  // Separate system message from conversation
  const systemMessage = req.messages.find(m => m.role === 'system')
  const conversationMessages = req.messages.filter(m => m.role !== 'system')

  const body: Record<string, unknown> = {
    model: req.model,
    max_tokens: req.maxTokens ?? 1024,
    messages: conversationMessages,
  }

  if (systemMessage) {
    body.system = systemMessage.content
  }

  if (req.temperature !== undefined) {
    body.temperature = req.temperature
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${error}`)
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>
    usage: { input_tokens: number; output_tokens: number }
    model: string
  }

  return {
    content: data.content.map(c => c.text).join(''),
    promptTokens: data.usage.input_tokens,
    completionTokens: data.usage.output_tokens,
    model: data.model,
  }
}

// ── OpenAI ────────────────────────────────────────────────────────────────────

async function callOpenAI(req: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${error}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
    usage: { prompt_tokens: number; completion_tokens: number }
    model: string
  }

  return {
    content: data.choices[0]?.message?.content ?? '',
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
    model: data.model,
  }
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const pricing = MODEL_PRICING[req.model]
  if (!pricing) {
    throw new Error(`Unknown model: ${req.model}`)
  }

  if (pricing.provider === 'anthropic') {
    return callAnthropic(req)
  } else {
    return callOpenAI(req)
  }
}

export function getProvider(model: string): 'anthropic' | 'openai' {
  return MODEL_PRICING[model]?.provider ?? 'openai'
}
