#!/bin/bash

# TokenHouse Demo Startup Script
# This script starts both the gateway and the chat UI

echo "🏦 Starting TokenHouse Demo..."
echo ""
echo "This will start:"
echo "  • Gateway server on http://localhost:8187"
echo "  • Chat UI on http://localhost:6181"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Run both services using concurrently
bun run dev
