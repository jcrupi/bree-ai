/**
 * AgentX library - testable pure functions and helpers.
 * Used by agentx-run.ts; exported for unit tests.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

/** Safety: only allow output that looks like an AgentX note (YAML front matter + interview/assessment content). */
export function isValidAgentxNote(content: string): boolean {
  if (!content || content.length < 40) return false;
  const c = content.trim();
  const hasFrontMatter =
    (c.startsWith("---") && c.includes("\n---")) ||
    (/(^|\n)\s*(kind|slug|parent_meta|title):/m.test(c) && c.includes("---"));
  const hasAgentxStructure =
    /(^|\n)\s*(kind|slug|parent_meta|title):/m.test(c) ||
    (hasFrontMatter && /#+\s+.+/m.test(c));
  const looksLikeInterviewOrRefusal =
    /interview|question|assessment|criteria|skill|technical|schema|CRUD|API|component|out of scope|candidate/i.test(c) ||
    /\*\*Q\*\*|\*\*Question\*\*|#\s+\w|explain|describe|how would you|what is|tell me about|ownership|rust|basic|advanced/i.test(c);
  const notClearlyAbuse =
    !/^(Sure!|Here'?s|Okay,|I'll|Certainly)/im.test(c) &&
    !/\b(patient name|SSN|medical record|PHI:|PII:)\b/i.test(c);
  return hasFrontMatter && hasAgentxStructure && looksLikeInterviewOrRefusal && notClearlyAbuse;
}

/** Load .env from a directory into target env. Returns true if any vars were loaded. */
export function loadEnvFile(
  dir: string,
  targetEnv: NodeJS.ProcessEnv = process.env,
  _readFile: (p: string, enc: BufferEncoding) => string = readFileSync,
  _exists: (p: string) => boolean = existsSync
): boolean {
  const path = join(dir, ".env");
  if (!_exists(path)) return false;
  try {
    let raw = _readFile(path, "utf-8");
    raw = raw.replace(/^\uFEFF/, ""); // BOM
    let loaded = 0;
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1).replace(/\\n/g, "\n");
      const existing = targetEnv[key];
      if (existing === undefined || (typeof existing === "string" && existing.trim() === "")) {
        targetEnv[key] = val;
        loaded++;
      }
    }
    return loaded > 0;
  } catch {
    return false;
  }
}

export interface ParsedMeta {
  slug: string;
  instructions: string;
  metaBody: string;
  basicOut: string;
  advancedOut: string;
  domains: { slug: string; file: string }[];
}

/** Strip shebang and extract YAML front matter + body from meta raw content. */
export function parseMeta(metaRaw: string): ParsedMeta {
  let raw = metaRaw;
  if (!raw.trimStart().startsWith("---")) {
    const idx = raw.indexOf("\n---");
    if (idx !== -1) raw = raw.slice(idx + 1);
    else if (raw.startsWith("#!")) raw = raw.replace(/^[^\n]+\n/, "");
  }
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const frontMatter = fmMatch?.[1] ?? "";
  const metaBody = (fmMatch?.[2] ?? raw).trim();

  const instructionsMatch = frontMatter.match(/instructions:\s*\|\s*\n([\s\S]*?)(?=\n---|\n\w+:\s|$)/);
  const instructions = instructionsMatch?.[1]
    ? instructionsMatch[1].replace(/^\s+/gm, "").trim()
    : "";

  const slugMatch = frontMatter.match(/\bslug:\s*(\S+)/);
  const slug = (slugMatch?.[1] ?? "agentx").replace(/^["']|["']$/g, "");

  const basicOutMatch = frontMatter.match(/generate:\s*\n\s*basic:\s*(\S+)/);
  const advancedOutMatch = frontMatter.match(/generate:\s*\n\s*advanced:\s*(\S+)/);
  const basicOut = basicOutMatch?.[1] ?? `${slug}-basic.agentx.md`;
  const advancedOut = advancedOutMatch?.[1] ?? `${slug}-advanced.agentx.md`;

  const domains: { slug: string; file: string }[] = [];
  const domainRe = /-\s*slug:\s*(\S+)\s*\n\s*file:\s*(\S+)/g;
  let dm: RegExpExecArray | null;
  while ((dm = domainRe.exec(frontMatter)) !== null) {
    const dSlug = dm[1];
    const dFile = dm[2];
    if (dSlug != null && dFile != null) domains.push({ slug: dSlug, file: dFile });
  }

  return { slug, instructions, metaBody, basicOut, advancedOut, domains };
}

export interface Job {
  level: string;
  levelPrompt: string;
  outPath: string;
}

export interface BuildJobsOptions {
  basic: boolean;
  advanced: boolean;
  domainSlugs: string[];
  outPathOverride: string;
  slug: string;
  basicOut: string;
  advancedOut: string;
  domains: { slug: string; file: string }[];
}

/** Build job list from flags and parsed meta. */
export function buildJobs(opts: BuildJobsOptions): Job[] {
  const { basic, advanced, domainSlugs, outPathOverride, slug, basicOut, advancedOut, domains } = opts;
  const jobs: Job[] = [];
  const hasLevelFlag = basic || advanced || domainSlugs.length > 0;

  if (!hasLevelFlag) {
    jobs.push({
      level: "mid-advanced",
      levelPrompt: "Generate a single agentx note that combines mid-level and advanced interview questions (one file covering both).",
      outPath: outPathOverride || `${slug}-mid-advanced.agentx.md`,
    });
  } else {
    if (basic) {
      jobs.push({
        level: "basic",
        levelPrompt: `Generate the BASIC (junior/mid) interview question agentx file for this meta. Use the meta's instructions and body to determine topics (e.g. for database: SQL, CRUD; for Rust: ownership, borrowing, traits; for React: hooks, state).`,
        outPath: outPathOverride || basicOut,
      });
    }
    if (advanced) {
      jobs.push({
        level: "advanced",
        levelPrompt: `Generate the ADVANCED (senior+) interview question agentx file for this meta. Use the meta's instructions and body to determine topics (e.g. for database: indexing, transactions; for Rust: async, concurrency; for React: performance, architecture).`,
        outPath: outPathOverride || advancedOut,
      });
    }
    if (domainSlugs.length > 0 && domains.length > 0) {
      const toGen = domainSlugs.includes("__all__") ? domains : domains.filter((d) => domainSlugs.includes(d.slug));
      for (const d of toGen) {
        jobs.push({
          level: "domain",
          levelPrompt: `Generate the DOMAIN-specific agentx file for the domain: ${d.slug}. Apply the meta skills to this domain (e.g. healthcare: HIPAA, PHI; financial: audit trails, regulatory).`,
          outPath: d.file,
        });
      }
    }
    const singleJob = jobs.length === 1 ? jobs[0] : null;
    if (outPathOverride && singleJob) {
      singleJob.outPath = outPathOverride;
    }
  }
  return jobs;
}

/** Strip markdown code fences from LLM output before validation. */
export function stripCodeFences(content: string): string {
  if (!content.startsWith("```")) return content;
  return content.replace(/^```(?:yaml|yml)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
}
