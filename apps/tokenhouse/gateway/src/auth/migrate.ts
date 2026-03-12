/**
 * Migration Script: Create Better Auth database with TokenHouse organizations
 *
 * This creates a fresh better-auth database with all TokenHouse organizations.
 * Run with: bun run src/auth/migrate.ts
 */

import { Database } from 'bun:sqlite'
import bcrypt from 'bcryptjs'

const db = new Database('tokenhouse.db')

console.log('Starting TokenHouse Better Auth database creation...\n')

// Create better-auth tables
console.log('Creating better-auth tables...')

db.run(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    email_verified INTEGER DEFAULT 0,
    name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    password TEXT,
    salt TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    org_secret TEXT UNIQUE NOT NULL,
    org_token TEXT UNIQUE NOT NULL,
    billing_tier TEXT NOT NULL DEFAULT 'free',
    allowed_models TEXT NOT NULL DEFAULT '[]',
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    tokens_per_day INTEGER NOT NULL DEFAULT 500000
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS organization_member (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE(organization_id, user_id)
  )
`)

console.log('✅ Tables created successfully\n')

// Define organizations with plaintext secrets
const organizations = [
  {
    slug: 'tokenhouse-super-org',
    name: 'TokenHouse',
    secret: 'ths_super_secret_abc123',
    tier: 'enterprise' as const,
    models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    rpm: 1000,
    tpd: 100_000_000,
    users: ['johnny@tokenhouse.ai']
  },
  {
    slug: 'tokenhouse-community',
    name: 'TokenHouse Community',
    secret: 'ths_community_secret_xyz',
    tier: 'free' as const,
    models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
    rpm: 60,
    tpd: 500_000,
    users: []
  },
  {
    slug: 'tokenhouse-professional',
    name: 'TokenHouse Professional',
    secret: 'ths_professional_secret_xyz',
    tier: 'pro' as const,
    models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    rpm: 200,
    tpd: 5_000_000,
    users: []
  },
  {
    slug: 'happyai',
    name: 'HappyAI',
    secret: 'ths_happyai_secret_xyz',
    tier: 'enterprise' as const,
    models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'],
    rpm: 300,
    tpd: 10_000_000,
    users: []
  },
  {
    slug: 'groovy-relativity',
    name: 'GroovyRelativity',
    secret: 'ths_groovy_secret_xyz',
    tier: 'pro' as const,
    models: ['gpt-4o', 'claude-3-5-sonnet-20241022'],
    rpm: 250,
    tpd: 8_000_000,
    users: []
  },
  {
    slug: 'freehabits',
    name: 'FreeHabits',
    secret: 'ths_freehabits_secret_xyz',
    tier: 'starter' as const,
    models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
    rpm: 150,
    tpd: 3_000_000,
    users: []
  },
  {
    slug: 'org_demo123',
    name: 'Demo Organization',
    secret: 'ths_demo_secret_xyz789',
    tier: 'pro' as const,
    models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022'],
    rpm: 100,
    tpd: 1_000_000,
    users: ['demo@tokenhouse.ai']
  }
]

// Migrate organizations
console.log('Creating organizations...')

const orgMap = new Map<string, string>()

const insertOrg = db.prepare(`
  INSERT INTO organization (
    id, name, slug, created_at, updated_at,
    org_secret, org_token, billing_tier, allowed_models,
    requests_per_minute, tokens_per_day
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const org of organizations) {
  const orgId = crypto.randomUUID()
  orgMap.set(org.slug, orgId)

  const now = new Date().toISOString()

  insertOrg.run(
    orgId,
    org.name,
    org.slug,
    now,
    now,
    org.secret, // Store plaintext for development
    crypto.randomUUID(),
    org.tier,
    JSON.stringify(org.models),
    org.rpm,
    org.tpd
  )

  console.log(`  ✓ Created org: ${org.name} (${org.slug})`)
}

console.log(`✅ Created ${orgMap.size} organizations\n`)

// Create users
console.log('Creating users...')

const userMap = new Map<string, string>()
const defaultPassword = 'ChangeMe123!'

const insertUser = db.prepare(`
  INSERT INTO user (
    id, email, email_verified, name, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?)
`)

const insertAccount = db.prepare(`
  INSERT INTO account (
    id, user_id, account_id, provider_id, password, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`)

// Collect all unique users
const allUsers = new Set<string>()
for (const org of organizations) {
  for (const email of org.users) {
    allUsers.add(email)
  }
}

for (const email of allUsers) {
  const userId = crypto.randomUUID()
  userMap.set(email, userId)

  const now = new Date().toISOString()
  const name = email.split('@')[0]

  insertUser.run(
    userId,
    email,
    1, // Verified
    name,
    now,
    now
  )

  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  insertAccount.run(
    crypto.randomUUID(),
    userId,
    email,
    'credential',
    passwordHash,
    now,
    now
  )

  console.log(`  ✓ Created user: ${email}`)
}

console.log(`✅ Created ${userMap.size} users\n`)

// Create memberships
console.log('Creating organization memberships...')

let membershipCount = 0

const insertMember = db.prepare(`
  INSERT INTO organization_member (
    id, organization_id, user_id, role, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?)
`)

for (const org of organizations) {
  const orgId = orgMap.get(org.slug)
  if (!orgId) continue

  for (let i = 0; i < org.users.length; i++) {
    const email = org.users[i]
    const userId = userMap.get(email)
    if (!userId) continue

    const role = i === 0 ? 'owner' : 'member'

    insertMember.run(
      crypto.randomUUID(),
      orgId,
      userId,
      role,
      new Date().toISOString(),
      new Date().toISOString()
    )

    membershipCount++
    console.log(`  ✓ Added ${email} to ${org.slug} as ${role}`)
  }
}

console.log(`✅ Created ${membershipCount} memberships\n`)

// Verify
console.log('Verifying database...')

const userCount = db.query('SELECT COUNT(*) as count FROM user').get() as { count: number }
const orgCount = db.query('SELECT COUNT(*) as count FROM organization').get() as { count: number }
const memberCount = db.query('SELECT COUNT(*) as count FROM organization_member').get() as { count: number }

console.log(`  Users: ${userCount.count}`)
console.log(`  Organizations: ${orgCount.count}`)
console.log(`  Memberships: ${memberCount.count}`)

console.log('\n' + '='.repeat(70))
console.log('🎉 TokenHouse Better Auth database created successfully!\n')
console.log('📝 Next steps:')
console.log('  1. Update gateway to use better-auth')
console.log('  2. Default password for all users: ChangeMe123!')
console.log('  3. Users should reset passwords on first login')
console.log('  4. Update admin UI to use better-auth-ui components')
console.log('='.repeat(70))

console.log('\n📋 Organization Credentials:\n')
for (const org of organizations) {
  console.log(`${org.name}:`)
  console.log(`  Slug: ${org.slug}`)
  console.log(`  Secret: ${org.secret}`)
  console.log(`  Tier: ${org.tier}`)
  console.log(`  Models: ${org.models.length}`)
  console.log(`  Limits: ${org.rpm} req/min, ${org.tpd.toLocaleString()} tokens/day`)
  console.log('')
}

db.close()
console.log('✅ Database closed successfully')
