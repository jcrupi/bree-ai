# Build stage
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

WORKDIR /app

# Copy workspace files
WORKDIR /app

# Add build arguments for Vite
ARG VITE_API_URL
ARG VITE_RAGSTER_API_URL
ARG VITE_AGENTX_URL
ARG VITE_COLLECTIVE_URL
ARG VITE_ANTIMATTER_URL
ARG VITE_RAGSTER_DEFAULT_ORG_ID
ARG VITE_RAGSTER_DEFAULT_USER_ID
ARG VITE_APP_NAME
ARG VITE_BRAND_ID

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RAGSTER_API_URL=$VITE_RAGSTER_API_URL
ENV VITE_AGENTX_URL=$VITE_AGENTX_URL
ENV VITE_COLLECTIVE_URL=$VITE_COLLECTIVE_URL
ENV VITE_ANTIMATTER_URL=$VITE_ANTIMATTER_URL
ENV VITE_RAGSTER_DEFAULT_ORG_ID=$VITE_RAGSTER_DEFAULT_ORG_ID
ENV VITE_RAGSTER_DEFAULT_USER_ID=$VITE_RAGSTER_DEFAULT_USER_ID
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_BRAND_ID=$VITE_BRAND_ID

COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/genius-talent/ ./apps/genius-talent/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/genius-talent
RUN bun run build

# Production stage
FROM oven/bun:latest
WORKDIR /app

# Copy built assets
COPY --from=builder /app/apps/genius-talent/dist ./apps/genius-talent/dist
COPY --from=builder /app/apps/genius-talent/index.ts ./apps/genius-talent/index.ts
COPY --from=builder /app/apps/genius-talent/package.json ./apps/genius-talent/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./bun.lock ./

# Install production dependencies
RUN bun install --production

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/genius-talent
CMD ["bun", "index.ts"]
