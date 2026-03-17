---
agentx:
  version: 1
  created_at: "2026-03-17"
  type: design
  filename: playbook-catalog-architecture.agentx.md
---

# Playbook-AI Catalog Architecture — AgentX

> **Purpose:** Design the core playbook-ai on Bree with catalogs as URL pointers to external repos. playbookX is the code builder per catalog.

---

## 1. Overview

| Concept | Description |
|---------|-------------|
| **Core playbook-ai** | Lives in **bree-ai**. Single UI + server. Renders playbooks from any catalog. |
| **Catalog** | A pointer (URL) to a repo + path where playbooks live. Not embedded content. |
| **playbookX** | Code builder for a **specific catalog**. One playbookX per catalog. Generates/validates playbooks for that catalog's domain. |

---

## 2. Catalog as URL Pointer

### Current (embedded)
```
bree-ai/apps/playbook-ai/
├── agentx/playbook/          ← All playbooks live here
│   ├── 1040-simple.playbook.agentx-v1.md
│   ├── wound-ai.playbook.agentx-v1.md
│   └── ...
└── shared/specialty-config.ts  ← Hardcoded appRoot paths
```

### Target (URL pointers)
```yaml
# specialty-config or catalog-config
catalogs:
  - id: bree-ai
    name: Bree AI
    repo: "https://github.com/jcrupi/bree-ai"
    branch: main
    playbookPath: "apps/playbook-ai/agentx/playbook"
    playbookX: "local"  # or path to playbookX in same repo

  - id: grelin-ai
    name: Grelin AI
    repo: "https://github.com/GrelinhealthTeam/grelin-ai"
    branch: main
    playbookPath: "apps/wound-ai/agentx/playbook"
    playbookX: "https://github.com/GrelinhealthTeam/grelin-ai/apps/playbook-ai/playbookx"
```

**Specialty** = catalog + baseName. Example: `{ catalogId: "grelin-ai", baseName: "wound-ai" }` → fetch from `{repo}/{playbookPath}/wound-ai.playbook.agentx-v1.md`.

---

## 3. playbookX — Code Builder per Catalog

| Catalog | playbookX Location | Scope |
|---------|-------------------|-------|
| **bree-ai** | `bree-ai/apps/playbook-ai/playbookx/` | 1040, hipaa, disability, fmla, aml-kyc, gdpr-breach, ediscovery, etc. |
| **grelin-ai** | `grelin-ai/apps/playbook-ai/playbookx/` | wound-ai, enm-ai, derm-ai, pain-ai, urgent-ai, dme-ai, behavioral-health-ai |

**playbookX responsibilities:**
- `validate` — Validate playbook/algos against rules
- `watch` — Auto-sync on file change
- `generate` — Generate code from playbook (e.g., rules-engine, validation)
- `sync` — Push playbooks to a target (e.g., bree-ai) for deployment

Each playbookX is **catalog-scoped**. It knows only its catalog's specialties and paths.

---

## 4. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CORE PLAYBOOK-AI (bree-ai)                        │
│  - Single UI                                                             │
│  - Fetches playbooks by catalog URL                                      │
│  - No embedded playbook content for external catalogs                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │ Bree catalog │  │ Grelin catalog│  │ Future catalog│
         │ (local/URL)  │  │ (URL pointer) │  │ (URL pointer) │
         └──────────────┘  └──────────────┘  └──────────────┘
                    │               │               │
                    ▼               ▼               ▼
         ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
         │ playbookX    │  │ playbookX    │  │ playbookX    │
         │ (bree-ai)    │  │ (grelin-ai)  │  │ (other repo) │
         │              │  │              │  │              │
         │ Builds:      │  │ Builds:      │  │ Builds:      │
         │ 1040, hipaa, │  │ wound, enm,  │  │ ...          │
         │ fmla, etc.   │  │ derm, etc.   │  │              │
         └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 5. Loader Behavior

**playbook-loader** (core, in bree-ai):

