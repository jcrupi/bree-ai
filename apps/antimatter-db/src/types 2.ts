/**
 * AntiMatterDB Type Definitions
 */

export interface FrontMatter {
  [key: string]: any;
}

export interface ParsedMarkdown {
  frontMatter: FrontMatter;
  content: string;
  filename: string;
  path: string;
}

export interface SchemaPathPattern {
  pattern: string; // e.g., "orgs/:orgId/users/:email.agentx.md"
  fields: Record<string, SchemaFieldType>;
  required?: string[];
}

export type SchemaFieldType = "string" | "number" | "boolean" | "date" | "array" | "object";

export interface SchemaDefinition {
  name: string;
  version: string;
  description?: string;
  paths: SchemaPathPattern[];
  validation?: Record<string, ValidationRule>;
}

export interface ValidationRule {
  type?: SchemaFieldType;
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface QueryFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "regex";
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  sort?: Record<string, "asc" | "desc">;
  limit?: number;
  offset?: number;
}

export interface DBEntry {
  id: string;
  path: string;
  frontMatter: FrontMatter;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DBConfig {
  rootPath: string;
  schemaPath: string;
  autoCreateFolders?: boolean;
  validation?: boolean;
}
