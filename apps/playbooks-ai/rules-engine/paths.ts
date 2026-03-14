/**
 * Path resolution for rules-engine and playbookx.
 * APPS_ROOT = apps/ (parent of playbook-ai, wound-ai, etc.)
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = typeof import.meta.dir !== "undefined"
  ? import.meta.dir
  : dirname(fileURLToPath(import.meta.url));
// paths.ts lives in rules-engine/; APPS_ROOT = apps/
const RULES_ENGINE_DIR = __dirname;
export const APPS_ROOT = join(RULES_ENGINE_DIR, "../../");
