#!/bin/bash

# Relativity API Explorer - Startup Script
# Starts both backend and frontend servers

echo "🚀 Starting Relativity Workspace API Explorer..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "${YELLOW}⚠️  Bun is not installed!${NC}"
    echo "Install it with: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "${BLUE}📦 Starting Backend (Elysia)...${NC}"
cd backend
bun install > /dev/null 2>&1
bun run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend
echo "${BLUE}⚛️  Starting Frontend (React + Vite)...${NC}"
cd ../frontend
bun install > /dev/null 2>&1
bun run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "${GREEN}✅ Both servers are running!${NC}"
echo ""
echo "📍 Frontend: ${BLUE}http://localhost:3000${NC}"
echo "📍 Backend:  ${BLUE}http://localhost:3001${NC}"
echo "📚 Swagger:  ${BLUE}http://localhost:3001/swagger${NC}"
echo ""
echo "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait
