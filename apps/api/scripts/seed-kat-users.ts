/**
 * Seed script: Create initial kat.ai users
 * Run locally against prod: bun run scripts/seed-kat-users.ts
 * Or via Fly SSH: fly ssh console -a bree-api -C "bun run scripts/seed-kat-users.ts"
 */

import { db } from "../src/db";
import bcrypt from "bcryptjs";

const USERS = [
  { email: "corby@kat.ai",  name: "Corby",  password: "kat2026!" },
  { email: "chris@kat.ai",  name: "Chris",  password: "kat2026!" },
  { email: "johnny@kat.ai", name: "Johnny", password: "kat2026!" },
  { email: "marc@kat.ai",   name: "Marc",   password: "kat2026!" },
];

console.log("🌱 Seeding kat.ai users...\n");

for (const user of USERS) {
  // Check if already exists
  const existing = db.query("SELECT id, email FROM users WHERE email = $email")
    .get({ $email: user.email }) as { id: number; email: string } | undefined;

  if (existing) {
    console.log(`⏭️  Skipped  ${user.email} (already exists, id=${existing.id})`);
    continue;
  }

  const hash = await bcrypt.hash(user.password, 10);
  db.query("INSERT INTO users (email, password_hash, name) VALUES ($email, $hash, $name)")
    .run({ $email: user.email, $hash: hash, $name: user.name });

  const created = db.query("SELECT id FROM users WHERE email = $email")
    .get({ $email: user.email }) as { id: number };

  console.log(`✅ Created  ${user.email}  (id=${created.id})`);
}

console.log("\n📋 All users in DB:");
const all = db.query("SELECT id, email, name, created_at FROM users ORDER BY id").all() as any[];
for (const u of all) {
  console.log(`  [${u.id}] ${u.email} — ${u.name} — joined ${u.created_at}`);
}

console.log("\n✨ Done.");
process.exit(0);
