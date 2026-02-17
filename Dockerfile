# ---------- BUILD STAGE ----------
FROM oven/bun:latest AS build

WORKDIR /app

# Install Python and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package management files first
COPY package.json bun.lock ./
COPY packages/bree-ai-core/package.json ./packages/bree-ai-core/
COPY apps/api/package.json ./apps/api/
COPY apps/genius-talent/package.json ./apps/genius-talent/
COPY apps/kat-ai/package.json ./apps/kat-ai/
COPY apps/habitaware-ai/package.json ./apps/habitaware-ai/
COPY apps/the-vineyard/package.json ./apps/the-vineyard/

# Install dependencies (utilizing cache)
RUN bun install

# Copy source code
COPY . .

# Build all apps (or specific ones as needed)
# This produces:
# - apps/api/dist (if configured)
# - apps/genius-talent/dist (via vite config ../../dist or strict local)
# 
# Note: Our best practice configures vite to output to ../../dist (root dist)
# We'll run the build for the target app. For now, let's assume we are building 'genius-talent' as the primary frontend
# If we want a multi-frontend container, we'd build all and serve them under paths, but usually it's 1 App + 1 API per Fly Machine.

# Create dist folder (may be empty for API-only deployments)
RUN mkdir -p /app/dist

# Build Genius Talent
RUN bun run --filter genius-talent build || true
# Build API (transpile if needed, or just run source)
RUN bun run --filter bree-ai-api build || true

# ---------- RUNTIME STAGE ----------
FROM oven/bun:slim

WORKDIR /app

# Copy built assets
# 1. The combined "dist" folder from the root (where Genius outputted) - may be empty
COPY --from=build /app/dist ./dist

# 2. The API Source code (run from source, no build needed)
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

# Environment for Production
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_ASSETS_PATH=./dist

# Expose the single port
EXPOSE 3000

# Run the API from source (Bun can run TypeScript directly)
CMD ["bun", "run", "apps/api/src/index.ts"]
