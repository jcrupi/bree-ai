import { CollectiveAgent, SUBJECTS, type DatabaseGetRequest, type DatabaseListRequest, type DatabaseSetRequest, type DatabaseQueryRequest, type DatabaseEntry } from "../../collective-sdk/src/index";
import { AntiMatterDB } from "../lib/database";
import { join } from "path";

export async function startNatsAgentWithSDK(dbPath: string) {
  console.log(`🤖 AntiMatterDB NATS Agent (SDK) starting...`);
  console.log(`📂 Database: ${dbPath}`);

  // Initialize database
  const schemaFile = join(dbPath, "schema.md");
  const db = new AntiMatterDB({
    rootPath: dbPath,
    schemaPath: schemaFile,
    autoCreateFolders: true,
  });

  // Create agent with SDK
  const agent = new CollectiveAgent({
    agentId: "antimatter-db",
    agentType: "database",
    capabilities: ["get", "list", "set", "query"],
  });

  // Connect to NATS
  await agent.connect();

  // Register GET handler
  await agent.handle<DatabaseGetRequest, DatabaseEntry>(
    SUBJECTS.DATABASE_GET,
    async (payload) => {
      console.log(`[SDK] GET: ${payload.path}`);
      return await db.get(payload.path);
    }
  );

  // Register LIST handler
  await agent.handle<DatabaseListRequest, DatabaseEntry[]>(
    SUBJECTS.DATABASE_LIST,
    async (payload) => {
      console.log(`[SDK] LIST: ${payload.dir}`);
      return await db.list(payload.dir || "");
    }
  );

  // Register SET handler
  await agent.handle<DatabaseSetRequest, DatabaseEntry>(
    SUBJECTS.DATABASE_SET,
    async (payload) => {
      console.log(`[SDK] SET: ${payload.path}`);
      return await db.set(payload.path, payload.frontMatter || {}, payload.content || "");
    }
  );

  // Register QUERY handler
  await agent.handle<DatabaseQueryRequest, DatabaseEntry[]>(
    SUBJECTS.DATABASE_QUERY,
    async (payload) => {
      console.log(`[SDK] QUERY: ${JSON.stringify(payload)}`);
      return await db.query(payload.options || {});
    }
  );

  console.log(`✅ AntiMatterDB Agent ready with Collective SDK`);
}
