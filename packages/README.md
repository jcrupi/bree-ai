# BREE AI Shared Packages

This directory contains shared packages used across the BREE AI monorepo.

## Available Packages

### 🧮 [@bree-ai/math-ai-engine](./math-ai-engine)
Deterministic Math AI Engine for declarative JSON-based mathematical operations.

**Features:**
- Expression parsing (infix notation)
- Variable substitution
- Template system
- 15+ math operators and functions

**Usage:**
```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';

const engine = new MathEngine({ a: 10, b: 20 });
const result = engine.parseExpression("a + b * 2");
```

---

### 📦 [@bree-ai/shared-types](./shared-types)
Common TypeScript types and interfaces.

**Features:**
- API response types
- Entity types
- NATS message types
- Math AI types
- Utility types

**Usage:**
```typescript
import { ApiResponse, User, Status } from '@bree-ai/shared-types';
```

---

### 🛠️ [@bree-ai/shared-utils](./shared-utils)
Utility functions and helpers.

**Features:**
- Logger
- Validation utilities
- Date manipulation
- String transformations
- Object operations
- Common helpers (sleep, retry, etc.)

**Usage:**
```typescript
import { createLogger } from '@bree-ai/shared-utils/logger';
import { isEmail, slugify } from '@bree-ai/shared-utils';
```

---

## Using Shared Packages

### Installation
All packages use `workspace:*` protocol for local dependencies:

```json
{
  "dependencies": {
    "@bree-ai/math-ai-engine": "workspace:*",
    "@bree-ai/shared-types": "workspace:*",
    "@bree-ai/shared-utils": "workspace:*"
  }
}
```

### Development
```bash
# Install all dependencies
bun install

# Build all packages
bun run build

# Test packages
bun test
```

## Package Structure

Each package follows this structure:
```
packages/
  <package-name>/
    src/           # Source TypeScript files
    package.json   # Package configuration
    README.md      # Package documentation
    tsconfig.json  # TypeScript configuration (optional)
```

## Adding a New Package

1. Create package directory: `mkdir -p packages/new-package/src`
2. Create `package.json` with `@bree-ai/` scope
3. Add source files in `src/`
4. Document in `README.md`
5. Add to root `package.json` workspaces (already includes `packages/*`)

## Benefits

✅ **Code Reuse**: Share code across all apps
✅ **Type Safety**: Consistent types across the monorepo
✅ **Single Source of Truth**: Update once, use everywhere
✅ **Better Maintainability**: Centralized shared logic
✅ **Faster Development**: Avoid duplicating common code

## Contributing

When adding shared code:
1. Ensure it's genuinely used by 2+ apps
2. Keep packages focused and cohesive
3. Document all public APIs
4. Add tests for critical functionality
5. Version carefully (breaking changes affect all apps)
