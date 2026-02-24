/**
 * Schema Manager - Handles schema definition and path pattern matching
 */

import type { SchemaDefinition, SchemaPathPattern } from "../types";
import { MarkdownParser } from "./parser";

export class SchemaManager {
  private schema: SchemaDefinition;

  constructor(schemaPath: string) {
    throw new Error("Use SchemaManager.create() for async initialization");
  }

  static async create(schemaPath: string): Promise<SchemaManager> {
    const manager = Object.create(SchemaManager.prototype);
    const file = Bun.file(schemaPath);
    const content = await file.text();
    const parsed = MarkdownParser.parse(content, schemaPath);
    manager.schema = {
      name: parsed.frontMatter.name || "default",
      version: parsed.frontMatter.version || "1.0.0",
      description: parsed.frontMatter.description,
      paths: parsed.frontMatter.paths || [],
      validation: parsed.frontMatter.validation || {},
    };
    return manager;
  }

  /**
   * Get schema definition
   */
  getSchema(): SchemaDefinition {
    return this.schema;
  }

  /**
   * Match a file path against schema patterns
   */
  matchPath(filePath: string): SchemaPathPattern | null {
    for (const pattern of this.schema.paths) {
      if (this.pathMatches(filePath, pattern.pattern)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Extract variables from a file path based on pattern
   */
  extractPathVariables(filePath: string, pattern: string): Record<string, string> | null {
    const regex = this.patternToRegex(pattern);
    const match = filePath.match(regex);

    if (!match) return null;

    const variables: Record<string, string> = {};
    const varPattern = /:(\w+)/g;
    let varMatch;
    let index = 1;

    while ((varMatch = varPattern.exec(pattern)) !== null) {
      variables[varMatch[1]] = match[index++];
    }

    return variables;
  }

  /**
   * Check if a path matches a pattern
   */
  private pathMatches(filePath: string, pattern: string): boolean {
    const regex = this.patternToRegex(pattern);
    return regex.test(filePath);
  }

  /**
   * Convert pattern like "orgs/:orgId/users/:email.md" to regex
   * Also handles glob patterns with double-star for recursive matching
   */
  private patternToRegex(pattern: string): RegExp {
    // Handle glob patterns first
    // Convert ** to match any path (including subdirectories)
    // Convert * to match any filename (but not path separators)
    let processed = pattern;
    
    // Replace ** with a special marker (we'll handle this after variable replacement)
    processed = processed.replace(/\*\*/g, "__GLOB_STAR_STAR__");
    // Replace single * (but not **) with a marker
    processed = processed.replace(/(?<!\*)\*(?!\*)/g, "__GLOB_STAR__");
    
    // Split pattern by variables, escape each part, then reassemble
    const parts: string[] = [];
    let lastIndex = 0;
    const varPattern = /:(\w+)/g;
    let match;
    
    while ((match = varPattern.exec(processed)) !== null) {
      // Escape the part before the variable
      if (match.index > lastIndex) {
        const before = processed.substring(lastIndex, match.index);
        // Escape regex special chars: . + ? ^ $ { } ( ) | [ ] \
        parts.push(before.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
      }
      // Add the capture group for the variable (matches anything except /)
      parts.push("([^/]+)");
      lastIndex = match.index + match[0].length;
    }
    
    // Add the remaining part after the last variable
    if (lastIndex < processed.length) {
      const after = processed.substring(lastIndex);
      parts.push(after.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
    }
    
    // If no variables found, just escape the whole pattern
    if (parts.length === 0) {
      parts.push(processed.replace(/[.+?^${}()|[\]\\]/g, "\\$&"));
    }
    
    // Now replace glob markers with regex
    let regexStr = parts.join("");
    // Replace __GLOB_STAR_STAR__ with .* (matches anything including /)
    regexStr = regexStr.replace(/__GLOB_STAR_STAR__/g, ".*");
    // Replace __GLOB_STAR__ with [^/]* (matches anything except /)
    regexStr = regexStr.replace(/__GLOB_STAR__/g, "[^/]*");
    
    try {
      return new RegExp(`^${regexStr}$`);
    } catch (e) {
      console.error(`Invalid regex pattern: ${regexStr} from pattern: ${pattern}`);
      throw e;
    }
  }

  /**
   * Generate path from pattern and variables
   */
  generatePath(pattern: string, variables: Record<string, string>): string {
    let path = pattern;
    for (const [key, value] of Object.entries(variables)) {
      path = path.replace(`:${key}`, value);
    }
    return path;
  }
}
