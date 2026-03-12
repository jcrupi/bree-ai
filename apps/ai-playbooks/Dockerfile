# ai-playbooks - Bun/Elysia server + static client
# Build from repo root: fly deploy --config apps/ai-playbooks/fly.toml --dockerfile apps/ai-playbooks/Dockerfile

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy the monorepo's shared and packages if needed
COPY apps/ai-playbooks/package.json apps/ai-playbooks/package.json
COPY apps/ai-playbooks/client apps/ai-playbooks/client
COPY apps/ai-playbooks/server apps/ai-playbooks/server
COPY apps/ai-playbooks/shared apps/ai-playbooks/shared
COPY apps/ai-playbooks/agentx apps/ai-playbooks/agentx
COPY apps/ai-playbooks/playbookx apps/ai-playbooks/playbookx
COPY apps/ai-playbooks/rules-engine apps/ai-playbooks/rules-engine

# Copy playbook-ai's agentx (for 1040, HIPAA, etc.)
COPY apps/playbook-ai/agentx apps/playbook-ai/agentx

WORKDIR /app/apps/ai-playbooks
RUN bun install

# Build client
RUN cd client && bunx vite build

# Runtime
FROM oven/bun:1-slim

WORKDIR /app

# Ensure /app/apps directory exists
RUN mkdir -p /app/apps

# Copy the main app
COPY --from=builder /app/apps/ai-playbooks /app/apps/ai-playbooks

# Setup specialties where the loader expects them: /app/apps/<specialtyApp>/agentx/playbook
# 1. Grelin Specialties (from ai-playbooks/agentx/apps)
# Builder has /app/apps/ai-playbooks/agentx/apps/enm-ai/...
# Loader for enm-ai looks for /app/apps/enm-ai/agentx/playbook
COPY --from=builder /app/apps/ai-playbooks/agentx/apps/ /app/apps/

# 2. Standard Specialties (from playbook-ai)
# Builder has /app/apps/playbook-ai/agentx/...
# Loader for 1040-simple looks for /app/apps/playbook-ai/agentx/playbook
RUN mkdir -p /app/apps/playbook-ai
COPY --from=builder /app/apps/playbook-ai/agentx /app/apps/playbook-ai/agentx

# Final fix: Ensure client dist is in the runtime's server folder
# The server looks for join(ROOT, "client/dist") where ROOT is ../.. from server/src
# So ROOT is /app/apps/ai-playbooks.
COPY --from=builder /app/apps/ai-playbooks/client/dist /app/apps/ai-playbooks/server/client/dist

ENV PORT=8080
EXPOSE 8080

WORKDIR /app/apps/ai-playbooks
CMD ["bun", "run", "server/src/server.ts"]
