/**
 * AntiMatterDB - Main Entry Point
 * Schema-driven markdown database system
 */

export { AntiMatterDB } from "./lib/database";
export { MarkdownParser } from "./lib/parser";
export { SchemaManager } from "./lib/schema";
export { AntimatterServer } from "./server/index";
export { AntimatterCLI } from "./cli/index";
export * from "./types";

// Example usage
if (import.meta.main) {
  console.log("AntiMatterDB - Schema-driven Markdown Database");
  console.log("");
  console.log("Usage:");
  console.log("  As a library:");
  console.log("    import { AntiMatterDB } from 'antimatterdb'");
  console.log("");
  console.log("  As a CLI:");
  console.log("    bun run src/cli/index.ts init ./my_db");
  console.log("");
  console.log("  As a server:");
  console.log("    bun run src/server/index.ts");
}
