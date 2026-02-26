# ── Build stage ─────────────────────────────────────────────────────────────
# Uses oven/bun directly — BREE monorepo never uses Node.
FROM oven/bun:latest AS builder

WORKDIR /app

# Build-time Vite env (baked into the JS bundle at build time)
ARG VITE_API_URL=https://bree-api.fly.dev
ENV VITE_API_URL=$VITE_API_URL

# Copy workspace manifests first so bun install can be cached
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/talent-village-ai/ ./apps/talent-village-ai/

# Install all workspace deps
RUN bun install

# Vite build (outputs to apps/talent-village-ai/dist)
WORKDIR /app/apps/talent-village-ai
RUN bun run build

# ── Runtime stage ────────────────────────────────────────────────────────────
# Minimal Bun image — serves the SPA static files via index.ts
FROM oven/bun:slim AS runtime

WORKDIR /app/apps/talent-village-ai

# Only copy what the server needs at runtime:
#   - compiled static assets
#   - the tiny Bun HTTP server entry point
#   - package.json (so bun knows the module type)
COPY --from=builder /app/apps/talent-village-ai/dist ./dist
COPY --from=builder /app/apps/talent-village-ai/index.ts ./index.ts
COPY --from=builder /app/apps/talent-village-ai/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "index.ts"]
