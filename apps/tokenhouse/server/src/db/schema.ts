import { pgTable, text, integer, timestamp, boolean, real, jsonb, uuid } from 'drizzle-orm/pg-core'

// ── Better Auth required tables ──────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  activeOrganizationId: text('active_organization_id'),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// ── Better Auth organization tables ──────────────────────────────────────────

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: text('metadata'),
})

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

// ── Token House specific tables ───────────────────────────────────────────────

export const wallet = pgTable('wallet', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Either userId (personal) or organizationId (org wallet)
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }),
  balance: integer('balance').notNull().default(0),          // in Token House units
  monthlyBudget: integer('monthly_budget'),                  // optional spend cap
  planTier: text('plan_tier').notNull().default('free'),     // free | pro | enterprise
  allowedModels: jsonb('allowed_models').$type<string[]>().default(['claude-3-5-haiku-20241022', 'gpt-4o-mini']),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const creditPurchase = pgTable('credit_purchase', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  organizationId: text('organization_id').references(() => organization.id),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  amountUsd: integer('amount_usd').notNull(),               // in cents
  tokensGranted: integer('tokens_granted').notNull(),
  status: text('status').notNull().default('pending'),      // pending | completed | failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const usageLog = pgTable('usage_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id),
  organizationId: text('organization_id').references(() => organization.id),
  taskId: text('task_id').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),                     // anthropic | openai
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  tokensCharged: integer('tokens_charged').notNull().default(0),
  costUsd: real('cost_usd').notNull().default(0),
  latencyMs: integer('latency_ms'),
  status: text('status').notNull().default('completed'),    // completed | failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const agentRegistry = pgTable('agent_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: text('organization_id').references(() => organization.id),
  name: text('name').notNull(),
  description: text('description'),
  capabilities: jsonb('capabilities').$type<string[]>().notNull(),
  natsSubject: text('nats_subject').notNull(),
  costPerTask: integer('cost_per_task').notNull().default(10),
  isPublic: boolean('is_public').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Organization = typeof organization.$inferSelect
export type Member = typeof member.$inferSelect
export type Wallet = typeof wallet.$inferSelect
export type UsageLog = typeof usageLog.$inferSelect
export type AgentRegistry = typeof agentRegistry.$inferSelect
