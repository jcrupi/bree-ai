import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Database } from "duckdb-async";
import type {
  DBEntry,
  DBConfig,
  FrontMatter,
  QueryOptions,
  QueryFilter,
} from "../types";
import { MarkdownParser } from "./parser";
import { SchemaManager } from "./schema";

export interface TigrisDBConfig extends DBConfig {
  tigrisBucket: string;
  tigrisRegion?: string;
  tigrisEndpoint?: string;
  tigrisAccessKeyId?: string;
  tigrisSecretAccessKey?: string;
  duckdbPath?: string; // e.g., ":memory:" or a file path
}

export class AntiMatterTigrisDB {
  private config: TigrisDBConfig;
  private schemaManager?: SchemaManager;
  private s3Client: S3Client;
  private db: Database | null = null;

  constructor(config: TigrisDBConfig) {
    this.config = {
      autoCreateFolders: true,
      validation: true,
      duckdbPath: ":memory:",
      tigrisRegion: "auto",
      tigrisEndpoint: "https://fly.storage.tigris.dev",
      ...config,
    };

    this.s3Client = new S3Client({
      region: this.config.tigrisRegion,
      endpoint: this.config.tigrisEndpoint,
      credentials: {
        accessKeyId:
          this.config.tigrisAccessKeyId || process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey:
          this.config.tigrisSecretAccessKey ||
          process.env.AWS_SECRET_ACCESS_KEY ||
          "",
      },
      // Force path style is required for local MinIO compatibility
      forcePathStyle: true,
    });
  }

  async initialize(): Promise<void> {
    // Initialize DuckDB
    this.db = await Database.create(this.config.duckdbPath as string);

    // Create entries table to act as our index
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS entries (
        id VARCHAR PRIMARY KEY,
        path VARCHAR UNIQUE,
        collection VARCHAR,
        frontmatter JSON,
        content VARCHAR,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);

    // Initialize SchemaManager if needed (Note: for Tigris, we might need to fetch schema.md from S3 first, or use a local one)
    if (this.config.schemaPath) {
      try {
        const schemaFile = Bun.file(this.config.schemaPath);
        if (await schemaFile.exists()) {
          this.schemaManager = await SchemaManager.create(
            this.config.schemaPath,
          );
        }
      } catch (err) {
        console.warn("Could not load local schema.md:", err);
      }
    }
  }

  /**
   * Syncs the DuckDB index with the files currently in the Tigris bucket.
   * This is useful on startup if using an in-memory DuckDB.
   */
  async syncFromTigris(prefix: string = ""): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const command = new ListObjectsV2Command({
      Bucket: this.config.tigrisBucket,
      Prefix: prefix,
    });

    let isTruncated = true;
    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await this.s3Client.send(command);

      if (Contents) {
        for (const item of Contents) {
          if (
            item.Key &&
            (item.Key.endsWith(".md") || item.Key.endsWith(".agentx.md"))
          ) {
            await this.get(item.Key, true); // this will fetch and index it
          }
        }
      }

