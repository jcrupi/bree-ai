/**
 * Database Seed Script for Organizations
 * Create SuperFly and FlyHigh organizations with users
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://johnnycrupi@localhost:5432/flysaas';

async function seedOrgs() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('🌱 Seeding organizations and users...\n');

    // Hash passwords using Bun's built-in password hashing
    const johnnyPassword = await Bun.password.hash('SuperFly123');
    const sarahPassword = await Bun.password.hash('SuperFly123');
    const mikePassword = await Bun.password.hash('FlyHigh123');
    const emilyPassword = await Bun.password.hash('FlyHigh123');

    // Create users
    console.log('Creating users...');

    const johnny = await sql`
      INSERT INTO users (id, email, name, password_hash, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'johnny@superfly.ai',
        'Johnny Admin',
        ${johnnyPassword},
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
      RETURNING id, email, name
    `.then(rows => rows[0]);
    console.log('✅', johnny.name, '-', johnny.email);

    const sarah = await sql`
      INSERT INTO users (id, email, name, password_hash, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000002',
        'sarah@superfly.ai',
        'Sarah Johnson',
        ${sarahPassword},
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
      RETURNING id, email, name
    `.then(rows => rows[0]);
    console.log('✅', sarah.name, '-', sarah.email);

    const mike = await sql`
      INSERT INTO users (id, email, name, password_hash, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000003',
        'mike@flyhigh.ai',
        'Mike Chen',
        ${mikePassword},
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
      RETURNING id, email, name
    `.then(rows => rows[0]);
    console.log('✅', mike.name, '-', mike.email);

    const emily = await sql`
      INSERT INTO users (id, email, name, password_hash, email_verified)
      VALUES (
        'a0000000-0000-0000-0000-000000000004',
        'emily@flyhigh.ai',
        'Emily Rodriguez',
        ${emilyPassword},
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
      RETURNING id, email, name
    `.then(rows => rows[0]);
    console.log('✅', emily.name, '-', emily.email);

    // Create organizations
    console.log('\nCreating organizations...');

    const superfly = await sql`
      INSERT INTO organizations (id, slug, name, status)
      VALUES (
        'b0000000-0000-0000-0000-000000000001',
        'superfly',
        'SuperFly',
        'active'
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name
      RETURNING id, slug, name, status
    `.then(rows => rows[0]);
    console.log('✅', superfly.name, '-', superfly.slug);

    const flyhigh = await sql`
      INSERT INTO organizations (id, slug, name, status)
      VALUES (
        'b0000000-0000-0000-0000-000000000002',
        'flyhigh',
        'FlyHigh',
        'active'
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name
      RETURNING id, slug, name, status
    `.then(rows => rows[0]);
    console.log('✅', flyhigh.name, '-', flyhigh.slug);

    // Create org memberships
    console.log('\nCreating organization memberships...');

    // SuperFly members
    await sql`
      INSERT INTO org_members (org_id, user_id, role, is_observer_admin)
      VALUES (
        ${superfly.id},
        ${johnny.id},
        'owner',
        true
      )
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_observer_admin = EXCLUDED.is_observer_admin
    `;
    console.log('✅ Johnny Admin → SuperFly (Owner, Observer Admin)');

    await sql`
      INSERT INTO org_members (org_id, user_id, role, is_observer_admin)
      VALUES (
        ${superfly.id},
        ${sarah.id},
        'admin',
        false
      )
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_observer_admin = EXCLUDED.is_observer_admin
    `;
    console.log('✅ Sarah Johnson → SuperFly (Admin)');

    // FlyHigh members
    await sql`
      INSERT INTO org_members (org_id, user_id, role, is_observer_admin)
      VALUES (
        ${flyhigh.id},
        ${mike.id},
        'owner',
        true
      )
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_observer_admin = EXCLUDED.is_observer_admin
    `;
    console.log('✅ Mike Chen → FlyHigh (Owner, Observer Admin)');

    await sql`
      INSERT INTO org_members (org_id, user_id, role, is_observer_admin)
      VALUES (
        ${flyhigh.id},
        ${emily.id},
        'member',
        false
      )
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_observer_admin = EXCLUDED.is_observer_admin
    `;
    console.log('✅ Emily Rodriguez → FlyHigh (Member)');

    // Create sample observations for testing
    console.log('\nCreating sample observations...');

    const sampleObs1 = await sql`
      INSERT INTO observations (org_id, user_id, type, description, url, status, priority)
      VALUES (
        ${superfly.id},
        ${sarah.id},
        'bug',
        'Login page does not show error message when wrong password is entered',
        '/login',
        'new',
        'high'
      )
      RETURNING id, type, status
    `.then(rows => rows[0]);
    console.log('✅ Bug observation created');

    const sampleObs2 = await sql`
      INSERT INTO observations (org_id, user_id, type, description, url, status, priority)
      VALUES (
        ${superfly.id},
        ${sarah.id},
        'feature',
        'Add dark mode toggle to settings page',
        '/settings',
        'planned',
        'medium'
      )
      RETURNING id, type, status
    `.then(rows => rows[0]);
    console.log('✅ Feature observation created');

    const sampleObs3 = await sql`
      INSERT INTO observations (org_id, user_id, type, description, url, status, priority)
      VALUES (
        ${flyhigh.id},
        ${emily.id},
        'enhancement',
        'Improve dashboard loading speed - currently takes 5 seconds',
        '/dashboard',
        'reviewing',
        'urgent'
      )
      RETURNING id, type, status
    `.then(rows => rows[0]);
    console.log('✅ Enhancement observation created');

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📧 Login credentials:');
    console.log('   johnny@superfly.ai / SuperFly123 (SuperFly Owner, Observer Admin)');
    console.log('   sarah@superfly.ai / SuperFly123 (SuperFly Admin)');
    console.log('   mike@flyhigh.ai / FlyHigh123 (FlyHigh Owner, Observer Admin)');
    console.log('   emily@flyhigh.ai / FlyHigh123 (FlyHigh Member)');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedOrgs();
