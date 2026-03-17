# BREE FlySaaS Admin Dashboard

Professional admin dashboard for managing the FlySaaS multi-tenant platform with BREE AI branding.

## Features

- **Dashboard**: Overview with analytics, metrics, and recent activity
- **Organizations**: Manage tenant organizations and provisioning
- **Contacts**: Multi-tenant contact management (Core CRM + Client Org)
- **Deals**: Sales pipeline tracking with stage visualization
- **AI Features**: Generate and manage AI-powered custom features
- **Settings**: User profile, API keys, notifications, and system configuration

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TanStack Query** for data fetching and state management
- **React Router** for navigation
- **Tailwind CSS** for styling with BREE brand colors
- **Recharts** for data visualization
- **Lucide React** for icons

## Prerequisites

- Bun runtime installed
- FlySaaS SuperOrg running on `http://localhost:3000`
- FlySaaS Client Org running on `http://localhost:3001` (optional)

## Installation

From the monorepo root:

```bash
# Install dependencies
bun install
```

## Development

```bash
# Start the dev server
cd apps/flysaas-admin
bun run dev

# Or from the root
bun --filter flysaas-admin dev
```

The dashboard will be available at `http://localhost:5173`

## Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
flysaas-admin/
├── src/
│   ├── components/
│   │   └── Layout.tsx           # Main layout with sidebar navigation
│   ├── lib/
│   │   ├── api.ts               # API client with authentication
│   │   └── auth-context.tsx     # React Context for auth state
│   ├── pages/
│   │   ├── Login.tsx            # Authentication page
│   │   ├── Dashboard.tsx        # Overview and analytics
│   │   ├── Organizations.tsx    # Tenant management
│   │   ├── Contacts.tsx         # Contact management
│   │   ├── Deals.tsx            # Deal pipeline
│   │   ├── AIFeatures.tsx       # AI feature generation
│   │   └── Settings.tsx         # User settings
│   ├── App.tsx                  # Routing setup
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind imports
├── index.html                   # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Configuration

### Environment Variables

Create a `.env` file in the `flysaas-admin` directory:

```env
VITE_API_URL=http://localhost:3000
```

### BREE Brand Colors

The dashboard uses custom BREE brand colors defined in `tailwind.config.js`:

```javascript
colors: {
  bree: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Primary
    600: '#0284c7',  // Primary hover
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  }
}
```

## API Integration

The dashboard connects to the FlySaaS SuperOrg API at `http://localhost:3000` by default.

### Authentication Flow

1. User signs in via `/auth/sign-in` endpoint
2. JWT token stored in localStorage
3. Token included in all subsequent API requests
4. Auth context manages user state across the app

### API Endpoints Used

- `POST /auth/sign-in` - User authentication
- `POST /auth/sign-up` - User registration
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/core/contacts` - List core CRM contacts
- `POST /api/core/contacts` - Create core contact
- `GET /api/orgs/:slug/apps/contacts` - List client org contacts
- `GET /api/core/deals` - List core deals
- `GET /api/orgs/:slug/apps/ai/features` - List AI features
- `POST /api/orgs/:slug/apps/ai/generate` - Generate AI feature

## Usage

### Demo Credentials

The login page displays demo credentials:
- Email: `demo@flysaas.dev`
- Password: `Demo123!`

### Multi-Tenant Switching

On Contacts and Deals pages, use the toggle buttons to switch between:
- **Core CRM**: Shared data across all organizations
- **Client Org**: Isolated tenant-specific data

### AI Feature Generation

1. Navigate to AI Features page
2. Click "Generate Feature"
3. Enter a feature description (e.g., "Add lead scoring to deals")
4. Click "Generate"
5. View generated code and toggle features on/off

## Development Tips

### Hot Module Replacement

Vite provides instant HMR - changes are reflected immediately without full page reload.

### TypeScript

All components are written in TypeScript with strict type checking enabled.

### Query Caching

TanStack Query caches API responses for 5 minutes by default. Mutations automatically invalidate related queries.

### State Management

- **Auth State**: Managed by `AuthContext`
- **Server State**: Managed by TanStack Query
- **UI State**: Local component state with `useState`

## Testing

Start the full FlySaaS stack:

1. Start PostgreSQL:
   ```bash
   cd apps/flysaas-superorg
   docker-compose up postgres -d
   ```

2. Start SuperOrg:
   ```bash
   cd apps/flysaas-superorg
   bun run dev
   ```

3. Start Client Org (optional):
   ```bash
   cd apps/flysaas-client-template
   ORG_ID=corp-ai bun run dev
   ```

4. Start Admin Dashboard:
   ```bash
   cd apps/flysaas-admin
   bun run dev
   ```

5. Open browser to `http://localhost:5173`

## Troubleshooting

### CORS Errors

Ensure SuperOrg is running with CORS enabled. The Elysia CORS plugin should be configured in `apps/flysaas-superorg/src/index.ts`.

### API Connection Failed

Check that:
- SuperOrg is running on port 3000
- `VITE_API_URL` is set correctly
- Network tab shows requests to `http://localhost:3000`

### Authentication Issues

Clear localStorage and try signing in again:
```javascript
localStorage.clear();
```

### Build Errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules
bun install
```

## Contributing

When adding new features:

1. Create new page in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/Layout.tsx`
4. Add API methods in `src/lib/api.ts`
5. Update this README with new features

## License

Part of the FlySaaS project. See root LICENSE file.
