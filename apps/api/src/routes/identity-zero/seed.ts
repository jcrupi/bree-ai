import bcrypt from "bcryptjs";
import { sql, encryptKey, initializeIdentityDatabase } from "./db";

export async function seedIdentityZero() {
  try {
    console.log("Seeding Identity Zero PostgreSQL database...");
    await initializeIdentityDatabase();

    // 1. Create super-org client
    const clientId = "super-org";
    const clientName = "Bree AI Super Org";
    const id = `client-${clientId}`;

    const existingClient = await sql`SELECT id FROM client WHERE client_id = ${clientId}`;
    if (existingClient.length === 0) {
      console.log(`Creating ${clientId} client...`);
      
      const rawJwtSecret = crypto.randomUUID() + crypto.randomUUID();
      const rawEncryptionKey = crypto.randomUUID() + crypto.randomUUID();
      
      const encJwt = await encryptKey(rawJwtSecret);
      const encKey = await encryptKey(rawEncryptionKey);

      await sql`
        INSERT INTO client (id, client_id, client_name, jwt_secret, encryption_key)
        VALUES (${id}, ${clientId}, ${clientName}, ${encJwt}, ${encKey})
      `;
    } else {
      console.log(`Client ${clientId} already exists.`);
    }

    // 2. Create super admin member
    const username = "admin@bree.ai";
    const password = "admin";
    const role = "super_admin";
    const memberId = `${role}-${username.split('@')[0]}-seed`;

    const existingMember = await sql`SELECT id FROM member WHERE username = ${username} AND client_id = ${clientId}`;
    
    if (existingMember.length === 0) {
      console.log(`Creating ${username} user...`);
      const password_hash = await bcrypt.hash(password, 10);
      
      await sql`
        INSERT INTO member (id, username, password_hash, client_id, role, is_lead_admin, must_change_password, active)
        VALUES (${memberId}, ${username}, ${password_hash}, ${clientId}, ${role}, 1, 0, 1)
      `;
    } else {
      console.log(`User ${username} already exists.`);
    }

    console.log("✅ Identity Zero Super Org seeded successfully.");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding Identity Zero:", error);
    process.exit(1);
  }
}

seedIdentityZero();
