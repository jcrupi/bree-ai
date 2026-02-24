/**
 * AntiMatterDB Library Export
 * Use as a library in your Node.js/TypeScript applications
 */

export { AntiMatterDB } from "./database";
export { MarkdownParser } from "./parser";
export { SchemaManager } from "./schema";
export {
  OrganizationSchema,
  MemberSchema,
  TeamSchema,
  ProjectSchema,
  FeatureSchema,
  TaskSchema,
  DocumentSchema,
  UserSchema,
  BUILTIN_SCHEMAS,
  getBuiltinSchema,
  listBuiltinSchemas,
} from "./schemas";
export * from "../types";
