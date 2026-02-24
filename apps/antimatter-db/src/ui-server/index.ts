#!/usr/bin/env bun
/**
 * AntiMatterDB UI Server
 * Serves the React UI and provides API endpoints for database operations
 */

import { join, extname } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import { AntiMatterDB } from "../lib/index";

interface FileEntry {
  path: string;
  name?: string;
  isDirectory: boolean;
  children?: FileEntry[];
}

class UIServer {
  private port: number;
  private dbPath: string;
  private db: AntiMatterDB | null = null;
  private transpiler = new Bun.Transpiler({ loader: "tsx", target: "browser" });

  constructor() {
    this.port = parseInt(process.env.PORT || "8899");
    this.dbPath = process.env.DB_PATH || "./test_db";
  }

  /**
   * Start the UI server
   */
  async start(): Promise<void> {
    console.log(`🚀 Starting AntiMatterDB UI Server`);
    console.log(`📁 Database: ${this.dbPath}`);
    console.log(`🌐 Server: http://localhost:${this.port}`);

    // Initialize database
    const schemaPath = join(this.dbPath, "schema.md");
    const schemaExists = await Bun.file(schemaPath).exists();
    this.db = new AntiMatterDB({
      rootPath: this.dbPath,
      schemaPath: schemaExists ? schemaPath : undefined,
    });

    // Start Bun server
    const server = Bun.serve({
      port: this.port,
      hostname: "0.0.0.0",
      fetch: (req) => this.handleRequest(req),
    });

    console.log(`✓ Server listening on http://localhost:${this.port}`);
  }

  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      let response: Response;
      // API routes
      if (pathname.startsWith("/api/")) {
        response = await this.handleAPI(req, pathname, url);
      } else if (pathname === "/" || pathname === "/index.html") {
        response = await this.serveUI();
      } else if (pathname.startsWith("/src/")) {
        response = this.serveFile(pathname);
      } else {
        response = new Response("Not found", { status: 404 });
      }

