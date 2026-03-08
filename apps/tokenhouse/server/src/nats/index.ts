import { connect, StringCodec, JSONCodec, type NatsConnection } from 'nats'

let nc: NatsConnection | null = null
const sc = StringCodec()
const jc = JSONCodec()

export async function getNatsConnection(): Promise<NatsConnection> {
  if (nc && !nc.isClosed()) return nc

  nc = await connect({
    servers: process.env.NATS_URL ?? 'nats://localhost:4222',
    name: 'tokenhouse-server',
    reconnect: true,
    maxReconnectAttempts: -1,
  })

  console.log(`[NATS] Connected to ${nc.getServer()}`)

  // Handle connection close
  nc.closed().then(() => {
    console.log('[NATS] Connection closed')
    nc = null
  })

  return nc
}

// ── Subject constants ─────────────────────────────────────────────────────────

export const SUBJECTS = {
  // Task lifecycle
  TASK_NEW: 'tokenhouse.tasks.new',
  TASK_CLAIMED: 'tokenhouse.tasks.claimed',
  TASK_COMPLETED: (taskId: string) => `tokenhouse.tasks.${taskId}.completed`,
  TASK_STREAM: (taskId: string) => `tokenhouse.tasks.${taskId}.stream`,
  TASK_ERROR: (taskId: string) => `tokenhouse.tasks.${taskId}.error`,

  // Agent registry
  AGENT_ANNOUNCE: 'tokenhouse.agents.announce',
  AGENT_HEARTBEAT: (agentId: string) => `tokenhouse.agents.${agentId}.heartbeat`,

  // Settlement
  SETTLEMENT: 'tokenhouse.settlement',

  // LLM proxy subjects
  LLM_REQUEST: (provider: string) => `tokenhouse.llm.${provider}.request`,
} as const

// ── Task payload types ────────────────────────────────────────────────────────

export interface TaskPayload {
  taskId: string
  userId: string
  orgId: string | null
  model: string
  provider: 'anthropic' | 'openai'
  messages: Array<{ role: string; content: string }>
  maxTokens?: number
  temperature?: number
  stream?: boolean
  planTier: string
  allowedModels: string[]
  replySubject: string
  createdAt: string
}

export interface SettlementPayload {
  taskId: string
  userId: string
  orgId: string | null
  model: string
  provider: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  tokensCharged: number
  costUsd: number
  latencyMs: number
  status: 'completed' | 'failed'
}

// ── Publish helpers ───────────────────────────────────────────────────────────

export async function publishTask(payload: TaskPayload): Promise<void> {
  const conn = await getNatsConnection()
  conn.publish(SUBJECTS.TASK_NEW, jc.encode(payload))
}

export async function publishSettlement(payload: SettlementPayload): Promise<void> {
  const conn = await getNatsConnection()
  conn.publish(SUBJECTS.SETTLEMENT, jc.encode(payload))
}

export { sc, jc }
