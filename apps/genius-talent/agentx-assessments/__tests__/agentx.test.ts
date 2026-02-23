import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import {
  isValidAgentxNote,
  loadEnvFile,
  parseMeta,
  buildJobs,
  stripCodeFences,
} from "../bin/agentx-lib";

describe("isValidAgentxNote", () => {
  const validNote = `---
kind: basic
slug: rust-basic
parent_meta: rust
---

# Rust Basic Questions

- **Question**: What is ownership in Rust?
  - **Expected Answer**: Ownership governs memory management.
`;

  it("accepts valid AgentX notes with YAML front matter and interview content", () => {
    expect(isValidAgentxNote(validNote)).toBe(true);
  });

  it("accepts notes with kind/slug/title and interview keywords", () => {
    const note = `---
kind: advanced
slug: db-advanced
parent_meta: database
---
# Database Advanced
- **Question**: Explain indexing strategies.
- Assessment criteria for technical skills.`;
    expect(isValidAgentxNote(note)).toBe(true);
  });

  it("accepts 'out of scope' refusal notes", () => {
    const refusal = `---
kind: basic
slug: out-of-scope
parent_meta: agentx
---
Request out of scope. AgentX generates only technical interview question notes for candidate assessment.`;
    expect(isValidAgentxNote(refusal)).toBe(true);
  });

  it("rejects empty or too-short content", () => {
    expect(isValidAgentxNote("")).toBe(false);
    expect(isValidAgentxNote("abc")).toBe(false);
    expect(isValidAgentxNote("   ")).toBe(false);
  });

  it("rejects casual Q&A responses", () => {
    const casual = "Sure! Here's how you can do that. I'll explain step by step.";
    expect(isValidAgentxNote(casual)).toBe(false);
  });

  it("rejects content with PHI/PII patterns", () => {
    const phi = `---
kind: basic
slug: test
---
**Question**: What is patient name John Doe's SSN?
PHI: medical record 12345`;
    expect(isValidAgentxNote(phi)).toBe(false);
  });

  it("rejects content without interview-like keywords", () => {
    // kind: meta and body avoid interview keywords (basic/slug in YAML must not match)
    const nonInterview = `---
kind: meta
slug: recipe-spec
---
This is a recipe for chocolate cake. Mix flour and sugar.`;
    expect(isValidAgentxNote(nonInterview)).toBe(false);
  });
});

describe("stripCodeFences", () => {
  it("strips yaml code fences", () => {
    const wrapped = "```yaml\nkind: basic\nslug: test\n---\n# Body\n```";
    expect(stripCodeFences(wrapped)).toBe("kind: basic\nslug: test\n---\n# Body");
  });

  it("strips yml code fences", () => {
    const wrapped = "```yml\nkind: basic\n```";
    expect(stripCodeFences(wrapped)).toBe("kind: basic");
  });

  it("returns content unchanged if no leading code fence", () => {
    const plain = "kind: basic\nslug: test";
    expect(stripCodeFences(plain)).toBe(plain);
  });
});

describe("parseMeta", () => {
  it("strips shebang and extracts front matter", () => {
    const meta = `#!/usr/bin/env bash
exec something
---
slug: rust
generate:
  basic: rust-basic.agentx.md
  advanced: rust-advanced.agentx.md
---
# Rust meta body`;
    const parsed = parseMeta(meta);
    expect(parsed.slug).toBe("rust");
    expect(parsed.basicOut).toBe("rust-basic.agentx.md");
    expect(parsed.advancedOut).toBe("rust-advanced.agentx.md");
    expect(parsed.metaBody).toContain("# Rust meta body");
  });

  it("extracts instructions block", () => {
    const meta = `---
slug: db
instructions: |
  Generate basic SQL questions.
  Use CRUD and schema.
---
# Body`;
    const parsed = parseMeta(meta);
    expect(parsed.instructions).toContain("Generate basic SQL questions");
    expect(parsed.instructions).toContain("Use CRUD and schema");
  });

  it("extracts domain list from generate.domains", () => {
    const meta = `---
slug: rust
generate:
  basic: rust-basic.agentx.md
  domains:
    - slug: healthcare
      file: rust.healthcare.domain.agentx.md
    - slug: financial
      file: rust.financial.domain.agentx.md
---
# Body`;
    const parsed = parseMeta(meta);
    expect(parsed.domains).toHaveLength(2);
    expect(parsed.domains[0]).toEqual({ slug: "healthcare", file: "rust.healthcare.domain.agentx.md" });
    expect(parsed.domains[1]).toEqual({ slug: "financial", file: "rust.financial.domain.agentx.md" });
  });

  it("defaults slug to agentx when missing", () => {
    const meta = `---
generate:
  basic: x-basic.agentx.md
---
# Body`;
    const parsed = parseMeta(meta);
    expect(parsed.slug).toBe("agentx");
  });
});

