# Shared Packages - Usage Examples

This document shows how to use the shared packages across different apps in the BREE AI monorepo.

## Setup

### 1. Add dependencies to your app

In your app's `package.json`:

```json
{
  "dependencies": {
    "@bree-ai/math-ai-engine": "workspace:*",
    "@bree-ai/shared-types": "workspace:*",
    "@bree-ai/shared-utils": "workspace:*"
  }
}
```

### 2. Install dependencies

```bash
# From monorepo root
bun install
```

### 3. Import and use

TypeScript will auto-complete and type-check all imports!

---

## Example 1: Math AI Engine

### Simple Expression Calculation

```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';

// Simple calculation
const engine = new MathEngine();
const model = engine.parseExpression("100 - 10 + 490 - 8 * (19/5)");
const result = engine.run(model);

console.log(result.lastResult); // 549.6
```

### With Variables

```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';

// BMI calculation with variables
const engine = new MathEngine({ weight: 75, height: 1.75 });
const model = engine.parseExpression("weight / (height * height)");
const result = engine.run(model);

console.log(`BMI: ${result.lastResult.toFixed(2)}`); // BMI: 24.49
```

### Using Templates

```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';
import { readFileSync } from 'node:fs';

// Load and run a template
const template = readFileSync('path/to/bmi.template.algos.agentx.md', 'utf-8');
const engine = new MathEngine();
const result = engine.runTemplate(template, { W: 75, H: 1.75 });

console.log(`BMI: ${result.allResults.BMI}`);
```

---

## Example 2: Shared Types

### API Response Handling

```typescript
import { ApiResponse, PaginatedResponse, User } from '@bree-ai/shared-types';

// API endpoint returning typed response
async function getUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Usage
const result = await getUser('123');
if (result.success && result.data) {
  console.log(`User: ${result.data.name}`);
}
```

### Paginated Lists

```typescript
import { PaginatedResponse, Task } from '@bree-ai/shared-types';

async function getTasks(page = 1): Promise<PaginatedResponse<Task>> {
  const response = await fetch(`/api/tasks?page=${page}`);
  return response.json();
}

const tasks = await getTasks(1);
console.log(`Showing ${tasks.items.length} of ${tasks.total} tasks`);
console.log(`Has more: ${tasks.hasMore}`);
```

### NATS Messaging

```typescript
import { NatsMessage } from '@bree-ai/shared-types';

interface UserCreatedData {
  userId: string;
  email: string;
  timestamp: number;
}

const message: NatsMessage<UserCreatedData> = {
  subject: 'user.created',
  data: {
    userId: '123',
    email: 'user@example.com',
    timestamp: Date.now()
  },
  timestamp: Date.now(),
  correlationId: 'abc-123-def'
};

// Publish to NATS
await nc.publish(message.subject, JSON.stringify(message.data));
```

---

## Example 3: Shared Utils

### Logger

```typescript
import { createLogger } from '@bree-ai/shared-utils/logger';

const logger = createLogger({
  level: 'info',
  prefix: 'PlaybooksAI'
});

logger.info('Application started');
logger.debug('Debug info', { userId: '123' });
logger.error('Something went wrong', error);
```

### Validation

```typescript
import { isEmail, isEmpty, inRange, isUrl } from '@bree-ai/shared-utils/validation';

// Validate user input
function validateUser(email: string, age: number, website?: string) {
  if (!isEmail(email)) {
    throw new Error('Invalid email');
  }

  if (!inRange(age, 0, 120)) {
    throw new Error('Invalid age');
  }

  if (website && !isUrl(website)) {
    throw new Error('Invalid website URL');
  }

  return true;
}
```

### Date Utilities

```typescript
import { addDays, diffInDays, isToday, formatDate } from '@bree-ai/shared-utils/date';

const now = new Date();
const tomorrow = addDays(now, 1);
const nextWeek = addDays(now, 7);

console.log(formatDate(tomorrow, 'long'));
console.log(`Days until next week: ${diffInDays(now, nextWeek)}`);

if (isToday(now)) {
  console.log('This is today!');
}
```

### String Utilities

