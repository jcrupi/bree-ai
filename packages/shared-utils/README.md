# @bree-ai/shared-utils

Shared utility functions for BREE AI monorepo.

## Installation

```bash
# In your app's package.json
{
  "dependencies": {
    "@bree-ai/shared-utils": "workspace:*"
  }
}
```

## Usage

### Logger
```typescript
import { createLogger } from '@bree-ai/shared-utils/logger';

const logger = createLogger({ level: 'info', prefix: 'MyApp' });
logger.info('Application started');
logger.error('Something went wrong', error);
```

### Validation
```typescript
import { isEmail, isEmpty, inRange } from '@bree-ai/shared-utils/validation';

isEmail('test@example.com'); // true
isEmpty(''); // true
inRange(5, 1, 10); // true
```

### Date Utilities
```typescript
import { addDays, diffInDays, isToday } from '@bree-ai/shared-utils/date';

const tomorrow = addDays(new Date(), 1);
const daysDiff = diffInDays(new Date(), tomorrow);
```

### String Utilities
```typescript
import { capitalize, slugify, truncate } from '@bree-ai/shared-utils/string';

capitalize('hello'); // 'Hello'
slugify('Hello World'); // 'hello-world'
truncate('Long text...', 10); // 'Long te...'
```

### Object Utilities
```typescript
import { pick, omit, deepMerge } from '@bree-ai/shared-utils/object';

const user = { id: 1, name: 'John', email: 'john@example.com' };
pick(user, ['id', 'name']); // { id: 1, name: 'John' }
omit(user, ['email']); // { id: 1, name: 'John' }
```

### Common Utilities
```typescript
import { sleep, retry, randomId, chunk, groupBy } from '@bree-ai/shared-utils';

await sleep(1000); // Wait 1 second
const id = randomId(16); // Generate random ID
const chunks = chunk([1,2,3,4,5], 2); // [[1,2], [3,4], [5]]
```

## License

MIT
