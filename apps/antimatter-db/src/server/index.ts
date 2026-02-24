/**
 * AntiMatterDB Server
 * RESTful API server for database operations
 */

import {
  AntiMatterDB,
  SchemaManager,
  getBuiltinSchema,
  listBuiltinSchemas,
} from "../lib/index";
import { join } from "path";

interface ServerConfig {
  port: number;
  host: string;
  dbPath: string;
  corsEnabled?: boolean;
}

export class AntimatterServer {
  private config: ServerConfig;
  private db?: AntiMatterDB;
  private schemaManager?: SchemaManager;
  private server?: any;

  constructor(config: ServerConfig) {
    this.config = {
      corsEnabled: true,
      ...config,
    };

    // Initialize database if path exists
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const schemaPath = join(this.config.dbPath, "schema.md");
    const schemaExists = await Bun.file(schemaPath).exists();
    this.db = new AntiMatterDB({
      rootPath: this.config.dbPath,
      schemaPath: schemaExists ? schemaPath : undefined,
    });
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    this.server = Bun.serve({
      hostname: "0.0.0.0",
      port: this.config.port,
      fetch: (request: Request) => this.handleRequest(request),
    });

    console.log(
      `AntiMatterDB Server running at http://${this.config.host}:${this.config.port}`,
    );
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
    }
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS headers
    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers, status: 200 });
    }

    try {
      // Routes
      if (pathname === "/api/health") {
        return this.healthCheck(headers);
      }

      // Schema routes
      if (pathname === "/api/schemas/builtin") {
        return this.listBuiltinSchemas(headers);
      }

      if (pathname.startsWith("/api/schemas/init")) {
        if (method === "POST") {
          return await this.initSchema(request, headers);
        }
      }

      if (pathname.startsWith("/api/schema-entries")) {
        if (method === "POST") {
          return await this.createSchemaEntry(request, headers);
        } else if (method === "GET") {
          return await this.getSchemaEntry(url, headers);
        }
      }

      if (pathname.startsWith("/api/schema-collections")) {
        if (method === "GET") {
          return await this.listSchemaCollection(url, headers);
        }
      }

      if (pathname.startsWith("/api/entries")) {
        if (method === "GET") {
          return await this.getEntries(url, headers);
        } else if (method === "POST") {
          return await this.createEntry(request, headers);
        } else if (method === "PUT") {
          return await this.updateEntry(request, headers);
        } else if (method === "DELETE") {
          return await this.deleteEntry(url, headers);
        }
      }

      if (pathname.startsWith("/api/query")) {
        return await this.queryEntries(request, headers);
      }

      if (pathname.startsWith("/api/collections")) {
        if (
          method === "GET" &&
          pathname.match(/\/api\/collections\/[^/]+\/hierarchy/)
        ) {
          return await this.getCollectionHierarchy(url, headers);
        } else if (
          method === "GET" &&
          pathname.match(/\/api\/collections\/[^/]+\/items/)
        ) {
          return await this.listCollectionItems(url, headers);
        } else if (
          method === "GET" &&
          pathname.match(/\/api\/collections\/[^/]+\/subs/)
        ) {
          return await this.listSubcollections(url, headers);
        } else if (method === "GET") {
          return await this.getCollection(url, headers);
        } else if (method === "POST") {
          return await this.createCollection(request, headers);
        }
      }

      if (pathname === "/api/schema") {
        return this.getSchema(headers);
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        headers,
        status: 404,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 500 },
      );
    }
  }

  /**
   * GET /api/health
   */
  private healthCheck(headers: Record<string, string>): Response {
    return new Response(
      JSON.stringify({
        status: "ok",
        database: this.config.dbPath,
      }),
      { headers, status: 200 },
    );
  }

  /**
   * GET /api/entries
   * Query params: path, dir, limit, offset
   */
  private async getEntries(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    const path = url.searchParams.get("path");
    const dir = url.searchParams.get("dir");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    if (!this.db) {
      throw new Error("Database not initialized");
    }

    let entries;
    if (path) {
      const entry = await this.db.get(path);
      entries = entry ? [entry] : [];
    } else if (dir) {
      entries = await this.db.list(dir);
    } else {
      entries = await this.db.query({ limit, offset });
    }

    return new Response(JSON.stringify({ entries, count: entries.length }), {
      headers,
      status: 200,
    });
  }

  /**
   * POST /api/entries
   * Body: { path, frontMatter, content }
   */
  private async createEntry(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const body = await request.json();
    const { path, frontMatter = {}, content = "" } = body;

    if (!path) {
      return new Response(JSON.stringify({ error: "path is required" }), {
        headers,
        status: 400,
      });
    }

    const entry = await this.db.set(path, frontMatter, content);

    return new Response(JSON.stringify({ success: true, entry }), {
      headers,
      status: 201,
    });
  }

  /**
   * PUT /api/entries
   * Body: { path, frontMatter, content }
   */
  private async updateEntry(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const body = await request.json();
    const { path, frontMatter = {}, content = "" } = body;

    if (!path) {
      return new Response(JSON.stringify({ error: "path is required" }), {
        headers,
        status: 400,
      });
    }

    // Get existing entry and merge
    const existing = await this.db.get(path);
    const merged = {
      ...existing?.frontMatter,
      ...frontMatter,
    };

    const entry = await this.db.set(path, merged, content);

    return new Response(JSON.stringify({ success: true, entry }), {
      headers,
      status: 200,
    });
  }

  /**
   * DELETE /api/entries
   * Query params: path
   */
  private async deleteEntry(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const path = url.searchParams.get("path");

    if (!path) {
      return new Response(JSON.stringify({ error: "path is required" }), {
        headers,
        status: 400,
      });
    }

    const success = await this.db.delete(path);

    if (!success) {
      return new Response(JSON.stringify({ error: "Entry not found" }), {
        headers,
        status: 404,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers,
      status: 200,
    });
  }

  /**
   * POST /api/query
   * Body: { filters, sort, limit, offset }
   */
  private async queryEntries(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const body = await request.json();
    const entries = await this.db.query(body);

    return new Response(JSON.stringify({ entries, count: entries.length }), {
      headers,
      status: 200,
    });
  }

  /**
   * GET /api/schema
   */
  private getSchema(headers: Record<string, string>): Response {
    // Return schema info if available
    return new Response(
      JSON.stringify({
        dbPath: this.config.dbPath,
        hasSchema: !!this.db,
      }),
      { headers, status: 200 },
    );
  }

  /**
   * GET /api/collections/:collectionPath/metadata
   */
  private async getCollection(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const collectionPath = url.pathname.replace("/api/collections/", "");
    const metadata = await this.db.getCollectionMetadata(collectionPath);

    if (!metadata) {
      return new Response(JSON.stringify({ error: "Collection not found" }), {
        headers,
        status: 404,
      });
    }

    return new Response(JSON.stringify(metadata), { headers, status: 200 });
  }

  /**
   * POST /api/collections/:collectionPath
   */
  private async createCollection(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const body = (await request.json()) as any;
    const { collectionPath, metadata } = body;

    if (!collectionPath) {
      return new Response(
        JSON.stringify({ error: "collectionPath required" }),
        {
          headers,
          status: 400,
        },
      );
    }

    try {
      const entry = await this.db.set(
        collectionPath,
        "index.md",
        metadata || {},
      );
      return new Response(JSON.stringify(entry), { headers, status: 201 });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 400 },
      );
    }
  }

  /**
   * GET /api/collections/:collectionPath/items
   */
  private async listCollectionItems(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const collectionPath = url.pathname
      .replace("/api/collections/", "")
      .replace("/items", "");
    const items = await this.db.listCollection(collectionPath);

    return new Response(JSON.stringify({ items, count: items.length }), {
      headers,
      status: 200,
    });
  }

  /**
   * GET /api/collections/:collectionPath/subs
   */
  private async listSubcollections(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const collectionPath = url.pathname
      .replace("/api/collections/", "")
      .replace("/subs", "");
    const subs = await this.db.listSubcollections(collectionPath);

    return new Response(
      JSON.stringify({ subcollections: subs, count: subs.length }),
      { headers, status: 200 },
    );
  }

  /**
   * GET /api/collections/:collectionPath/hierarchy
   */
  private async getCollectionHierarchy(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const collectionPath = url.pathname
      .replace("/api/collections/", "")
      .replace("/hierarchy", "");
    const hierarchy = await this.db.getHierarchy(collectionPath);

    if (!hierarchy) {
      return new Response(JSON.stringify({ error: "Collection not found" }), {
        headers,
        status: 404,
      });
    }

    return new Response(JSON.stringify(hierarchy), { headers, status: 200 });
  }

  /**
   * GET /api/schemas/builtin
   */
  private listBuiltinSchemas(headers: Record<string, string>): Response {
    const schemas = listBuiltinSchemas();
    return new Response(JSON.stringify({ schemas }), { headers, status: 200 });
  }

  /**
   * POST /api/schemas/init
   * Body: { schemaName }
   */
  private async initSchema(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.db) {
      return new Response(
        JSON.stringify({ error: "Database not initialized" }),
        {
          headers,
          status: 500,
        },
      );
    }

    const body = (await request.json()) as any;
    const { schemaName } = body;

    if (!schemaName) {
      return new Response(JSON.stringify({ error: "schemaName is required" }), {
        headers,
        status: 400,
      });
    }

    const schema = getBuiltinSchema(schemaName);
    if (!schema) {
      const available = listBuiltinSchemas();
      return new Response(
        JSON.stringify({
          error: `Unknown schema: ${schemaName}`,
          available,
        }),
        { headers, status: 400 },
      );
    }

    try {
      this.schemaManager = new SchemaManager(this.db, schema);
      await this.schemaManager.initializeSchema("");
      return new Response(
        JSON.stringify({
          success: true,
          schema: schemaName,
          message: `Database initialized with ${schemaName} schema`,
        }),
        { headers, status: 201 },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 500 },
      );
    }
  }

  /**
   * POST /api/schema-entries
   * Body: { collectionPath, entryName, data }
   */
  private async createSchemaEntry(
    request: Request,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.schemaManager) {
      return new Response(
        JSON.stringify({
          error: "Schema not initialized. Call /api/schemas/init first",
        }),
        { headers, status: 400 },
      );
    }

    const body = (await request.json()) as any;
    const { collectionPath, entryName, data = {}, content = "" } = body;

    if (!collectionPath || !entryName) {
      return new Response(
        JSON.stringify({ error: "collectionPath and entryName are required" }),
        { headers, status: 400 },
      );
    }

    try {
      const entry = await this.schemaManager.createEntry(
        collectionPath,
        entryName,
        data,
        content,
      );
      return new Response(JSON.stringify({ success: true, entry }), {
        headers,
        status: 201,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 500 },
      );
    }
  }

  /**
   * GET /api/schema-entries
   * Query params: collectionPath, uuid
   */
  private async getSchemaEntry(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.schemaManager) {
      return new Response(
        JSON.stringify({
          error: "Schema not initialized. Call /api/schemas/init first",
        }),
        { headers, status: 400 },
      );
    }

    const collectionPath = url.searchParams.get("collectionPath");
    const uuid = url.searchParams.get("uuid");

    if (!collectionPath || !uuid) {
      return new Response(
        JSON.stringify({
          error: "collectionPath and uuid query parameters are required",
        }),
        { headers, status: 400 },
      );
    }

    try {
      const entry = await this.schemaManager.getEntryByUuid(
        collectionPath,
        uuid,
      );
      if (!entry) {
        return new Response(JSON.stringify({ error: "Entry not found" }), {
          headers,
          status: 404,
        });
      }
      return new Response(JSON.stringify({ entry }), { headers, status: 200 });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 500 },
      );
    }
  }

  /**
   * GET /api/schema-collections
   * Query params: collectionPath
   */
  private async listSchemaCollection(
    url: URL,
    headers: Record<string, string>,
  ): Promise<Response> {
    if (!this.schemaManager) {
      return new Response(
        JSON.stringify({
          error: "Schema not initialized. Call /api/schemas/init first",
        }),
        { headers, status: 400 },
      );
    }

    const collectionPath = url.searchParams.get("collectionPath");

    if (!collectionPath) {
      return new Response(
        JSON.stringify({ error: "collectionPath query parameter is required" }),
        { headers, status: 400 },
      );
    }

    try {
      const entries =
        await this.schemaManager.listEntriesWithUuids(collectionPath);
      return new Response(JSON.stringify({ entries, count: entries.length }), {
        headers,
        status: 200,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
        }),
        { headers, status: 500 },
      );
    }
  }
}

/**
 * Start server from CLI
 */
if (import.meta.main) {
  const port = parseInt(process.env.PORT || "8080");
  const host = process.env.HOST || "localhost";
  const dbPath = process.env.DB_PATH || process.cwd();

  const server = new AntimatterServer({ port, host, dbPath });
  server.start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
