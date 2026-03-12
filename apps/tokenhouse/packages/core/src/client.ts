export interface TokenHouseConfig {
  baseUrl?: string
  orgId: string
  orgSecret: string
  onTokenRefresh?: (token: string) => void
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  cost_usd: number
  org_id: string
}

export interface UsageStats {
  org_id: string
  period: {
    start: string
    end: string
  }
  totals: {
    requests: number
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    cost_usd: number
  }
  by_model: Record<string, {
    requests: number
    tokens: number
    cost_usd: number
  }>
  daily_breakdown: Array<{
    date: string
    tokens: number
    cost_usd: number
  }>
}

export class TokenHouseClient {
  private baseUrl: string
  private orgId: string
  private orgSecret: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private onTokenRefresh?: (token: string) => void

  constructor(config: TokenHouseConfig) {
    this.baseUrl = config.baseUrl || 'https://api.tokenhouse.ai'
    this.orgId = config.orgId
    this.orgSecret = config.orgSecret
    this.onTokenRefresh = config.onTokenRefresh
  }

  /**
   * Authenticate and get JWT access token
   */
  async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: this.orgId,
        org_secret: this.orgSecret
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText })) as { message: string }
      throw new Error(`Authentication failed: ${error.message}`)
    }

    const data = await response.json() as { access_token: string; expires_in: number }
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in * 1000)

    if (this.onTokenRefresh) {
      this.onTokenRefresh(this.accessToken)
    }

    return this.accessToken
  }

  /**
   * Get current access token (auto-refresh if expired)
   */
  private async getToken(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry - 60000) {
      await this.authenticate()
    }
    return this.accessToken!
  }

  /**
   * Chat completion (proxied through TokenHouse)
   */
  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const token = await this.getToken()

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText })) as { message: string }
      throw new Error(`Chat request failed: ${error.message}`)
    }

    return response.json() as Promise<ChatCompletionResponse>
  }

  /**
   * Stream chat completion
   */
  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<string> {
    const token = await this.getToken()

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...request, stream: true })
    })

    if (!response.ok) {
      throw new Error(`Stream failed: ${response.statusText}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }
      }
    }
  }

  /**
   * Get usage statistics for this org
   */
  async getUsage(params?: {
    start_date?: string
    end_date?: string
    model?: string
  }): Promise<UsageStats> {
    const token = await this.getToken()

    const searchParams = new URLSearchParams()
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    if (params?.model) searchParams.set('model', params.model)

    const response = await fetch(
      `${this.baseUrl}/usage/stats?${searchParams}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch usage: ${response.statusText}`)
    }

    return response.json() as Promise<UsageStats>
  }
}
