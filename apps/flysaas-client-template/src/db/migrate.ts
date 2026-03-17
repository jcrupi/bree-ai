/**
 * Database Migration Script
 * Run with: bun src/db/migrate.ts
 */

import { Database } from 'bun:sqlite';

const DB_PATH = process.env.DB_PATH || '/app/data/corp-ai.db';

async function migrate() {
  try {
    console.log('🗄️  Running database migrations...');

    const db = new Database(DB_PATH, { create: true });

    // Read and execute schema
    const schemaFile = Bun.file(import.meta.dir + '/schema.sql');
    const schema = await schemaFile.text();

    db.exec(schema);

    console.log('✅ Database migrations completed successfully');
    db.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
