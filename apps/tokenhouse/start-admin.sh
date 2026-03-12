#!/bin/bash

# TokenHouse Admin UI Startup Script
# This script starts both the gateway and the admin UI

echo "🏦 Starting TokenHouse Admin UI..."
echo ""
echo "This will start:"
echo "  • Gateway server on http://localhost:8187"
echo "  • Admin UI on http://localhost:6182"
echo ""
echo "Admin credentials:"
echo "  • Secret: admin-secret-change-me"
echo "  • User: johnny@tokenhouse.ai"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Run both services using concurrently
bun run dev:admin-full
