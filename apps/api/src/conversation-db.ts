/**
 * Village conversation persistence - supports SQLite (default) and PostgreSQL.
 * Set DATABASE_URL to use PostgreSQL; otherwise uses SQLite at DB_PATH.
 * SQLite volume should be persistent (e.g. /app/data on fly.io).
 */

import { Database } from 'bun:sqlite';
import { join } from 'path';

export interface VillageMessage {
  id: string;
  vineId: string;
  sender: string;
  content: string;
  timestamp: string;
  createdAt?: string;
}

type DbMode = 'sqlite' | 'postgres';

function getDbMode(): DbMode {
  return process.env.DATABASE_URL ? 'postgres' : 'sqlite';
}

// SQLite - uses same path as main db for consistency (DB_PATH or bree.db)
let sqliteDb: Database | null = null;

function getSqliteDb(): Database {
  if (!sqliteDb) {
    const dbPath = process.env.DB_PATH || join(process.cwd(), 'bree.db');
    sqliteDb = new Database(dbPath);
    sqliteDb.run('PRAGMA foreign_keys = ON;');
  }
  return sqliteDb;
}

// PostgreSQL
let pgSql: import('postgres').Sql | null = null;

async function getPgSql() {
  if (!pgSql) {
    const postgres = (await import('postgres')).default;
    const url = process.env.DATABASE_URL || '';
    pgSql = postgres(url);
  }
  return pgSql;
}

function ensureTables() {
  const mode = getDbMode();
  if (mode === 'sqlite') {
    const db = getSqliteDb();
    db.run(`
      CREATE TABLE IF NOT EXISTS village_conversation_messages (
        id TEXT PRIMARY KEY,
        vine_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_village_messages_vine_id ON village_conversation_messages(vine_id);
      CREATE INDEX IF NOT EXISTS idx_village_messages_timestamp ON village_conversation_messages(timestamp);
    `);
  }
}

async function ensureTablesPostgres() {
  const sql = await getPgSql();
  await sql`
    CREATE TABLE IF NOT EXISTS village_conversation_messages (
      id TEXT PRIMARY KEY,
      vine_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_village_messages_vine_id ON village_conversation_messages(vine_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_village_messages_timestamp ON village_conversation_messages(timestamp);`;
}

let initPromise: Promise<void> | null = null;

export async function initConversationDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const mode = getDbMode();
    if (mode === 'sqlite') {
      ensureTables();
      console.log('✅ Village conversation DB (SQLite) initialized');
    } else {
      await ensureTablesPostgres();
      console.log('✅ Village conversation DB (PostgreSQL) initialized');
    }
  })();
  return initPromise;
}

export const conversationDb = {
  async insert(msg: VillageMessage): Promise<void> {
    await initConversationDb();
    const mode = getDbMode();
    const id = msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    if (mode === 'sqlite') {
      const db = getSqliteDb();
      db.query(`
        INSERT OR IGNORE INTO village_conversation_messages (id, vine_id, sender, content, timestamp)
        VALUES ($id, $vineId, $sender, $content, $timestamp)
      `).run({
        $id: id,
        $vineId: msg.vineId,
        $sender: msg.sender,
        $content: msg.content,
        $timestamp: msg.timestamp
      });
    } else {
      const sql = await getPgSql();
      await sql`
        INSERT INTO village_conversation_messages (id, vine_id, sender, content, timestamp)
        VALUES (${id}, ${msg.vineId}, ${msg.sender}, ${msg.content}, ${msg.timestamp})
        ON CONFLICT (id) DO NOTHING
      `;
    }
  },

  async insertBatch(messages: VillageMessage[]): Promise<void> {
    if (messages.length === 0) return;
    await initConversationDb();
    for (const msg of messages) {
      await conversationDb.insert(msg);
    }
  },

  async findByVineId(vineId: string, options?: { since?: string; limit?: number }): Promise<VillageMessage[]> {
    await initConversationDb();
    const mode = getDbMode();
    const limit = options?.limit ?? 500;

    if (mode === 'sqlite') {
      const db = getSqliteDb();
      let query = 'SELECT id, vine_id as vineId, sender, content, timestamp FROM village_conversation_messages WHERE vine_id = $vineId';
      const params: Record<string, unknown> = { $vineId: vineId };

      if (options?.since) {
        query += ' AND timestamp >= $since';
        params.$since = options.since;
      }
      query += ' ORDER BY timestamp ASC LIMIT $limit';
      params.$limit = limit;

      const rows = db.query(query).all(params as any) as any[];
      return rows.map(r => ({
        id: r.id,
        vineId: r.vineId,
        sender: r.sender,
        content: r.content,
        timestamp: r.timestamp
      }));
    } else {
      const sql = await getPgSql();
      const rows = options?.since
        ? await sql`
            SELECT id, vine_id as "vineId", sender, content, timestamp
            FROM village_conversation_messages
            WHERE vine_id = ${vineId} AND timestamp >= ${options.since}
            ORDER BY timestamp ASC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, vine_id as "vineId", sender, content, timestamp
            FROM village_conversation_messages
            WHERE vine_id = ${vineId}
            ORDER BY timestamp ASC
            LIMIT ${limit}
          `;
      return rows.map((r: any) => ({
        id: r.id,
        vineId: r.vineId,
        sender: r.sender,
        content: r.content,
        timestamp: r.timestamp
      }));
    }
  }
};
