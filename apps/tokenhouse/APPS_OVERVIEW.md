# TokenHouse Apps Overview

Complete guide to all TokenHouse applications and how to use them.

## Available Apps

### 1. 🚀 Starter App (NEW!)
**Location**: `examples/starter-app`
**Port**: 3000
**Purpose**: Minimal React app demonstrating Better-Auth integration

**Features**:
- ✅ Email/password authentication
- ✅ JWT custom claims display
- ✅ Organization dashboard
- ✅ Rate limits and allowed models
- ✅ Interactive chat demo
- ✅ Beautiful gradient UI

**Quick Start**:
```bash
cd examples/starter-app
bun install
bun run dev
```

**Test Login**:
- Email: `johnny@tokenhouse.ai`
- Password: `ChangeMe123!`

**What You'll See**:
- Organization info from JWT claims
- Your rate limits (requests/min, tokens/day)
- Allowed AI models
- Interactive chat interface
- Raw JWT token viewer

---

### 2. 🎛️ Admin UI
**Location**: `examples/admin-ui`
**Port**: 5174
**Purpose**: Organization and user management interface

**Features**:
- ✅ View all organizations
- ✅ Create new organizations
- ✅ Create new users
- ✅ Manage billing tiers
- ✅ Configure allowed models
- ✅ Set rate limits

**Quick Start**:
```bash
cd examples/admin-ui
bun install
bun run dev
```

**Admin Credentials**:
- Admin Secret: `your-secret-admin-key-change-me`

**What You Can Do**:
- Create organizations with custom configurations
- Add users to organizations
- View org secrets (shown once)
- Configure model access per org
- Set custom rate limits

---

### 3. 🌐 Gateway
**Location**: `gateway`
**Port**: 8187
**Purpose**: API gateway with dual authentication

**Features**:
- ✅ Better-Auth endpoints (`/auth/*`)
- ✅ JWKS endpoint for JWT verification
- ✅ Legacy API token support
- ✅ Chat completions API
- ✅ Usage statistics API
- ✅ Admin API

**Quick Start**:
```bash
cd gateway
bun run src/index.ts
```

**Available Endpoints**:

**Better-Auth (RS256)**:
```bash
POST /auth/sign-in/email        # User sign-in
POST /auth/sign-up/email        # User sign-up
POST /auth/sign-out             # Sign out
GET  /auth/.well-known/jwks.json  # Public keys
GET  /auth/session              # Current session
```

**Legacy API (HS256)**:
```bash
POST /auth/token                # Get API token with org credentials
```

**API Endpoints** (accept both JWT types):
```bash
POST /chat/completions          # AI chat completions
GET  /usage/stats               # Usage statistics
```

**Admin Endpoints**:
```bash
POST /admin/orgs                # Create organization
POST /admin/users               # Create user
GET  /admin/orgs                # List organizations
GET  /admin/users               # List users
```

---

## Quick Start: Run Everything

### Option 1: Start Gateway Only
```bash
cd /Users/johnnycrupi/Documents/devel/KickAnalytics/bree-ai/apps/tokenhouse
bun run gateway/src/index.ts
```

### Option 2: Start Gateway + Admin UI
```bash
cd /Users/johnnycrupi/Documents/devel/KickAnalytics/bree-ai/apps/tokenhouse
./start-admin.sh
```

This starts:
- Gateway on port 8187
- Admin UI on port 5174

### Option 3: Full Stack (Gateway + Admin + Starter)
```bash
# Terminal 1: Gateway
cd gateway
bun run src/index.ts

# Terminal 2: Admin UI
cd examples/admin-ui
bun run dev

# Terminal 3: Starter App
cd examples/starter-app
bun run dev
```

This starts:
- Gateway on port 8187
- Admin UI on port 5174
- Starter App on port 3000

---

## Common Workflows

### For End Users (Starter App)

1. **Sign In**
   - Open http://localhost:3000
   - Enter email/password
   - View your organization dashboard

2. **Test Chat API**
   - Type a message in the chat input
   - See the AI response
   - All authentication handled automatically

3. **View JWT Claims**
   - Expand "View JWT Token" section
   - See all custom claims embedded in token
   - Verify org_id, allowed_models, rate_limits

### For Administrators (Admin UI)

1. **Create Organization**
   - Open http://localhost:5174
   - Click "Create Organization" tab
   - Fill in org details
   - Select billing tier and models
   - Copy the org_secret (shown once!)

2. **Create User**
   - Click "Create User" tab
   - Enter email and name
   - Select organization(s)
   - User receives email to set password

3. **View All Orgs**
   - Click "Organizations" tab
   - See all orgs with their configs
   - View billing tiers and rate limits

### For Developers (API Integration)

1. **Get JWT Token (Better-Auth)**
```bash
# Sign in
curl -X POST http://localhost:8187/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johnny@tokenhouse.ai",
    "password": "ChangeMe123!"
  }'
```

