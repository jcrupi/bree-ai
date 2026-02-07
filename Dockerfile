# ---------- BUILD STAGE ----------
FROM oven/bun:latest AS build

WORKDIR /app

# Copy package management files first
COPY package.json bun.lock ./
COPY packages/bree-ai-core/package.json ./packages/bree-ai-core/
COPY apps/api/package.json ./apps/api/
COPY apps/genius-talent/package.json ./apps/genius-talent/
COPY apps/kat-ai/package.json ./apps/kat-ai/
COPY apps/habitaware-ai/package.json ./apps/habitaware-ai/
COPY apps/keen-ai/package.json ./apps/keen-ai/

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

# Build Genius Talent
RUN bun run --filter genius-talent build
# Build API (transpile if needed, or just run source)
RUN bun run --filter bree-ai-api build

# ---------- RUNTIME STAGE ----------
FROM oven/bun:slim

WORKDIR /app

# Copy built assets
# 1. The combined "dist" folder from the root (where Genius outputted)
COPY --from=build /app/dist ./dist

# 2. The API Source code
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./

# Install production dependencies only
COPY --from=build /app/bun.lock ./
RUN bun install --production

# Environment for Production
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_ASSETS_PATH=./dist

# Expose the single port
EXPOSE 3000

# Run the API (which serves the frontend from /dist)
CMD ["bun", "run", "apps/api/src/index.ts"]
