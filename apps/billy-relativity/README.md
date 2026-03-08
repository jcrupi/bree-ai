# Relativity Workspace API Explorer

Interactive API testing tool for Relativity eDiscovery Workspace APIs with mock data and advanced debugging capabilities.

## 🚀 Tech Stack (BREE)

- **B**un - Fast JavaScript runtime and package manager
- **R**eact - Frontend UI framework with TypeScript
- **E**lysia - Fast and type-safe backend framework
- **E**den - End-to-end type safety for Elysia APIs

## ✨ Features

### 🔍 Interactive API Explorer
- 11 pre-configured API questions covering all workspace operations
- Clean, intuitive UI for selecting and executing API calls
- Real-time mock data responses

### 📊 Pretty Data Tables
- Automatically formatted tables for array responses
- Smart column formatting (dates, booleans, status badges, numbers)
- Hover effects and visual enhancements
- Summary statistics

### 🔬 Advanced View (Developer Mode)
- **Request Details**:
  - HTTP method and endpoint
  - Complete request headers
  - POST/PUT request body (formatted JSON)
- **Response Details**:
  - HTTP status code with color coding
  - Response time in milliseconds
  - Full response body (formatted JSON)
  - Timestamp
- Expandable/collapsible interface
- Tabbed view for request vs response

### 💾 Mock Data
- 5 sample workspaces across different clients and matters
- 4 resource pools with utilization metrics
- Multiple clients, matters, and statuses
- Saved searches linked to workspaces
- Azure credentials for resource pools

## 📋 API Operations Covered

### Workspace Queries
- ✅ Get all workspaces
- ✅ Get workspace by ID
- ✅ Query saved searches for workspace

### Workspace Management
- ✅ Create new workspace
- ✅ Update workspace
- ✅ Delete workspace

### Resource Management
- ✅ Get eligible resource pools
- ✅ Get Azure credentials for resource pool

### Lookup Data
- ✅ Get all matters
- ✅ Get all clients
- ✅ Get all workspace statuses

## 🛠 Installation

### Prerequisites

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Verify Bun installation:
   ```bash
   bun --version
   ```

### Setup

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   bun install
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   bun install
   ```

## 🚀 Running the Application

### Option 1: Run Both Servers Separately

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   bun run dev
   ```
   Backend will run on: `http://localhost:3001`

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   bun run dev
   ```
   Frontend will run on: `http://localhost:3000`

3. **Open Browser**:
   Navigate to `http://localhost:3000`

### Option 2: Run from Root (Recommended)

From the project root, you can create a script to run both:

```bash
# Run backend in background
cd backend && bun run dev &

# Run frontend
cd frontend && bun run dev
```

## 📖 Usage Guide

### 1. Select an API Question
- Browse the left panel to see all available API operations
- Questions are organized by category:
  - **Workspace Queries** - Read operations
  - **Workspace Management** - Create, update, delete
  - **Resource Management** - Pools and credentials
  - **Lookup Data** - Reference data

### 2. Fill Input Parameters (if required)
- Some operations require input (e.g., Workspace ID)
- Required fields are marked with a red asterisk (*)
- Input forms appear below the question title

### 3. Execute the API Call
- Click the **"Execute API Call"** button
- Wait for the response (typically <100ms)

### 4. View Results
- **Data Table**: Pretty formatted table with smart column rendering
- **Advanced View**: Click to expand and see:
  - Full request details (method, endpoint, headers, body)
  - Complete response (status, time, data)
  - Switch between Request/Response tabs

## 🎯 Example Workflows

### Create a New Workspace

1. Select **"Create a new workspace"** from Workspace Management
2. Fill in the form:
   - **Workspace Name**: "My Test Workspace"
   - **Matter ID**: `1003697` (Patent Litigation 2026)
   - **Client ID**: `1003663` (Acme Corporation)
   - **Resource Pool ID**: `1003680` (Production Pool - East)
   - **Enable Data Grid**: ✓
   - **Keywords**: "test, demo"
   - **Notes**: "Created via API Explorer"
3. Click **Execute API Call**
4. Expand **Advanced View** to see the POST request details

### Query Saved Searches

1. Select **"What saved searches exist for a workspace?"**
2. Enter **Workspace ID**: `1234001`
3. Click **Execute API Call**
4. View the table showing saved searches with criteria

### Get Resource Pool Information

1. Select **"What resource pools are available?"**
2. Click **Execute API Call** (no input needed)
3. View utilization percentages and capacity metrics

## 🔧 API Endpoints Reference

All endpoints are prefixed with `http://localhost:3001`

### Workspace
- `GET /api/workspace` - List all workspaces
- `GET /api/workspace/:id` - Get workspace by ID
- `POST /api/workspace` - Create workspace
- `PUT /api/workspace/:id` - Update workspace
- `DELETE /api/workspace/:id` - Delete workspace
- `POST /api/workspace/:id/query-eligible-saved-searches` - Get saved searches

