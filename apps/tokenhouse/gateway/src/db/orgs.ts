import { hash } from 'bcrypt'

interface Org {
  org_id: string
  org_name: string
  org_secret_hash: string
  org_token_hash: string
  allowed_models: string[]
  rate_limits: {
    requests_per_minute: number
    tokens_per_day: number
  }
  billing_tier: 'free' | 'starter' | 'pro' | 'enterprise'
  users: string[]  // Array of user emails
  created_at: Date
}

interface User {
  email: string
  name?: string
  org_ids: string[]  // Orgs this user belongs to
  created_at: Date
}

// In-memory storage (replace with database in production)
const orgs: Map<string, Org> = new Map()
const users: Map<string, User> = new Map()

// Initialize with all organizations
const secrets = {
  demo: 'ths_demo_secret_xyz789',
  superOrg: 'ths_super_secret_abc123',
  community: 'ths_community_secret_xyz',
  professional: 'ths_professional_secret_xyz',
  happyAI: 'ths_happyai_secret_xyz',
  groovyRelativity: 'ths_groovy_secret_xyz',
  freeHabits: 'ths_freehabits_secret_xyz'
}

Promise.all([
  hash(secrets.demo, 10),
  hash(secrets.superOrg, 10),
  hash(secrets.community, 10),
  hash(secrets.professional, 10),
  hash(secrets.happyAI, 10),
  hash(secrets.groovyRelativity, 10),
  hash(secrets.freeHabits, 10)
]).then(([demoHash, superHash, communityHash, professionalHash, happyAIHash, groovyHash, freeHabitsHash]) => {

  // TokenHouse Super Org (Platform Owner)
  orgs.set('tokenhouse-super-org', {
    org_id: 'tokenhouse-super-org',
    org_name: 'TokenHouse',
    org_secret_hash: superHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022'
    ],
    rate_limits: {
      requests_per_minute: 1000,
      tokens_per_day: 100_000_000
    },
    billing_tier: 'enterprise',
    users: ['johnny@tokenhouse.ai'],
    created_at: new Date()
  })

  // TokenHouse Community (Free Tier)
  orgs.set('tokenhouse-community', {
    org_id: 'tokenhouse-community',
    org_name: 'TokenHouse Community',
    org_secret_hash: communityHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022'
    ],
    rate_limits: {
      requests_per_minute: 60,
      tokens_per_day: 500_000
    },
    billing_tier: 'free',
    users: [],
    created_at: new Date()
  })

  // TokenHouse Professional
  orgs.set('tokenhouse-professional', {
    org_id: 'tokenhouse-professional',
    org_name: 'TokenHouse Professional',
    org_secret_hash: professionalHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022'
    ],
    rate_limits: {
      requests_per_minute: 200,
      tokens_per_day: 5_000_000
    },
    billing_tier: 'pro',
    users: [],
    created_at: new Date()
  })

  // HappyAI
  orgs.set('happyai', {
    org_id: 'happyai',
    org_name: 'HappyAI',
    org_secret_hash: happyAIHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-5-sonnet-20241022'
    ],
    rate_limits: {
      requests_per_minute: 300,
      tokens_per_day: 10_000_000
    },
    billing_tier: 'enterprise',
    users: [],
    created_at: new Date()
  })

  // GroovyRelativity
  orgs.set('groovy-relativity', {
    org_id: 'groovy-relativity',
    org_name: 'GroovyRelativity',
    org_secret_hash: groovyHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o',
      'claude-3-5-sonnet-20241022'
    ],
    rate_limits: {
      requests_per_minute: 250,
      tokens_per_day: 8_000_000
    },
    billing_tier: 'pro',
    users: [],
    created_at: new Date()
  })

  // FreeHabits
  orgs.set('freehabits', {
    org_id: 'freehabits',
    org_name: 'FreeHabits',
    org_secret_hash: freeHabitsHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022'
    ],
    rate_limits: {
      requests_per_minute: 150,
      tokens_per_day: 3_000_000
    },
    billing_tier: 'starter',
    users: [],
    created_at: new Date()
  })

  // Demo org (keep for testing)
  orgs.set('org_demo123', {
    org_id: 'org_demo123',
    org_name: 'Demo Organization',
    org_secret_hash: demoHash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022'
    ],
    rate_limits: {
      requests_per_minute: 100,
      tokens_per_day: 1_000_000
    },
    billing_tier: 'pro',
    users: ['demo@tokenhouse.ai'],
    created_at: new Date()
  })

  // Create users
  users.set('johnny@tokenhouse.ai', {
    email: 'johnny@tokenhouse.ai',
    name: 'Johnny',
    org_ids: ['tokenhouse-super-org'],
    created_at: new Date()
  })

  users.set('demo@tokenhouse.ai', {
    email: 'demo@tokenhouse.ai',
    name: 'Demo User',
    org_ids: ['org_demo123'],
    created_at: new Date()
  })

  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    TOKENHOUSE PLATFORM INITIALIZED                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  [SUPER ORG] 🏦 TokenHouse                                           ║
