/**
 * AntiMatterDB - Core Database Class
 * Folder-based hierarchical markdown database with front-matter YAML
 *
 * Folder Structure:
 * db-root/
 * ├── schema.md              (database schema definition)
 * ├── collection-name/       (folder = collection)
 * │   ├── index.md          (collection metadata)
 * │   ├── item1.md          (entry with front-matter)
 * │   ├── item2.md
 * │   └── sub-collection/
 * │       ├── index.md
 * │       ├── nested-item.md
 */

import { join, dirname } from "path";
import type { DBEntry, DBConfig, FrontMatter, QueryOptions, QueryFilter } from "../types";
import { MarkdownParser } from "./parser";
import { SchemaManager } from "./schema";

export class AntiMatterDB {
  private config: DBConfig;
  private schemaManager?: SchemaManager;
  private cache: Map<string, DBEntry> = new Map();

  constructor(config: DBConfig) {
    this.config = {
      autoCreateFolders: true,
      validation: true,
      ...config,
    };

    this.initializeDatabase();
  }

  private async initializeDatabase() {
    const rootPathFile = Bun.file(this.config.rootPath);

    // Create root directory if it doesn't exist
    if (this.config.autoCreateFolders && !rootPathFile.exists()) {
      await Bun.write(this.config.rootPath, "");
    }

    // Initialize schema manager if schema exists
    if (this.config.schemaPath) {
      const schemaFile = Bun.file(this.config.schemaPath);
      if (await schemaFile.exists()) {
        this.schemaManager = await SchemaManager.create(this.config.schemaPath);
      }
    }
  }

  /**
   * Create or update an entry in a collection
   * @param collectionPath - Folder path like "users" or "orgs/acme/teams"
   * @param entryName - File name like "john.md" or "admin-team.md"
   * @param frontMatter - YAML front-matter data
   * @param content - Markdown content
   */
  async set(collectionPath: string, entryName: string, frontMatter: FrontMatter, content?: string): Promise<DBEntry>;
  async set(relPath: string, frontMatter: FrontMatter, content?: string): Promise<DBEntry>;
  async set(collectionPathOrRelPath: string, entryNameOrFrontMatter: string | FrontMatter, frontMatterOrContent?: FrontMatter | string, contentArg?: string): Promise<DBEntry> {
    // Handle both old API (relPath, frontMatter, content) and new API (collection, entry, frontMatter, content)
    let fullPath: string;
    let frontMatter: FrontMatter;
    let content: string;
    let relPath: string;

    if (typeof entryNameOrFrontMatter === 'string') {
      // New API: collection, entryName, frontMatter, content
      const collectionPath = collectionPathOrRelPath;
      const entryName = entryNameOrFrontMatter;
      frontMatter = frontMatterOrContent as FrontMatter || {};
      content = contentArg || "";
      relPath = join(collectionPath, entryName);
      fullPath = join(this.config.rootPath, relPath);
    } else {
      // Old API: relPath, frontMatter, content
      relPath = collectionPathOrRelPath;
      fullPath = join(this.config.rootPath, relPath);
      frontMatter = entryNameOrFrontMatter;
      content = (frontMatterOrContent as string) || "";
    }

    const id = (frontMatter.id as string) || crypto.randomUUID();

    // Validate against schema if enabled
    if (this.config.validation && this.schemaManager) {
      const pattern = this.schemaManager.matchPath(relPath);
      if (pattern?.fields) {
        const validation = MarkdownParser.validateFrontMatter(frontMatter, pattern.fields);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
        }
      }
    }

    // Create directories if needed
    if (this.config.autoCreateFolders) {
      const dirPath = dirname(fullPath);
      await Bun.write(dirPath + "/.keep", "");
    }

    // Create markdown content
    const mdContent = MarkdownParser.stringify(
      { id, ...frontMatter },
      content
    );

    await Bun.write(fullPath, mdContent);

    const entry: DBEntry = {
      id,
      path: relPath,
      frontMatter: { id, ...frontMatter },
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cache.set(fullPath, entry);
    return entry;
  }

