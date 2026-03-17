FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/flysaas-types/package.json packages/flysaas-types/
COPY packages/flysaas-auth/package.json packages/flysaas-auth/
COPY packages/flysaas-provisioning/package.json packages/flysaas-provisioning/
COPY apps/flysaas-superorg/package.json apps/flysaas-superorg/
COPY apps/playbook-ai/server/package.json apps/playbook-ai/server/
COPY apps/playbook-ai/client/package.json apps/playbook-ai/client/

# Install dependencies
RUN bun install

# Copy source code
COPY packages packages
COPY apps/flysaas-superorg apps/flysaas-superorg

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 7800
CMD ["bun", "--watch", "apps/flysaas-superorg/src/index.ts"]

# Build stage
FROM base AS builder
WORKDIR /app/apps/flysaas-superorg
RUN bun build src/index.ts --outdir=dist --target=bun

# Production stage
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/apps/flysaas-superorg/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/flysaas-superorg/src/db ./src/db

EXPOSE 7800
CMD ["bun", "dist/index.js"]
