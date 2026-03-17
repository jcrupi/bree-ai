/**
 * Database Seeder
 * Seeds the database with initial development data
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';

async function seed() {
  console.log('🌱 Seeding database...');

  const sql = postgres(DATABASE_URL);

  try {
    // Read and execute seed SQL
    const seedFile = Bun.file(import.meta.dir + '/seed.sql');
    const seedSQL = await seedFile.text();

    await sql.unsafe(seedSQL);

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed();
