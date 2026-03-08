import Elysia, { t } from 'elysia'
import { authPlugin } from '../plugins/auth.plugin'
import { publishTask } from '../nats'
import { getNatsConnection, jc } from '../nats'
import { MODEL_PRICING, estimateCost } from '../services/wallet.service'
import { randomUUID } from 'crypto'

const MESSAGE_TIMEOUT_MS = 60_000

export const gatewayRoutes = new Elysia({ prefix: '/api/gateway' })
  .use(authPlugin)

  // ── List available models for this user's plan ─────────────────────────────
  .get('/models', ({ user }) => {
    const allModels = Object.entries(MODEL_PRICING).map(([id, info]) => ({
      id,
      provider: info.provider,
      inputPricePerMTokens: info.input,
      outputPricePerMTokens: info.output,
    }))

    if (!user) {
      return { models: allModels }
    }

    const allowed = allModels.filter(m => user.allowedModels.includes(m.id))
    return { models: allowed }
  })

  // ── OpenAI-compatible chat completions endpoint ────────────────────────────
  // Apps built for OpenAI can point at this endpoint with a Token House bearer token
  .post('/v1/chat/completions', async ({ user, body, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    const { model, messages, max_tokens, temperature, stream } = body

    // Validate model access
    if (!user.allowedModels.includes(model)) {
      set.status = 403
      return {
        error: `Model '${model}' is not available on your ${user.planTier} plan`,
        allowedModels: user.allowedModels,
      }
    }

    // Quick balance pre-check (actual deduction happens post-completion)
    if (user.tokenBalance <= 0) {
      set.status = 402
      return { error: 'Insufficient token balance. Please purchase more credits.' }
    }

    const taskId = randomUUID()
    const replySubject = `tokenhouse.reply.${taskId}`

    const conn = await getNatsConnection()

    // Subscribe to reply before publishing task (avoid race condition)
    const replySub = conn.subscribe(replySubject, { max: 1 })

    // Publish task to NATS
    await publishTask({
      taskId,
      userId: user.id,
      orgId: user.orgId,
      model,
      provider: MODEL_PRICING[model]?.provider ?? 'openai',
      messages: messages as Array<{ role: string; content: string }>,
      maxTokens: max_tokens,
      temperature,
      stream: stream ?? false,
      planTier: user.planTier,
      allowedModels: user.allowedModels,
      replySubject,
      createdAt: new Date().toISOString(),
    })

    // Wait for response with timeout
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), MESSAGE_TIMEOUT_MS)
    )

    const responsePromise = new Promise<Record<string, unknown> | null>(async (resolve) => {
      for await (const msg of replySub) {
        const data = jc.decode(msg.data) as Record<string, unknown>
        resolve(data)
        break
      }
    })

    const result = await Promise.race([responsePromise, timeout])

    if (!result) {
      set.status = 504
      return { error: 'Request timed out — LLM consumer may be unavailable' }
    }

    if (result.error) {
      set.status = 500
      return { error: result.error }
    }

    // Return OpenAI-compatible response format
    return {
      id: `chatcmpl-${taskId}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.model ?? model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: result.content,
        },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: result.promptTokens ?? 0,
        completion_tokens: result.completionTokens ?? 0,
        total_tokens: (result.promptTokens as number ?? 0) + (result.completionTokens as number ?? 0),
      },
      // Token House extras
      tokenhouse: {
        taskId,
        tokensCharged: result.tokensCharged ?? 0,
        latencyMs: result.latencyMs ?? 0,
        remainingBalance: user.tokenBalance - (result.tokensCharged as number ?? 0),
      },
    }
  }, {
    body: t.Object({
      model: t.String(),
      messages: t.Array(t.Object({
        role: t.String(),
        content: t.String(),
      })),
      max_tokens: t.Optional(t.Number()),
      temperature: t.Optional(t.Number()),
      stream: t.Optional(t.Boolean()),
    }),
  })

  // ── Agent registry endpoints ───────────────────────────────────────────────
  .get('/agents', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' } }

    const { db } = await import('../db')
    const { agentRegistry } = await import('../db/schema')
    const { eq, or } = await import('drizzle-orm')

    const agents = await db
      .select()
      .from(agentRegistry)
      .where(eq(agentRegistry.isActive, true))

    return { agents }
  })
