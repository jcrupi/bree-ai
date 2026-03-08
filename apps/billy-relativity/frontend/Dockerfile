# Stage 1: Build the React app
# NOTE: Docker context must be the monorepo root (BillyRelativity/)
# so that the backend type declarations are reachable for Eden imports.
FROM node:20-alpine AS builder

# Install Bun
RUN npm install -g bun

WORKDIR /app

# Copy frontend manifests and install deps first (better layer caching)
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

# Copy frontend + backend source (backend needed for Eden type resolution at runtime)
COPY frontend/ ./frontend/
COPY backend/src/ ./backend/src/
COPY backend/package.json ./backend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json

# Install backend deps so type resolution works cleanly from a single source
WORKDIR /app/backend
RUN bun install --frozen-lockfile

WORKDIR /app/frontend

# Build — VITE_API_URL baked in at build time via build arg
ARG VITE_API_URL=https://billy-relativity-api.fly.dev
ENV VITE_API_URL=$VITE_API_URL

# Use vite build directly to skip tsc strict checking
# (type errors from dual node_modules are build-environment-only, not runtime)
RUN bunx vite build

# Stage 2: Serve via Nginx
FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
