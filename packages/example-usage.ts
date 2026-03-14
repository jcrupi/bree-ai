#!/usr/bin/env bun

/**
 * Example: Using Shared Packages in Your App
 * This demonstrates how any app can import and use the shared packages
 */

import { MathEngine } from '@bree-ai/math-ai-engine';
import { ApiResponse, User, Task, Status, NatsMessage } from '@bree-ai/shared-types';
import {
  createLogger,
  isEmail,
  slugify,
  addDays,
  retry,
  chunk,
} from '@bree-ai/shared-utils';

console.log('\n🚀 BREE AI Shared Packages - Live Demo\n');

// =====================================================
// Example 1: Logger
// =====================================================
const logger = createLogger({ level: 'info', prefix: 'Demo' });
logger.info('Starting shared packages demonstration');

// =====================================================
// Example 2: Math AI Engine
// =====================================================
console.log('📐 Math AI Engine Examples:\n');

// Simple expression
const engine1 = new MathEngine();
const model1 = engine1.parseExpression("100 + 50 * 2");
const result1 = engine1.run(model1);
console.log(`  Simple: 100 + 50 * 2 = ${result1.lastResult}`);

// With variables
const engine2 = new MathEngine({ price: 99.99, taxRate: 0.08 });
const model2 = engine2.parseExpression("price * (1 + taxRate)");
const result2 = engine2.run(model2);
console.log(`  With vars: price * (1 + taxRate) = $${result2.lastResult.toFixed(2)}`);

// BMI calculation
const engine3 = new MathEngine({ W: 75, H: 1.75 });
const model3 = engine3.parseExpression("W / (H * H)");
const result3 = engine3.run(model3);
console.log(`  BMI: ${result3.lastResult.toFixed(2)}\n`);

// =====================================================
// Example 3: Typed API Response
// =====================================================
console.log('📦 Typed API Response Example:\n');

function createUser(email: string, name: string): ApiResponse<User> {
  if (!isEmail(email)) {
    return {
      success: false,
      error: 'Invalid email address'
    };
  }

  return {
    success: true,
    data: {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      role: 'user' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}

const userResult = createUser('john@example.com', 'John Doe');
if (userResult.success && userResult.data) {
  console.log(`  ✓ User created: ${userResult.data.name} (${userResult.data.email})`);
}

const invalidResult = createUser('invalid-email', 'Bad User');
if (!invalidResult.success) {
  console.log(`  ✗ Error: ${invalidResult.error}\n`);
}

// =====================================================
// Example 4: String Utilities
// =====================================================
console.log('🔤 String Utilities Example:\n');

const title = "Hello World from BREE AI";
console.log(`  Original: "${title}"`);
console.log(`  Slug: "${slugify(title)}"`);
console.log(`  URL-safe: /blog/${slugify(title)}\n`);

// =====================================================
// Example 5: Date Utilities
// =====================================================
console.log('📅 Date Utilities Example:\n');

const today = new Date();
const dueDate = addDays(today, 7);
console.log(`  Today: ${today.toLocaleDateString()}`);
console.log(`  Due in 7 days: ${dueDate.toLocaleDateString()}\n`);

// =====================================================
// Example 6: Task Management with Types
// =====================================================
console.log('✓ Task Management Example:\n');

const tasks: Task[] = [
  {
    id: '1',
    title: 'Setup shared packages',
    status: 'completed' as Status,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Write documentation',
    status: 'in_progress' as Status,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Deploy to production',
    status: 'pending' as Status,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

for (const task of tasks) {
  const icon = task.status === 'completed' ? '✓' :
               task.status === 'in_progress' ? '⏳' : '○';
  console.log(`  ${icon} ${task.title} (${task.status})`);
}
console.log();

// =====================================================
// Example 7: Retry with Error Handling
// =====================================================
console.log('🔄 Retry Utility Example:\n');

let attemptCount = 0;
const unreliableOperation = async () => {
  attemptCount++;
  console.log(`  Attempt ${attemptCount}...`);

  if (attemptCount < 3) {
    throw new Error('Simulated failure');
  }
  return 'Success!';
};

try {
  const result = await retry(unreliableOperation, { maxRetries: 3, delay: 100 });
  console.log(`  ✓ ${result}\n`);
} catch (error) {
  console.log(`  ✗ Failed after retries\n`);
}

// =====================================================
// Example 8: NATS Message (Type-Safe)
// =====================================================
console.log('📨 NATS Message Example:\n');

interface UserCreatedEvent {
  userId: string;
  email: string;
  timestamp: number;
}

const message: NatsMessage<UserCreatedEvent> = {
  subject: 'user.created',
  data: {
    userId: '123',
    email: 'john@example.com',
    timestamp: Date.now()
  },
  timestamp: Date.now(),
  correlationId: 'demo-123'
};

console.log(`  Subject: ${message.subject}`);
console.log(`  Data:`, message.data);
console.log(`  Correlation ID: ${message.correlationId}\n`);

// =====================================================
// Example 9: Chunking Large Arrays
// =====================================================
console.log('📊 Array Chunking Example:\n');

const items = Array.from({ length: 10 }, (_, i) => i + 1);
const batches = chunk(items, 3);

console.log(`  Processing ${items.length} items in batches of 3:`);
batches.forEach((batch, i) => {
  console.log(`  Batch ${i + 1}: [${batch.join(', ')}]`);
});

console.log('\n✨ Demo complete! All shared packages working correctly.\n');

logger.info('Demonstration completed successfully');
