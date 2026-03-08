import { db } from '../db'
import { wallet, usageLog, creditPurchase } from '../db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import type { SettlementPayload } from '../nats'

// ── Token pricing constants ───────────────────────────────────────────────────
// Token House units per 1M provider tokens (approximate)

export const MODEL_PRICING: Record<string, { input: number; output: number; provider: 'anthropic' | 'openai' }> = {
  'claude-3-5-sonnet-20241022': { input: 3000, output: 15000, provider: 'anthropic' },
  'claude-3-5-haiku-20241022':  { input: 800,  output: 4000,  provider: 'anthropic' },
  'claude-3-opus-20240229':     { input: 15000, output: 75000, provider: 'anthropic' },
  'gpt-4o':                     { input: 2500,  output: 10000, provider: 'openai' },
  'gpt-4o-mini':                { input: 150,   output: 600,   provider: 'openai' },
}

export function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0

  const inputCost = (promptTokens / 1_000_000) * pricing.input
  const outputCost = (completionTokens / 1_000_000) * pricing.output
  return Math.ceil(inputCost + outputCost)
}

// ── Wallet helpers ────────────────────────────────────────────────────────────

export async function getOrCreateWallet(userId: string, organizationId?: string | null) {
  if (organizationId) {
    const [existing] = await db
      .select()
      .from(wallet)
      .where(eq(wallet.organizationId, organizationId))
      .limit(1)

    if (existing) return existing

    const [created] = await db
      .insert(wallet)
      .values({ organizationId, balance: 0, planTier: 'free' })
      .returning()

    return created
  }

  const [existing] = await db
    .select()
    .from(wallet)
    .where(and(eq(wallet.userId, userId), isNull(wallet.organizationId)))
    .limit(1)

  if (existing) return existing

  // New users get 1000 free tokens to start
  const [created] = await db
    .insert(wallet)
    .values({ userId, balance: 1000, planTier: 'free' })
    .returning()

  return created
}

export async function getBalance(userId: string, organizationId?: string | null): Promise<number> {
  const w = await getOrCreateWallet(userId, organizationId)
  return w.balance
}

export async function deductTokens(
  userId: string,
  amount: number,
  organizationId?: string | null
): Promise<{ success: boolean; newBalance: number }> {
  const w = await getOrCreateWallet(userId, organizationId)

  if (w.balance < amount) {
    return { success: false, newBalance: w.balance }
  }

  const whereClause = organizationId
    ? eq(wallet.organizationId, organizationId)
    : and(eq(wallet.userId, userId), isNull(wallet.organizationId))

  const [updated] = await db
    .update(wallet)
    .set({
      balance: sql`${wallet.balance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(whereClause!)
    .returning()

  return { success: true, newBalance: updated.balance }
}

export async function addTokens(
  userId: string,
  amount: number,
  organizationId?: string | null
): Promise<number> {
  await getOrCreateWallet(userId, organizationId)

  const whereClause = organizationId
    ? eq(wallet.organizationId, organizationId)
    : and(eq(wallet.userId, userId), isNull(wallet.organizationId))

  const [updated] = await db
    .update(wallet)
    .set({
      balance: sql`${wallet.balance} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(whereClause!)
    .returning()

  return updated.balance
}

// ── Settlement ────────────────────────────────────────────────────────────────

export async function settleUsage(payload: SettlementPayload): Promise<void> {
  const { userId, orgId, taskId, model, provider, promptTokens, completionTokens,
          totalTokens, tokensCharged, costUsd, latencyMs, status } = payload

  // Log usage regardless of outcome
  await db.insert(usageLog).values({
    userId,
    organizationId: orgId,
    taskId,
    model,
    provider,
    promptTokens,
    completionTokens,
    totalTokens,
    tokensCharged,
    costUsd,
    latencyMs,
    status,
  })

  // Deduct tokens if successful
  if (status === 'completed' && tokensCharged > 0) {
    await deductTokens(userId, tokensCharged, orgId)
  }
}

// ── USD to tokens conversion ──────────────────────────────────────────────────
// $1 USD = 10,000 Token House units

export const USD_TO_TOKENS = 10_000
export const PACKAGES = [
  { id: 'starter',    amountUsd: 1000,  tokens: 10_000_000,  label: '$10 — 10M tokens'  },
  { id: 'growth',     amountUsd: 2500,  tokens: 27_500_000,  label: '$25 — 27.5M tokens' },
  { id: 'pro',        amountUsd: 5000,  tokens: 60_000_000,  label: '$50 — 60M tokens'  },
  { id: 'enterprise', amountUsd: 10000, tokens: 130_000_000, label: '$100 — 130M tokens' },
]
