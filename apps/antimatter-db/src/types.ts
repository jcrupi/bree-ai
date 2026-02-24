/**
 * AntiMatterDB Type Definitions
 * Bun-native TypeScript types
 */

export type FrontMatter = Record<string, unknown>;

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
  schemaPath?: string;
  autoCreateFolders?: boolean;
  validation?: boolean;
}

export interface CollectionItem {
  name: string;
  entry: DBEntry;
}

export interface CollectionHierarchy {
  metadata?: DBEntry;
  items: CollectionItem[];
  subcollections: CollectionHierarchyNested[];
}

export interface CollectionHierarchyNested extends CollectionHierarchy {
  name: string;
}

/**
 * Schema System - Defines structure for organized data storage
 */

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
  required?: boolean;
  description?: string;
  validation?: ValidationRule;
}

export interface SchemaCollection {
  name: string;
  description?: string;
  fields?: SchemaField[];
  subcollections?: SchemaCollectionReference[];
}

export interface SchemaCollectionReference {
  name: string;
  schema: string;
  description?: string;
}

export interface Schema {
  id: string;
  name: string;
  version: string;
  description?: string;
  createdAt: Date;
  collections: Record<string, SchemaCollection>;
  templates?: Record<string, Record<string, any>>;
}

export interface SchemaEntry {
  schema: string;
  collection: string;
  uuid: string;
  name: string;
  data: FrontMatter;
}

export interface InitOptions {
  schema?: string;
  rootPath: string;
}

export interface CollectionSpec {
  schema: string;
  path: string;
  metadata?: FrontMatter;
}
