# TokenHouse Starter App

A minimal React + TypeScript starter app demonstrating Better-Auth integration with the TokenHouse Gateway.

## Features

✅ **User Authentication** - Email/password sign-in with Better-Auth
✅ **JWT Custom Claims** - Organization data embedded in JWT
✅ **Chat API Demo** - Test AI completions with your token
✅ **Organization Dashboard** - View org info, rate limits, and allowed models
✅ **Beautiful UI** - Gradient design with responsive layout

## What This Demonstrates

### 1. Better-Auth Integration
- Sign in with email/password
- User session management
- Automatic JWT token handling

### 2. JWT Custom Claims
The JWT includes organization data from the database:
```json
{
  "org_id": "tokenhouse-super-org",
  "org_name": "TokenHouse",
  "org_role": "owner",
  "billing_tier": "enterprise",
  "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"],
  "rate_limits": {
    "requests_per_minute": 1000,
    "tokens_per_day": 100000000
  }
}
```

### 3. API Authentication
Uses the JWT token to call protected API endpoints:
```typescript
fetch(`${API_BASE}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.token}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...]
  })
})
```

## Quick Start

### Prerequisites
1. TokenHouse Gateway running on port 8187
2. Better-auth database created (see `MIGRATION_COMPLETE.md`)

### Installation

```bash
cd examples/starter-app
bun install
```

### Development

```bash
# Start the app (runs on http://localhost:3000)
bun run dev
```

### Test Credentials

**User Login**:
- Email: `johnny@tokenhouse.ai`
- Password: `ChangeMe123!`

Or:
- Email: `demo@tokenhouse.ai`
- Password: `ChangeMe123!`

## How It Works

### 1. AuthProvider Setup
Wraps the entire app with Better-Auth context:

```typescript
<AuthProvider
  auth={{
    baseURL: 'http://localhost:8187',
    basePath: '/auth'
  }}
>
  <App />
</AuthProvider>
```

### 2. Authentication UI
Uses Better-Auth UI components for login:

```typescript
<AuthCard
  onSuccess={(session) => {
    console.log('Signed in!', session)
  }}
/>
```

### 3. Session Hook
Access current user session and JWT:

```typescript
const { data: session, isPending } = useSession()

// session.token - JWT with custom claims
// session.user - User info
// session.org_id - Organization ID
// session.allowed_models - Allowed AI models
// session.rate_limits - Rate limits
```

### 4. Protected API Calls
Use JWT token for authentication:

```typescript
fetch('/chat/completions', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
})
```

## Architecture

```
┌─────────────────────────────────────┐
│      React App (Port 3000)          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    AuthProvider             │   │
│  │  - Better-Auth UI           │   │
│  │  - Session Management       │   │
│  └─────────────────────────────┘   │
│               │                     │
│               ▼                     │
│  ┌─────────────────────────────┐   │
│  │    Dashboard                │   │
│  │  - Org Info                 │   │
│  │  - Rate Limits              │   │
│  │  - Chat Demo                │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
               │
               │ HTTP + JWT
               ▼
┌─────────────────────────────────────┐
│   TokenHouse Gateway (Port 8187)    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Better-Auth Handler        │   │
│  │  - POST /auth/sign-in       │   │
│  │  - GET /auth/session        │   │
│  │  - GET /auth/jwks           │   │
│  └─────────────────────────────┘   │
│               │                     │
│               ▼                     │
│  ┌─────────────────────────────┐   │
│  │  JWT Verification           │   │
│  │  - RS256 via JWKS           │   │
│  │  - Extract Custom Claims    │   │
│  └─────────────────────────────┘   │
│               │                     │
│               ▼                     │
│  ┌─────────────────────────────┐   │
│  │  API Routes                 │   │
│  │  - POST /chat/completions   │   │
│  │  - GET /usage/stats         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Component Breakdown

### App.tsx
Main application component with routing logic:
- Not signed in → Show AuthCard
- Signed in → Show Dashboard

### Dashboard
Displays all JWT custom claims:
- **Organization Info**: org_id, org_name, org_role, billing_tier
- **Rate Limits**: requests_per_minute, tokens_per_day
- **Allowed Models**: List of accessible AI models
- **Chat Demo**: Interactive chat interface
- **JWT Token**: Expandable token viewer (for debugging)

### AuthCard
Better-Auth UI component providing:
- Email/password sign-in
- Sign-up flow
- Forgot password
- Social login (if configured)

### UserButton
Dropdown menu for signed-in users:
- User profile
- Settings
- Sign out

## Customization

### Change API Base URL
Edit the `API_BASE` constant in `App.tsx`:

```typescript
const API_BASE = 'http://localhost:8187'
```

### Add More Features
The session object contains all custom claims from the JWT. You can use them for:
- Model selection dropdown
- Usage tracking display
- Rate limit warnings
- Role-based UI

### Styling
All styles are in `App.css`. The design uses:
- Purple gradient background (#667eea → #764ba2)
- Card-based layout
- Responsive grid system
- Dark code blocks

## Development Tips

### Hot Module Replacement
Vite provides instant HMR - changes appear immediately without refresh.

### TypeScript Support
Full TypeScript support for Better-Auth session types.

### Debugging
Open the "View JWT Token" section to inspect the raw JWT and verify custom claims.

### CORS
If you get CORS errors, ensure the gateway has CORS enabled:

```typescript
// gateway/src/index.ts
app.use(cors())
```

## Production Deployment

### Build
```bash
bun run build
```

### Preview
```bash
bun run preview
```

### Environment Variables
Create `.env` for production:

```env
VITE_API_BASE=https://api.tokenhouse.ai
```

Then use in code:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8187'
```

## Next Steps

### Add More Features
- [ ] Organization switcher (for users in multiple orgs)
- [ ] Usage analytics dashboard
- [ ] Settings page for user profile
- [ ] Password reset flow
- [ ] Email verification

### Customize Better-Auth
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Customize email templates
- [ ] Add two-factor authentication
- [ ] Implement session management

## Resources

- [Better-Auth Docs](https://better-auth.com)
- [Better-Auth UI Docs](https://better-auth-ui.com)
- [TokenHouse Integration Guide](../../GATEWAY_INTEGRATION_COMPLETE.md)
- [Custom Claims Guide](../../CUSTOM_CLAIMS_GUIDE.md)

## License

MIT
