import { Elysia, t } from 'elysia'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { logUsage } from '../tracking/usage-logger'
import { verifyToken, extractToken } from '../middleware/jwt-verify'

// Initialize with platform owner's master keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-demo-key'
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-demo-key'
})

export const chatRoutes = new Elysia({ prefix: '/chat' })
  .derive(async ({ headers, jwt, set }) => {
    const token = extractToken(headers.authorization)
    if (!token) {
      set.status = 401
      throw new Error('Missing authorization token')
    }

    // Verify JWT (supports both better-auth and legacy tokens)
    const claims = await verifyToken(token, jwt)
    if (!claims) {
      set.status = 401
      throw new Error('Invalid or expired token')
    }

    return { org: claims }
  })
  .post('/completions', async ({ body, org, set }) => {
    const { model, messages, temperature, max_tokens, stream } = body

    // Validate model access
    if (!org.allowed_models.includes(model)) {
      set.status = 403
      return { error: `Model ${model} not allowed for this org` }
    }

    const startTime = Date.now()

    try {
      // Route to appropriate provider
      if (model.startsWith('gpt-') || model.startsWith('o1-')) {
        // OpenAI
        const response = await openai.chat.completions.create({
          model,
          messages,
          temperature,
          max_tokens,
          stream: false  // Handle streaming separately
        })

        // Calculate cost
        const cost = calculateCost('openai', model, {
          prompt_tokens: response.usage!.prompt_tokens,
          completion_tokens: response.usage!.completion_tokens
        })

        // Log usage
        await logUsage({
          org_id: org.org_id,
          usage_tracking_id: org.usage_tracking_id,
          provider: 'openai',
          model,
          prompt_tokens: response.usage!.prompt_tokens,
          completion_tokens: response.usage!.completion_tokens,
          total_tokens: response.usage!.total_tokens,
          latency_ms: Date.now() - startTime,
          cost_usd: cost
        })

        return {
          id: response.id,
          model: response.model,
          choices: response.choices,
          usage: response.usage,
          cost_usd: cost,
          org_id: org.org_id
        }
      }
      else if (model.startsWith('claude-')) {
        // Anthropic
        const response = await anthropic.messages.create({
          model,
          messages: messages.filter((m: any) => m.role !== 'system'),
          system: messages.find((m: any) => m.role === 'system')?.content,
          temperature,
          max_tokens: max_tokens || 1024
        })

        // Calculate cost
        const cost = calculateCost('anthropic', model, {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        })

        // Log usage
        await logUsage({
          org_id: org.org_id,
          usage_tracking_id: org.usage_tracking_id,
          provider: 'anthropic',
          model,
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
          latency_ms: Date.now() - startTime,
          cost_usd: cost
        })

        return {
          id: response.id,
          model: response.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response.content[0].type === 'text' ? response.content[0].text : ''
            },
            finish_reason: response.stop_reason
          }],
          usage: {
            prompt_tokens: response.usage.input_tokens,
            completion_tokens: response.usage.output_tokens,
            total_tokens: response.usage.input_tokens + response.usage.output_tokens
          },
          cost_usd: cost,
          org_id: org.org_id
        }
      }

      set.status = 400
      return { error: `Unsupported model: ${model}` }
    } catch (error: any) {
      set.status = 500
      return { error: error.message || 'Internal server error' }
    }
  }, {
    body: t.Object({
      model: t.String(),
      messages: t.Array(t.Object({
        role: t.String(),
        content: t.String()
      })),
      temperature: t.Optional(t.Number()),
      max_tokens: t.Optional(t.Number()),
      stream: t.Optional(t.Boolean())
    })
  })

// Cost calculation based on current pricing
function calculateCost(
  provider: 'openai' | 'anthropic',
  model: string,
  usage: any
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
    'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
    'claude-3-5-sonnet-20241022': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
    'claude-3-5-haiku-20241022': { input: 0.80 / 1_000_000, output: 4 / 1_000_000 }
  }

  const rates = pricing[model]
  if (!rates) return 0

  if (provider === 'openai') {
    return (usage.prompt_tokens * rates.input) + (usage.completion_tokens * rates.output)
  } else {
    return (usage.input_tokens * rates.input) + (usage.output_tokens * rates.output)
  }
}
