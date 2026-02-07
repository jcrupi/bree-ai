# Build stage
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/kat-ai/ ./apps/kat-ai/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/kat-ai
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/apps/kat-ai/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/kat-ai/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
