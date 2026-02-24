import { CollectiveAgent } from "@agent-collective/sdk";
import { AntiMatterDB } from "../lib/database";
import { join } from "path";

export async function startNatsAgent(dbPath: string) {
  const agentId = "antimatter-db";
  
  console.log(`🤖 AntiMatterDB NATS Agent starting...`);
  console.log(`📂 Database: ${dbPath}`);

  const schemaFile = join(dbPath, "schema.md");
  const db = new AntiMatterDB({
    rootPath: dbPath,
    schemaPath: schemaFile,
    autoCreateFolders: true,
  });

  const agent = new CollectiveAgent({
    agentId,
    agentType: "database",
    capabilities: ["list", "get", "set", "query"],
    natsUrl: "localhost:4222",
    description: "Multi-instance Markdown Database Agent",
    manifest: {
      httpRoot: "/api/antimatterdb",
      natsPrefix: `agent.${agentId}`,
      endpoints: [
        { path: "/list", method: "GET", action: "list", description: "List files in a directory" },
        { path: "/get", method: "GET", action: "get", description: "Get file content and front-matter" },
        { path: "/set", method: "POST", action: "set", description: "Create or update a file" },
        { path: "/query", method: "POST", action: "query", description: "Query database files" }
      ]
    },
    metadata: {
      dbPath
    }
  });

  await agent.connect();

  // 1. Handle GET
  await agent.handle(`agent.${agentId}.get`, async (payload: any) => {
      console.log(`[AntiMatterDB] GET: ${payload.path}`);
      console.log(`[AntiMatterDB] DB Root: ${db['config'].rootPath}`);
      const entry = await db.get(payload.path);
      console.log(`[AntiMatterDB] Entry result:`, entry ? 'FOUND' : 'NULL');
      if (!entry) {
        const errorResponse = { success: false, error: `Entry not found: ${payload.path}` };
        console.log(`[AntiMatterDB] Returning error:`, errorResponse);
        return errorResponse;
      }
      const successResponse = { success: true, entry };
      console.log(`[AntiMatterDB] Returning success with entry ID:`, entry.id);
      return successResponse;
  });

  // 2. Handle LIST
  await agent.handle(`agent.${agentId}.list`, async (payload: any) => {
      console.log(`[AntiMatterDB] LIST: ${payload.dir}`);
      const entries = await db.list(payload.dir || "");
      return { success: true, entries, count: entries.length };
  });

  // 3. Handle SET (Create/Update)
  await agent.handle(`agent.${agentId}.set`, async (payload: any) => {
      console.log(`[AntiMatterDB] SET: ${payload.path}`);
      const entry = await db.set(payload.path, payload.frontMatter || {}, payload.content || "");
      return { success: true, entry };
  });

  // 4. Handle QUERY
  await agent.handle(`agent.${agentId}.query`, async (payload: any) => {
      console.log(`[AntiMatterDB] QUERY: ${JSON.stringify(payload)}`);
      const entries = await db.query(payload.options || {});
      return { success: true, entries, count: entries.length };
  });

  console.log("✅ AntiMatterDB agent is ready!");
}
