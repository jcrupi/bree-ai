# Playbook.ai - Bun/Elysia server + static client
# Build from repo root: docker build -f apps/playbook-ai/Dockerfile .
# Deploy: fly deploy -c fly.toml (from apps/playbook-ai)

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy playbook-ai and install deps
COPY apps/playbook-ai/package.json apps/playbook-ai/package.json
COPY apps/playbook-ai/bun.lock apps/playbook-ai/bun.lock
COPY apps/playbook-ai/client apps/playbook-ai/client
COPY apps/playbook-ai/server apps/playbook-ai/server
COPY apps/playbook-ai/shared apps/playbook-ai/shared

WORKDIR /app/apps/playbook-ai
RUN bun install --frozen-lockfile

# Build client
RUN bun run --cwd client build

# Copy agentx/playbook (versioned playbook + algo) and agentx/design from each specialty app
COPY apps/enm-ai/agentx/ /app/apps/enm-ai/agentx/
COPY apps/wound-ai/agentx/ /app/apps/wound-ai/agentx/
COPY apps/derm-ai/agentx/ /app/apps/derm-ai/agentx/
COPY apps/pain-ai/agentx/ /app/apps/pain-ai/agentx/
COPY apps/urgent-ai/agentx/ /app/apps/urgent-ai/agentx/
COPY apps/dme-ai/agentx/ /app/apps/dme-ai/agentx/
COPY apps/behavioral-health-ai/agentx/ /app/apps/behavioral-health-ai/agentx/

# Runtime - preserve apps/ structure so APPS_ROOT = join(server/src, "../../..") = apps/
FROM oven/bun:1-slim

WORKDIR /app

# Full apps/ structure: playbook-ai (server+client+node_modules) + enm-ai, wound-ai, etc.
COPY --from=builder /app/apps/playbook-ai /app/apps/playbook-ai
COPY --from=builder /app/apps/enm-ai /app/apps/enm-ai
COPY --from=builder /app/apps/wound-ai /app/apps/wound-ai
COPY --from=builder /app/apps/derm-ai /app/apps/derm-ai
COPY --from=builder /app/apps/pain-ai /app/apps/pain-ai
COPY --from=builder /app/apps/urgent-ai /app/apps/urgent-ai
COPY --from=builder /app/apps/dme-ai /app/apps/dme-ai
COPY --from=builder /app/apps/behavioral-health-ai /app/apps/behavioral-health-ai

# Ensure client dist is in server (DIST = server/client/dist)
COPY --from=builder /app/apps/playbook-ai/client/dist /app/apps/playbook-ai/server/client/dist

ENV PORT=8080

EXPOSE 8080

WORKDIR /app/apps/playbook-ai
CMD ["bun", "run", "server/src/server.ts"]
