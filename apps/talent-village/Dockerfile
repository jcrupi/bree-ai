# Build stage
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Add build arguments for Vite
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL

COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/talent-village/ ./apps/talent-village/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/talent-village
RUN bun run build

# Production stage
FROM oven/bun:latest
WORKDIR /app

# Copy built assets
COPY --from=builder /app/apps/talent-village/dist ./apps/talent-village/dist
COPY --from=builder /app/apps/talent-village/index.ts ./apps/talent-village/index.ts
COPY --from=builder /app/apps/talent-village/package.json ./apps/talent-village/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json /app/bun.lock ./

# Install production dependencies
RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/talent-village
CMD ["bun", "index.ts"]
