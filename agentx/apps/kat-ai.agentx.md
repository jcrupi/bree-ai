---
title: KAT.ai — Document Intelligence App
type: app
app: kat-ai
fly_app: kat-ai
url: https://kat-ai.fly.dev
stack: Vite, React, bree-ai-core
brand_id: kat-ai
last_updated: 2026-02-25
ai_context: true
---

# KAT.ai — Document Intelligence App

KAT.ai is a **document-centric AI assistant** that lets users upload documents, search them via RAG (Ragster), and chat with an AI that answers questions grounded in their documents.

---

## User Flows

1. **Upload documents** → Ragster indexes them into a collection
2. **Search** → semantic search across the collection
3. **Chat** → question answered using RAG context + OpenAI streaming
4. **TTS** → AI responses read aloud via `SpeakingAvatar`
5. **STT** → question spoken via microphone (Whisper)

---

## Key Pages / Components

| Page               | Description                                        |
| ------------------ | -------------------------------------------------- |
| Login              | `Login` component from `bree-ai-core`              |
| Document Upload    | Upload to Ragster via `uploadDocument()`           |
| Collection Browser | List/select Ragster collections                    |
| Chat Interface     | `useOpenAIStream` + `SpeakingAvatar` for streaming |
| Settings           | Set default collection, model preferences          |

---

## External Services Used

| Service                     | Purpose                             |
| --------------------------- | ----------------------------------- |
| Ragster                     | Document indexing + semantic search |
| OpenAI (bree-api-realtime)  | NATS-backed streaming chat          |
| OpenAI TTS (bree-api)       | `SpeakingAvatar` voice output       |
| OpenAI STT (bree-api)       | Microphone voice input              |
| Identity Zero / Better Auth | User authentication                 |

---

## Key Environment Variables

| Variable                      | Value                               |
| ----------------------------- | ----------------------------------- |
| `VITE_API_URL`                | `https://bree-api.fly.dev`          |
| `VITE_REALTIME_URL`           | `https://bree-api-realtime.fly.dev` |
| `VITE_APP_NAME`               | `KAT.ai`                            |
| `VITE_BRAND_ID`               | `kat-ai`                            |
| `VITE_RAGSTER_DEFAULT_ORG_ID` | `kat.ai`                            |
| `VITE_RAGSTER_API_URL`        | Ragster service URL                 |

---

## Local Dev

```bash
bun run dev:kat
# → http://localhost:5173 (or next available port)
```
