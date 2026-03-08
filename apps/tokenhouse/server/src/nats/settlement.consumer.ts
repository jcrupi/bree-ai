import { getNatsConnection, SUBJECTS, jc, type SettlementPayload } from '../nats'
import { settleUsage } from '../services/wallet.service'

export async function startSettlementConsumer(): Promise<void> {
  const conn = await getNatsConnection()
  const sub = conn.subscribe(SUBJECTS.SETTLEMENT)

  console.log('[Settlement] Consumer started, listening on', SUBJECTS.SETTLEMENT)

  ;(async () => {
    for await (const msg of sub) {
      try {
        const payload = jc.decode(msg.data) as SettlementPayload

        await settleUsage(payload)

        console.log(
          `[Settlement] Settled task ${payload.taskId} — charged ${payload.tokensCharged} tokens to user ${payload.userId}`
        )
      } catch (err) {
        console.error('[Settlement] Failed to process settlement:', err)
      }
    }
  })()
}
