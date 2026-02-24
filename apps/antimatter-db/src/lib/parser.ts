/**
 * Markdown Parser - Handles front-matter extraction and markdown parsing
 */

import matter from "gray-matter";
import type { FrontMatter, ParsedMarkdown } from "../types";

export class MarkdownParser {
  /**
   * Parse a markdown file and extract front-matter (async with Bun)
   */
  static async parseFile(filePath: string): Promise<ParsedMarkdown> {
    const file = Bun.file(filePath);
    const content = await file.text();
    return this.parse(content, filePath);
  }

  /**
   * Parse markdown content string
   */
  static parse(content: string, filePath: string = ""): ParsedMarkdown {
    const { data, content: bodyContent } = matter(content);

    return {
      frontMatter: data,
      content: bodyContent.trim(),
      filename: filePath.split("/").pop() || "",
      path: filePath,
    };
  }

  /**
   * Create markdown content with front-matter
   */
  static stringify(frontMatter: FrontMatter, content: string = ""): string {
    const fm = Object.keys(frontMatter).length > 0 ? matter.stringify(content, frontMatter) : content;
    return fm;
  }

  /**
   * Validate front-matter against schema
   */
  static validateFrontMatter(
    frontMatter: FrontMatter,
    rules: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = frontMatter[field];

      if (rule.required && value === undefined) {
        errors.push(`Field '${field}' is required`);
        continue;
      }

      if (value === undefined) continue;

      // Type validation
      if (rule.type) {
        const actualType = typeof value;
        if (actualType !== rule.type && !(rule.type === "array" && Array.isArray(value))) {
          errors.push(`Field '${field}' should be of type ${rule.type}, got ${actualType}`);
        }
      }

      // String validations
      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`Field '${field}' must be at least ${rule.minLength} characters`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`Field '${field}' must be at most ${rule.maxLength} characters`);
        }
        if (rule.pattern) {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(value)) {
            errors.push(`Field '${field}' does not match pattern: ${rule.pattern}`);
          }
        }
      }

      // Number validations
      if (typeof value === "number") {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`Field '${field}' must be >= ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`Field '${field}' must be <= ${rule.max}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
