import { getNatsConnection, SUBJECTS, jc, type TaskPayload, type SettlementPayload } from '../nats'
import { callLLM, getProvider } from '../services/llm.service'
import { estimateCost } from '../services/wallet.service'
import { randomUUID } from 'crypto'

export async function startLLMConsumer(): Promise<void> {
  const conn = await getNatsConnection()
  const sub = conn.subscribe(SUBJECTS.TASK_NEW)

  console.log('[LLM Consumer] Started, listening on', SUBJECTS.TASK_NEW)

  ;(async () => {
    for await (const msg of sub) {
      const startTime = Date.now()
      let payload: TaskPayload | null = null

      try {
        payload = jc.decode(msg.data) as TaskPayload
        console.log(`[LLM Consumer] Processing task ${payload.taskId} — model: ${payload.model}`)

        // Validate model is allowed for this user
        if (!payload.allowedModels.includes(payload.model)) {
          throw new Error(`Model ${payload.model} not permitted on plan ${payload.planTier}`)
        }

        // Call the actual LLM
        const result = await callLLM({
          model: payload.model,
          messages: payload.messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
          maxTokens: payload.maxTokens,
          temperature: payload.temperature,
        })

        const latencyMs = Date.now() - startTime
        const tokensCharged = estimateCost(payload.model, result.promptTokens, result.completionTokens)

        // Reply to requester
        if (payload.replySubject) {
          conn.publish(
            payload.replySubject,
            jc.encode({
              taskId: payload.taskId,
              content: result.content,
              model: result.model,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              tokensCharged,
              latencyMs,
            })
          )
        }

        // Publish settlement
        const settlement: SettlementPayload = {
          taskId: payload.taskId,
          userId: payload.userId,
          orgId: payload.orgId,
          model: payload.model,
          provider: getProvider(payload.model),
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.promptTokens + result.completionTokens,
          tokensCharged,
          costUsd: tokensCharged / 10_000,
          latencyMs,
          status: 'completed',
        }

        conn.publish(SUBJECTS.SETTLEMENT, jc.encode(settlement))
        console.log(`[LLM Consumer] Task ${payload.taskId} completed in ${latencyMs}ms`)
      } catch (err) {
        console.error(`[LLM Consumer] Task failed:`, err)

        if (payload?.replySubject) {
          conn.publish(
            payload.replySubject,
            jc.encode({
              taskId: payload.taskId,
              error: err instanceof Error ? err.message : 'Unknown error',
            })
          )
        }

        // Log failed settlement
        if (payload) {
          const settlement: SettlementPayload = {
            taskId: payload.taskId,
            userId: payload.userId,
            orgId: payload.orgId,
            model: payload.model,
            provider: getProvider(payload.model),
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            tokensCharged: 0,
            costUsd: 0,
            latencyMs: Date.now() - startTime,
            status: 'failed',
          }
          conn.publish(SUBJECTS.SETTLEMENT, jc.encode(settlement))
        }
      }
    }
  })()
}
