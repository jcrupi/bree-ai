---
title: FatApps AI — App Listing Intelligence App
type: app
app: fatapps-ai
stack: Vite, React, TailwindCSS
last_updated: 2026-02-25
ai_context: true
---

# FatApps AI — App Listing Intelligence App

FatApps AI is a **fatapps.com-integrated AI assistant** for app store intelligence. It helps users discover, analyze, and compare mobile apps using AI-assisted search and summaries.

---

## Technology

- **Frontend:** Vite + React + TailwindCSS (unique among BREE apps — uses Tailwind rather than vanilla CSS)
- **No shared bree-ai-core dependency** — standalone app with its own fetch calls
- **Package manager:** Bun (workspace member)

---

## Source Structure

```
apps/fatapps-ai/
├── src/
│   ├── App.tsx          ← Root component
│   ├── main.tsx         ← Vite entry
│   └── ...
├── fatapps/             ← Local fatapps data / fixtures
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## External Services

| Service                         | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| FatApps API                     | App store data — listings, reviews, rankings |
| OpenAI (direct or via bree-api) | AI-generated summaries and comparisons       |

---

## Notes for AI Tools

- This app uses **TailwindCSS** (unlike other BREE apps which use vanilla CSS). When editing styles, use Tailwind utility classes.
- No `bree-ai-core` package — import nothing from `@bree-ai/core` here.
- Does **not** use NATS or WebSocket — purely HTTP/REST.

---

## Local Dev

```bash
bun run dev:fatapps
# → http://localhost:5173
```
