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
COPY apps/talent-village-ai/ ./apps/talent-village-ai/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/talent-village-ai
RUN bun run build

# Production stage
FROM oven/bun:latest
WORKDIR /app

# Copy built assets
COPY --from=builder /app/apps/talent-village-ai/dist ./apps/talent-village-ai/dist
COPY --from=builder /app/apps/talent-village-ai/index.ts ./apps/talent-village-ai/index.ts
COPY --from=builder /app/apps/talent-village-ai/package.json ./apps/talent-village-ai/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json /app/bun.lock ./

# Install production dependencies
RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/talent-village-ai
CMD ["bun", "index.ts"]
