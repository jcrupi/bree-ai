# playbooks-ai - Bun/Elysia server + static client
# Build from repo root: fly deploy --config apps/playbooks-ai/fly.toml --dockerfile apps/playbooks-ai/Dockerfile

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy the monorepo's shared and packages if needed
COPY apps/playbooks-ai/package.json apps/playbooks-ai/package.json
COPY apps/playbooks-ai/client apps/playbooks-ai/client
COPY apps/playbooks-ai/server apps/playbooks-ai/server
COPY apps/playbooks-ai/shared apps/playbooks-ai/shared
COPY apps/playbooks-ai/agentx apps/playbooks-ai/agentx
COPY apps/playbooks-ai/playbookx apps/playbooks-ai/playbookx
COPY apps/playbooks-ai/rules-engine apps/playbooks-ai/rules-engine

WORKDIR /app/apps/playbooks-ai
RUN bun install

# Build client
RUN cd client && bunx vite build

# Runtime
FROM oven/bun:1-slim

WORKDIR /app

# Ensure /app/apps directory exists
RUN mkdir -p /app/apps

# Copy the main app
COPY --from=builder /app/apps/playbooks-ai /app/apps/playbooks-ai

# Setup specialties where the loader expects them: /app/apps/<specialtyApp>/agentx/playbook
# Previously this involved multiple COPY commands, now we copy everything from agentx/apps/
# Loader for enm-ai looks for /app/apps/enm-ai/agentx/playbook
COPY --from=builder /app/apps/playbooks-ai/agentx/apps/ /app/apps/

# Final fix: Ensure client dist is in the runtime's server folder
# The server looks for join(ROOT, "client/dist") where ROOT is /app/apps/playbooks-ai
COPY --from=builder /app/apps/playbooks-ai/client/dist /app/apps/playbooks-ai/server/client/dist

ENV PORT=8080
EXPOSE 8080

WORKDIR /app/apps/playbooks-ai
CMD ["bun", "run", "server/src/server.ts"]
