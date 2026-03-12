# TokenHouse Admin UI

Professional admin interface for managing TokenHouse organizations and users.

## Features

- **Organization Management**: View and create organizations with different billing tiers
- **User Management**: Create users and assign them to organizations
- **Super Org Dashboard**: Platform owner view with grouped organization display
- **Real-time Data**: Refresh organization and user lists on demand

## Quick Start

### Start Admin UI

From the root directory:

```bash
# Start gateway + admin UI
./start-admin.sh

# Or manually
bun run dev:admin-full
```

The admin UI will be available at: http://localhost:6182

### Admin Credentials

- **Admin Secret**: `admin-secret-change-me`
- **User Email**: `johnny@tokenhouse.ai`
- **Org ID**: `tokenhouse-super-org`

## Organization Structure

### Platform Owner
- **TokenHouse (tokenhouse-super-org)**: Platform owner with full access
  - Billing: Enterprise
  - Limits: 1000 req/min, 100M tokens/day
  - Owner: johnny@tokenhouse.ai

### Groups
- **TokenHouse Community (tokenhouse-community)**: Free tier group
  - Limits: 60 req/min, 500K tokens/day

- **TokenHouse Professional (tokenhouse-professional)**: Pro tier group
  - Limits: 200 req/min, 5M tokens/day

### Organizations
- **HappyAI (happyai)**: Enterprise tier
  - Limits: 300 req/min, 10M tokens/day

- **Groovy Relativity (groovy-relativity)**: Pro tier
  - Limits: 250 req/min, 8M tokens/day

- **FreeHabits (freehabits)**: Starter tier
  - Limits: 150 req/min, 3M tokens/day

## Creating Organizations

1. Click "➕ Create Org" tab
2. Fill in the form:
   - **Organization Name**: Human-readable name (e.g., "Acme Corporation")
   - **Initial User Email**: Email for the first admin user
   - **Billing Tier**: Select tier (free/starter/pro/enterprise)
   - **Allowed Models**: Check models this org can access
3. Click "➕ Create Organization"
4. **Important**: Save the org secret immediately - it's only shown once!

### Billing Tiers

| Tier | Requests/Min | Tokens/Day | Best For |
|------|--------------|------------|----------|
| Free | 60 | 500K | Testing & small projects |
| Starter | 150 | 3M | Growing startups |
| Pro | 200 | 5M | Production applications |
| Enterprise | 300 | 10M | Large-scale deployments |

## Creating Users

1. Click "➕ Create User" tab
2. Fill in the form:
   - **Email**: User's email address (required)
   - **Name**: User's full name (optional)
   - **Organizations**: Select one or more orgs for this user
3. Click "➕ Create User"
4. User can now authenticate using their email and org credentials

## Available Models

All organizations can access a subset of these models:

- **OpenAI**: gpt-4o, gpt-4o-mini, o1, o1-mini
- **Anthropic**: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022

## Admin API Endpoints

The admin UI uses these endpoints (requires `X-Admin-Secret` header):

### Organizations
- `GET /admin/orgs` - List all organizations
- `POST /admin/orgs` - Create new organization
  ```json
  {
    "org_name": "Acme Corp",
    "initial_user_email": "admin@acme.com",
    "billing_tier": "pro",
    "allowed_models": ["gpt-4o", "claude-3-5-sonnet-20241022"]
  }
  ```

### Users
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
  ```json
  {
    "email": "user@example.com",
    "name": "John Doe",
    "org_ids": ["happyai", "groovy-relativity"]
  }
  ```

## Development

### Tech Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Native CSS**: No external styling libraries

### File Structure
```
admin-ui/
├── src/
│   ├── App.tsx                      # Main app with tab navigation
│   ├── main.tsx                     # React entry point
│   ├── index.css                    # Global styles
│   └── components/
│       ├── OrganizationsPanel.tsx   # Display orgs grouped by type
│       ├── UsersPanel.tsx           # Display users in table
│       ├── CreateOrgPanel.tsx       # Create org form
│       └── CreateUserPanel.tsx      # Create user form
├── index.html                       # HTML template
├── vite.config.ts                   # Vite configuration (port 6182)
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

### Local Development

```bash
# Install dependencies
cd examples/admin-ui
bun install

# Start dev server (requires gateway running on 8187)
bun run dev

# Build for production
bun run build
```

## Security Notes

⚠️ **Important Security Considerations**:

1. **Admin Secret**: Change `admin-secret-change-me` in production
2. **HTTPS Only**: Always use HTTPS in production
3. **Org Secrets**: Shown only once - store securely
4. **Access Control**: Super org admin has full platform access
5. **Rate Limiting**: Implement proper rate limiting in production

## Troubleshooting

### Gateway not responding
- Ensure gateway is running on port 8187
- Check that `ADMIN_SECRET` matches in both gateway and UI

### Organizations not loading
- Verify `X-Admin-Secret` header is correct
- Check browser console for API errors
- Ensure gateway has proper CORS configuration

### Create forms not working
- Check that all required fields are filled
- Verify at least one model is selected (create org)
- Ensure at least one organization is selected (create user)

## Related Documentation

- [Main README](../../README.md) - Project overview
- [Admin API Guide](../../ADMIN_GUIDE.md) - Complete API reference
- [SDK Documentation](../../packages/core/README.md) - TypeScript SDK
- [Domain Model](../../agentx/apps/tokenhouse-domain-model.agentx.md) - Architecture

## Support

For issues or questions:
- Check the [Admin API Guide](../../ADMIN_GUIDE.md)
- Review [Domain Model](../../agentx/apps/tokenhouse-domain-model.agentx.md)
- Contact: johnny@tokenhouse.ai
