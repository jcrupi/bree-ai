# TokenHouse Admin Guide

Complete guide for managing organizations and users in TokenHouse.

## 🔐 Admin Authentication

All admin endpoints require the `X-Admin-Secret` header.

**Default admin secret**: `admin-secret-change-me`

Set via environment variable:
```bash
ADMIN_SECRET=your-secure-admin-secret
```

## 🏢 Organizations

### Your Organization

**Token House Super Org** has been created with the following details:

```
Org ID:       org_superorg_001
Org Name:     Token House Super Org
Secret:       ths_super_secret_abc123
Billing Tier: Enterprise
User:         johnny@tokenhouse.ai
Limits:       500 requests/min, 10M tokens/day
```

### List All Organizations

```bash
curl -X GET http://localhost:8187/admin/orgs \
  -H "X-Admin-Secret: admin-secret-change-me"
```

Response:
```json
{
  "orgs": [
    {
      "org_id": "org_demo123",
      "org_name": "Demo Organization",
      "billing_tier": "pro",
      "users": ["demo@tokenhouse.ai"],
      "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
      "rate_limits": {
        "requests_per_minute": 100,
        "tokens_per_day": 1000000
      },
      "created_at": "2024-03-09T..."
    },
    {
      "org_id": "org_superorg_001",
      "org_name": "Token House Super Org",
      "billing_tier": "enterprise",
      "users": ["johnny@tokenhouse.ai"],
      "allowed_models": ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
      "rate_limits": {
        "requests_per_minute": 500,
        "tokens_per_day": 10000000
      },
      "created_at": "2024-03-09T..."
    }
  ]
}
```

### Create New Organization

```bash
curl -X POST http://localhost:8187/admin/orgs \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "Acme Corporation",
    "initial_user_email": "admin@acme.com",
    "billing_tier": "pro",
    "allowed_models": ["gpt-4o-mini", "claude-3-5-haiku-20241022"]
  }'
```

Response:
```json
{
  "org_id": "org_acme_corporation_lx3k9d",
  "org_name": "Acme Corporation",
  "org_secret": "ths_a1b2c3d4e5f6g7h8i9j0k1l2",
  "billing_tier": "pro",
  "users": ["admin@acme.com"],
  "allowed_models": ["gpt-4o-mini", "claude-3-5-haiku-20241022"],
  "message": "⚠️  Save the org_secret - it will not be shown again!"
}
```

**⚠️ Important**: The `org_secret` is only returned once during creation. Save it securely!

### Billing Tiers

| Tier | Requests/Min | Tokens/Day | Use Case |
|------|--------------|------------|----------|
| **free** | 60 | 100K | Testing, small projects |
| **starter** | 100 | 500K | Small businesses |
| **pro** | 200 | 2M | Growing companies |
| **enterprise** | 500 | 10M | Large organizations |

## 👥 Users

### List All Users

```bash
curl -X GET http://localhost:8187/admin/users \
  -H "X-Admin-Secret: admin-secret-change-me"
```

Response:
```json
{
  "users": [
    {
      "email": "johnny@tokenhouse.ai",
      "name": "Johnny",
      "org_ids": ["org_superorg_001"],
      "created_at": "2024-03-09T..."
    },
    {
      "email": "demo@tokenhouse.ai",
      "name": "Demo User",
      "org_ids": ["org_demo123"],
      "created_at": "2024-03-09T..."
    }
  ]
}
```

### Create New User

Create a user and add them to an organization:

```bash
curl -X POST http://localhost:8187/admin/users \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com",
    "name": "Alice Johnson",
    "org_id": "org_acme_corporation_lx3k9d"
  }'
```

Response:
```json
{
  "email": "alice@acme.com",
  "name": "Alice Johnson",
  "org_ids": ["org_acme_corporation_lx3k9d"],
  "message": "User created successfully"
}
```

### Add Existing User to Organization

Add an existing user to another organization:

```bash
curl -X POST http://localhost:8187/admin/orgs/org_superorg_001/users \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@acme.com"
  }'
```

Response:
```json
{
  "message": "User alice@acme.com added to org org_superorg_001",
  "org_id": "org_superorg_001",
  "email": "alice@acme.com"
}
```

Now Alice can access resources from both organizations.

## 🔑 Authentication Flow

### For Your Super Org

```bash
# 1. Authenticate with your org
curl -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "org_superorg_001",
    "org_secret": "ths_super_secret_abc123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Use the Token

```bash
# 2. Make API calls with the token
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## 📊 Usage Tracking

