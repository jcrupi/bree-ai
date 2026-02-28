# ── Stage 1: Build ────────────────────────────────────────────────────────────
# node:20-alpine is ~50 MB smaller than the full node image.
# We only copy what the build actually needs out of the monorepo.
FROM node:20-alpine AS builder

# Install bun (fast installs + workspace support)
RUN npm install -g bun --quiet

WORKDIR /app

# 1. Copy root workspace manifest + lockfile first (better layer caching)
COPY package.json bun.lock ./

# 2. Copy only the packages and app that kat-ai depends on
COPY packages/ ./packages/
COPY apps/kat-ai/ ./apps/kat-ai/

# 3. Install (workspace-aware, skips devDeps not needed for other apps)
RUN bun install

# 4. Build the Vite SPA
WORKDIR /app/apps/kat-ai
RUN bun run build


# ── Stage 2: Serve ────────────────────────────────────────────────────────────
# nginx:alpine is ~8 MB. Nothing else is copied in — no Node, no Bun, no sources.
FROM nginx:alpine

# Copy compiled assets
COPY --from=builder /app/apps/kat-ai/dist /usr/share/nginx/html

# Copy Nginx config
COPY apps/kat-ai/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint — generates /config.js from Fly secrets at container start
COPY apps/kat-ai/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

CMD ["/docker-entrypoint.sh"]
