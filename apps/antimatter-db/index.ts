/**
 * AntiMatterDB - Quick Test
 */

import { AntiMatterDB, MarkdownParser } from "./src/lib";

async function main() {
  console.log("🔬 AntiMatterDB - Quick Test\n");

  // Create test database
  const db = new AntiMatterDB({
    rootPath: "./test_db",
    schemaPath: "./test_db/schema.md",
    autoCreateFolders: true,
  });

  console.log("✓ Database initialized\n");

  // Create sample entries
  console.log("📝 Creating sample entries...");

  await db.set("orgs/acme/index.agentx.md", {
    id: "org_1",
    name: "ACME Corporation",
    slug: "acme-corp",
    created: new Date().toISOString(),
  });

  await db.set("orgs/acme/users/john@acme.com.agentx.md", {
    id: "user_1",
    email: "john@acme.com",
    name: "John Smith",
    role: "developer",
    status: "active",
  });

  await db.set("orgs/acme/users/jane@acme.com.agentx.md", {
    id: "user_2",
    email: "jane@acme.com",
    name: "Jane Doe",
    role: "designer",
    status: "active",
  });

  await db.set("orgs/acme/admins/admin@acme.com.agentx.md", {
    id: "admin_1",
    email: "admin@acme.com",
    name: "Admin User",
    permissions: ["read", "write", "delete"],
  });

  console.log("✓ Sample entries created\n");

  // List entries
  console.log("📋 Listing all users in ACME:");
  const users = await db.list("orgs/acme/users");
  users.forEach((user) => {
    console.log(`  - ${user.frontMatter.name} (${user.frontMatter.email})`);
  });

  console.log("\n📋 Listing all admins:");
  const admins = await db.list("orgs/acme/admins");
  admins.forEach((admin) => {
    console.log(`  - ${admin.frontMatter.name} (${admin.frontMatter.email})`);
  });

  // Get single entry
  console.log("\n🔍 Getting single entry:");
  const org = await db.get("orgs/acme/index.agentx.md");
  if (org) {
    console.log(`  Organization: ${org.frontMatter.name}`);
    console.log(`  ID: ${org.frontMatter.id}`);
  }

  // Query with filters
  console.log("\n🔎 Querying active users:");
  const results = await db.query({
    filters: [
      { field: "status", operator: "eq", value: "active" },
      { field: "email", operator: "contains", value: "@acme.com" },
    ],
  });
  console.log(`  Found ${results.length} active users`);

  console.log("\n✅ AntiMatterDB test complete!");
  console.log("   Check ./test_db to see the created files");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});