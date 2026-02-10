# Dockerfile for The Vineyard
FROM oven/bun:1.3.5-alpine AS build
WORKDIR /app

# Copy everything for monorepo build
COPY . .

# Install dependencies
RUN bun install

# Build The Vineyard
RUN cd apps/the-vineyard && bun run build

# Production stage
FROM oven/bun:1.3.5-alpine
WORKDIR /app

# Copy only what's needed for production
COPY --from=build /app/package.json /app/bun.lockb* ./
COPY --from=build /app/apps/the-vineyard/dist ./apps/the-vineyard/dist
COPY --from=build /app/apps/the-vineyard/server.ts ./apps/the-vineyard/server.ts
COPY --from=build /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run production server
CMD ["bun", "run", "apps/the-vineyard/server.ts"]
