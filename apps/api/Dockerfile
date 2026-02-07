# Use Bun's official image
FROM oven/bun:1 AS base

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Build the API
WORKDIR /app/apps/api
RUN bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose the API port
EXPOSE 3000

# Run the API server
CMD ["bun", "dist/index.js"]
