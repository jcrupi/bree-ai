# Quick Start Guide

Get the Relativity Workspace API Explorer running in 3 minutes!

## Prerequisites

Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation & Setup

### 1. Install Dependencies

```bash
# Backend
cd backend
bun install

# Frontend
cd ../frontend
bun install
```

### 2. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```

You should see:
```
🚀 Relativity Workspace API Explorer is running!

📍 Server: http://localhost:3001
📚 Swagger: http://localhost:3001/swagger
🏥 Health: http://localhost:3001/health

Stack: BREE (Bun + React + Elysia + Eden)
```

**Terminal 2 - Frontend:**
```bash
cd frontend
bun run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3. Open the App

Navigate to **http://localhost:3000** in your browser.

## First API Call

1. **Select a question** from the left panel:
   - Click on **"What workspaces exist in the system?"**

2. **Execute the call**:
   - Click the blue **"Execute API Call"** button

3. **View results**:
   - See the pretty table showing 5 mock workspaces
   - Click **"Advanced View"** to expand REST call details

4. **Explore the details**:
   - Switch between **Request** and **Response** tabs
   - See the GET request with headers
   - View the formatted JSON response

## Try More Operations

### Create a Workspace

1. Select **"Create a new workspace"**
2. Fill in:
   - Name: `My Test Workspace`
   - Matter ID: `1003697`
   - Client ID: `1003663`
   - Resource Pool ID: `1003680`
3. Click **Execute API Call**
4. Expand **Advanced View** → **Request** tab to see the POST body

### Query Saved Searches

1. Select **"What saved searches exist for a workspace?"**
2. Enter Workspace ID: `1234001`
3. Execute and view saved searches in table

### Get Resource Pools

1. Select **"What resource pools are available?"**
2. Execute (no input needed)
3. View pools with utilization metrics

## Troubleshooting

### Port Already in Use

If port 3001 or 3000 is already in use:

**Backend:**
```bash
# backend/src/index.ts
.listen(3002)  # Change to different port
```

**Frontend:**
```bash
# frontend/vite.config.ts
server: {
  port: 3001,  # Change to different port
```

### Module Not Found

```bash
# Clean install
cd backend && rm -rf node_modules && bun install
cd frontend && rm -rf node_modules && bun install
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [DESIGN_SPEC.md](./DESIGN_SPEC.md) for architecture details
- Explore all 11 API operations
- Experiment with creating, updating, and deleting workspaces

## API Endpoints Overview

All available at `http://localhost:3001/api/`:

- `GET /workspace` - All workspaces
- `GET /workspace/:id` - Single workspace
- `POST /workspace` - Create workspace
- `PUT /workspace/:id` - Update workspace
- `DELETE /workspace/:id` - Delete workspace
- `POST /workspace/:id/query-eligible-saved-searches` - Saved searches
- `GET /workspace/eligible-resource-pools` - Resource pools
- `GET /matters` - All matters
- `GET /clients` - All clients
- `GET /statuses` - All statuses

## Swagger Documentation

View interactive API docs at:
**http://localhost:3001/swagger**

---

**That's it! You're ready to explore the Relativity Workspace APIs! 🚀**