### Resource Pools
- `GET /api/workspace/eligible-resource-pools` - List available pools
- `GET /api/workspace/eligible-resource-pools/:poolId/eligible-azure-credentials` - Get Azure credentials

### Lookup
- `GET /api/matters` - List all matters
- `GET /api/clients` - List all clients
- `GET /api/statuses` - List all statuses

## 📊 Mock Data Reference

### Sample Workspaces

| ID | Name | Client | Matter | Status |
|----|------|--------|--------|--------|
| 1234001 | Acme Patent Discovery - Phase 1 | Acme Corporation | Patent Litigation 2026 | Active |
| 1234002 | Acme Patent Discovery - Phase 2 | Acme Corporation | Patent Litigation 2026 | Active |
| 1234003 | Global Contract Review | Global Industries Inc | Contract Dispute - Phase II | Active |
| 1234004 | TechStart Regulatory Investigation | TechStart Ventures | Regulatory Investigation | Active |
| 1234005 | Acme Archived Workspace - 2025 | Acme Corporation | Patent Litigation 2026 | Archived |

### Resource Pools

| ID | Name | Type | Capacity | Used | Utilization |
|----|------|------|----------|------|-------------|
| 1003680 | Production Pool - East | Primary | 1000 | 450 | 45% |
| 1003681 | Production Pool - West | Primary | 1000 | 320 | 32% |
| 1003682 | Development Pool | Development | 500 | 120 | 24% |
| 1003683 | Archive Pool | Archive | 2000 | 890 | 44.5% |

### Clients

| ID | Name | Industry |
|----|------|----------|
| 1003663 | Acme Corporation | Technology |
| 1003664 | Global Industries Inc | Manufacturing |
| 1003665 | TechStart Ventures | Venture Capital |

### Matters

| ID | Name | Client | Status |
|----|------|--------|--------|
| 1003697 | Patent Litigation 2026 | Acme Corporation | Active |
| 1003698 | Contract Dispute - Phase II | Global Industries Inc | Active |
| 1003699 | Regulatory Investigation | TechStart Ventures | Active |

## 🏗 Project Structure

```
BillyRelativity/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   └── mockData.ts          # Mock data store
│   │   └── index.ts                  # Elysia server
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── APIExplorer.tsx       # Main API testing interface
│   │   │   ├── AdvancedView.tsx      # REST call details viewer
│   │   │   └── DataTable.tsx         # Pretty table component
│   │   ├── services/
│   │   │   └── api.ts                # Eden API client
│   │   ├── App.tsx                   # Main app component
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── DESIGN_SPEC.md                    # Full design specification
└── README.md                          # This file
```

## 🎨 UI Components

### DataTable
- Automatically detects column types
- Smart formatting:
  - **Dates**: Locale-formatted date/time
  - **Booleans**: ✓ / ✗ icons
  - **Numbers**: Thousand separators
  - **Status**: Colored badges
  - **URLs**: Clickable links
  - **Objects**: Expandable JSON viewers

### AdvancedView
- Collapsible panel below results
- Two tabs: Request | Response
- Syntax-highlighted JSON
- Color-coded HTTP status
- Response time metrics
- Full header display

## 🔒 Security Notes

- This is a **mock API** for development and testing
- No real Relativity instance is accessed
- No authentication required (mock OAuth would be added for production)
- All data is in-memory and resets on server restart

## 🐛 Troubleshooting

### Backend won't start
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules
bun install
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
bun install
```

### Type errors in frontend
```bash
# Ensure backend is running first (for type generation)
cd backend
bun run dev

# Then start frontend in new terminal
cd frontend
bun run dev
```

### Eden client not working
- Make sure backend is running on port 3001
- Check that frontend is proxying to backend (vite.config.ts)
- Verify types are exported from backend/src/index.ts

## 📚 Additional Resources

- [Design Specification](./DESIGN_SPEC.md) - Complete design document
- [Relativity Platform Documentation](https://platform.relativity.com/RelativityOne/Content/Relativity_Platform/index.htm)
- [Elysia Documentation](https://elysiajs.com)
- [Eden Documentation](https://elysiajs.com/eden/overview.html)
- [Bun Documentation](https://bun.sh/docs)

## 🚀 Next Steps / Enhancements

### Phase 2 Features
- [ ] Real OAuth2 authentication flow
- [ ] WebSocket support for real-time updates
- [ ] Export responses to JSON/CSV
- [ ] API call history and favorites
- [ ] Bulk operations interface
- [ ] Error simulation toggles
- [ ] Performance metrics dashboard

### Integration
- [ ] Connect to real Relativity instance
- [ ] Environment configuration (dev/staging/prod)
- [ ] Request/response logging
- [ ] API versioning support

## 📝 License

MIT License - Feel free to use for testing and development

## 👥 Contributing

This is a demo/testing tool. Contributions welcome for:
- Additional mock data scenarios
- UI/UX improvements
- More API endpoints
- Documentation enhancements

---

**Built with ❤️ using the BREE stack**

*Bun + React + Elysia + Eden = Fast, Type-Safe, Beautiful*