      // Add CORS headers to all responses
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    } catch (error) {
      console.error("Request handling error:", error);
      return new Response("Internal Server Error", { status: 500, headers });
    }
  }

  /**
   * Handle API requests
   */
  private async handleAPI(
    req: Request,
    pathname: string,
    url: URL
  ): Promise<Response> {
    try {
      switch (pathname) {
        case "/api/health":
          return this.jsonResponse({ status: "ok" });

        case "/api/explorer":
          return await this.handleExplorer(url);

        case "/api/entries":
          if (req.method === "GET") {
            return await this.handleGetEntry(url);
          }
          if (req.method === "POST") {
            return this.handleCreateEntry(req);
          }
          if (req.method === "DELETE") {
            return this.handleDeleteEntry(url);
          }
          break;

        case "/api/query":
          if (req.method === "POST") {
            return this.handleQuery(req);
          }
          break;

        case "/api/schema":
          return await this.handleGetSchema();
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("API Error:", error);
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }

  /**
   * Handle file explorer requests
   */
  private async handleExplorer(url: URL): Promise<Response> {
    try {
      const path = url.searchParams.get("path") || this.dbPath;

      const files = await this.buildFileTree(path);
      const { entryCount, directoryCount } = this.countFiles(files);

      return this.jsonResponse({
        success: true,
        files,
        stats: {
          totalEntries: entryCount,
          totalDirectories: directoryCount,
        },
      });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to load files",
        },
        400
      );
    }
  }

  /**
   * Build file tree structure
   */
  private async buildFileTree(dirPath: string, baseDir: string = ""): Promise<FileEntry[]> {
    try {
      const entries: FileEntry[] = [];
      const fullPath = baseDir ? dirPath : join(this.dbPath, dirPath);

      if (!existsSync(fullPath)) {
        return entries;
      }

      const files = readdirSync(fullPath);

      for (const fileName of files) {
        // Skip hidden files and node_modules
        if (fileName.startsWith(".") || fileName === "node_modules") {
          continue;
        }

        const relativePath = baseDir
          ? `${baseDir}/${fileName}`
          : fileName;
        const fullFilePath = join(fullPath, fileName);
        const stats = statSync(fullFilePath);

        if (stats.isDirectory()) {
          entries.push({
            path: relativePath,
            name: fileName,
            isDirectory: true,
            children: await this.buildFileTree(fullFilePath, relativePath),
          });
        } else if (fileName.endsWith(".md") || fileName.endsWith(".agentx.md")) {
          entries.push({
            path: relativePath,
            name: fileName,
            isDirectory: false,
          });
        }
      }

      return entries.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return (a.name || a.path).localeCompare(b.name || b.path);
      });
    } catch {
      return [];
    }
  }

  /**
   * Count files and directories
   */
  private countFiles(
    files: FileEntry[]
  ): { entryCount: number; directoryCount: number } {
    let entryCount = 0;
    let directoryCount = 0;

    const traverse = (items: FileEntry[]) => {
      for (const item of items) {
        if (item.isDirectory) {
          directoryCount++;
          if (item.children) {
            traverse(item.children);
          }
        } else {
          entryCount++;
        }
      }
    };

    traverse(files);
    return { entryCount, directoryCount };
  }

  /**
   * Handle get entry request
   */
  private async handleGetEntry(url: URL): Promise<Response> {
    const path = url.searchParams.get("path");
    if (!path) {
      return this.jsonResponse({ success: false, error: "Path required" }, 400);
    }

    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      // Get relative path from db root
      const relativePath = path.replace(this.dbPath + "/", "");
      const fullPath = join(this.dbPath, relativePath);

      // Read file
      const file = Bun.file(fullPath);
      const content = await file.text();

      // Parse front matter
      let frontmatter: any = {};
      let markdown = content;
      let id = "";

      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        markdown = content.replace(fmMatch[0] + "\n", "");

        // Simple YAML parser
        const lines = fmMatch[1].split("\n");
        for (const line of lines) {
          const [key, ...valueParts] = line.split(":");
          if (key && valueParts.length > 0) {
            const value = valueParts.join(":").trim();
            frontmatter[key.trim()] = value.replace(/^['"]|['"]$/g, "");
          }
        }

        if (frontmatter.id) {
          id = frontmatter.id;
        }
      }

      return this.jsonResponse({
        success: true,
        entry: {
          id,
          path: relativePath,
          frontmatter,
          content: markdown.trim(),
        },
      });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to read entry",
        },
        400
      );
    }
  }

  /**
   * Handle create entry request
   */
  private async handleCreateEntry(req: Request): Promise<Response> {
    try {
      const data = await req.json() as {
        path: string;
        data: Record<string, any>;
      };

      if (!data.path) {
        return this.jsonResponse({ success: false, error: "Path required" }, 400);
      }

      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const entry = await this.db.set(data.path, data.data);

      return this.jsonResponse({ success: true, entry });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create entry",
        },
        400
      );
    }
  }

  /**
   * Handle delete entry request
   */
  private async handleDeleteEntry(url: URL): Promise<Response> {
    const path = url.searchParams.get("path");
    if (!path) {
      return this.jsonResponse({ success: false, error: "Path required" }, 400);
    }

    try {
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const success = await this.db.delete(path);

      return this.jsonResponse({ success, deleted: success });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete entry",
        },
        400
      );
    }
  }

  /**
   * Handle query request
   */
  private async handleQuery(req: Request): Promise<Response> {
    try {
      const body = await req.json() as {
        filters?: Array<{ field: string; operator: string; value: string }>;
        limit?: number;
      };

      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const results = await this.db.query({
        filters: body.filters,
        limit: body.limit || 50,
      });

      return this.jsonResponse({ success: true, results });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Query failed",
        },
        400
      );
    }
  }

  /**
   * Handle get schema request
   */
  private async handleGetSchema(): Promise<Response> {
    try {
      const schemaPath = join(this.dbPath, "schema.md");
      const schemaFile = Bun.file(schemaPath);
      if (!await schemaFile.exists()) {
        return this.jsonResponse({ success: false, error: "Schema not found" }, 404);
      }

      const schema = await schemaFile.text();
      return this.jsonResponse({ success: true, schema });
    } catch (error) {
      return this.jsonResponse(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to read schema",
        },
        400
      );
    }
  }

  /**
   * Serve UI HTML
   */
  private async serveUI(): Promise<Response> {
    try {
      // import.meta.dir is apps/antimatter-db/src/ui-server
      const htmlPath = join(import.meta.dir, "..", "ui", "index.html");
      const htmlFile = Bun.file(htmlPath);
      const html = await htmlFile.text();

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    } catch (error) {
      console.error("serveUI error:", error);
      return new Response("UI not found", { status: 404 });
    }
  }

  /**
   * Serve static file
   */
  private serveFile(pathname: string): Response {
    try {
      // Remove leading slash for safe join
      const cleanPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      
      // import.meta.dir is apps/antimatter-db/src/ui-server
      // pathname example: src/ui/main.tsx
      // We want apps/antimatter-db/src/ui/main.tsx
      const filePath = join(import.meta.dir, "..", "..", cleanPath);
      const file = Bun.file(filePath);

      if (!existsSync(filePath)) {
        return new Response("Not found", { status: 404 });
      }

      const contentType = this.getContentType(filePath);
      
      // Transpile TSX/TS files for the browser
      if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
        const text = await file.text();
        const transpiled = await this.transpiler.transform(text);
        return new Response(transpiled, {
          headers: { "Content-Type": "application/javascript" },
        });
      }

      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  /**
   * Get content type from file extension
   */
  private getContentType(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      ".js": "application/javascript",
      ".jsx": "application/javascript",
      ".ts": "application/typescript",
      ".tsx": "application/typescript",
      ".css": "text/css",
      ".html": "text/html",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
    return types[ext] || "application/octet-stream";
  }

  /**
   * Send JSON response
   */
  private jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    });
  }
}

// Start server
if (import.meta.main) {
  const server = new UIServer();
  await server.start();
}
