# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

ARG VITE_API_URL=https://bree-api.fly.dev

# Copy workspace root
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/geni-crazy-week/ ./apps/geni-crazy-week/

# Stub other workspace members so bun install is happy
RUN mkdir -p apps/playbook-ai/server apps/playbook-ai/client && \
  echo '{"name":"playbook-ai","private":true}' > apps/playbook-ai/package.json && \
  echo '{"name":"playbook-ai-server","private":true}' > apps/playbook-ai/server/package.json && \
  echo '{"name":"playbook-ai-client","private":true}' > apps/playbook-ai/client/package.json

RUN bun install

WORKDIR /app/apps/geni-crazy-week
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Runtime stage
FROM nginx:alpine

COPY --from=build /app/apps/geni-crazy-week/dist /usr/share/nginx/html
COPY apps/geni-crazy-week/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
