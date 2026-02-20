import { Database } from 'bun:sqlite';
import { join } from 'path';

// Initialize isolated SQLite database for Identity Zero
const dbPath = process.env.IDENTITY_ZERO_DB_PATH || join(process.cwd(), 'identity-zero.db');
export const identityDb = new Database(dbPath);

// Enable foreign keys
identityDb.run('PRAGMA foreign_keys = ON;');

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
  
  // Use SHA-256 to ensure we have exactly 256 bits of key material
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

/**
 * Encrypts a tenant key using the Identity Master Key via WebCrypto AES-GCM
 */
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

/**
 * Decrypts a tenant key using the Identity Master Key via WebCrypto AES-GCM
 */
export async function decryptKey(cipherFormat: string): Promise<string> {
  if (!cipherFormat || !cipherFormat.includes(':')) return cipherFormat; // Fallback
  
  const parts = cipherFormat.split(':');
  
  // Handing the old format temporarily if migration in-progress (iv:authtag:encryptedData) vs new WebCrypto format (iv:encryptedPayloadIncludingAuthTag)
  let ivHex = '';
  let encryptedHex = '';
  
  if (parts.length === 3) {
      // Legacy Node Crypto migration fallback
      ivHex = parts[0];
      encryptedHex = parts[2] + parts[1]; // GCM tag is appended at the end in WebCrypto
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

/**
 * Initialize Identity Zero Database Schema
 */
export async function initializeIdentityDatabase() {
  // Client (Organizations)
  identityDb.run(`
    CREATE TABLE IF NOT EXISTS client (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      jwt_secret TEXT NOT NULL,
      encryption_key TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);

  // Migration for existing databases
  try {
    identityDb.run(`ALTER TABLE client ADD COLUMN jwt_secret TEXT DEFAULT '';`);
    identityDb.run(`ALTER TABLE client ADD COLUMN encryption_key TEXT DEFAULT '';`);
    console.log('🔄 Migrated client table with encryption keys.');

    // Populate existing rows with secure random values if empty (Encrypted via Master Key)
    const clients = identityDb.query(`SELECT id FROM client WHERE jwt_secret = ''`).all() as { id: string }[];
    const updateClient = identityDb.prepare(`UPDATE client SET jwt_secret = ?, encryption_key = ? WHERE id = ?`);
    
    for (const client of clients) {
      const rawJwtSecret = crypto.randomUUID() + crypto.randomUUID();
      const rawEncryptionKey = crypto.randomUUID() + crypto.randomUUID();
      
      const encJwt = await encryptKey(rawJwtSecret);
      const encKey = await encryptKey(rawEncryptionKey);
      
      updateClient.run(encJwt, encKey, client.id);
    }
    if (clients.length > 0) {
       console.log(`✅ Provisioned envelope-encrypted keys for ${clients.length} existing clients`);
    }
  } catch (e) {
    // Column likely already exists
  }

  // Member (Users)
  identityDb.run(`
    CREATE TABLE IF NOT EXISTS member (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      client_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('super_admin', 'super_agent', 'super_apprentice', 'org_admin', 'provider', 'user')),
      active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      is_lead_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      UNIQUE(username, client_id)
    );
  `);
  identityDb.run(`CREATE INDEX IF NOT EXISTS idx_member_client ON member(client_id);`);
  identityDb.run(`CREATE INDEX IF NOT EXISTS idx_member_username ON member(username);`);

  // Password Reset Code
  identityDb.run(`
    CREATE TABLE IF NOT EXISTS password_reset_code (
      username TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // Provider Platform Access
  identityDb.run(`
    CREATE TABLE IF NOT EXISTS provider_platform_access (
      provider_id TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      PRIMARY KEY (provider_id, platform_id),
      FOREIGN KEY (provider_id) REFERENCES member(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES client(client_id) ON DELETE CASCADE
    );
  `);
  identityDb.run(`CREATE INDEX IF NOT EXISTS idx_ppa_provider ON provider_platform_access(provider_id);`);

  console.log('✅ Identity Zero database schema initialized');
}

// Initialize database on import
initializeIdentityDatabase();
