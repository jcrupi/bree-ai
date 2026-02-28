#!/bin/sh
# docker-entrypoint.sh
# Writes runtime config from Fly.io env vars into /config.js before Nginx starts.
# This lets `fly secrets set` take effect on the next machine restart — no rebuild needed.

set -e

cat > /usr/share/nginx/html/config.js <<EOF
window.__BREE_CONFIG__ = {
  API_URL:                      "${VITE_API_URL:-https://bree-api.fly.dev}",
  REALTIME_URL:                 "${VITE_REALTIME_URL:-https://bree-api-realtime.fly.dev}",
  APP_NAME:                     "${VITE_APP_NAME:-KAT.ai}",
  BRAND_ID:                     "${VITE_BRAND_ID:-kat-ai}",
  RAGSTER_DEFAULT_ORG_ID:       "${VITE_RAGSTER_DEFAULT_ORG_ID:-kat.ai}",
  RAGSTER_DEFAULT_USER_ID:      "${VITE_RAGSTER_DEFAULT_USER_ID:-user@kat.ai}",
  RAGSTER_DEFAULT_COLLECTION_ID:"${VITE_RAGSTER_DEFAULT_COLLECTION_ID:-}"
};
EOF

exec nginx -g 'daemon off;'
