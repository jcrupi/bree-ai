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
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies (utilizing cache)
RUN bun install

# Build API
RUN bun run --filter bree-ai-api build

# ---------- RUNTIME STAGE ----------
FROM oven/bun:slim

WORKDIR /app

# Copy API and dependencies
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
