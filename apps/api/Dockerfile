# Use Bun's official image
FROM oven/bun:1 AS base

WORKDIR /app

# Install build dependencies for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy everything (filtered by .dockerignore)
COPY . .

# Install dependencies
RUN bun install

# Build/run directly (avoiding complex bundle issues)
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["bun", "src/index.ts"]
