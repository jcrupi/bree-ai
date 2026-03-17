FROM oven/bun:1 AS base

WORKDIR /app

# Install build dependencies for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/tokenhouse/ ./apps/tokenhouse/

# Install dependencies
WORKDIR /app/apps/tokenhouse/server
RUN bun install

# Build the server
WORKDIR /app/apps/tokenhouse/server
RUN bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

COPY --from=base /app/apps/tokenhouse/server/dist ./dist
COPY --from=base /app/apps/tokenhouse/server/package.json ./
COPY --from=base /app/apps/tokenhouse/server/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "dist/index.js"]