describe("buildJobs", () => {
  const base = {
    slug: "rust",
    basicOut: "rust-basic.agentx.md",
    advancedOut: "rust-advanced.agentx.md",
    domains: [
      { slug: "healthcare", file: "rust.healthcare.domain.agentx.md" },
      { slug: "financial", file: "rust.financial.domain.agentx.md" },
    ],
  };

  it("builds mid-advanced job when no level flags", () => {
    const jobs = buildJobs({
      ...base,
      basic: false,
      advanced: false,
      domainSlugs: [],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].level).toBe("mid-advanced");
    expect(jobs[0].outPath).toBe("rust-mid-advanced.agentx.md");
  });

  it("builds basic job when --basic", () => {
    const jobs = buildJobs({
      ...base,
      basic: true,
      advanced: false,
      domainSlugs: [],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].level).toBe("basic");
    expect(jobs[0].outPath).toBe("rust-basic.agentx.md");
  });

  it("builds advanced job when --advanced", () => {
    const jobs = buildJobs({
      ...base,
      basic: false,
      advanced: true,
      domainSlugs: [],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].level).toBe("advanced");
    expect(jobs[0].outPath).toBe("rust-advanced.agentx.md");
  });

  it("builds both basic and advanced when both flags", () => {
    const jobs = buildJobs({
      ...base,
      basic: true,
      advanced: true,
      domainSlugs: [],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(2);
    expect(jobs[0].level).toBe("basic");
    expect(jobs[1].level).toBe("advanced");
  });

  it("builds domain jobs when --domain slug", () => {
    const jobs = buildJobs({
      ...base,
      basic: false,
      advanced: false,
      domainSlugs: ["healthcare"],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].level).toBe("domain");
    expect(jobs[0].outPath).toBe("rust.healthcare.domain.agentx.md");
  });

  it("builds all domain jobs when --domain __all__", () => {
    const jobs = buildJobs({
      ...base,
      basic: false,
      advanced: false,
      domainSlugs: ["__all__"],
      outPathOverride: "",
    });
    expect(jobs).toHaveLength(2);
    expect(jobs[0].outPath).toBe("rust.healthcare.domain.agentx.md");
    expect(jobs[1].outPath).toBe("rust.financial.domain.agentx.md");
  });

  it("applies --out override for single job", () => {
    const jobs = buildJobs({
      ...base,
      basic: true,
      advanced: false,
      domainSlugs: [],
      outPathOverride: "custom.agentx.md",
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].outPath).toBe("custom.agentx.md");
  });
});

describe("loadEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "agentx-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  it("loads KEY=VALUE pairs into target env", () => {
    writeFileSync(join(tmpDir, ".env"), "FOO=bar\nBAZ=qux\n");
    const env: Record<string, string | undefined> = {};
    const ok = loadEnvFile(tmpDir, env);
    expect(ok).toBe(true);
    expect(env.FOO).toBe("bar");
    expect(env.BAZ).toBe("qux");
  });

  it("strips BOM from file", () => {
    writeFileSync(join(tmpDir, ".env"), "\uFEFFKEY=value\n", "utf-8");
    const env: Record<string, string | undefined> = {};
    loadEnvFile(tmpDir, env);
    expect(env.KEY).toBe("value");
  });

  it("handles export prefix", () => {
    writeFileSync(join(tmpDir, ".env"), "export EXPORTED=yes\n");
    const env: Record<string, string | undefined> = {};
    loadEnvFile(tmpDir, env);
    expect(env.EXPORTED).toBe("yes");
  });

  it("unquotes double-quoted values", () => {
    writeFileSync(join(tmpDir, ".env"), 'QUOTED="hello world"\n');
    const env: Record<string, string | undefined> = {};
    loadEnvFile(tmpDir, env);
    expect(env.QUOTED).toBe("hello world");
  });

  it("returns false when .env does not exist", () => {
    const env: Record<string, string | undefined> = {};
    const ok = loadEnvFile(tmpDir, env);
    expect(ok).toBe(false);
  });

  it("does not overwrite existing non-empty env vars", () => {
    writeFileSync(join(tmpDir, ".env"), "EXISTING=newvalue\n");
    const env: Record<string, string | undefined> = { EXISTING: "original" };
    loadEnvFile(tmpDir, env);
    expect(env.EXISTING).toBe("original");
  });
});

describe("agentx-gen (integration)", () => {
  const agentxDir = join(__dirname, ".."); // agentx-assessments
  const agentxGen = join(agentxDir, "bin", "agentx-gen");

  it("exits with code 1 when meta file does not exist", async () => {
    const code = await new Promise<number>((resolve) => {
      const proc = spawn("bash", [agentxGen, "nonexistent.agentx.md"], {
        cwd: agentxDir,
        stdio: "pipe",
      });
      proc.on("close", resolve);
    });
    expect(code).toBe(1);
  });

  it("exits with code 1 when agentx-run gets invalid meta path", async () => {
    const code = await new Promise<number>((resolve) => {
      const proc = spawn("bun", ["run", "bin/agentx-run.ts", "--meta", "/nonexistent/meta.agentx.md"], {
        cwd: agentxDir,
        stdio: "pipe",
      });
      proc.on("close", resolve);
    });
    expect(code).toBe(1);
  });
});
