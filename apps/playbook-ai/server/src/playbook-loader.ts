/**
 * Load latest playbook and algos agentx notes from specialty apps.
 * Resolves versioned files (*-vN.md) and returns version + created timestamp.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync, statSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const APPS_ROOT = join(import.meta.dir, "../../../");

export type DocMeta = {
  content: string;
  filename: string;
  version: number;
  created_at: string; // ISO 8601
};

const VERSION_PATTERN = /-v(\d+)\.(?:md|agentx\.md)$/;

function parseVersionFromFilename(name: string): number | null {
  const m = name.match(VERSION_PATTERN);
  return m ? parseInt(m[1], 10) : null;
}

function findLatestVersionedFile(dir: string, prefix: string): { path: string; version: number } | null {
  if (!existsSync(dir)) return null;
  const entries = readdirSync(dir);
  let best: { path: string; version: number } | null = null;
  for (const e of entries) {
    if (!e.startsWith(prefix) || !e.endsWith(".md")) continue;
    const v = parseVersionFromFilename(e);
    if (v != null && (best == null || v > best.version)) {
      best = { path: join(dir, e), version: v };
    }
  }
  return best;
}

function getCreatedAt(path: string, content: string): string {
  // Prefer frontmatter agentx.created_at
  const fmMatch = content.match(/^---\s*\n[\s\S]*?agentx:[\s\S]*?created_at:\s*["']?([^"'\s]+)["']?/m);
  if (fmMatch) return fmMatch[1];
  // Fallback to file mtime
  try {
    const stat = statSync(path);
    return stat.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function getVersionFromContent(content: string): number {
  const fmMatch = content.match(/^---\s*\n[\s\S]*?agentx:[\s\S]*?version:\s*(\d+)/m);
  return fmMatch ? parseInt(fmMatch[1], 10) : 1;
}

export function loadPlaybook(specialtyApp: string, baseName: string, appRoot?: string): DocMeta {
  // If appRoot provided (e.g. 'ai-playbooks/agentx/apps/wound-ai'), use it directly
  const playbookDir = appRoot
    ? join(APPS_ROOT, appRoot, "playbook")
    : join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const prefix = baseName.replace(".playbook.agentx", "") + ".playbook.agentx";
  const found = findLatestVersionedFile(playbookDir, prefix);
  if (!found) {
    return { content: "", filename: "", version: 0, created_at: "" };
  }
  const content = readFileSync(found.path, "utf-8");
  const created_at = getCreatedAt(found.path, content);
  const version = getVersionFromContent(content) || found.version;
  return {
    content,
    filename: found.path.split("/").pop() ?? "",
    version,
    created_at,
  };
}

export function loadAlgos(specialtyApp: string, baseName: string, appRoot?: string): DocMeta {
  const playbookDir = appRoot
    ? join(APPS_ROOT, appRoot, "playbook")
    : join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const base = baseName.replace(".algos.agentx", "").replace(".algo.agentx", "");
  let found = findLatestVersionedFile(playbookDir, base + ".algos.agentx");
  if (!found) {
    found = findLatestVersionedFile(playbookDir, base + ".algo.agentx");
  }
  if (!found) {
    return { content: "", filename: "", version: 0, created_at: "" };
  }
  const content = readFileSync(found.path, "utf-8");
  const created_at = getCreatedAt(found.path, content);
  const version = getVersionFromContent(content) || found.version;
  return {
    content,
    filename: found.path.split("/").pop() ?? "",
    version,
    created_at,
  };
}

export { SPECIALTY_CONFIG, CATALOG_CONFIG } from "../../shared/specialty-config.js";

/** Analysis files: testing team feedback. Versioned: {app}.analysis.{type}.agentx-vN.md */
export type AnalysisType = "playbook" | "algos";

const ANALYSIS_PREFIX = (baseName: string, type: AnalysisType) =>
  `${baseName}.analysis.${type}.agentx`;

function findLatestAnalysisFile(specialtyApp: string, baseName: string, type: AnalysisType): { path: string; version: number } | null {
  const playbookDir = join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const prefix = ANALYSIS_PREFIX(baseName, type);
  let found = findLatestVersionedFile(playbookDir, prefix);
  if (!found && type === "algos") {
    found = findLatestVersionedFile(playbookDir, `${baseName}.analysis.algo.agentx`);
  }
  return found;
}

export function loadAnalysis(
  specialtyApp: string,
  baseName: string,
  type: AnalysisType
): { content: string; filename: string; version: number } {
  const playbookDir = join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const found = findLatestAnalysisFile(specialtyApp, baseName, type);
  if (found) {
    const content = readFileSync(found.path, "utf-8");
    return {
      content,
      filename: found.path.split("/").pop() ?? "",
      version: found.version,
    };
  }
  const legacyPath = join(playbookDir, `${ANALYSIS_PREFIX(baseName, type)}.md`);
  if (existsSync(legacyPath)) {
    const content = readFileSync(legacyPath, "utf-8");
    return { content, filename: legacyPath.split("/").pop() ?? "", version: 1 };
  }
  return { content: "", filename: `${ANALYSIS_PREFIX(baseName, type)}-v1.md`, version: 1 };
}

