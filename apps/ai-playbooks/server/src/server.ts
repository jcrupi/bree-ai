import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { join } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import {
  loadPlaybook,
  loadAlgos,
  loadAnalysis,
  saveAnalysis,
  archiveAndBumpAnalysis,
  loadDesigns,
  loadCodeMapping,
  SPECIALTY_CONFIG,
  type AnalysisType,
} from "./playbook-loader";

const ROOT_SERVER = join(import.meta.dir, "../..");
const AGENTX_DIR = join(ROOT_SERVER, "agentx");
const PLAYBOOK_DIR = join(AGENTX_DIR, "playbook");

function loadMetaPlaybook(): string {
  const path = join(AGENTX_DIR, "meta-playbook.agentx.md");
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

function loadMetaAlgos(): string {
  const path = join(AGENTX_DIR, "meta-algos.agentx.md");
  if (!existsSync(path)) return "";
  return readFileSync(path, "utf-8");
}

function savePlaybookAndAlgos(domain: string, playbookContent: string, algosContent: string): void {
  if (!existsSync(PLAYBOOK_DIR)) mkdirSync(PLAYBOOK_DIR, { recursive: true });
  const slug = domain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "domain";
  const playbookPath = join(PLAYBOOK_DIR, `${slug}.playbook.agentx-v1.md`);
  const algosPath = join(PLAYBOOK_DIR, `${slug}.algos.agentx-v1.md`);
  writeFileSync(playbookPath, playbookContent, "utf-8");
  writeFileSync(algosPath, algosContent, "utf-8");
}

async function callOpenAI(system: string, user: string, maxTokens = 2048): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

const ROOT = join(import.meta.dir, "../..");
const DIST = join(ROOT, "client/dist");

const app = new Elysia()
  .use(cors())
  .get("/", async ({ request }) => {
    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      const distIndex = join(DIST, "index.html");
      return (await Bun.file(distIndex).exists())
        ? new Response(Bun.file(distIndex))
        : new Response(
            '<p>Playbook.ai — Run <code>bun run dev:client</code> then visit the client URL, or build first.</p>',
            { headers: { "Content-Type": "text/html" } }
          );
    }
    return { service: "Playbook.ai", version: "1.0.0", status: "running" };
  })
  .get("/health", () => ({ status: "healthy", service: "playbook-ai" }))
  .get("/api/specialties", () => ({
    specialties: SPECIALTY_CONFIG.map((s) => ({ id: s.id, name: s.name })),
  }))
  .get("/api/specialties/:specialty/flows", ({ params }) => {
    const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
    if (!spec) return { flows: [] };
    return { flows: spec.flows };
  })
  .get("/api/documents/:specialty/playbook", ({ params }) => {
    const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
    if (!spec) return { content: "", filename: "", version: 0, created_at: "" };
    const meta = loadPlaybook(spec.app, spec.baseName);
    return {
      content: meta.content,
      filename: meta.filename,
      version: meta.version,
      created_at: meta.created_at,
    };
  })
  .get("/api/documents/:specialty/algos", ({ params }) => {
    const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
    if (!spec) return { content: "", filename: "", version: 0, created_at: "" };
    const meta = loadAlgos(spec.app, spec.baseName);
    return {
      content: meta.content,
      filename: meta.filename,
      version: meta.version,
      created_at: meta.created_at,
    };
  })
  .get("/api/designs", () => {
    const designs = loadDesigns();
    return { designs };
  })
  .get("/api/documents/:specialty/code-mapping", ({ params }) => {
    const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
    if (!spec) return { content: "", filename: "", language: "TypeScript" };
    const meta = loadCodeMapping(spec.app);
    return {
      content: meta.content,
      filename: meta.filename,
      language: meta.language,
    };
  })
  .get("/api/documents/:specialty/analysis/:type", ({ params }) => {
    const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
    if (!spec) return { content: "", filename: "", version: 1 };
    const type = params.type as AnalysisType;
    if (type !== "playbook" && type !== "algos") return { content: "", filename: "", version: 1 };
    const meta = loadAnalysis(spec.app, spec.baseName, type);
    return { content: meta.content, filename: meta.filename, version: meta.version };
  })
  .post(
    "/api/documents/:specialty/analysis/:type",
    ({ params, body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
      if (!spec) throw new Error("Invalid specialty");
      const type = params.type as AnalysisType;
      if (type !== "playbook" && type !== "algos") throw new Error("Invalid analysis type");
      saveAnalysis(spec.app, spec.baseName, type, body.content ?? "");
      const meta = loadAnalysis(spec.app, spec.baseName, type);
      return { ok: true, filename: meta.filename, version: meta.version };
    },
    {
      body: t.Object({ content: t.String() }),
    }
  )
  .post(
    "/api/documents/:specialty/analysis/:type/dry-run",
    async ({ params, body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
      if (!spec) throw new Error("Invalid specialty");
      const type = params.type as AnalysisType;
      if (type !== "playbook" && type !== "algos") throw new Error("Invalid analysis type");

      const before = type === "playbook"
        ? loadPlaybook(spec.app, spec.baseName).content
        : loadAlgos(spec.app, spec.baseName).content;
      const analysisContent = body.analysis_content ?? "";

      if (!analysisContent.trim()) {
        return { before, after: before, message: "No analysis content to apply." };
      }

      const docType = type === "playbook" ? "playbook" : "algorithm";
      const system = `You are an expert medical coding specialist. Given the current ${docType} document and testing team analysis/feedback, produce the REVISED ${docType} document that would result from implementing all the feedback.

Rules:
- Output ONLY the revised document text. No preamble, no explanation.
- Preserve the document structure (markdown, headers, tables, code blocks).
- Apply the analysis feedback: fix errors, add missing content, clarify ambiguities, update rules.
- Keep the same format and style. Do not add meta-commentary.`;
      const user = `# Current ${docType}\n\n${before.slice(0, 45000)}\n\n---\n\n# Testing Team Analysis / Feedback\n\n${analysisContent.slice(0, 8000)}\n\n---\n\nProduce the revised ${docType} document:`;

      const after = await callOpenAI(system, user, 8192);
      return { before, after: after || before };
    },
    {
      body: t.Object({ analysis_content: t.String() }),
    }
  )
  .post(
    "/api/documents/:specialty/analysis/:type/archive-and-bump",
    ({ params, body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === params.specialty);
      if (!spec) throw new Error("Invalid specialty");
      const type = params.type as AnalysisType;
      if (type !== "playbook" && type !== "algos") throw new Error("Invalid analysis type");
      const result = archiveAndBumpAnalysis(spec.app, spec.baseName, type, body.content ?? "");
      return {
        ok: true,
        archivedFilename: result.archivedFilename,
        newVersion: result.newVersion,
      };
    },
    {
      body: t.Object({ content: t.String() }),
    }
  )
  .post(
    "/api/chat",
    async ({ body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === body.specialty);
      if (!spec) throw new Error("Invalid specialty");

      const playbook = loadPlaybook(spec.app, spec.baseName).content;
      const algos = loadAlgos(spec.app, spec.baseName).content;

      let doc: string;
      let docName: string;
      if (body.context === "playbook") {
        doc = playbook;
        docName = `${spec.name} Playbook`;
      } else if (body.context === "algos") {
        doc = algos;
        docName = `${spec.name} Algos`;
      } else {
        doc = `# Playbook\n\n${playbook}\n\n---\n\n# Algos\n\n${algos}`;
        docName = `${spec.name} Playbook and Algo`;
      }

      if (!doc.trim()) throw new Error("Document is empty");

      const system = `You are an expert medical coding assistant for specialty: ${spec.name}. Answer questions based ONLY on the following ${docName}. Be accurate, concise, and cite sections when relevant. If the document does not contain the answer, say so. Do not make up information.`;
      const user = `Document:\n\n${doc.slice(0, 50000)}\n\n---\n\nQuestion: ${body.question}`;

      const answer = await callOpenAI(system, user);
      return { answer, question: body.question };
    },
    {
      body: t.Object({
        specialty: t.String(),
        question: t.String(),
        context: t.Union([t.Literal("playbook"), t.Literal("algos"), t.Literal("both")]),
      }),
    }
  )
  .post(
    "/api/generate",
    async ({ body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === body.specialty);
      if (!spec) throw new Error("Invalid specialty");
      if (!body.input_text.trim()) throw new Error("Input text is required");

      const playbook = loadPlaybook(spec.app, spec.baseName).content;
      const algos = loadAlgos(spec.app, spec.baseName).content;

      const system = `You are an expert assistant for the ${spec.name} specialty. Use the Playbook and Algos below to analyze the user's input.

Your response MUST be valid JSON only — no markdown fences, no preamble:
{
  "summary": "2-3 sentence overall assessment",
  "evaluations": [
    {
      "ruleId": "TX.ID.001",
      "ruleName": "SSN/TIN format",
      "status": "PASS",
      "finding": "SSN 412-87-3301 is present and valid",
      "remediation": null
    }
  ],
  "narrative": "Full markdown analysis with rule citations..."
}

Status must be exactly: "PASS", "FAIL", or "INVESTIGATING"
- PASS: rule fully satisfied by the input
- FAIL: rule violated with clear evidence from the input
- INVESTIGATING: ambiguous, input insufficient, or cannot fully verify

For every rule in the Algos RuleCatalog flow array, produce one evaluation object.
Findings: 1 concise sentence. Remediation: null if PASS, else 1 sentence.`;

      const user = `# Playbook\n\n${playbook.slice(0, 25000)}\n\n---\n\n# Algos\n\n${algos.slice(0, 25000)}\n\n---\n\n# User Input\n\n${body.input_text}`;

      const raw = await callOpenAI(system, user, 4096);

      type RuleEval = {
        ruleId: string;
        ruleName: string;
        status: "PASS" | "FAIL" | "INVESTIGATING";
        finding: string;
        remediation: string | null;
      };
      let evaluations: RuleEval[] = [];
      let summary = "";
      let narrative = raw;

      try {
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/g, "").trim();
        const parsed = JSON.parse(cleaned) as { summary?: string; evaluations?: RuleEval[]; narrative?: string };
        summary = parsed.summary ?? "";
        evaluations = parsed.evaluations ?? [];
        narrative = parsed.narrative ?? raw;
      } catch {
        // AI didn't return valid JSON — graceful fallback, narrative view still works
        narrative = raw;
      }

      return {
        answer: narrative,
        summary,
        evaluations,
        input_preview: body.input_text.slice(0, 200) + (body.input_text.length > 200 ? "..." : ""),
      };
    },
    {
      body: t.Object({
        specialty: t.String(),
        input_text: t.String(),
      }),
    }
  )
  .post(
    "/api/chart-ai",
    async ({ body }) => {
      const spec = SPECIALTY_CONFIG.find((s) => s.id === body.specialty);
      if (!spec) throw new Error("Invalid specialty");
      if (spec.id !== "em") throw new Error("Chart AI is only available for E/M specialty");

      const playbook = loadPlaybook(spec.app, spec.baseName).content;
      const algos = loadAlgos(spec.app, spec.baseName).content;

      const codeInfo: Record<string, string> = {
        "99233": "Subsequent hospital care, High MDM, 40–54 min. Use MDM or time.",
        "99255": "Inpatient consultation, High MDM, 80–89 min. Use MDM or time.",
        "99223": "Initial hospital care, High MDM, 60–74 min.",
        "99285": "ED visit, High MDM. ED codes use MDM only, no time.",
        "99291": "Critical care, 30–74 min. Time-based only.",
        "99292": "Critical care, each add'l 30 min beyond 74.",
        "99242": "Office consultation, Straightforward, 20–29 min",
        "99243": "Office consultation, Low, 30–44 min",
        "99244": "Office consultation, Moderate, 45–59 min",
        "99245": "Office consultation, High, 55–64 min",
        "99252": "Inpatient consultation, Straightforward, 35–44 min",
        "99253": "Inpatient consultation, Low, 45–59 min",
        "99254": "Inpatient consultation, Moderate, 60–74 min",
      };

      const codeDesc = codeInfo[body.target_code] ?? body.target_code;

      if (body.action === "validate") {
        const system = `You are an expert E/M coding assistant. Use the Playbook and Algo below to VALIDATE whether the user's documentation supports billing the target code ${body.target_code} (${codeDesc}).

Return a structured response:
1. **Supports code?** Yes/No
2. **MDM:** Does documentation meet the required MDM level? (Problems, Data, Risk - two of three)
3. **Time:** If time-based, does documented time meet the requirement?
4. **Gaps:** What is missing or needs to be strengthened?
5. **Remediation:** Specific suggestions to improve documentation for billing ${body.target_code}`;
        const user = `# Playbook\n\n${playbook.slice(0, 35000)}\n\n---\n\n# Algos\n\n${algos.slice(0, 15000)}\n\n---\n\n# Target Code\n${body.target_code}: ${codeDesc}\n\n# User Documentation\n\n${body.documentation || "(empty)"}`;
        const answer = await callOpenAI(system, user, 3072);
        return { action: "validate", answer, target_code: body.target_code };
      }

      if (body.action === "write") {
        const system = `You are an expert E/M coding assistant. Use the Playbook and Algo below to DRAFT documentation that supports billing ${body.target_code} (${codeDesc}).

The user has provided a partial note or clinical scenario. Generate a complete, billable documentation that:
1. Meets the MDM requirements (Problems, Data, Risk - two of three at the required level)
2. OR meets the time requirement if time-based
3. Includes chief complaint, history, exam, assessment, plan
4. Is clinically appropriate and ready for the physician to review/sign

Return the drafted documentation as a block. Add a brief note at the end: "To support ${body.target_code}: [key elements documented]."`;
        const user = `# Playbook\n\n${playbook.slice(0, 35000)}\n\n---\n\n# Target Code\n${body.target_code}: ${codeDesc}\n\n# User Input (partial note or scenario)\n\n${body.documentation || "(Describe the encounter: chief complaint, key findings, plan)"}`;
        const answer = await callOpenAI(system, user, 4096);
        return { action: "write", answer, target_code: body.target_code };
      }

      throw new Error("Invalid action: use validate or write");
    },
    {
      body: t.Object({
        specialty: t.String(),
        target_code: t.String(),
        action: t.Union([t.Literal("validate"), t.Literal("write")]),
        documentation: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/api/builder/generate",
    async ({ body, set }) => {
      try {
        const metaPlaybook = loadMetaPlaybook();
        const metaAlgos = loadMetaAlgos();
        if (!metaPlaybook || !metaAlgos) {
          set.status = 400;
          return { error: "Meta schemas (meta-playbook.agentx.md, meta-algos.agentx.md) not found in agentx/" };
        }

        const system = `You are an expert at creating domain-specific playbooks and algos that conform to strict schemas.

You will receive:
1. Meta-Playbook schema — the canonical structure for playbook.agentx documents
2. Meta-Algos schema — the canonical structure for algos.agentx documents (includes RuleCatalog YAML, flow diagram, algorithm blocks)
3. Domain information from the user

Your task: Generate TWO complete markdown documents that STRICTLY conform to the meta schemas:
- {domain}.playbook.agentx-v1.md — full playbook with frontmatter, Overview, Domain, Entities, Rules, optional API Surface
- {domain}.algos.agentx-v1.md — full algos with frontmatter, Overview, Validation Rules, RuleCatalog YAML block, Validation Flow diagram, Algorithm Blocks per rule

CRITICAL for algos:
- Rule IDs MUST follow {PREFIX}.{CATEGORY}.{NUMBER} (e.g. DM.ENT.001, DM.VAL.010)
- Include exactly one RuleCatalog YAML block with flow array and rules object
- Include ASCII flow diagram with rule IDs in parentheses
- Each rule in flow must have a matching Algorithm block with Input/Output/Steps

Output format: Use EXACTLY these delimiters. No other text before or after.
<<<PLAYBOOK>>>
{full playbook markdown here}
<<<ALGOS>>>
{full algos markdown here}
<<<END>>>`;

      const user = `# Meta-Playbook Schema\n\n${metaPlaybook.slice(0, 15000)}\n\n---\n\n# Meta-Algos Schema\n\n${metaAlgos.slice(0, 15000)}\n\n---\n\n# Domain Information\n\n${body.domain_info}`;

      const raw = await callOpenAI(system, user, 8192);
      let playbook = "";
      let algos = "";
      const playbookMatch = raw.match(/<<<PLAYBOOK>>>\s*([\s\S]*?)\s*<<<ALGOS>>>/);
      const algosMatch = raw.match(/<<<ALGOS>>>\s*([\s\S]*?)\s*<<<END>>>/);
      if (playbookMatch) playbook = playbookMatch[1].trim();
      if (algosMatch) algos = algosMatch[1].trim();
      if (!playbook && !algos) {
        const half = Math.ceil(raw.length / 2);
        playbook = raw.slice(0, half);
        algos = raw.slice(half);
      }
      return { playbook, algos };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Generate failed";
        set.status = 500;
        return { error: msg };
      }
    },
    {
      body: t.Object({
        domain_info: t.String(),
      }),
    }
  )
  .post(
    "/api/builder/save",
    async ({ body }) => {
      const domain = (body.domain ?? "").trim();
      if (!domain) throw new Error("Domain is required");
      savePlaybookAndAlgos(domain, body.playbook ?? "", body.algos ?? "");
      const slug = domain.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "domain";
      return {
        ok: true,
        playbook_path: `agentx/playbook/${slug}.playbook.agentx-v1.md`,
        algos_path: `agentx/playbook/${slug}.algos.agentx-v1.md`,
      };
    },
    {
      body: t.Object({
        domain: t.String(),
        playbook: t.String(),
        algos: t.String(),
      }),
    }
  )
  .get("/assets/*", async ({ params }) => {
    const assetPath = join(DIST, "assets", params["*"] ?? "");
    const file = Bun.file(assetPath);
    if (!(await file.exists())) return new Response(null, { status: 404 });
    const ext = assetPath.split(".").pop() ?? "";
    const mime =
      ext === "js" ? "application/javascript" : ext === "css" ? "text/css" : undefined;
    const body = await file.arrayBuffer();
    return new Response(body, {
      headers: new Headers(mime ? { "Content-Type": mime } : {}),
    });
  })
  .get("/favicon.ico", () => new Response(null, { status: 204 }))
  .listen(process.env.PORT ? parseInt(process.env.PORT) : 9000);

export type App = typeof app;

console.log(`Playbook.ai server running at http://${app.server?.hostname}:${app.server?.port}`);
