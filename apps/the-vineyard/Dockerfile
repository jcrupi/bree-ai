# Build stage
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/the-vineyard/ ./apps/the-vineyard/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/the-vineyard
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/apps/the-vineyard/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/the-vineyard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
