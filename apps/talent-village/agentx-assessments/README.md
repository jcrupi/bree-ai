# AgentX Interview Question Specs

This folder holds **meta** AgentX specs and (when generated) **basic**, **advanced**, and **domain** interview question files. Meta files are the source of truth; they are sent to the AI with instructions to generate the question files.

## Structure

```
agentx-assessments/
├── meta/          # Meta specs (you maintain these)
├── notes/         # Generated question files (created by AI)
├── bin/           # agentx-gen, agentx-run.ts
└── __tests__/     # Test suite
```

### Meta files (in `meta/`)

- **`meta.ui-react.agentx.md`** – React & UI development standards; used to generate UI React question sets.
- **`meta.typescript-backend.agentx.md`** – TypeScript backend standards; used to generate backend question sets.
- **`meta.database.agentx.md`** – Database design & engineering standards; used to generate database question sets.
- **`meta.rust.agentx.md`** – Rust systems & backend standards; used to generate Rust question sets.

Each meta file has **YAML front matter** that defines:

- `kind: meta`
- `slug`, `version`, `title`, `description`
- `generate.basic` – target filename for basic (junior/mid) questions
- `generate.advanced` – target filename for advanced (senior+) questions
- `generate.domains` – list of `{ slug, file }` for domain-specific question files
- `instructions` – text sent to the AI describing how to generate basic/advanced/domain files from this meta

You can have **multiple versions** of a meta file (e.g. `meta.ui-react.v2.agentx.md` or version inside front matter). The AI uses the chosen meta + instructions to produce the corresponding question files.

### Generated files (in `notes/`, created by AI from meta)

| Level    | Naming pattern              | Example |
|----------|-----------------------------|---------|
| Basic    | `{slug}-basic.agentx.md`   | `ui-react-basic.agentx.md`, `typescript-backend-basic.agentx.md`, `database-basic.agentx.md` |
| Advanced | `{slug}-advanced.agentx.md`| `ui-react-advanced.agentx.md`, etc. |
| Domain   | `{slug}.{domain}.domain.agentx.md` | `ui-react.healthcare.domain.agentx.md`, `ui-react.financial.domain.agentx.md` |

Generated files should include front matter with:

- `kind`: `basic` | `advanced` | `domain`
- `slug`, `version`
- `parent_meta`: slug of the meta file (e.g. `ui-react`, `typescript-backend`, `database`)
- For domain: `domain`: e.g. `healthcare`, `financial`

## Workflow

1. **Edit** a meta `*.agentx.md` file (skills, standards, stack).
2. **Send** that meta file + its `instructions` block to the AI.
3. **Generate** the corresponding `*-basic.agentx.md`, `*-advanced.agentx.md`, and optionally `*.{domain}.domain.agentx.md` files.
4. Generated files are written to the `notes/` subfolder automatically.

### Executable AgentX notes (agentx-gen)

Meta files can be **executable**: the meta file’s first line is a shebang (`#!/usr/bin/env agentx-gen`) and the file is `chmod +x`. Then you can run the meta file like a script to generate notes via the LLM.

**Setup**

- From this folder, add `bin` to your PATH so `agentx-gen` is found:
  - `export PATH="$PATH:$(pwd)/bin"`
- Or run the runner explicitly: `./bin/agentx-gen meta/meta.database.agentx.md [options]`
- Requires: **Bun**, and **OPENAI_API_KEY** (or OPENAI_KEY): set in the environment, or on macOS store in Keychain (see below). Optional: **pdftotext** on PATH for `--pdf` (e.g. `brew install poppler`).
- **macOS Keychain**: If the key is not in env, the runner reads it from the system Keychain. Add it once:  
  `security add-generic-password -a "$USER" -s "openai-api-key" -w "sk-your-key"`  
  Override the service name with `AGENTX_KEYCHAIN_SERVICE`.

**Usage**

- **Run executable meta** (with PATH set and file executable):
  - `./meta/meta.rust.agentx.md [options]`
  - `./meta/meta.database.agentx.md [options]`
- **Or call the runner directly:**
  - `./bin/agentx-gen meta/meta.database.agentx.md [options]`

**Level flags** (what to generate)

| Flag | Description |
|------|-------------|
| *(none)* | **Default**: one file with mid-level + advanced questions combined (`{slug}-mid-advanced.agentx.md`). |
| `-basic` or `--basic` | Generate the basic (junior/mid) questions file only. |
| `-advanced` or `--advanced` | Generate the advanced (senior+) questions file only. |
| Both `-basic` and `-advanced` | Generate **2 files** (basic + advanced). |
| `-domain` or `--domain` | Generate domain file(s). If the meta defines `generate.domains`, generates one file per domain (e.g. healthcare, financial). |
| `-domain healthcare` | Generate only the domain file for that slug (e.g. `database.healthcare.domain.agentx.md`). |

**Safety and scope**

- The executable **only generates AgentX notes** (technical candidate assessment interview content). It cannot be used for general AI Q&A, code generation, or other tasks.
- Prompts are scoped to generating or refining interview question sets from the meta. Off-topic or inappropriate prompts are refused; the model is instructed to output only a minimal “out of scope” agentx note in that case.
- The runner enforces: no PHI/PII beyond fictional scenarios, no inappropriate content; domains (e.g. healthcare, financial) are for technical/compliance topics only (e.g. HIPAA as a topic), not real data.
- Output is validated: only content that looks like a valid AgentX note (YAML front matter + interview/assessment content) is written to disk; otherwise the run fails.

**Other options**

| Option | Description |
|--------|-------------|
| `--prompt "..."` | User prompt for this run (must be about generating/refining interview questions from the meta). |
| `--with note1.agentx.md [note2.agentx.md ...]` | Extra **non-meta** `.agentx.md` files as context. |
| `--pdf file.pdf` | **One** PDF; its text (via `pdftotext`) is sent as context. |
| `--out output.agentx.md` | Output path when generating a **single** file (overrides default). Ignored when generating multiple files. |
| `-v` or `--verbose` | Verbose mode: log meta path, jobs, model, context (--with, --pdf, prompt), and each write. |

**Examples**

```bash
# Default: one mid-to-advanced file (notes/database-mid-advanced.agentx.md)
./meta/meta.database.agentx.md

# Basic questions only (notes/database-basic.agentx.md)
./meta/meta.database.agentx.md -basic

# Advanced only (notes/database-advanced.agentx.md)
./meta/meta.database.agentx.md -advanced

# Both basic and advanced (2 files)
./meta/meta.database.agentx.md -basic -advanced

# All domain files from meta (e.g. healthcare + financial)
./meta/meta.database.agentx.md -domain

# One domain only
./meta/meta.database.agentx.md -domain healthcare

# With prompt and PDF context
./meta/meta.database.agentx.md -basic --prompt "Focus on PostgreSQL" --pdf API_ENDPOINTS.pdf
```

## Domain examples

- **Healthcare**: HIPAA, PHI handling, audit trails, compliance in UI/backend/DB.
- **Financial**: Audit trails, regulatory reporting, data consistency, secure handling of financial data in UI/backend/DB.

Additional domains can be added under `generate.domains` in each meta file and new domain agentx files generated from the same meta.
