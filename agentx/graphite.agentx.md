---
schema_version: "1.0"
kind: developer_workflow
scope: branching
tool: graphite
updated: 2026-02-26
---

# Graphite Branching Workflow

Developer branching workflow using [Graphite](https://graphite.dev/) for stacked PRs and collaborative feature work across all BREE AI repos.

---

## Install

```bash
npm install -g @withgraphite/graphite-cli
```

## Auth

```bash
gt auth
```

---

## Workflow: Stacked Branches

### Create your stack

```bash
# Base feature branch
gt branch create feature/claim-era-status

# Your work stacked on top
gt branch create feature/claim-era-status-johnny
```

### Teammate does the same

```bash
# Arsen creates the same base
gt branch create feature/claim-era-status

# Arsen's work stacked on top
gt branch create feature/claim-era-status-arsen
```

### When a teammate merges their PR

```bash
gt sync
```

This automatically rebases your stacked branch on top of the updated base — no manual pulling.

### Submit PRs in the correct order

```bash
gt submit
```

Opens PRs in dependency order (base first, then stacked branches).

---

## Quick Reference

| Command                   | Purpose                            |
| ------------------------- | ---------------------------------- |
| `gt auth`                 | Authenticate with Graphite         |
| `gt branch create <name>` | Create branch (stacked on current) |
| `gt sync`                 | Rebase stack on remote changes     |
| `gt submit`               | Open PRs for stack in order        |
| `gt log`                  | View the current stack             |
| `gt checkout <branch>`    | Switch to a branch in the stack    |
| `gt up` / `gt down`       | Navigate up/down the stack         |

---

## BREE Monorepo Conventions

Since BREE is a Bun monorepo with multiple apps, follow these naming conventions for branches:

```
feature/<app>/<short-description>
fix/<app>/<short-description>
chore/<scope>/<short-description>
```

**Examples:**

```bash
# Working on talent-village-ai
gt branch create feature/talent-village-ai/code-snippet-questions

# Fixing a bug in bree-api
gt branch create fix/bree-api/nats-reconnect

# Infra / deploy changes
gt branch create chore/fly/talent-village-dockerfile
```

---

## Related

- [Graphite CLI docs](https://graphite.dev/docs/graphite-cli)
- [Stacked PRs explainer](https://graphite.dev/docs/stacked-prs)
- [fly.agentx.md](fly.agentx.md) — Fly.io deployment workflow
- [architecture.agentx.md](architecture.agentx.md) — BREE monorepo architecture
