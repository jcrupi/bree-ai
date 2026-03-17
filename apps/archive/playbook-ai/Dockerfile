# Playbook.ai - Bun/Elysia server + static client
# Build from repo root: fly deploy -c apps/playbook-ai/fly.toml

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy playbook-ai and install deps
COPY apps/playbook-ai/package.json apps/playbook-ai/package.json
COPY apps/playbook-ai/client apps/playbook-ai/client
COPY apps/playbook-ai/server apps/playbook-ai/server
COPY apps/playbook-ai/shared apps/playbook-ai/shared
COPY apps/playbook-ai/agentx apps/playbook-ai/agentx
COPY apps/playbook-ai/playbookx apps/playbook-ai/playbookx

# Grelin AI specialty playbooks (wound, pain, derm, dme, enm, urgent, behavioral-health)
COPY apps/ai-playbooks/agentx/apps apps/ai-playbooks/agentx/apps

WORKDIR /app/apps/playbook-ai
RUN bun install

# Build client (skip tsc — vite handles transpilation in production)
RUN cd client && bunx vite build

# Runtime
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/apps/playbook-ai /app/apps/playbook-ai

# Ensure client dist is in server (DIST = server/client/dist)
COPY --from=builder /app/apps/playbook-ai/client/dist /app/apps/playbook-ai/server/client/dist

# Grelin AI agentx files
COPY --from=builder /app/apps/ai-playbooks/agentx/apps /app/apps/ai-playbooks/agentx/apps

ENV PORT=8080

EXPOSE 8080

WORKDIR /app/apps/playbook-ai
CMD ["bun", "run", "server/src/server.ts"]
