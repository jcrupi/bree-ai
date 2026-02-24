# Talent Village

Standalone **Genius Talent.ai** Live Assessment Engine — real-time candidate assessment with Lead and Expert roles, NATS-backed vines, and invite flows.

## Routes

| Path | Description |
|------|-------------|
| `/setup` | Create a new village (name, description, lead name). Creator becomes Lead Expert. |
| `/talent-village` | Main board: Candidate view or Expert/Lead dashboard (role from query params). |
| `/talent-village/vines-eye` | Multi-perspective debug view (assessment + private + queue vines). |

## Backend

The app expects a backend that implements the **Village API**:

- **WebSocket** `GET /api/village/:vineId/ws?name=...` — real-time messaging.
- **HTTP** `POST /api/village/:vineId/message` — send message (body: `{ sender, content }`).
- **HTTP** `POST /api/village/start` — create vine (body: `{ topic, invited }`).

Set the API base URL with:

```bash
# .env or .env.local
VITE_API_URL=http://localhost:3000
```

If unset, it defaults to `http://localhost:3000`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174). You’ll be redirected to `/setup`. After deploying a village, you’ll land on the board as Lead. Use **Invite** to generate links for candidates or other experts.

## Repo as its own project

This app is self-contained. To use it as its own repo:

1. Copy the `talent-village` folder to a **new directory outside the monorepo** (so `npm install` does not see `workspace:*` deps).
2. Run `npm install` and `npm run dev` (or build) in that directory.
3. Run `git init` and add your remote.
4. Ensure your backend (e.g. the API from the original monorepo) is running and set `VITE_API_URL` if needed.
5. Deploy the Vite build (`npm run build`) to any static host; keep the same route structure (or use a router that supports client-side routing).

## Roles (from agentx)

- **Candidate** — Live assessment chat only; no expert vine or tools.
- **Lead Expert** — Full dashboard: candidate mirror, direct intervention, simulation, AI tools, intervention queue, question designer, expert roster, invite links.
- **Expert** — Candidate mirror (read-only by default), expert vine chat, propose-to-queue; no Lead tools or invite.

See `talent-village.agentx.md` in this repo for full role spec.