║  • ID: tokenhouse-super-org                                          ║
║  • Secret: ${secrets.superOrg}                          ║
║  • Admin: johnny@tokenhouse.ai                                       ║
║  • Tier: Enterprise | 1000 req/min | 100M tokens/day                ║
╠──────────────────────────────────────────────────────────────────────╣
║  [GROUPS]                                                            ║
║  • tokenhouse-community (Free) - ${secrets.community}         ║
║  • tokenhouse-professional (Pro) - ${secrets.professional}       ║
╠──────────────────────────────────────────────────────────────────────╣
║  [ORGANIZATIONS]                                                     ║
║  • HappyAI - ${secrets.happyAI}                          ║
║  • GroovyRelativity - ${secrets.groovyRelativity}                  ║
║  • FreeHabits - ${secrets.freeHabits}                      ║
╠──────────────────────────────────────────────────────────────────────╣
║  Admin UI: http://localhost:6182                                     ║
║  API: http://localhost:8187                                          ║
╚══════════════════════════════════════════════════════════════════════╝
  `)
})

export async function getOrg(org_id: string): Promise<Org | null> {
  return orgs.get(org_id) || null
}

export async function createOrg(params: {
  org_id: string
  org_name: string
  org_secret: string
  allowed_models?: string[]
  billing_tier?: Org['billing_tier']
  initial_user_email?: string
}): Promise<Org> {
  const org_secret_hash = await hash(params.org_secret, 10)

  const org: Org = {
    org_id: params.org_id,
    org_name: params.org_name,
    org_secret_hash,
    org_token_hash: crypto.randomUUID(),
    allowed_models: params.allowed_models || ['gpt-4o-mini'],
    rate_limits: {
      requests_per_minute: 60,
      tokens_per_day: 100_000
    },
    billing_tier: params.billing_tier || 'free',
    users: params.initial_user_email ? [params.initial_user_email] : [],
    created_at: new Date()
  }

  orgs.set(org.org_id, org)

  // Create user if provided
  if (params.initial_user_email) {
    await createUser({
      email: params.initial_user_email,
      org_id: org.org_id
    })
  }

  return org
}

export async function getUser(email: string): Promise<User | null> {
  return users.get(email) || null
}

export async function createUser(params: {
  email: string
  name?: string
  org_id: string
}): Promise<User> {
  const existingUser = users.get(params.email)

  if (existingUser) {
    // User exists, add org to their list
    if (!existingUser.org_ids.includes(params.org_id)) {
      existingUser.org_ids.push(params.org_id)
    }
    return existingUser
  }

  // New user
  const user: User = {
    email: params.email,
    name: params.name,
    org_ids: [params.org_id],
    created_at: new Date()
  }

  users.set(user.email, user)
  return user
}

export async function addUserToOrg(email: string, org_id: string): Promise<void> {
  const org = orgs.get(org_id)
  const user = users.get(email)

  if (!org) {
    throw new Error(`Org ${org_id} not found`)
  }

  if (!user) {
    throw new Error(`User ${email} not found`)
  }

  // Add user to org
  if (!org.users.includes(email)) {
    org.users.push(email)
  }

  // Add org to user
  if (!user.org_ids.includes(org_id)) {
    user.org_ids.push(org_id)
  }
}

export async function listOrgs(): Promise<Org[]> {
  return Array.from(orgs.values())
}

export async function listUsers(): Promise<User[]> {
  return Array.from(users.values())
}