```ts
// Resolve playbook URL from catalog config
function getPlaybookUrl(catalogId: string, baseName: string): string {
  const catalog = CATALOG_CONFIG.find(c => c.id === catalogId);
  if (!catalog?.repo) return "";  // local fallback
  const base = `${catalog.repo}/blob/${catalog.branch}/${catalog.playbookPath}`;
  return `${base}/${baseName}.playbook.agentx-v1.md`;  // or fetch raw
}

// Load: fetch from URL (raw GitHub, or cached) or read local
async function loadPlaybook(catalogId: string, baseName: string): Promise<DocMeta> {
  const catalog = CATALOG_CONFIG.find(c => c.id === catalogId);
  if (catalog?.repo) {
    return fetchFromUrl(catalog.repo, catalog.branch, catalog.playbookPath, baseName);
  }
  return loadFromLocal(baseName);  // bree catalog default
}
```

**Caching:** Core can cache fetched playbooks (TTL, or on sync) to avoid repeated network calls.

---

## 6. Catalog Config Schema

```ts
interface CatalogConfig {
  id: string;
  name: string;
  icon: string;
  description?: string;
  /** URL to repo (e.g. https://github.com/owner/repo) */
  repo?: string;
  branch?: string;
  /** Path within repo to playbook dir (e.g. apps/wound-ai/agentx/playbook) */
  playbookPath?: string;
  /** If local, playbooks are in core's agentx/playbook */
  local?: boolean;
}

interface SpecialtyConfig {
  id: string;
  name: string;
  icon: string;
  catalogId: string;
  baseName: string;
  rulesEngine?: boolean;
  /** Override catalog's playbookPath for this specialty (optional) */
  playbookPathOverride?: string;
}
```

**bree-ai catalog:** `local: true` → read from `apps/playbook-ai/agentx/playbook/`.  
**grelin-ai catalog:** `repo: "https://github.com/GrelinhealthTeam/grelin-ai"`, `playbookPath: "apps/wound-ai/agentx/playbook"` → fetch from URL.

---

## 7. playbookX CLI Scope

```bash
# In bree-ai repo — scope: bree-ai catalog only
bun run playbookx validate 1040-simple
bun run playbookx watch

# In grelin-ai repo — scope: grelin-ai catalog only
bun run playbookx validate wound-ai
bun run playbookx watch
```

**Alternative:** Single playbookX in core that accepts `--catalog`:

```bash
bun run playbookx validate --catalog grelin-ai wound-ai
bun run playbookx validate --catalog bree-ai 1040-simple
```

Requires playbookX to resolve catalog config (repo, path) and operate in that context.

---

## 8. Sync Strategy

| Direction | Mechanism |
|-----------|-----------|
| grelin-ai → bree-ai | GitHub Action in bree-ai (already built). Fetches from GrelinhealthTeam/grelin-ai, copies to bree-ai cache or serves via proxy. |
| bree-ai local | No sync; playbooks are in bree-ai. |
| Future catalogs | Same pattern: URL pointer + optional sync/cache. |

**Option A (cache):** Core fetches on demand, caches. Sync action warms cache.  
**Option B (no copy):** Core always fetches from URL at request time. No copy into bree-ai.  
**Option C (sync copy):** Sync action copies into `agentx/playbook/{catalog}/` for faster reads. Catalog config points to that path when synced.

---

## 9. Implementation Phases

### Phase 1: Catalog URL config
- [ ] Extend `specialty-config` / `CATALOG_CONFIG` with `repo`, `branch`, `playbookPath`
- [ ] bree-ai catalog: `local: true`, keep current paths
- [ ] grelin-ai catalog: add URL, remove copied playbooks from bree

### Phase 2: Loader fetches from URL
- [ ] Implement `fetchFromUrl()` for raw GitHub content
- [ ] Fallback to local when `repo` absent or fetch fails
- [ ] Optional: cache layer (memory or disk)

### Phase 3: playbookX catalog scope
- [ ] playbookX reads catalog from config or `--catalog`
- [ ] Validate/watch only specialties in that catalog
- [ ] Document: bree playbookX for bree catalog, grelin playbookX for grelin catalog

### Phase 4: Remove embedded grelin playbooks
- [ ] Delete wound-ai (and other grelin) playbooks from bree-ai
- [ ] Rely on URL fetch or sync cache

---

## 10. Open Questions

1. **Auth:** Private repos need token. Store in env / secrets?
2. **Version pinning:** Use `branch` only, or support tag/commit?
3. **playbookX location:** One in core (--catalog) vs one per repo?
4. **Sync vs live fetch:** Cache for speed vs always-fresh?

---

**END OF DESIGN**

*Next: Implement Phase 1 (catalog URL config) and Phase 2 (loader fetch).*