```typescript
import { capitalize, slugify, truncate, camelCase } from '@bree-ai/shared-utils/string';

const title = "Hello World from BREE AI";
console.log(capitalize(title)); // "Hello world from bree ai"
console.log(slugify(title));    // "hello-world-from-bree-ai"
console.log(truncate(title, 20)); // "Hello World from..."
console.log(camelCase(title));   // "helloWorldFromBreeAi"
```

### Object Utilities

```typescript
import { pick, omit, deepMerge, mapValues } from '@bree-ai/shared-utils/object';

const user = {
  id: '123',
  name: 'John',
  email: 'john@example.com',
  password: 'secret'
};

// Pick only safe fields
const safeUser = pick(user, ['id', 'name', 'email']);

// Omit sensitive fields
const publicUser = omit(user, ['password']);

// Merge objects
const defaults = { theme: 'dark', notifications: true };
const userPrefs = { theme: 'light' };
const merged = deepMerge(defaults, userPrefs);
// Result: { theme: 'light', notifications: true }
```

### Common Utilities

```typescript
import { sleep, retry, randomId, chunk, groupBy } from '@bree-ai/shared-utils';

// Wait for something
await sleep(1000);

// Retry failed operations
const data = await retry(
  async () => {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  },
  { maxRetries: 3, delay: 1000 }
);

// Generate random IDs
const id = randomId(16);

// Split array into chunks
const items = [1, 2, 3, 4, 5, 6, 7, 8];
const batches = chunk(items, 3);
// [[1,2,3], [4,5,6], [7,8]]

// Group by property
const users = [
  { name: 'John', role: 'admin' },
  { name: 'Jane', role: 'user' },
  { name: 'Bob', role: 'admin' }
];
const grouped = groupBy(users, u => u.role);
// { admin: [{John}, {Bob}], user: [{Jane}] }
```

---

## Example 4: Combined Usage (Real-World API)

```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';
import { ApiResponse, User } from '@bree-ai/shared-types';
import { createLogger, isEmail, retry } from '@bree-ai/shared-utils';

const logger = createLogger({ prefix: 'BMI-Service' });

interface BmiRequest {
  userId: string;
  weight: number; // kg
  height: number; // meters
}

interface BmiResult {
  bmi: number;
  category: string;
  timestamp: Date;
}

async function calculateBmi(req: BmiRequest): Promise<ApiResponse<BmiResult>> {
  logger.info(`Calculating BMI for user ${req.userId}`);

  try {
    // Use Math AI Engine
    const engine = new MathEngine({ W: req.weight, H: req.height });
    const model = engine.parseExpression("W / (H * H)");
    const result = engine.run(model);
    const bmi = result.lastResult;

    // Determine category
    let category: string;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    logger.info(`BMI calculated: ${bmi.toFixed(2)} (${category})`);

    return {
      success: true,
      data: {
        bmi: parseFloat(bmi.toFixed(2)),
        category,
        timestamp: new Date()
      }
    };
  } catch (error) {
    logger.error('BMI calculation failed', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Usage
const result = await calculateBmi({
  userId: '123',
  weight: 75,
  height: 1.75
});

if (result.success && result.data) {
  console.log(`BMI: ${result.data.bmi} (${result.data.category})`);
}
```

---

## Benefits of Using Shared Packages

✅ **Type Safety**: Full TypeScript support with auto-completion
✅ **Consistency**: Same utilities across all apps
✅ **Maintainability**: Fix bugs once, benefit everywhere
✅ **Faster Development**: No need to rewrite common code
✅ **Better Testing**: Shared packages can have comprehensive tests
✅ **Single Source of Truth**: Update in one place, use everywhere

---

## Tips

1. **Import what you need**: Use specific imports to reduce bundle size
   ```typescript
   // Good
   import { createLogger } from '@bree-ai/shared-utils/logger';

   // Less optimal (imports everything)
   import { createLogger } from '@bree-ai/shared-utils';
   ```

2. **Check package exports**: Each package exports specific modules
   ```typescript
   import { MathEngine } from '@bree-ai/math-ai-engine';
   import { ApiResponse } from '@bree-ai/shared-types';
   import { createLogger } from '@bree-ai/shared-utils/logger';
   ```

3. **Use TypeScript**: All packages are TypeScript-first for best DX

4. **Read the docs**: Each package has its own README with detailed API documentation
