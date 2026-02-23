import postgres from 'postgres';
import { Buffer } from 'buffer';

// Initialize Postgres database for Identity Zero
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bree_ai';
export const sql = postgres(dbUrl, {
  max: 10
});

// ==========================================
// Envelope Encryption (Master Key Management)
// ==========================================

// Fallback logic for local development if standard crypto isn't available
function generateFallbackKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('hex');
}

export const IDENTITY_MASTER_KEY = process.env.IDENTITY_MASTER_KEY || generateFallbackKey();

if (process.env.NODE_ENV === 'production' && !process.env.IDENTITY_MASTER_KEY) {
  console.warn("⚠️ WARNING: IDENTITY_MASTER_KEY is not set in production. Envelope encryption is using an ephemeral development key.");
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.digest(
      'SHA-256',
      enc.encode(IDENTITY_MASTER_KEY)
  );
  
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptKey(text: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );
  
  const encryptedBytes = new Uint8Array(encryptedBuffer);
  return `${Buffer.from(iv).toString('hex')}:${Buffer.from(encryptedBytes).toString('hex')}`;
}

export async function decryptKey(cipherFormat: string): Promise<string> {
  if (!cipherFormat || !cipherFormat.includes(':')) return cipherFormat; // Fallback
  
  const parts = cipherFormat.split(':');
  
  let ivHex = '';
  let encryptedHex = '';
  
  if (parts.length === 3) {
      ivHex = parts[0];
      encryptedHex = parts[2] + parts[1];
  } else if (parts.length === 2) {
      ivHex = parts[0];
      encryptedHex = parts[1];
  } else {
      return cipherFormat;
  }

  const key = await getCryptoKey();
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decryptedBuffer);
}

export async function initializeIdentityDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS client (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      jwt_secret TEXT NOT NULL DEFAULT '',
      encryption_key TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const clients = await sql`SELECT id FROM client WHERE jwt_secret = ''`;
    for (const client of clients) {
      const rawJwtSecret = crypto.randomUUID() + crypto.randomUUID();
      const rawEncryptionKey = crypto.randomUUID() + crypto.randomUUID();
      
      const encJwt = await encryptKey(rawJwtSecret);
      const encKey = await encryptKey(rawEncryptionKey);
      
      await sql`UPDATE client SET jwt_secret = ${encJwt}, encryption_key = ${encKey} WHERE id = ${client.id}`;
    }
    if (clients.length > 0) {
       console.log(`✅ Provisioned envelope-encrypted keys for ${clients.length} existing clients`);
    }
  } catch (e) {
    console.error(e);
  }

  await sql`
    CREATE TABLE IF NOT EXISTS member (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      client_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'super_agent', 'super_apprentice', 'org_admin', 'provider', 'user')),
      active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      is_lead_admin INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(username, client_id)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_member_client ON member(client_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_member_username ON member(username);`;

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_code (
      username TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      app_name TEXT,
      page_url TEXT,
      type TEXT,
      description TEXT,
      status TEXT DEFAULT 'open',
      screenshot_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS provider_platform_access (
      provider_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      PRIMARY KEY (provider_id, platform_id),
      FOREIGN KEY (provider_id) REFERENCES member(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_ppa_provider ON provider_platform_access(provider_id);`;

  console.log('✅ Identity Zero database schema initialized');
}

// Initialize database
initializeIdentityDatabase().catch(console.error);
