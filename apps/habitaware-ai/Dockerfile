# Build stage
FROM node:20-alpine AS builder

# Install bun
RUN npm install -g bun

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
ARG VITE_OPENAI_API_KEY

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
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/habitaware-ai/ ./apps/habitaware-ai/

# Install dependencies
RUN bun install

# Build the app
WORKDIR /app/apps/habitaware-ai
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/apps/habitaware-ai/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/habitaware-ai/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
