FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/flysaas-types/package.json packages/flysaas-types/
COPY packages/flysaas-auth/package.json packages/flysaas-auth/
COPY apps/flysaas-client-template/package.json apps/flysaas-client-template/
COPY apps/playbook-ai/server/package.json apps/playbook-ai/server/
COPY apps/playbook-ai/client/package.json apps/playbook-ai/client/

# Install dependencies
RUN bun install

# Copy source code
COPY packages packages
COPY apps/flysaas-client-template apps/flysaas-client-template

# Development stage
FROM base AS development
WORKDIR /app
RUN mkdir -p /app/data
EXPOSE 7801
CMD ["bun", "--watch", "apps/flysaas-client-template/src/index.ts"]

# Build stage
FROM base AS builder
WORKDIR /app/apps/flysaas-client-template
RUN bun build src/index.ts --outdir=dist --target=bun

# Production stage
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Install flyctl for provisioning
RUN apk add --no-cache curl && \
    curl -L https://fly.io/install.sh | sh && \
    ln -s /root/.fly/bin/flyctl /usr/local/bin/flyctl

# Copy built app and dependencies
COPY --from=builder /app/apps/flysaas-client-template/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/flysaas-client-template/src/db ./src/db

# Create data directory
RUN mkdir -p /app/data

EXPOSE 7801
CMD ["sh", "-c", "bun src/db/migrate.ts && bun dist/index.js"]
