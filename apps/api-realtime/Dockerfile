# bree-api-realtime Dockerfile
FROM oven/bun:1 AS base

WORKDIR /app

# Install build dependencies (bun:sqlite needs nothing; postgres uses pure JS)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace root + this app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/api-realtime/ ./apps/api-realtime/
# Also copy api sources so we can import shared modules (nats.ts, conversation-db.ts)
COPY apps/api/src/nats.ts ./apps/api/src/nats.ts
COPY apps/api/src/conversation-db.ts ./apps/api/src/conversation-db.ts
COPY apps/api/src/auth.ts ./apps/api/src/auth.ts
COPY apps/api/src/auth-provider.ts ./apps/api/src/auth-provider.ts
COPY apps/api/src/db.ts ./apps/api/src/db.ts
COPY apps/api/src/routes/ ./apps/api/src/routes/
# Copy api package.json so bun install picks up jose, nats, postgres, twilio etc.
COPY apps/api/package.json ./apps/api/package.json

RUN bun install

WORKDIR /app/apps/api-realtime
RUN bun run build

# Production stage — tiny alpine image
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=base /app/apps/api-realtime/dist ./dist
COPY --from=base /app/apps/api-realtime/package.json ./
COPY --from=base /app/node_modules ./node_modules

EXPOSE 3001

CMD ["bun", "dist/index.js"]