Each org's usage is tracked separately. Check usage for your super org:

```bash
curl -X GET "http://localhost:8187/usage/stats?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response:
```json
{
  "org_id": "org_superorg_001",
  "period": {
    "start": "2024-03-01",
    "end": "2024-03-31"
  },
  "totals": {
    "requests": 1234,
    "prompt_tokens": 45678,
    "completion_tokens": 23456,
    "total_tokens": 69134,
    "cost_usd": 0.123456
  },
  "by_model": {
    "gpt-4o": {
      "requests": 500,
      "tokens": 35000,
      "cost_usd": 0.087500
    },
    "claude-3-5-sonnet-20241022": {
      "requests": 734,
      "tokens": 34134,
      "cost_usd": 0.035956
    }
  },
  "daily_breakdown": [...]
}
```

## 🎯 Common Admin Tasks

### Onboard a New Customer

```bash
# 1. Create org
curl -X POST http://localhost:8187/admin/orgs \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "org_name": "New Customer Inc",
    "initial_user_email": "admin@newcustomer.com",
    "billing_tier": "starter",
    "allowed_models": ["gpt-4o-mini"]
  }'

# 2. Save the returned org_secret
# 3. Send credentials to customer
# 4. Customer can now authenticate and use the API
```

### Add Team Members

```bash
# Add more users to an existing org
curl -X POST http://localhost:8187/admin/users \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@newcustomer.com",
    "name": "Dev Team",
    "org_id": "org_new_customer_inc_abc123"
  }'
```

### Upgrade Billing Tier

Currently requires database update. For production, implement an update endpoint:

```bash
# Future endpoint (not yet implemented)
curl -X PATCH http://localhost:8187/admin/orgs/org_xxx \
  -H "X-Admin-Secret: admin-secret-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "billing_tier": "enterprise",
    "rate_limits": {
      "requests_per_minute": 1000,
      "tokens_per_day": 50000000
    }
  }'
```

## 🔒 Security Best Practices

### Admin Secret

**Never expose the admin secret**:
- Store in environment variables only
- Use different secrets for dev/staging/production
- Rotate regularly
- Never commit to git

### Org Secrets

**Handle org secrets carefully**:
- Only shown once during creation
- Store in customer's password manager
- If lost, must regenerate (future feature)
- Never log or expose in responses

### Production Recommendations

1. **Use a real database**: Replace in-memory storage with MongoDB/PostgreSQL
2. **Add role-based access**: Implement org admin vs member roles
3. **Enable audit logging**: Track all admin actions
4. **Add rate limiting**: Prevent abuse of admin endpoints
5. **Use HTTPS only**: Never expose admin endpoints over HTTP
6. **Add IP allowlisting**: Restrict admin access to trusted IPs

## 📝 Current Organizations

You now have access to:

### 1. Demo Organization
- **Org ID**: `org_demo123`
- **Secret**: `ths_demo_secret_xyz789`
- **Tier**: Pro
- **User**: demo@tokenhouse.ai

### 2. Token House Super Org ⭐
- **Org ID**: `org_superorg_001`
- **Secret**: `ths_super_secret_abc123`
- **Tier**: Enterprise
- **User**: johnny@tokenhouse.ai (YOU)
- **Limits**: 500 req/min, 10M tokens/day

## 🚀 Test Your Super Org

### Use the Chat UI

Update `examples/simple-chat/src/App.tsx`:

```typescript
<TokenHouseProvider
  config={{
    orgId: 'org_superorg_001',
    orgSecret: 'ths_super_secret_abc123',
    baseUrl: 'http://localhost:8187'
  }}
>
```

### Use the API

```bash
# Authenticate
TOKEN=$(curl -s -X POST http://localhost:8187/auth/token \
  -H "Content-Type: application/json" \
  -d '{"org_id":"org_superorg_001","org_secret":"ths_super_secret_abc123"}' \
  | jq -r '.access_token')

# Chat
curl -X POST http://localhost:8187/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role":"user","content":"What are the benefits of enterprise tier?"}]
  }'
```

## 📚 API Reference

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/orgs` | GET | List all organizations |
| `/admin/orgs` | POST | Create new organization |
| `/admin/users` | GET | List all users |
| `/admin/users` | POST | Create new user |
| `/admin/orgs/:org_id/users` | POST | Add user to org |

All endpoints require `X-Admin-Secret` header.

---

**You're all set!** Your super org is ready to use with enterprise limits and all models enabled.
