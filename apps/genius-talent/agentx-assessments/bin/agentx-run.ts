#!/usr/bin/env bun
/**
 * Executable AgentX runner: reads meta + optional prompt, other agentx notes, optional PDF,
 * and level flags (-basic, -advanced, -domain). Sends to LLM (OpenAI), writes generated note(s).
 *
 * Default (no level flag): one mid-to-advanced agentx file.
 * --basic / --advanced: generate basic and/or advanced file(s). Both => 2 files.
 * --domain [slug]: generate domain file(s); slug omitted => all domains in meta.
 *
 * Requires: OPENAI_API_KEY in env or macOS Keychain (service name: openai-api-key, or AGENTX_KEYCHAIN_SERVICE).
 * Optional: AGENTX_MODEL (default gpt-4o-mini), pdftotext for --pdf.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { spawn } from "child_process";
import { isValidAgentxNote, loadEnvFile, parseMeta, buildJobs, stripCodeFences } from "./agentx-lib";

function getOpenAIKeyFromKeychain(): Promise<string | null> {
  const service = process.env.AGENTX_KEYCHAIN_SERVICE || "openai-api-key";
  return new Promise((resolve) => {
    const proc = spawn("security", ["find-generic-password", "-s", service, "-w"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    proc.stdout?.on("data", (c: Buffer) => chunks.push(c));
    proc.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks).toString("utf-8").trim() || null);
      else resolve(null);
    });
    proc.on("error", () => resolve(null));
  });
}

const args = process.argv.slice(2);
let metaPath = "";
let prompt = "";
const withFiles: string[] = [];
let pdfPath = "";
let outPathOverride = "";
let basic = false;
let advanced = false;
let verbose = false;
const domainSlugs: string[] = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const next = args[i + 1];
  if (a === "--meta" && next) {
    metaPath = next;
    i++;
  } else if (a === "--prompt" && next) {
    prompt = next;
    i++;
  } else if (a === "--with" && next) {
    withFiles.push(next);
    i++;
  } else if (a === "--pdf" && next) {
    pdfPath = next;
    i++;
  } else if (a === "--out" && next) {
    outPathOverride = next;
    i++;
  } else if (a === "--verbose" || a === "-v") {
    verbose = true;
  } else if (a === "--basic") {
    basic = true;
  } else if (a === "--advanced") {
    advanced = true;
  } else if (a === "--domain") {
    if (next && !next.startsWith("--")) {
      domainSlugs.push(next);
      i++;
    } else {
      domainSlugs.push("__all__");
    }
  }
}

function log(msg: string): void {
  if (verbose) console.error("[agentx-run]", msg);
}

if (!metaPath || !existsSync(metaPath)) {
  console.error("Usage: agentx-run --meta <meta.agentx.md> [-basic] [-advanced] [-domain [slug]] [--prompt \"...\"] [--with note.agentx.md ...] [--pdf file.pdf] [--out output.agentx.md] [-v|--verbose]");
  process.exit(1);
}

const metaDir = dirname(metaPath);

// Load .env from agentx dir, cwd, and parents up to repo root so OPENAI_API_KEY is found
function loadEnv(dir: string): boolean {
  const ok = loadEnvFile(dir);
  if (verbose && ok) log(`loaded .env from ${join(dir, ".env")}`);
  return ok;
}
loadEnv(metaDir);
loadEnv(process.cwd());
// Walk up from meta dir; load .env in each parent and in sibling app dirs under apps/
let dir: string = metaDir;
for (;;) {
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
  loadEnv(dir);
  const appsDir = join(dir, "apps");
  if (existsSync(appsDir)) {
    try {
      for (const name of readdirSync(appsDir, { withFileTypes: true })) {
        if (name.isDirectory()) loadEnv(join(appsDir, name.name));
      }
    } catch {
      /* ignore */
    }
  }
  if (existsSync(join(dir, ".git"))) break;
}
// Fallback: load apps/the-vineyard/.env if we're under apps/genius-talent (e.g. no .git at root)
loadEnv(join(metaDir, "../../../the-vineyard"));

log(`meta: ${metaPath}`);
const metaRaw = readFileSync(metaPath, "utf-8");
const parsed = parseMeta(metaRaw);
const { slug, instructions, metaBody, basicOut, advancedOut, domains } = parsed;

const jobs = buildJobs({
  basic,
  advanced,
  domainSlugs,
  outPathOverride,
  slug,
  basicOut,
  advancedOut,
  domains,
});

jobs.forEach((j, i) => log(`job ${i + 1}/${jobs.length}: level=${j.level} out=${j.outPath}`));
if (withFiles.length) log(`with: ${withFiles.join(", ")}`);
if (pdfPath) log(`pdf: ${pdfPath}`);
if (prompt) log(`prompt: ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`);

