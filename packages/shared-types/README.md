# @bree-ai/shared-types

Shared TypeScript types and interfaces for BREE AI monorepo.

## Installation

```bash
# In your app's package.json
{
  "dependencies": {
    "@bree-ai/shared-types": "workspace:*"
  }
}
```

## Usage

### API Response Types
```typescript
import { ApiResponse, PaginatedResponse } from '@bree-ai/shared-types';

const response: ApiResponse<User> = {
  success: true,
  data: { id: '1', email: 'user@example.com', name: 'John' }
};

const paginated: PaginatedResponse<Task> = {
  items: [...],
  total: 100,
  page: 1,
  pageSize: 20,
  hasMore: true
};
```

### Entity Types
```typescript
import { BaseEntity, User, UserRole, Task, Status } from '@bree-ai/shared-types';

const user: User = {
  id: '123',
  email: 'john@example.com',
  name: 'John Doe',
  role: UserRole.Admin,
  createdAt: new Date(),
  updatedAt: new Date()
};

const task: Task = {
  id: '456',
  title: 'Complete project',
  status: 'in_progress',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### NATS Message Types
```typescript
import { NatsMessage } from '@bree-ai/shared-types';

const message: NatsMessage<{ action: string }> = {
  subject: 'user.created',
  data: { action: 'create' },
  timestamp: Date.now(),
  correlationId: 'abc-123'
};
```

### Math AI Types
```typescript
import { MathVariable, CalculationResult } from '@bree-ai/shared-types';

const variable: MathVariable = {
  name: 'weight',
  value: 75,
  unit: 'kg'
};

const result: CalculationResult = {
  result: 24.49,
  variables: { W: 75, H: 1.75 },
  steps: ['Square height', 'Divide weight by height squared']
};
```

### Utility Types
```typescript
import { Nullable, Optional, DeepPartial } from '@bree-ai/shared-types';

type MaybeUser = Nullable<User>;        // User | null
type OptionalName = Optional<string>;   // string | undefined
type PartialUser = DeepPartial<User>;   // All fields optional recursively
```

## Available Types

### API Types
- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Paginated list response
- `ApiError` - Error response format
- `ApiMeta` - Response metadata
- `ApiRequestContext` - Request context
- `HttpMethod` - HTTP method enum
- `ApiEndpoint` - Endpoint definition

### Entity Types
- `BaseEntity` - Base entity with id, timestamps
- `User` - User entity
- `UserRole` - User role enum
- `Task` - Task entity
- `Status` - Status type
- `Timestamps` - Created/updated timestamps
- `AuditInfo` - Full audit trail
- `TenantEntity` - Multi-tenant support
- `SoftDelete` - Soft delete support
- `Versioned` - Versioning support
- `Tagged` - Tagging support
- `Metadata` - Arbitrary metadata

### NATS Types
- `NatsMessage<T>` - NATS message wrapper

### Math AI Types
- `MathVariable` - Math variable with unit
- `CalculationResult` - Calculation result with steps

### Utility Types
- `Nullable<T>` - T | null
- `Optional<T>` - T | undefined
- `DeepPartial<T>` - Recursive partial

## Exports

```typescript
// Main exports
export * from './api';      // API-related types
export * from './entities'; // Entity types
export * from './index';    // All other types
```

## License

MIT
