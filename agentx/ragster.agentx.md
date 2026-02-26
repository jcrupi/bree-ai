---
title: Ragster — Knowledge Search & RAG Service
type: service
scope: platform
stack: Ragster API, OpenAI Embeddings, Vector DB
last_updated: 2026-02-25
ai_context: true
---

# Ragster — Knowledge Search & RAG Service

Ragster is the **Retrieval-Augmented Generation (RAG) backbone** for BREE AI. It handles document ingestion, semantic embedding, vector storage, and similarity search. All AI chat responses grounded in user documents flow through Ragster.

---

## Concepts

| Term           | Meaning                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| **Collection** | A named vector store scoped to an `org_id` — like a folder of semantically indexed documents |
| **Resource**   | An uploaded and indexed document (PDF, txt, md, etc.)                                        |
| **Embedding**  | A vector representation of a text chunk used for similarity search                           |
| **Search**     | Semantic similarity lookup returning the top-K most relevant chunks                          |
| **org_id**     | Tenant isolation key — each brand has its own org in Ragster                                 |

---

## Client — `packages/bree-ai-core/src/utils/ragster.ts`

The client calls Ragster **directly from the frontend** (Vite apps) using env-configured URLs. It does not route through `bree-api`.

### Configuration

| Env Var                              | Description                                           |
| ------------------------------------ | ----------------------------------------------------- |
| `VITE_RAGSTER_API_URL`               | Base URL e.g. `https://ragster.internal/api`          |
| `VITE_RAGSTER_DEFAULT_ORG_ID`        | Tenant org ID (e.g. `kat.ai`, `habitaware`)           |
| `VITE_RAGSTER_DEFAULT_USER_ID`       | Default user for API headers                          |
| `VITE_RAGSTER_DEFAULT_COLLECTION_ID` | Pre-selected collection (overridable in localStorage) |

All requests include `x-org-id` and `x-user-id` headers for tenant routing.

---

## API Surface

### Search

```ts
import { searchRagster } from "@bree-ai/core";

const results = await searchRagster(query, collectionId, {
  topK: 10,
  min_score: 0.0,
  filter: { type: "pdf" },
});
// results: { results: RagsterSearchResult[], query, count }
```

**Collection ID priority:** explicit arg → `localStorage.katai_default_collection` → `VITE_RAGSTER_DEFAULT_COLLECTION_ID`

### Collections

```ts
import {
  listCollections,
  getCollection,
  createCollection,
  deleteCollection,
} from "@bree-ai/core";

const { collections } = await listCollections({ limit: 50 });
const collection = await getCollection("col-abc123");

await createCollection({
  name: "My Docs",
  org_id: "kat.ai",
  user_id: "user-1",
  created_by_member: "user-1",
  embedding_model: "text-embedding-3-large", // default
  embedding_dimension: 3072, // default
  chunking_strategy: "semantic", // default
  chunk_size: 1024,
  chunk_overlap: 200,
});
```

### Upload & Index

```ts
import { uploadDocument } from "@bree-ai/core";

// Uses /api/index/file — uploads AND indexes in one call
const resource = await uploadDocument({
  file: fileObject,
  org_id: "kat.ai",
  user_id: "user-1",
  collection_id: "col-abc123",
  metadata: { source: "user-upload" },
});
```

### Chat (Ragster LLM Proxy)

```ts
import { generateChatResponse } from "@bree-ai/core/utils/ragster";

const text = await generateChatResponse(
  [
    { role: "system", content: "You are KAT.ai..." },
    { role: "user", content: "Summarize the uploaded docs" },
  ],
  { model: "gpt-4o", temperature: 0.7 },
);
```

### Health Check

```ts
import { checkRagsterHealth } from "@bree-ai/core";
const { status } = await checkRagsterHealth(); // { status: 'ok', service: 'ragster' }
```

---

## breeAPI Facade

All Ragster calls are also available via the unified API facade:

```ts
import { breeAPI } from "@bree-ai/core";

const results = await breeAPI.knowledge.search({
  query,
  collection: "col-abc",
});
const collections = await breeAPI.knowledge.listCollections("kat.ai");
```

---

## RAG Chat Pattern

Standard usage across BREE apps:

```ts
// 1. Search Ragster for relevant context
const { results } = await searchRagster(userQuery);
const context = results.map((r) => r.text).join("\n\n");

// 2. Stream OpenAI response grounded in context
const { ask } = useOpenAIStream({
  systemPrompt: "Answer using only the provided context.",
});
await ask(userQuery, context);
```

---

## Tenant Isolation

Each BREE app uses its own `org_id`:

| App            | `VITE_RAGSTER_DEFAULT_ORG_ID` |
| -------------- | ----------------------------- |
| KAT.ai         | `kat.ai`                      |
| HabitAware     | `habitaware`                  |
| The Vineyard   | `the-vineyard`                |
| Talent Village | `talent-village`              |

Collections are fully isolated per `org_id` — cross-tenant search is not possible through the client.
