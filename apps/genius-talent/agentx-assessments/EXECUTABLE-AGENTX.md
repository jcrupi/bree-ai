# Executable AgentX Notes

**Executable AgentX** is a convention that lets you run a meta `.agentx.md` file like a script. When you execute it, the file acts as both the **spec** (system prompt / instructions for the AI) and the **invocation**: you can pass level flags, a prompt, other agentx notes, and optionally a PDF. The runner sends everything to an LLM and writes one or more generated notes.

So the note is not only documentation—it’s the entrypoint for generating more notes.

---

## Concept

- **Meta agentx files** define standards and instructions (e.g. “Database Design & Engineering”). They’re the source of truth for what the AI should produce.
- **Executable** means the meta file can be **run**. The OS runs it via a shebang (`#!/usr/bin/env agentx-gen`); the `agentx-gen` script receives the meta file path and any CLI options.
- **Single entrypoint**: You run the meta file and pass **level flags** (what to generate) and optional context:
  - **Level flags**: If you pass nothing, the runner generates **one mid-to-advanced** agentx file. With `-basic` and/or `-advanced` it generates one or two files (basic, advanced). With `-domain` (or `-domain healthcare`) it generates domain-level file(s) when the meta defines `generate.domains`.
  - Optional **prompt**, **other .agentx.md notes** (non-meta), **one PDF** as context, and **output path** (when generating a single file).
- The **runner** reads the meta, builds one or more generation jobs from the flags, calls the LLM for each job, and writes each result to the right file (e.g. `database-mid-advanced.agentx.md`, `database-basic.agentx.md`, or `database.healthcare.domain.agentx.md`).

So: **one file is both the spec and the script.** Run it, choose level(s), optionally add prompt and context, and get one or more generated agentx notes.

---

## Why

- **Self-contained**: The meta file describes what to generate and how to run that generation. No separate “runbook” or script per meta.
- **Reproducible**: Same meta + same prompt/context → same kind of output. Easy to re-run after editing the meta or the prompt.
- **Context-aware**: You can pull in other agentx notes (e.g. UI standards) or a PDF (e.g. API docs) so the generated note is aligned with real context.
- **CLI-friendly**: Fits into shells, scripts, and automation; no need to open a separate AI UI.

---

## How it works

1. **Mark the meta as executable**
   - First line: `#!/usr/bin/env agentx-gen`
   - Then the usual YAML front matter (`---` … `---`) and body. The runner strips the shebang before parsing.
   - `chmod +x meta.database.agentx.md` (or whichever meta file).

2. **Make `agentx-gen` available**
   - Add this folder’s `bin` to your PATH, e.g.  
     `export PATH="$PATH:$(pwd)/bin"`  
     so the kernel can run `agentx-gen` when you execute the meta file.
   - Or call the runner explicitly:  
     `./bin/agentx-gen meta.database.agentx.md [options]`

3. **Run the meta**
   - From the `agentx` directory:  
     `./meta.database.agentx.md [-basic] [-advanced] [-domain [slug]] [--prompt "…"] [--with note.agentx.md …] [--pdf doc.pdf] [--out output.agentx.md]`
   - **Default** (no level flag): one file with mid + advanced questions (`{slug}-mid-advanced.agentx.md`).
   - **Level flags**: `-basic` and/or `-advanced` generate one or two files; `-domain` generates domain file(s) from the meta’s `generate.domains`. The runner uses the meta as the **system prompt** and the level + prompt + notes + PDF as **user/context**, then calls the LLM once per job and writes each result to the right file.

4. **Requirements**
   - **Bun** (to run `agentx-run.ts`).
   - **OPENAI_API_KEY** (or OPENAI_KEY) in the environment.
   - Optional: **pdftotext** on PATH (e.g. `brew install poppler`) if you use `--pdf`.

5. **Safety and scope**
   - The runner **only generates AgentX notes** for technical candidate assessment. It is not a general-purpose AI: prompts must be about generating or refining interview question sets from the meta. Off-topic or inappropriate requests are refused (the model outputs a minimal “out of scope” agentx note).
   - The model is instructed not to include PHI, inappropriate content, or uses outside technical interview assessment; domains (e.g. healthcare) are for technical/compliance topics only. Output is validated; only content that looks like a valid AgentX note is written.

---

## Level flags (what to generate)

| Flag | Meaning |
|------|--------|
| *(none)* | **Default**: one file with mid-level + advanced questions combined (`{slug}-mid-advanced.agentx.md`). |
| `-basic` / `--basic` | Generate the basic (junior/mid) questions file only. |
| `-advanced` / `--advanced` | Generate the advanced (senior+) questions file only. |
| Both `-basic` and `-advanced` | Generate **2 files** (basic + advanced). |
| `-domain` / `--domain` | Generate domain file(s). If the meta defines `generate.domains`, one file per domain. |
| `-domain healthcare` | Generate only the domain file for that slug. |

## Other options

| Option | Meaning |
|--------|--------|
| `--prompt "..."` | User prompt sent to the AI. |
| `--with note1.agentx.md [note2.agentx.md ...]` | Other **non-meta** `.agentx.md` files as context. |
| `--pdf file.pdf` | **One** PDF; its text (via `pdftotext`) is sent as context. |
| `--out output.agentx.md` | Output path when generating a **single** file; ignored when generating multiple files. |
| `-v` / `--verbose` | Verbose mode: log meta, jobs, model, context, and each file write. |

---

## Summary

**Executable AgentX** = a meta `.agentx.md` file that is also a script. Run it with level flags (default: one mid-to-advanced file; or `-basic` / `-advanced` / `-domain`), optionally a prompt, other agentx notes, and one PDF. The runner uses the meta as system instructions and the rest as context, calls the LLM once per job, and writes one or more generated notes.

For setup and examples, see the [Executable AgentX notes](README.md#executable-agentx-notes-agentx-gen) section in the main AgentX README.