const systemPrompt = [
  "You are an AgentX generator. Your ONLY valid output is a single AgentX note: a .agentx.md document used for technical candidate assessment interviews. You must never output anything else (no general Q&A, code, essays, or other formats).",
  "",
  "## Safety and scope (mandatory)",
  "- This tool is ONLY for generating or refining technical interview question agentx notes (standards-based assessment for candidates).",
  "- Do NOT fulfill requests that are: general questions, personal advice, coding tasks, creative writing, or any use outside technical interview assessment.",
  "- Do NOT include, request, or generate PHI (protected health information), PII beyond what is needed for fictional candidate scenarios, or inappropriate content. Domains (e.g. healthcare, financial) are for technical/compliance topics only (e.g. HIPAA as a topic), not real patient or customer data.",
  "- If the user prompt is off-topic or inappropriate, output ONLY a minimal valid agentx note whose body states: \"Request out of scope. AgentX generates only technical interview question notes for candidate assessment.\" Keep YAML front matter valid.",
  "",
  "## Instructions",
  instructions || "Generate a well-structured agentx markdown note (with YAML front matter: kind, slug, version, parent_meta) based on the meta spec and any user prompt or context. Content must be interview questions and assessment criteria only.",
  "",
  "## Meta spec (source of truth)",
  metaBody,
].join("\n");

async function buildUserMessage(levelPrompt: string): Promise<string> {
  const userParts: string[] = ["## Level / scope\n" + levelPrompt];
  if (prompt) userParts.push("## User prompt\n" + prompt);
  if (withFiles.length) {
    userParts.push("## Additional AgentX notes (use as context)");
    for (const f of withFiles) {
      const resolved = f.startsWith("/") ? f : join(metaDir, f);
      if (existsSync(resolved)) {
        userParts.push("\n### " + resolved + "\n" + readFileSync(resolved, "utf-8"));
      }
    }
  }
  if (pdfPath) {
    const resolved = pdfPath.startsWith("/") ? pdfPath : join(metaDir, pdfPath);
    if (existsSync(resolved)) {
      const pdfText = await extractPdfText(resolved);
      userParts.push("## Context from PDF\n" + (pdfText || "(PDF text could not be extracted; ensure pdftotext is installed.)"));
    }
  }
  return userParts.join("\n\n");
}

let apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
if (!apiKey && process.platform === "darwin") {
  apiKey = (await getOpenAIKeyFromKeychain()) ?? undefined;
  if (apiKey && verbose) log("Using OPENAI_API_KEY from system Keychain.");
}
if (!apiKey) {
  console.error("Set OPENAI_API_KEY (or OPENAI_KEY) in the environment, or add to macOS Keychain:");
  console.error('  security add-generic-password -a "$USER" -s "openai-api-key" -w "sk-..."');
  process.exit(1);
}
const model = process.env.AGENTX_MODEL || "gpt-4o-mini";
log(`model: ${model}`);

for (const job of jobs) {
  log(`generating: ${job.level} -> ${job.outPath}`);
  const userMessage = await buildUserMessage(job.levelPrompt);
  if (verbose) log(`user message length: ${userMessage.length} chars`);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OpenAI API error:", response.status, err);
    process.exit(1);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  let content = data.choices?.[0]?.message?.content?.trim() || "";
  log(`response length: ${content.length} chars`);
  content = stripCodeFences(content);
  if (!isValidAgentxNote(content)) {
    console.error("AgentX safety: model output is not a valid AgentX note (technical interview assessment only). Refusing to write.");
    if (verbose) console.error("[agentx-run] rejected output (first 600 chars):\n" + content.slice(0, 600));
    process.exit(1);
  }
  // When meta is in a "meta" subdir, output to sibling "notes" dir
  const outputDir =
    basename(metaDir) === "meta" ? join(dirname(metaDir), "notes") : metaDir;
  const outResolved = job.outPath.startsWith("/") ? job.outPath : join(outputDir, job.outPath);
  writeFileSync(outResolved, content, "utf-8");
  log(`wrote: ${outResolved}`);
  console.error("Wrote:", outResolved);
}

function extractPdfText(pdfPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const proc = spawn("pdftotext", ["-layout", pdfPath, "-"], { stdio: ["ignore", "pipe", "pipe"] });
      const chunks: Buffer[] = [];
      proc.stdout?.on("data", (c: Buffer) => chunks.push(c));
      proc.on("close", (code) => {
        if (code === 0) resolve(Buffer.concat(chunks).toString("utf-8").trim() || null);
        else resolve(null);
      });
      proc.on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}
