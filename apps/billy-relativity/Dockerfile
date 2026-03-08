# Billy Relativity — BREE stack (Bun + React + Elysia + Eden)
# Frontend pre-built locally (bun + vite), shipped as static dist/
# Backend: Elysia/Bun serves the API + static files as a single service

FROM oven/bun:1 AS backend-builder

WORKDIR /app/backend
COPY backend/package.json backend/bun.lock ./
RUN bun install --frozen-lockfile
COPY backend/ .

# Runtime
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=backend-builder /app/backend /app/backend
# Pre-built frontend dist (run: cd frontend && bun run dev:build locally before deploying)
COPY frontend/dist /app/frontend/dist

ENV PORT=8080

EXPOSE 8080

WORKDIR /app/backend
CMD ["bun", "run", "src/index.ts"]
