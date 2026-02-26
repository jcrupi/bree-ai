---
title: Antimatter DB — Markdown-Driven Entity Store
type: service
scope: platform
stack: Bun, Elysia, Markdown, YAML Front Matter
port: 7198
last_updated: 2026-02-25
ai_context: true
---

# Antimatter DB — Markdown-Driven Entity Store

Antimatter DB is a **filesystem-backed entity database** where every record is a markdown file with YAML front matter. It powers Identity Zero's org/user registry and can store any structured entity as a `.agentx.md` file.

> **Key insight:** Antimatter DB is the origin of the `.agentx.md` naming convention used across this entire repository. Every entity — org, user, config, knowledge item — is a markdown file readable by both humans and AI tools like Claude, Cursor, and Antigravity.

---

## Architecture

```
antimatter-db (Bun + Elysia, port 7198)
  └─ /data/
       ├─ super-org/
       │    ├─ index.agentx.md          ← super-org definition
       │    └─ users/
       │         └─ admin@bree.ai.agentx.md
       └─ orgs/
            ├─ kat-ai/
            │    ├─ index.agentx.md    ← org definition
            │    └─ users/
            │         └─ alice@kat.ai.agentx.md
            └─ habitaware/
                 └─ index.agentx.md
```

---

## File Format

### Organization (`index.agentx.md`)

```markdown
---
name: KAT.ai
slug: kat-ai
uuid: abc-123-...
type: organization
status: active
createdAt: 2026-01-15T10:00:00Z
---

# Organization: KAT.ai

Managed via BREE AI Admin.
```

### User (`{email}.agentx.md`)

```markdown
---
email: alice@kat.ai
name: Alice Johnson
uuid: def-456-...
role: admin
status: active
createdAt: 2026-02-01T09:00:00Z
---

# User: Alice Johnson

Member of kat-ai.
```

---

## API Endpoints

| Method   | Path                    | Description                                   |
| -------- | ----------------------- | --------------------------------------------- |
| `GET`    | `/api/health`           | `{ status: 'ok' }`                            |
| `GET`    | `/api/entries?dir=orgs` | List `.agentx.md` files in directory          |
| `POST`   | `/api/entries`          | Create entry `{ path, frontMatter, content }` |
| `GET`    | `/api/entries/:path`    | Read a specific entry                         |
| `PATCH`  | `/api/entries/:path`    | Update front matter or content                |
| `DELETE` | `/api/entries/:path`    | Delete an entry                               |

---

## Client — `packages/bree-ai-core/src/utils/antimatter.ts`

```ts
import {
  healthCheck,
  listOrgs,
  listUsers,
  createOrg,
  createUser,
} from "@bree-ai/core";

const orgs = await listOrgs(); // reads super-org/ + orgs/
const users = await listUsers("kat-ai"); // reads orgs/kat-ai/users/

await createOrg("my-org", "My Org");
// → writes orgs/my-org/index.agentx.md

await createUser("my-org", "user@example.com", "Jane Smith", "member");
// → writes orgs/my-org/users/user@example.com.agentx.md
```

---

## Special `super-org`

Top-level admin org with global privileges. Users here can manage all tenants.

```ts
const adminUsers = await listUsers("super-org");
// reads: super-org/users/*.agentx.md
```

---

## Antimatter Admin UI (`apps/antimatter-admin`)

React admin panel for managing orgs and users:

- List orgs with member counts
- Create/deactivate organizations
- Manage users per org (roles: `admin`, `member`, `viewer`)
- Access gated to `super-org` admins + per-org `org_admin` users

---

## Configuration

| Env Var               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `VITE_ANTIMATTER_URL` | Antimatter DB base URL (default: `http://localhost:7198`) |

---

## Why Markdown?

1. **AI-native** — LLMs understand markdown + YAML front matter natively, no adapter needed
2. **Git-trackable** — all entity changes appear as readable, diffable commits
3. **Schema-free** — add a front matter field, query it immediately — no migrations
4. **Human-readable** — ops and developers can inspect/edit records in any text editor

---

## Local Dev

```bash
bun run dev:antimatter      # API → http://localhost:7198
bun run dev:antimatter-ui   # Admin UI → http://localhost:3001
```