2. **Get API Token (Legacy)**
```bash
# Get token with org credentials
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "tokenhouse-super-org",
    "org_secret": "ths_super_secret_abc123"
  }'
```

3. **Use Token for API Call**
```bash
# Chat completion
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    TokenHouse Ecosystem                       │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Starter App    │      │   Admin UI      │      │   Custom App    │
│  (Port 3000)    │      │  (Port 5174)    │      │                 │
│                 │      │                 │      │                 │
│  - Sign In      │      │  - Org Mgmt     │      │  - Your App     │
│  - Dashboard    │      │  - User Mgmt    │      │  - Your Logic   │
│  - Chat Demo    │      │  - Billing      │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  TokenHouse Gateway         │
                    │  (Port 8187)                │
                    │                             │
                    │  ┌──────────────────────┐   │
                    │  │  Better-Auth         │   │
                    │  │  - /auth/*           │   │
                    │  │  - RS256 JWT         │   │
                    │  │  - Custom Claims     │   │
                    │  └──────────────────────┘   │
                    │                             │
                    │  ┌──────────────────────┐   │
                    │  │  Legacy API Auth     │   │
                    │  │  - /auth/token       │   │
                    │  │  - HS256 JWT         │   │
                    │  └──────────────────────┘   │
                    │                             │
                    │  ┌──────────────────────┐   │
                    │  │  API Routes          │   │
                    │  │  - /chat/completions │   │
                    │  │  - /usage/stats      │   │
                    │  └──────────────────────┘   │
                    │                             │
                    │  ┌──────────────────────┐   │
                    │  │  Admin Routes        │   │
                    │  │  - /admin/orgs       │   │
                    │  │  - /admin/users      │   │
                    │  └──────────────────────┘   │
                    └─────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │  SQLite Database            │
                    │  (tokenhouse.db)            │
                    │                             │
                    │  - users                    │
                    │  - organizations            │
                    │  - organization_members     │
                    │  - sessions                 │
                    └─────────────────────────────┘
```

---

## Database State

**Organizations (7)**:
1. tokenhouse-super-org (Enterprise) - 1000 req/min, 100M tokens/day
2. tokenhouse-community (Free) - 60 req/min, 500K tokens/day
3. tokenhouse-professional (Pro) - 200 req/min, 5M tokens/day
4. happyai (Enterprise) - 300 req/min, 10M tokens/day
5. groovy-relativity (Pro) - 250 req/min, 8M tokens/day
6. freehabits (Starter) - 150 req/min, 3M tokens/day
7. org_demo123 (Pro) - 100 req/min, 1M tokens/day

**Users (2)**:
- johnny@tokenhouse.ai (Owner of tokenhouse-super-org)
- demo@tokenhouse.ai (Owner of org_demo123)

**Default Password**: `ChangeMe123!`

---

## Comparison: Starter vs Admin UI

### Starter App 🚀
**Purpose**: End-user application
**Auth**: Better-Auth (email/password)
**Target**: Application users
**Features**: Dashboard, chat, JWT viewer
**Use Case**: Reference implementation for your app

### Admin UI 🎛️
**Purpose**: Platform administration
**Auth**: Admin secret key
**Target**: Platform administrators
**Features**: Org/user management, billing config
**Use Case**: Platform management and configuration

---

## Next Steps

### 1. Try the Starter App
```bash
cd examples/starter-app
bun run dev
```
- Sign in with johnny@tokenhouse.ai
- Explore the dashboard
- Test the chat demo
- View the JWT token

### 2. Customize for Your Needs
- Fork the starter app
- Add your features
- Customize the UI
- Deploy to production

### 3. Build Your Own App
Use the starter app as a reference:
- Copy the Better-Auth integration
- Use the JWT verification pattern
- Implement your business logic

---

## Documentation Index

### Core Documentation
- `README.md` - Main project overview
- `INTEGRATION_SUMMARY.md` - Complete integration summary

### Better-Auth Guides
- `HOW_BETTER_AUTH_JWT_WORKS.md` - JWT deep dive (700+ lines)
- `CUSTOM_CLAIMS_GUIDE.md` - Adding custom claims
- `BETTER_AUTH_INTEGRATION.md` - Integration guide
- `MIGRATION_COMPLETE.md` - Migration summary

### Gateway Documentation
- `GATEWAY_INTEGRATION_COMPLETE.md` - Gateway integration details

### App-Specific
- `examples/starter-app/README.md` - Starter app guide
- `examples/admin-ui/README.md` - Admin UI guide

---

## Support

Need help?
- 📖 Check the documentation files in this directory
- 🌐 Better-Auth: https://better-auth.com
- 🎨 Better-Auth UI: https://better-auth-ui.com
- 🔑 JWT Debugger: https://jwt.io

## License

MIT