  /**
   * Get a single entry by path
   */
  async get(relPath: string): Promise<DBEntry | null> {
    const fullPath = join(this.config.rootPath, relPath);

    const file = Bun.file(fullPath);
    if (!await file.exists()) {
      return null;
    }

    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath) || null;
    }

    const content = await file.text();
    const parsed = MarkdownParser.parse(content);
    const entry: DBEntry = {
      id: (parsed.frontMatter.id as string) || crypto.randomUUID(),
      path: relPath,
      frontMatter: parsed.frontMatter,
      content: parsed.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cache.set(fullPath, entry);
    return entry;
  }

  /**
   * Query entries with filtering
   */
  async query(options: QueryOptions = {}): Promise<DBEntry[]> {
    const allEntries = await this.scanDirectory(this.config.rootPath);
    let results = allEntries;

    // Apply filters
    if (options.filters && options.filters.length > 0) {
      results = results.filter(entry => this.applyFilters(entry, options.filters!));
    }

    // Apply sorting
    if (options.sort) {
      results.sort((a, b) => this.compareEntries(a, b, options.sort!));
    }

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Delete an entry
   */
  async delete(relPath: string): Promise<boolean> {
    const fullPath = join(this.config.rootPath, relPath);

    const file = Bun.file(fullPath);
    if (!await file.exists()) {
      return false;
    }

    await Bun.write(fullPath, "");
    // For Bun, we'll write empty content; true file deletion requires system commands
    this.cache.delete(fullPath);
    return true;
  }

  /**
   * List entries in a directory pattern
   */
  async list(dirPattern: string = ""): Promise<DBEntry[]> {
    const searchPath = join(this.config.rootPath, dirPattern);
    return this.scanDirectory(searchPath);
  }

  /**
   * Get collection metadata from index.md
   */
  async getCollectionMetadata(collectionPath: string): Promise<DBEntry | null> {
    const indexPath = join(collectionPath, "index.md");
    return this.get(indexPath);
  }

  /**
   * List items in a collection (excluding index.md)
   */
  async listCollection(collectionPath: string): Promise<DBEntry[]> {
    const fullPath = join(this.config.rootPath, collectionPath);
    const { readdir } = await import("node:fs/promises");

    try {
      const files = await readdir(fullPath, { withFileTypes: true });
      const entries: DBEntry[] = [];

      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".md") && file.name !== "index.md") {
          const relPath = join(collectionPath, file.name);
          const entry = await this.get(relPath);
          if (entry) entries.push(entry);
        }
      }
      return entries;
    } catch {
      return [];
    }
  }

  /**
   * List subcollections (directories) in a collection
   */
  async listSubcollections(collectionPath: string): Promise<string[]> {
    const fullPath = join(this.config.rootPath, collectionPath);
    const { readdir } = await import("node:fs/promises");

    try {
      const files = await readdir(fullPath, { withFileTypes: true });
      return files
        .filter(file => file.isDirectory() && !file.name.startsWith("."))
        .map(file => file.name);
    } catch {
      return [];
    }
  }

  /**
   * Get hierarchy structure for a collection
   */
  async getHierarchy(collectionPath: string = ""): Promise<any> {
    const fullPath = join(this.config.rootPath, collectionPath);
    const { readdir } = await import("node:fs/promises");

    try {
      const files = await readdir(fullPath, { withFileTypes: true });
      const hierarchy: any = { items: [], subcollections: [] };

      // Get collection metadata if index.md exists
      if (files.some(f => f.name === "index.md")) {
        const metadata = await this.get(join(collectionPath, "index.md"));
        if (metadata) hierarchy.metadata = metadata;
      }

      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".md") && file.name !== "index.md") {
          const entry = await this.get(join(collectionPath, file.name));
          if (entry) hierarchy.items.push({ name: file.name, entry });
        } else if (file.isDirectory() && !file.name.startsWith(".")) {
          const subHier = await this.getHierarchy(join(collectionPath, file.name));
          if (subHier) hierarchy.subcollections.push({ name: file.name, ...subHier });
        }
      }
      return hierarchy;
    } catch {
      return null;
    }
  }

  /**
   * Recursively scan directory for markdown files
   */
  private async scanDirectory(dirPath: string): Promise<DBEntry[]> {
    const entries: DBEntry[] = [];
    const { readdir } = await import("node:fs/promises");

    try {
      const files = await readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const fullPath = join(dirPath, file.name);

        if (file.isDirectory()) {
          entries.push(...await this.scanDirectory(fullPath));
        } else if (file.name.endsWith(".md") || file.name.endsWith(".agentx.md")) {
          const relPath = this.getRelativePath(fullPath);
          if (this.cache.has(fullPath)) {
            entries.push(this.cache.get(fullPath)!);
          } else {
            const fileData = Bun.file(fullPath);
            const content = await fileData.text();
            const parsed = MarkdownParser.parse(content);
            const entry: DBEntry = {
              id: (parsed.frontMatter.id as string) || crypto.randomUUID(),
              path: relPath,
              frontMatter: parsed.frontMatter,
              content: parsed.content,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            this.cache.set(fullPath, entry);
            entries.push(entry);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }

    return entries;
  }

  /**
   * Get relative path from root
   */
  private getRelativePath(fullPath: string): string {
    return fullPath.replace(this.config.rootPath + "/", "").replace(this.config.rootPath, "");
  }

  /**
   * Apply query filters to an entry
   */
  private applyFilters(entry: DBEntry, filters: QueryFilter[]): boolean {
    return filters.every(filter => this.applyFilter(entry, filter));
  }

  /**
   * Apply single filter to entry
   */
  private applyFilter(entry: DBEntry, filter: QueryFilter): boolean {
    const value = this.getNestedValue(entry.frontMatter, filter.field);

    switch (filter.operator) {
      case "eq":
        return value === filter.value;
      case "neq":
        return value !== filter.value;
      case "gt":
        return value > filter.value;
      case "gte":
        return value >= filter.value;
      case "lt":
        return value < filter.value;
      case "lte":
        return value <= filter.value;
      case "in":
        return Array.isArray(filter.value) && filter.value.includes(value);
      case "contains":
        return typeof value === "string" && value.includes(filter.value);
      case "regex":
        return new RegExp(filter.value).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Compare entries for sorting
   */
  private compareEntries(
    a: DBEntry,
    b: DBEntry,
    sort: Record<string, "asc" | "desc">
  ): number {
    for (const [field, direction] of Object.entries(sort)) {
      const aVal = this.getNestedValue(a.frontMatter, field);
      const bVal = this.getNestedValue(b.frontMatter, field);

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      if (comparison !== 0) {
        return direction === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