export function saveAnalysis(specialtyApp: string, baseName: string, type: AnalysisType, content: string): void {
  const playbookDir = join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const found = findLatestAnalysisFile(specialtyApp, baseName, type);
  const version = found ? found.version : 1;
  const filename = `${ANALYSIS_PREFIX(baseName, type)}-v${version}.md`;
  const filePath = join(playbookDir, filename);
  if (!existsSync(playbookDir)) {
    mkdirSync(playbookDir, { recursive: true });
  }
  writeFileSync(filePath, content, "utf-8");
}

/** Archive current analysis as -implemented and create new v{N+1}. Returns new version. */
export function archiveAndBumpAnalysis(
  specialtyApp: string,
  baseName: string,
  type: AnalysisType,
  content: string
): { archivedFilename: string; newVersion: number } {
  const playbookDir = join(APPS_ROOT, specialtyApp, "agentx", "playbook");
  const archivesDir = join(playbookDir, "archives");
  const found = findLatestAnalysisFile(specialtyApp, baseName, type);
  const legacyPath = join(playbookDir, `${ANALYSIS_PREFIX(baseName, type)}.md`);
  const currentVersion = found ? found.version : 1;
  const currentPath = found ? found.path : (existsSync(legacyPath) ? legacyPath : null);

  if (!existsSync(archivesDir)) {
    mkdirSync(archivesDir, { recursive: true });
  }

  const archivedFilename = `${ANALYSIS_PREFIX(baseName, type)}-v${currentVersion}-implemented.md`;
  const archivedPath = join(archivesDir, archivedFilename);
  writeFileSync(archivedPath, content, "utf-8");

  const newVersion = currentVersion + 1;
  const newFilename = `${ANALYSIS_PREFIX(baseName, type)}-v${newVersion}.md`;
  const newPath = join(playbookDir, newFilename);
  const timestamp = new Date().toISOString();
  const template = `---
agentx:
  version: ${newVersion}
  created_at: "${timestamp}"
  type: analysis
  filename: ${newFilename}
---

# ${baseName} — ${type === "playbook" ? "Playbook" : "Algos"} Analysis v${newVersion}

> Testing team feedback. Add notes, issues, suggestions.

`;
  writeFileSync(newPath, template, "utf-8");

  if (currentPath && existsSync(currentPath)) {
    unlinkSync(currentPath);
  }

  return { archivedFilename, newVersion };
}

/** Load all design agentx notes from apps/ */
export function loadDesigns(): { app: string; path: string; content: string }[] {
  const designs: { app: string; path: string; content: string }[] = [];
  if (!existsSync(APPS_ROOT)) return designs;

  const appDirs = readdirSync(APPS_ROOT);
  for (const app of appDirs) {
    const designDir = join(APPS_ROOT, app, "agentx", "design");
    if (!existsSync(designDir)) continue;

    const files = readdirSync(designDir);
    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      const filePath = join(designDir, f);
      try {
        const content = readFileSync(filePath, "utf-8");
        designs.push({ app, path: filePath, content });
      } catch {
        // skip unreadable files
      }
    }
  }

  designs.sort((a, b) => a.app.localeCompare(b.app) || a.path.localeCompare(b.path));
  return designs;
}

/** Language per specialty app: wound-ai = Python, rest = TypeScript */
const APP_LANGUAGE: Record<string, "Python" | "TypeScript"> = {
  "playbook-ai": "TypeScript",
  "habit-streaks": "TypeScript",
  "wound-ai": "Python",
  "enm-ai": "TypeScript",
  "derm-ai": "TypeScript",
  "pain-ai": "TypeScript",
  "urgent-ai": "TypeScript",
  "dme-ai": "TypeScript",
  "behavioral-health-ai": "TypeScript",
};

/** Load playbook-to-code mapping for a specialty. Wound-ai has full mapping; others use shared pattern. */
export function loadCodeMapping(specialtyApp: string): {
  content: string;
  filename: string;
  language: "Python" | "TypeScript";
} {
  const appDir = join(APPS_ROOT, specialtyApp);
  const agentxDir = join(appDir, "agentx");
  const language = APP_LANGUAGE[specialtyApp] ?? "TypeScript";

  const candidates = [
    join(agentxDir, "playbook-to-code-mapping.agentx.md"),
    join(agentxDir, "playbook-to-implementation.agentx.md"),
    join(agentxDir, "playbook-to-code-mapping.md"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      const content = readFileSync(path, "utf-8");
      return {
        content,
        filename: path.split("/").pop() ?? "",
        language,
      };
    }
  }

  // Fallback: shared pattern (wound-ai has it)
  const patternPath = join(APPS_ROOT, "wound-ai", "agentx", "pattern-driven-playbook-impl.agentx.md");
  if (existsSync(patternPath)) {
    const content = readFileSync(patternPath, "utf-8");
    const header = `> **Note:** ${specialtyApp} uses **${language}**. This is the shared pattern. ${specialtyApp === "wound-ai" ? "" : "Wound-ai has the canonical playbook-to-code-mapping."}\n\n---\n\n`;
    return {
      content: header + content,
      filename: "pattern-driven-playbook-impl.agentx.md (shared)",
      language,
    };
  }

  return {
    content: `# Playbook → Code Mapping — ${specialtyApp}\n\nNo mapping document found for this specialty.\n\n**Language:** ${language}\n\n**Pattern:** See wound-ai for the reference implementation (Python). TypeScript specialties follow the same structure.`,
    filename: "",
    language,
  };
}
