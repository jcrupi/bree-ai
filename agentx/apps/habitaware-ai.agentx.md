---
title: HabitAware AI — Habit Intelligence App
type: app
app: habitaware-ai
fly_app: habitaware-ai
url: https://habitaware-ai.fly.dev
stack: Vite, React, bree-ai-core
brand_id: habitaware-ai
last_updated: 2026-02-25
ai_context: true
---

# HabitAware AI — Habit Intelligence App

HabitAware AI is a **personal habit intelligence assistant** that helps users understand and improve their behaviors using AI-guided conversations and document-grounded context from the HabitAware knowledge base.

---

## User Flows

1. **Login** → Identity Zero / Better Auth
2. **Chat with AI** → NATS streaming via `useOpenAIStream`
3. **Knowledge search** → Ragster collection scoped to `habitaware` org
4. **TTS responses** → `SpeakingAvatar` for audio feedback

---

## External Services Used

| Service                    | Purpose                          |
| -------------------------- | -------------------------------- |
| Ragster                    | HabitAware knowledge base search |
| OpenAI (bree-api-realtime) | Streaming chat                   |
| OpenAI TTS (bree-api)      | Audio responses                  |
| Identity Zero              | Authentication                   |

---

## Key Environment Variables

| Variable                      | Value                               |
| ----------------------------- | ----------------------------------- |
| `VITE_API_URL`                | `https://bree-api.fly.dev`          |
| `VITE_REALTIME_URL`           | `https://bree-api-realtime.fly.dev` |
| `VITE_APP_NAME`               | `HabitAware AI`                     |
| `VITE_BRAND_ID`               | `habitaware-ai`                     |
| `VITE_RAGSTER_DEFAULT_ORG_ID` | `habitaware`                        |

---

## Local Dev

```bash
bun run dev:habitaware
# → http://localhost:5173
```
