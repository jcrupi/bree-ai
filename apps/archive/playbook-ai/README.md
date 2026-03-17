# Playbook.ai

> Unified UI for specialty playbooks and algorithms. View, chat, and post encounters across E/M, Wound, Derm, Pain, and Urgent care.

## Overview

Playbook.ai replaces and extends the enm-ai playbook UI. It provides:

- **Specialty selector:** E/M, Wound, Derm, Pain, Urgent
- **Playbook & Algo view:** Read-only preview or raw markdown
- **Chat:** Ask questions about the selected playbook/algos (OpenAI)
- **Post encounter:** Paste encounter text and get AI-generated coding suggestions and validation feedback

## Run

**Development** (server on 9000, client on 5174):

```bash
cd apps/playbook-ai
bun install
bun run dev:server   # Terminal 1
bun run dev:client   # Terminal 2
```

Visit http://localhost:5174

**Production** (single server serves API + built client):

```bash
bun run build
PORT=9000 bun run start
```

Visit http://localhost:9000

## Environment

- `OPENAI_API_KEY` — Required for chat and generate
- `OPENAI_MODEL` — Optional (default: gpt-4o)
- `PORT` — Server port (default: 9000)

## Specialties

Playbook-ai loads the **latest versioned** playbook and algos from each app's `agentx/playbook/` folder:

| Specialty | Path |
|-----------|------|
| E/M | `apps/enm-ai/agentx/playbook/*-vN.md` |
| Wound | `apps/wound-ai/agentx/playbook/*-vN.md` |
| Derm | `apps/derm-ai/agentx/playbook/*-vN.md` |
| Pain | `apps/pain-ai/agentx/playbook/*-vN.md` |
| Urgent | `apps/urgent-ai/agentx/playbook/*-vN.md` |

Version and creation timestamp are shown in the UI. To bump a version: run `scripts/version-playbook.sh <app> <playbook|algos>` from repo root.

---

*Part of BREE AI monorepo — copied from Grelin AI*