      isTruncated = IsTruncated ?? false;
      command.input.ContinuationToken = NextContinuationToken;
    }
  }

  async set(
    collectionPathOrRelPath: string,
    entryNameOrFrontMatter: string | FrontMatter,
    frontMatterOrContent?: FrontMatter | string,
    contentArg?: string,
  ): Promise<DBEntry> {
    if (!this.db) throw new Error("Database not initialized");

    let relPath: string;
    let frontMatter: FrontMatter;
    let content: string;
    let collectionPath: string;

    if (typeof entryNameOrFrontMatter === "string") {
      collectionPath = collectionPathOrRelPath;
      const entryName = entryNameOrFrontMatter;
      frontMatter = (frontMatterOrContent as FrontMatter) || {};
      content = contentArg || "";
      relPath =
        `${collectionPath.replace(/\\/g, "/").replace(/\/$/, "")}/${entryName}`.replace(
          /^\//,
          "",
        );
    } else {
      relPath = collectionPathOrRelPath.replace(/^\//, "");
      const parts = relPath.split("/");
      parts.pop();
      collectionPath = parts.join("/");
      frontMatter = entryNameOrFrontMatter;
      content = (frontMatterOrContent as string) || "";
    }

    const id = (frontMatter.id as string) || crypto.randomUUID();

    // Validate against schema if enabled
    if (this.config.validation && this.schemaManager) {
      const pattern = this.schemaManager.matchPath(relPath);
      if (pattern?.fields) {
        const validation = MarkdownParser.validateFrontMatter(
          frontMatter,
          pattern.fields,
        );
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }
      }
    }

    const finalFrontMatter = { id, ...frontMatter };
    const mdContent = MarkdownParser.stringify(finalFrontMatter, content);

    // 1. Upload to Tigris (S3)
    const putCmd = new PutObjectCommand({
      Bucket: this.config.tigrisBucket,
      Key: relPath,
      Body: mdContent,
      ContentType: "text/markdown",
    });
    await this.s3Client.send(putCmd);

    // 2. Insert or replace in DuckDB
    const now = new Date().toISOString();

    // Check if exists for created_at logic
    const exists = await this.db.all(
      `SELECT created_at FROM entries WHERE path = ?`,
      relPath,
    );
    const createdAt =
      exists.length > 0 && exists[0].created_at ? exists[0].created_at : now;

    await this.db.run(
      `
      INSERT INTO entries (id, path, collection, frontmatter, content, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (path) DO UPDATE SET 
        frontmatter = excluded.frontmatter,
        content = excluded.content,
        updated_at = excluded.updated_at
    `,
      id,
      relPath,
      collectionPath,
      JSON.stringify(finalFrontMatter),
      content,
      createdAt,
      now,
    );

    return {
      id,
      path: relPath,
      frontMatter: finalFrontMatter,
      content,
      createdAt: new Date(createdAt),
      updatedAt: new Date(now),
    };
  }

  /**
   * Get a single entry by path.
   * If forceS3 is true, it fetches directly from Tigris, parses, and updates DuckDB.
   * Otherwise, it tries DuckDB first, and falls back to Tigris.
   */
  async get(
    relPath: string,
    forceS3: boolean = false,
  ): Promise<DBEntry | null> {
    if (!this.db) throw new Error("Database not initialized");

    relPath = relPath.replace(/^\//, "");

    // Try DuckDB first if not forced
    if (!forceS3) {
      const rows = await this.db.all(`SELECT * FROM entries WHERE path = ?`, relPath);
      if (rows.length > 0) {
        const row = rows[0];
        return {
          id: row.id,
          path: row.path,
          frontMatter: JSON.parse(row.frontmatter),
          content: row.content,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        };
      }
    }

    // Fallback or force: Fetch from Tigris
    try {
      const getCmd = new GetObjectCommand({
        Bucket: this.config.tigrisBucket,
        Key: relPath,
      });
      const response = await this.s3Client.send(getCmd);
      if (!response.Body) return null;

      const rawContent = await response.Body.transformToString();
      const parsed = MarkdownParser.parse(rawContent, relPath);

      const id = (parsed.frontMatter.id as string) || crypto.randomUUID();
      const parts = relPath.split("/");
      parts.pop();
      const collectionPath = parts.join("/");

      const lastModified = response.LastModified
        ? response.LastModified.toISOString()
        : new Date().toISOString();

      await this.db.run(
        `
        INSERT INTO entries (id, path, collection, frontmatter, content, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (path) DO UPDATE SET 
          frontmatter = excluded.frontmatter,
          content = excluded.content,
          updated_at = excluded.updated_at
      `,
        id,
        relPath,
        collectionPath,
        JSON.stringify(parsed.frontMatter),
        parsed.content,
        lastModified,
        lastModified,
      );

      return {
        id,
        path: relPath,
        frontMatter: parsed.frontMatter,
        content: parsed.content,
        createdAt: new Date(lastModified),
        updatedAt: new Date(lastModified),
      };
    } catch (err: any) {
      if (err.name === "NoSuchKey") {
        return null; // Document does not exist
      }
      throw err;
    }
  }

  async query(options: QueryOptions = {}): Promise<DBEntry[]> {
    if (!this.db) throw new Error("Database not initialized");

    let sql = `SELECT * FROM entries WHERE 1=1`;
    const params: any[] = [];

    // Map filters to DuckDB JSON functions
    if (options.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        // Simple mapping. Note: DuckDB json_extract returns JSON scalar, so we cast to VARCHAR for text comparison
        const jsonPath = `$.${filter.field}`;
        const val = filter.value;
        const op = filter.operator;

        switch (op) {
          case "eq":
            sql += ` AND json_extract_string(frontmatter, '${jsonPath}') = ?`;
            params.push(String(val));
            break;
          case "neq":
            sql += ` AND json_extract_string(frontmatter, '${jsonPath}') != ?`;
            params.push(String(val));
            break;
          case "contains":
            sql += ` AND json_extract_string(frontmatter, '${jsonPath}') LIKE ?`;
            params.push(`%${val}%`);
            break;
          case "in":
            if (Array.isArray(val) && val.length > 0) {
              const placeholders = val.map(() => "?").join(",");
              sql += ` AND json_extract_string(frontmatter, '${jsonPath}') IN (${placeholders})`;
              params.push(...val.map(String));
            }
            break;
          // You could extend this with gt, lt using casts depending on type
        }
      }
    }

    if (options.sort) {
      const orderClauses = [];
      for (const [field, direction] of Object.entries(options.sort)) {
        orderClauses.push(
          `json_extract_string(frontmatter, '$.${field}') ${direction === "desc" ? "DESC" : "ASC"}`,
        );
      }
      if (orderClauses.length > 0) {
        sql += ` ORDER BY ${orderClauses.join(", ")}`;
      }
    }

    if (options.limit !== undefined) {
      sql += ` LIMIT ?`;
      params.push(options.limit);
    }

    if (options.offset !== undefined) {
      sql += ` OFFSET ?`;
      params.push(options.offset);
    }

    const rows = await this.db.all(sql, ...params);

    return rows.map((row: any) => ({
      id: row.id,
      path: row.path,
      frontMatter: JSON.parse(row.frontmatter),
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async delete(relPath: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    relPath = relPath.replace(/^\//, "");

    try {
      // 1. Delete from Tigris
      const delCmd = new DeleteObjectCommand({
        Bucket: this.config.tigrisBucket,
        Key: relPath,
      });
      await this.s3Client.send(delCmd);

      // 2. Delete from DuckDB
      await this.db.run(`DELETE FROM entries WHERE path = ?`, relPath);

      return true;
    } catch (err: any) {
      console.error("Error deleting:", err);
      return false;
    }
  }

  async list(dirPattern: string = ""): Promise<DBEntry[]> {
    if (!this.db) throw new Error("Database not initialized");

    const prefix = dirPattern.replace(/^\//, "");

    // We can query DuckDB to get this list
    const sql = `SELECT * FROM entries WHERE path LIKE ? OR collection = ?`;
    const rows = await this.db.all(sql, `${prefix}%`, prefix.replace(/\/$/, ""));

    return rows.map((row: any) => ({
      id: row.id,
      path: row.path,
      frontMatter: JSON.parse(row.frontmatter),
      content: row.content,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }
}
