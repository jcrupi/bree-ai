#!/usr/bin/env bun
/**
 * AntiMatterDB CLI
 * Command-line interface for creating and managing schema-based databases
 */

import { join } from "path";
import { AntiMatterDB, MarkdownParser } from "../lib/index";

interface CLIConfig {
  rootPath: string;
  schemaPath?: string;
}

class AntimatterCLI {
  private config: CLIConfig;

  constructor() {
    this.config = {
      rootPath: process.cwd(),
      schemaPath: join(process.cwd(), "schema.md"),
    };
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      return await Bun.file(path).exists();
    } catch {
      return false;
    }
  }

  /**
   * Main CLI entry point
   */
  async run(args: string[]): Promise<void> {
    const [command, ...params] = args;

    try {
      switch (command) {
        case "init":
          await this.initDatabase(params[0], params[1]);
          break;
        case "create":
          await this.createEntry(params[0], params[1]);
          break;
        case "collection:create":
          await this.createCollection(params[0], params[1], params[2]);
          break;
        case "collection:add":
          await this.addToCollection(params[0], params[1], params[2], params[3]);
          break;
        case "collection:list":
          await this.listCollection(params[0], params[1]);
          break;
        case "collection:items":
          await this.listCollectionItems(params[0], params[1]);
          break;
        case "collection:subs":
          await this.listSubcollections(params[0], params[1]);
          break;
        case "collection:hierarchy":
          await this.showHierarchy(params[0], params[1]);
          break;
        case "update":
          await this.updateEntry(params[0], params[1]);
          break;
        case "org":
          await this.orgCommand(params);
          break;
        case "user":
          await this.userCommand(params);
          break;
        case "get":
          await this.getEntry(params[0], params[1]);
          break;
        case "list":
          await this.listEntries(params[0]);
          break;
        case "query":
          await this.queryEntries(params[0]);
          break;
        case "delete":
          await this.deleteEntry(params[0], params[1]);
          break;
        case "schema":
          await this.schemaCommand(params);
          break;
        case "schema:init":
          await this.initSchemaDatabase(params[0], params[1]);
          break;
        case "schema:add":
          await this.addSchemaEntry(params[0], params[1], params[2], params[3]);
          break;
        case "schema:list":
          await this.listSchemaEntries(params[0], params[1]);
          break;
        case "schema:get":
          await this.getSchemaEntry(params[0], params[1], params[2]);
          break;
        case "schema:builtin":
          await this.listBuiltinSchemas();
          break;
        case "ui":
          await this.startUI(params[0]);
          break;
        case "agent":
        case "-a":
        case "--agent":
          await this.AgentCommand(params);
          break;
        case "nats-agent":
          await this.startNatsAgent(params[0]);
          break;
        case "help":
          this.printHelp();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.printHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Initialize a new database with schema
   * Usage: antimatterdb init <dbPath> <schemaPath>
   */
  private async initDatabase(dbPath?: string, schemaPath?: string): Promise<void> {
    if (!dbPath) {
      console.error("Error: Database path required");
      console.error("Usage: antimatterdb init <dbPath> [schemaPath]");
      process.exit(1);
    }

    let schema: string;
    if (schemaPath) {
      const file = Bun.file(schemaPath);
      schema = await file.text();
    } else {
      schema = this.getDefaultSchema();
    }

    const schemaFile = join(dbPath, "schema.md");

    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: schemaFile,
      autoCreateFolders: true,
      validation: true,
    });

    await Bun.write(schemaFile, schema);
    console.log(`✓ Database initialized at ${dbPath}`);
    console.log(`✓ Schema created at ${schemaFile}`);
  }

  /**
   * Create a new entry
   * Usage: antimatterdb create <dbPath> <path> <dataJson>
   */
  private async createEntry(dbPath?: string, entryPath?: string): Promise<void> {
    if (!dbPath || !entryPath) {
      console.error("Error: dbPath and entryPath required");
      console.error("Usage: antimatterdb create <dbPath> <entryPath> <dataJson>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: schemaFile,
    });

    // Read data from stdin or arg
    let data: any = {};
    try {
      const dataArg = process.argv[process.argv.length - 1];
      if (dataArg && dataArg.startsWith("{")) {
        data = JSON.parse(dataArg);
      }
    } catch {
      data = {};
    }

    const entry = await db.set(entryPath, data);
    console.log(`✓ Entry created at ${entryPath}`);
    console.log(`  ID: ${entry.id}`);
  }

  /**
   * Get an entry
   * Usage: antimatterdb get <dbPath> <entryPath>
   */
  private async getEntry(dbPath?: string, entryPath?: string): Promise<void> {
    if (!dbPath || !entryPath) {
      console.error("Error: dbPath and entryPath required");
      console.error("Usage: antimatterdb get <dbPath> <entryPath>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const entry = await db.get(entryPath);
    if (!entry) {
      console.error(`Entry not found: ${entryPath}`);
      process.exit(1);
    }

    console.log(JSON.stringify(entry, null, 2));
  }

  /**
   * List entries in a directory
   * Usage: antimatterdb list <dbPath> [dirPattern]
   */
  private async listEntries(dbPath?: string, dirPattern: string = ""): Promise<void> {
    if (!dbPath) {
      console.error("Error: dbPath required");
      console.error("Usage: antimatterdb list <dbPath> [dirPattern]");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const entries = await db.list(dirPattern);
    console.log(`Found ${entries.length} entries:`);
    entries.forEach(entry => {
      console.log(`  - ${entry.path} (${entry.id})`);
    });
  }

  /**
   * Query entries
   * Usage: antimatterdb query <dbPath> <filterJson>
   */
  private async queryEntries(dbPath?: string): Promise<void> {
    if (!dbPath) {
      console.error("Error: dbPath required");
      console.error("Usage: antimatterdb query <dbPath> <filterJson>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const entries = await db.query();
    console.log(JSON.stringify(entries, null, 2));
  }

  /**
   * Update an existing entry (merges with existing data)
   * Usage: antimatterdb update <dbPath> <entryPath> <dataJson>
   */
  private async updateEntry(dbPath?: string, entryPath?: string): Promise<void> {
    if (!dbPath || !entryPath) {
      console.error("Error: dbPath and entryPath required");
      console.error("Usage: antimatterdb update <dbPath> <entryPath> <dataJson>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    // Get existing entry
    const existing = await db.get(entryPath);
    if (!existing) {
      console.error(`Entry not found: ${entryPath}`);
      console.error("Use 'create' command to create a new entry");
      process.exit(1);
    }

    // Read new data from stdin or arg
    let newData: any = {};
    try {
      const dataArg = process.argv[process.argv.length - 1];
      if (dataArg && dataArg.startsWith("{")) {
        newData = JSON.parse(dataArg);
      }
    } catch (e) {
      console.error("Error parsing JSON data");
      process.exit(1);
    }

    // Merge existing with new data
    const merged = {
      ...existing.frontMatter,
      ...newData,
    };

    const entry = await db.set(entryPath, merged, existing.content);
    console.log(`✓ Entry updated at ${entryPath}`);
    console.log(`  ID: ${entry.id}`);
  }

  /**
   * Organization commands
   * Usage: antimatterdb org create <dbPath> <orgSlug> <orgName>
   *        antimatterdb org update <dbPath> <orgSlug> <field=value> [field=value...]
   */
  private async orgCommand(params: string[]): Promise<void> {
    const [subcommand, dbPath, ...args] = params;

    if (!subcommand || !dbPath) {
      console.error("Usage: antimatterdb org <create|update|list> <dbPath> [args...]");
      console.error("\nExamples:");
      console.error("  antimatterdb org create ./my_db acme 'ACME Corp'");
      console.error("  antimatterdb org update ./my_db acme description='Tech company' website='https://acme.com'");
      console.error("  antimatterdb org list ./my_db");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    switch (subcommand) {
      case "create": {
        const [orgSlug, orgName] = args;
        if (!orgSlug || !orgName) {
          console.error("Usage: antimatterdb org create <dbPath> <orgSlug> <orgName>");
          process.exit(1);
        }
        const entryPath = `orgs/${orgSlug}/index.agentx.md`;
        const orgUuid = crypto.randomUUID();
        const entry = await db.set(entryPath, {
          id: `org_${orgSlug}`,
          uuid: orgUuid,
          name: orgName,
          slug: orgSlug,
          created: new Date().toISOString(),
        });
        console.log(`✓ Organization created: ${orgName} (${orgSlug})`);
        console.log(`  UUID: ${orgUuid}`);
        console.log(`  Path: ${entryPath}`);
        break;
      }
      case "update": {
        const [orgSlug, ...updates] = args;
        if (!orgSlug || updates.length === 0) {
          console.error("Usage: antimatterdb org update <dbPath> <orgSlug> <field=value> [field=value...]");
          process.exit(1);
        }
        const entryPath = `orgs/${orgSlug}/index.agentx.md`;
        const existing = await db.get(entryPath);
        if (!existing) {
          console.error(`Organization not found: ${orgSlug}`);
          process.exit(1);
        }
        const updatesObj: any = {};
        for (const update of updates) {
          const [key, ...valueParts] = update.split("=");
          const value = valueParts.join("="); // Handle values with = in them
          updatesObj[key] = value;
        }
        const merged = { ...existing.frontMatter, ...updatesObj };
        await db.set(entryPath, merged, existing.content);
        console.log(`✓ Organization updated: ${orgSlug}`);
        break;
      }
      case "list": {
        const orgs = await db.list("orgs");
        // Filter to only show index.agentx.md files (actual organizations)
        const actualOrgs = orgs.filter(org => org.path.endsWith("/index.agentx.md"));
        console.log(`Found ${actualOrgs.length} organizations:`);
        actualOrgs.forEach(org => {
          const name = org.frontMatter.name || "Unknown";
          const slug = org.frontMatter.slug || "unknown";
          console.log(`  - ${name} (${slug}) - ${org.path}`);
        });
        break;
      }
      default:
        console.error(`Unknown org subcommand: ${subcommand}`);
        process.exit(1);
    }
  }

  /**
   * User commands
   * Usage: antimatterdb user create <dbPath> <orgSlug> <email> <name> [role]
   *        antimatterdb user update <dbPath> <orgSlug> <email> <field=value> [field=value...]
   */
  private async userCommand(params: string[]): Promise<void> {
    const [subcommand, dbPath, ...args] = params;

    if (!subcommand || !dbPath) {
      console.error("Usage: antimatterdb user <create|update|list> <dbPath> [args...]");
      console.error("\nExamples:");
      console.error("  antimatterdb user create ./my_db acme john@acme.com 'John Smith' developer");
      console.error("  antimatterdb user update ./my_db acme john@acme.com department=Engineering phone='+1-555-0100'");
      console.error("  antimatterdb user list ./my_db acme");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    switch (subcommand) {
      case "create": {
        const [orgSlug, email, name, role] = args;
        if (!orgSlug || !email || !name) {
          console.error("Usage: antimatterdb user create <dbPath> <orgSlug> <email> <name> [role]");
          process.exit(1);
        }
        const entryPath = `orgs/${orgSlug}/users/${email}.agentx.md`;
        const userUuid = crypto.randomUUID();
        const entry = await db.set(entryPath, {
          id: `user_${email.replace(/[@.]/g, "_")}`,
          uuid: userUuid,
          email: email,
          name: name,
          role: role || "member",
          status: "active",
          created: new Date().toISOString(),
        });
        console.log(`✓ User created: ${name} (${email})`);
        console.log(`  UUID: ${userUuid}`);
        console.log(`  Path: ${entryPath}`);
        break;
      }
      case "update": {
        const [orgSlug, email, ...updates] = args;
        if (!orgSlug || !email || updates.length === 0) {
          console.error("Usage: antimatterdb user update <dbPath> <orgSlug> <email> <field=value> [field=value...]");
          process.exit(1);
        }
        const entryPath = `orgs/${orgSlug}/users/${email}.agentx.md`;
        const existing = await db.get(entryPath);
        if (!existing) {
          console.error(`User not found: ${email} in org ${orgSlug}`);
          process.exit(1);
        }
        const updatesObj: any = {};
        for (const update of updates) {
          const [key, ...valueParts] = update.split("=");
          const value = valueParts.join("=");
          updatesObj[key] = value;
        }
        const merged = { ...existing.frontMatter, ...updatesObj };
        await db.set(entryPath, merged, existing.content);
        console.log(`✓ User updated: ${email}`);
        break;
      }
      case "list": {
        const [orgSlug] = args;
        const dir = orgSlug ? `orgs/${orgSlug}/users` : "orgs";
        const users = await db.list(dir);
        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
          const name = user.frontMatter.name || "Unknown";
          const email = user.frontMatter.email || "No email";
          console.log(`  - ${name} (${email}) - ${user.path}`);
        });
        break;
      }
      default:
        console.error(`Unknown user subcommand: ${subcommand}`);
        process.exit(1);
    }
  }

  /**
   * Delete an entry
   * Usage: antimatterdb delete <dbPath> <entryPath>
   */
  private async deleteEntry(dbPath?: string, entryPath?: string): Promise<void> {
    if (!dbPath || !entryPath) {
      console.error("Error: dbPath and entryPath required");
      console.error("Usage: antimatterdb delete <dbPath> <entryPath>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const success = await db.delete(entryPath);
    if (!success) {
      console.error(`Entry not found: ${entryPath}`);
      process.exit(1);
    }

    console.log(`✓ Entry deleted: ${entryPath}`);
  }

  /**
   * Create a schema file
   * Usage: antimatterdb schema <name> [version]
   */
  private async createSchema(name?: string, version: string = "1.0.0"): Promise<void> {
    if (!name) {
      console.error("Error: schema name required");
      console.error("Usage: antimatterdb schema <name> [version]");
      process.exit(1);
    }

    const schema = this.generateSchema(name, version);
    console.log(schema);
  }

  /**
   * Generate default schema
   */
  private getDefaultSchema(): string {
    return `---
name: default
version: 1.0.0
description: Default AntiMatterDB Schema
paths:
  - pattern: "**/*.md"
    fields:
      id:
        type: string
        required: false
      title:
        type: string
        required: false
      tags:
        type: array
        required: false
validation:
  id:
    type: string
---

# Default Schema

This is the default schema for AntiMatterDB. Customize it for your use case.

## Structure

Supports any markdown files (.md or .agentx.md) with YAML front-matter.

## Example Entry

\`\`\`yaml
---
id: abc123
title: Example Entry
tags: [example, test]
---
\`\`\`

Content goes here...
`;
  }

  /**
   * Generate custom schema
   */
  private generateSchema(name: string, version: string): string {
    return `---
name: ${name}
version: ${version}
description: Schema for ${name}
paths:
  - pattern: "**/*.md"
    fields:
      id:
        type: string
        required: true
      title:
        type: string
        required: true
      created:
        type: date
        required: false
      tags:
        type: array
        required: false
---

# ${name} Schema

Custom schema for ${name} database.
`;
  }

  /**
   * Schema commands
   */
  private async schemaCommand(params: string[]): Promise<void> {
    const [subcommand, dbPath, ...args] = params;

    if (!subcommand) {
      console.error("Usage: antimatterdb schema <init|list-builtin> [dbPath] [schemaName]");
      process.exit(1);
    }

    switch (subcommand) {
      case "init":
        await this.initSchemaDatabase(dbPath, args[0]);
        break;
      case "list-builtin":
        await this.listBuiltinSchemas();
        break;
      default:
        console.error(`Unknown schema command: ${subcommand}`);
        process.exit(1);
    }
  }

  /**
   * Initialize database with a built-in schema
   * Usage: antimatterdb schema:init <dbPath> <schemaName>
   */
  private async initSchemaDatabase(dbPath?: string, schemaName?: string): Promise<void> {
    if (!dbPath || !schemaName) {
      console.error("Error: dbPath and schemaName required");
      console.error("Usage: antimatterdb schema:init <dbPath> <schemaName>");
      console.error("\nBuilt-in schemas: organization, project, team, member, document");
      process.exit(1);
    }

    try {
      const { getBuiltinSchema, SchemaManager } = await import("../lib/index");

      const schema = getBuiltinSchema(schemaName);
      if (!schema) {
        console.error(`Unknown schema: ${schemaName}`);
        console.error("Available schemas: organization, project, team, member, document");
        process.exit(1);
      }

      const db = new AntiMatterDB({
        rootPath: dbPath,
        autoCreateFolders: true,
      });

      const manager = new SchemaManager(db, schema);
      await manager.initializeSchema("");

      console.log(`✓ Database initialized with schema: ${schemaName}`);
      console.log(`✓ Structure created at ${dbPath}`);
    } catch (error) {
      console.error("Error initializing schema:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Add entry to schema collection
   * Usage: antimatterdb schema:add <dbPath> <collectionPath> <entryName> <dataJson>
   */
  private async addSchemaEntry(
    dbPath?: string,
    collectionPath?: string,
    entryName?: string,
    dataJson?: string
  ): Promise<void> {
    if (!dbPath || !collectionPath || !entryName) {
      console.error("Error: dbPath, collectionPath, entryName required");
      console.error("Usage: antimatterdb schema:add <dbPath> <collectionPath> <entryName> [dataJson]");
      process.exit(1);
    }

    try {
      const { SchemaManager, OrganizationSchema } = await import("../lib/index");

      const db = new AntiMatterDB({
        rootPath: dbPath,
        autoCreateFolders: true,
      });

      const manager = new SchemaManager(db, OrganizationSchema);

      let data: any = {};
      if (dataJson) {
        try {
          data = JSON.parse(dataJson);
        } catch (e) {
          console.error("Error parsing JSON data");
          process.exit(1);
        }
      }

      const entry = await manager.createEntry(collectionPath, entryName, data);
      console.log(`✓ Entry created with UUID: ${entry.uuid}`);
      console.log(`✓ Name: ${entryName}-[[${entry.uuid}]]`);
    } catch (error) {
      console.error("Error adding entry:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * List schema entries
   * Usage: antimatterdb schema:list <dbPath> <collectionPath>
   */
  private async listSchemaEntries(dbPath?: string, collectionPath?: string): Promise<void> {
    if (!dbPath || !collectionPath) {
      console.error("Error: dbPath and collectionPath required");
      console.error("Usage: antimatterdb schema:list <dbPath> <collectionPath>");
      process.exit(1);
    }

    try {
      const { SchemaManager, OrganizationSchema } = await import("../lib/index");

      const db = new AntiMatterDB({
        rootPath: dbPath,
      });

      const manager = new SchemaManager(db, OrganizationSchema);
      const entries = await manager.listEntriesWithUuids(collectionPath);

      console.log(`\nEntries in ${collectionPath}:`);
      entries.forEach((entry) => {
        console.log(`  - ${entry.name}-[[${entry.uuid}]]`);
        console.log(`    Name: ${entry.data.name || "N/A"}`);
      });
      console.log(`\nTotal: ${entries.length} entries\n`);
    } catch (error) {
      console.error("Error listing entries:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Get schema entry by UUID
   * Usage: antimatterdb schema:get <dbPath> <collectionPath> <uuid>
   */
  private async getSchemaEntry(dbPath?: string, collectionPath?: string, entryUuid?: string): Promise<void> {
    if (!dbPath || !collectionPath || !entryUuid) {
      console.error("Error: dbPath, collectionPath, uuid required");
      console.error("Usage: antimatterdb schema:get <dbPath> <collectionPath> <uuid>");
      process.exit(1);
    }

    try {
      const { SchemaManager, OrganizationSchema } = await import("../lib/index");

      const db = new AntiMatterDB({
        rootPath: dbPath,
      });

      const manager = new SchemaManager(db, OrganizationSchema);
      const entry = await manager.getEntryByUuid(collectionPath, entryUuid);

      if (!entry) {
        console.error(`Entry not found with UUID: ${entryUuid}`);
        process.exit(1);
      }

      console.log(JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error("Error getting entry:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * List built-in schemas
   */
  private async listBuiltinSchemas(): Promise<void> {
    try {
      const { listBuiltinSchemas } = await import("../lib/index");
      const schemas = listBuiltinSchemas();

      console.log("\nBuilt-in Schemas:\n");
      schemas.forEach((schema) => {
        console.log(`  • ${schema}`);
      });
      console.log("\nUsage: antimatterdb schema:init <dbPath> <schemaName>\n");
    } catch (error) {
      console.error("Error listing schemas:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Start NATS Agent
   */
  private async startNatsAgent(dbPath?: string): Promise<void> {
    const dbPathToUse = dbPath || process.cwd();
    const { startNatsAgent } = await import("./nats-agent");
    await startNatsAgent(dbPathToUse);
  }

  /**
   * Start UI server
   * Usage: antimatterdb ui <dbPath>
   */
  private async startUI(dbPath?: string): Promise<void> {
    const dbPathToUse = dbPath || "./test_db";
    const port = process.env.PORT || "5173";
    const fullPath = join(this.config.rootPath, dbPathToUse);

    // Spawn UI server process
    const subprocess = Bun.spawn(["bun", "run", "src/ui-server/index.ts"], {
      env: {
        ...process.env,
        DB_PATH: fullPath,
        PORT: String(port),
      },
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });

    console.log(`🌐 UI Server starting...`);
    console.log(`📁 Database: ${fullPath}`);
    console.log(`🔗 Open http://localhost:${port} in your browser`);

    await subprocess.exited;
  }

  /**
   * Print help
   */
  private printHelp(): void {
    console.log(`
AntiMatterDB CLI v0.1.0

Usage: antimatterdb <command> [options]

Commands:

  init <dbPath> [schemaPath]
    Initialize a new database with optional schema file

  org create <dbPath> <orgSlug> <orgName>
    Create a new organization (simple command)

  org update <dbPath> <orgSlug> <field=value> [field=value...]
    Update organization metadata (e.g., description='Tech company')

  org list <dbPath>
    List all organizations

  user create <dbPath> <orgSlug> <email> <name> [role]
    Create a new user in an organization (simple command)

  user update <dbPath> <orgSlug> <email> <field=value> [field=value...]
    Update user metadata (e.g., department=Engineering phone='+1-555-0100')

  user list <dbPath> [orgSlug]
    List users (optionally filtered by organization)

  create <dbPath> <entryPath> [dataJson]
    Create a new entry in the database (advanced)

  update <dbPath> <entryPath> [dataJson]
    Update an existing entry (merges with existing data)

  get <dbPath> <entryPath>
    Retrieve a single entry

  list <dbPath> [dirPattern]
    List all entries (optionally filtered by directory pattern)

  query <dbPath> [filterJson]
    Query entries with optional filters

  delete <dbPath> <entryPath>
    Delete an entry

  schema init <dbPath> <schemaName>
    Initialize database with built-in schema (organization, project, team, member, document)

  schema list-builtin
    List all available built-in schemas

  schema:builtin
    List all available built-in schemas

  ui [dbPath]
    Start the web UI server for database exploration

  help
    Show this help message

Schema-Based Entry Commands:

  schema:add <dbPath> <collectionPath> <entryName> [dataJson]
    Add entry with UUID-based naming (e.g., acme-corp-[[uuid123]])

  schema:list <dbPath> <collectionPath>
    List all entries with UUIDs in a collection

  schema:get <dbPath> <collectionPath> <uuid>
    Get entry by UUID

Examples:

  # Initialize a new database
  antimatterdb init ./my_db

  # Create an organization (simple)
  antimatterdb org create ./my_db acme 'ACME Corporation'

  # Create a user (simple)
  antimatterdb user create ./my_db acme john@acme.com 'John Smith' developer

  # Add metadata to organization later
  antimatterdb org update ./my_db acme description='Tech company' website='https://acme.com' industry=Technology

  # Add metadata to user later
  antimatterdb user update ./my_db acme john@acme.com department=Engineering phone='+1-555-0100' location='Remote'

  # List organizations
  antimatterdb org list ./my_db

  # List users in an organization
  antimatterdb user list ./my_db acme

  # Advanced: Create entry with JSON
  antimatterdb create ./my_db users/john@example.md '{"name":"John","role":"admin"}'

  # Advanced: Update entry with JSON
  antimatterdb update ./my_db users/john@example.md '{"department":"Engineering"}'

  # Start the UI server
  antimatterdb ui ./my_db

  # Collection-based commands (hierarchical)
  antimatterdb collection:create ./my_db users '{"name":"Users Collection"}'
  antimatterdb collection:add ./my_db users john.md '{"name":"John","role":"developer"}'
  antimatterdb collection:items ./my_db users
  antimatterdb collection:subs ./my_db users
  antimatterdb collection:hierarchy ./my_db users

  # Schema-based database (with UUID naming)
  antimatterdb schema list-builtin
  antimatterdb schema:init ./org_db organization
  antimatterdb schema:add ./org_db orgs acme-corp '{"name":"ACME Corporation","status":"active"}'
  antimatterdb schema:list ./org_db orgs
  antimatterdb schema:add ./org_db orgs/acme-corp/members john-smith '{"name":"John Smith","email":"john@acme.com","role":"admin","isAdmin":true}'
  antimatterdb schema:list ./org_db orgs/acme-corp/members
    `);
  }

  /**
   * Create a new collection with metadata
   * Usage: antimatterdb collection:create <dbPath> <collectionPath> <metadataJson>
   */
  private async createCollection(dbPath?: string, collectionPath?: string, metadataArg?: string): Promise<void> {
    if (!dbPath || !collectionPath) {
      console.error("Error: dbPath and collectionPath required");
      console.error("Usage: antimatterdb collection:create <dbPath> <collectionPath> [metadataJson]");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    let metadata: any = { name: collectionPath };
    try {
      if (metadataArg && metadataArg.startsWith("{")) {
        metadata = JSON.parse(metadataArg);
      }
    } catch (e) {
      console.error("Warning: Could not parse metadata JSON, using defaults");
    }

    await db.set(collectionPath, "index.md", metadata);
    console.log(`✓ Collection created: ${collectionPath}`);
  }

  /**
   * Add entry to collection
   * Usage: antimatterdb collection:add <dbPath> <collectionPath> <entryName> <dataJson>
   */
  private async addToCollection(dbPath?: string, collectionPath?: string, entryName?: string, dataArg?: string): Promise<void> {
    if (!dbPath || !collectionPath || !entryName) {
      console.error("Error: dbPath, collectionPath, and entryName required");
      console.error("Usage: antimatterdb collection:add <dbPath> <collectionPath> <entryName> [dataJson]");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    let data: any = {};
    try {
      if (dataArg && dataArg.startsWith("{")) {
        data = JSON.parse(dataArg);
      }
    } catch (e) {
      console.error("Warning: Could not parse data JSON, using empty data");
    }

    const entry = await db.set(collectionPath, entryName, data);
    console.log(`✓ Entry added to collection: ${collectionPath}/${entryName}`);
    console.log(`  ID: ${entry.id}`);
  }

  /**
   * List collection with metadata
   * Usage: antimatterdb collection:list <dbPath> <collectionPath>
   */
  private async listCollection(dbPath?: string, collectionPath?: string): Promise<void> {
    if (!dbPath || !collectionPath) {
      console.error("Error: dbPath and collectionPath required");
      console.error("Usage: antimatterdb collection:list <dbPath> <collectionPath>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const metadata = await db.getCollectionMetadata(collectionPath);
    if (metadata) {
      console.log(`Collection: ${collectionPath}`);
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      console.log(`No metadata found for collection: ${collectionPath}`);
    }
  }

  /**
   * List items in collection
   * Usage: antimatterdb collection:items <dbPath> <collectionPath>
   */
  private async listCollectionItems(dbPath?: string, collectionPath?: string): Promise<void> {
    if (!dbPath || !collectionPath) {
      console.error("Error: dbPath and collectionPath required");
      console.error("Usage: antimatterdb collection:items <dbPath> <collectionPath>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const items = await db.listCollection(collectionPath);
    console.log(`Found ${items.length} items in ${collectionPath}:`);
    items.forEach(item => {
      const name = item.frontMatter.name || item.path.split("/").pop();
      console.log(`  - ${name} (${item.id})`);
    });
  }

  /**
   * List subcollections
   * Usage: antimatterdb collection:subs <dbPath> <collectionPath>
   */
  private async listSubcollections(dbPath?: string, collectionPath?: string): Promise<void> {
    if (!dbPath || !collectionPath) {
      console.error("Error: dbPath and collectionPath required");
      console.error("Usage: antimatterdb collection:subs <dbPath> <collectionPath>");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const subs = await db.listSubcollections(collectionPath);
    console.log(`Found ${subs.length} subcollections in ${collectionPath}:`);
    subs.forEach(sub => {
      console.log(`  - ${sub}/`);
    });
  }

  /**
   * Show full hierarchy
   * Usage: antimatterdb collection:hierarchy <dbPath> <collectionPath>
   */
  private async showHierarchy(dbPath?: string, collectionPath?: string): Promise<void> {
    if (!dbPath) {
      console.error("Error: dbPath required");
      console.error("Usage: antimatterdb collection:hierarchy <dbPath> [collectionPath]");
      process.exit(1);
    }

    const schemaFile = join(dbPath, "schema.md");
    const db = new AntiMatterDB({
      rootPath: dbPath,
      schemaPath: (await this.fileExists(schemaFile)) ? schemaFile : undefined,
    });

    const hierarchy = await db.getHierarchy(collectionPath || "");
    console.log(JSON.stringify(hierarchy, null, 2));
  }

  /**
   * Agent orchestration command
   * Usage: antimatterdb agent <agentName> [args...]
   */
  private async AgentCommand(params: string[]): Promise<void> {
    const [agentName, ...args] = params;

    if (!agentName) {
      console.error("Error: agent name required");
      console.error("Usage: antimatterdb agent <agentName> [args...]");
      console.error("\nSupported agents: ragster, aicto");
      process.exit(1);
    }

    const { spawn } = await import("child_process");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    console.log(`\n🤖 AntiMatterDB Orchestrator: Delegating to ${agentName} agent...\n`);

    let binPath = "";
    let cwd = process.cwd();

    switch (agentName.toLowerCase()) {
      case "ragster":
        binPath = resolve(__dirname, "..", "..", "..", "ragster", "src", "cli", "index.ts");
        cwd = resolve(__dirname, "..", "..", "..", "ragster");
        break;
      case "aicto":
        binPath = resolve(__dirname, "..", "..", "..", "aicto", "aicto.sh");
        cwd = resolve(__dirname, "..", "..", "..", "aicto");
        break;
      default:
        console.error(`❌ Unknown agent: ${agentName}`);
        console.error("Supported agents: ragster, aicto");
        process.exit(1);
    }

    const child = binPath.endsWith(".sh")
      ? spawn(binPath, args, { stdio: "inherit", cwd, env: { ...process.env, INIT_CWD: cwd } })
      : spawn("bun", [binPath, ...args], { stdio: "inherit", cwd, env: { ...process.env, INIT_CWD: cwd } });

    child.on("exit", (code) => process.exit(code || 0));
  }
}

// Run CLI
if (import.meta.main) {
  const cli = new AntimatterCLI();
  let args = process.argv.slice(2);
  
  // Handle global --fly flag (sets NATS_URL for nats-agent mode)
  if (args.includes("--fly")) {
    // Note: NATS on Fly.io is internal-only, user needs to use flyctl proxy
    // This sets the URL assuming proxy is running: flyctl proxy 4222:4222 -a agent-collective-nats
    process.env.NATS_URL = process.env.NATS_URL || "localhost:4222";
    process.env.ANTIMATTER_URL = "https://agent-collective-antimatter.fly.dev";
    args = args.filter(arg => arg !== "--fly");
  }
  
  // Handle global --agentx flag
  if (args.includes("--agentx")) {
    const dbPath = args.find(a => a !== "--agentx") || process.cwd();
    args = ["nats-agent", dbPath];
  }

  cli.run(args).catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

export { AntimatterCLI };
