import { AntiMatterTigrisDB } from "./lib/tigris-db";

async function main() {
  console.log("🔬 AntiMatterDB - Local S3 (Tigris-compatible) + DuckDB Quick Test\n");

  // Set USE_LOCAL_MINIO=true to use docker-compose local S3
  // Set USE_LOCAL_MINIO=false to use real Tigris Cloud (requires TIGRIS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  const useLocal = process.env.USE_LOCAL_MINIO !== "false";
  
  let s3Endpoint, s3Bucket, s3AccessKey, s3SecretKey, s3Region, forcePathStyle;

  if (useLocal) {
    console.log("➡️ Using Local MinIO Configuration (docker-compose)");
    s3Endpoint = "http://localhost:9000";
    s3Bucket = "antimatter";
    s3AccessKey = "local_admin";
    s3SecretKey = "local_password123";
    s3Region = "us-east-1";
    forcePathStyle = true; // MinIO requires this
  } else {
    console.log("➡️ Using Real Tigris Cloud Configuration");
    if (!process.env.TIGRIS_BUCKET || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("❌ Error: Missing Tigris Cloud env variables.");
      console.log("Please define: TIGRIS_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY");
      process.exit(1);
    }
    s3Endpoint = process.env.AWS_ENDPOINT_URL_S3 || "https://fly.storage.tigris.dev";
    s3Bucket = process.env.TIGRIS_BUCKET;
    s3AccessKey = process.env.AWS_ACCESS_KEY_ID;
    s3SecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    s3Region = process.env.AWS_REGION || "auto";
    forcePathStyle = false; // Tigris uses virtual host style
  }

  const db = new AntiMatterTigrisDB({
    rootPath: "./dummy", // not used for S3
    tigrisBucket: s3Bucket,
    tigrisEndpoint: s3Endpoint,
    tigrisAccessKeyId: s3AccessKey,
    tigrisSecretAccessKey: s3SecretKey,
    tigrisRegion: s3Region,
    forcePathStyle: forcePathStyle,
    duckdbPath: ":memory:", // in-memory index
  });

  console.log("Initializing database and DuckDB tables...");
  await db.initialize();
  console.log("✓ Database initialized\n");

  // Create sample entries
  console.log("📝 Creating sample entries in Tigris...");

  await db.set("orgs/duck/index.agentx.md", {
    id: "org_duck",
    name: "Duck Corporation",
    slug: "duck-corp",
    status: "active",
  });

  await db.set("orgs/duck/users/donald@duck.com.agentx.md", {
    id: "user_donald",
    email: "donald@duck.com",
    name: "Donald Duck",
    role: "developer",
    status: "active",
  });

  console.log("✓ Sample entries created and pushed to Tigris\n");

  // List entries
  console.log("📋 Listing all users in Duck Corp:");
  const users = await db.list("orgs/duck/users");
  users.forEach((user) => {
    console.log(`  - ${user.frontMatter.name} (${user.frontMatter.email})`);
  });

  // Query using DuckDB JSON extraction
  console.log("\n🔎 Querying active orgs via DuckDB:");
  const results = await db.query({
    filters: [
      { field: "status", operator: "eq", value: "active" }
    ],
  });
  console.log(`  Found ${results.length} active records in total`);
  results.forEach((res) => {
    console.log(`  - ${res.path} -> ${res.frontMatter.name}`);
  });

  console.log("\n✅ AntiMatterTigrisDB test complete!");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
