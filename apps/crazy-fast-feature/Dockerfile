FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun --quiet

WORKDIR /app

# Copy workspace root manifests
COPY package.json bun.lock ./

# Copy shared packages
COPY packages/ ./packages/

# Copy app source
COPY apps/crazy-fast-feature/ ./apps/crazy-fast-feature/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/crazy-fast-feature
RUN bun run build

# --- Production image ---
FROM nginx:alpine

COPY --from=builder /app/apps/crazy-fast-feature/dist /usr/share/nginx/html
COPY apps/crazy-fast-feature/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
