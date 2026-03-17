/**
 * Database Migration Script
 * Run with: bun src/db/migrate.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';

async function migrate() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('🗄️  Running database migrations...');

    // Read and execute schema
    const schemaFile = Bun.file(import.meta.dir + '/schema.sql');
    const schema = await schemaFile.text();

    await sql.unsafe(schema);
    console.log('✅ Base schema applied');

    // Run migration files in order
    const migrationDir = import.meta.dir + '/migrations';
    const migrations = [
      '001_initial.sql',
      '002_add_password_hash.sql',
      '003_add_observations.sql'
    ];

    for (const migration of migrations) {
      try {
        const migrationFile = Bun.file(migrationDir + '/' + migration);
        const migrationSQL = await migrationFile.text();
        await sql.unsafe(migrationSQL);
        console.log(`✅ Applied migration: ${migration}`);
      } catch (err) {
        console.log(`⚠️  Migration ${migration} already applied or error:`, err.message);
      }
    }

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
