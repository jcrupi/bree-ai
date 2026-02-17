# Backend TypeScript Interview Questions - Genius Talent

## Technical Interview Questions (Medium to Senior Level)

### 1. Advanced TypeScript Types
**Q:** Explain mapped types, conditional types, and template literal types in TypeScript. Create a utility type that extracts all string properties from an interface and makes them optional.

### 2. Bun Runtime Benefits
**Q:** Compare Bun with Node.js. What specific advantages does Bun provide for backend development? When would you still choose Node.js over Bun?

### 3. ElysiaJS & Type Safety
**Q:** How does ElysiaJS achieve end-to-end type safety with the Eden client? Implement a type-safe API endpoint with validation and show how the client consumes it.

### 4. Async Patterns & Error Handling
**Q:** Compare callbacks, Promises, and async/await. How would you handle errors in an async function that calls multiple external APIs? Show proper error propagation and recovery strategies.

### 5. Zod Schema Validation
**Q:** Design a complex Zod schema for a user registration endpoint with nested objects, array validation, custom error messages, and schema transformations. How does Zod's type inference work?

### 6. Event Loop & Performance
**Q:** Explain the Node.js/Bun event loop phases. How would you optimize CPU-intensive operations to avoid blocking the event loop? Discuss Worker Threads and when to use them.

### 7. Database Transactions with Prisma
**Q:** Implement a transaction that transfers money between two accounts using Prisma. How would you handle race conditions and ensure data consistency? Discuss optimistic vs. pessimistic locking.

### 8. Dependency Injection
**Q:** TypeScript doesn't have native DI like Java. How would you implement a clean dependency injection pattern for your services? Compare using InversifyJS vs. a simpler approach.

### 9. Stream Processing
**Q:** You need to process a 10GB CSV file without loading it into memory. How would you use Node.js streams to read, transform, and write the data? Show proper error handling and backpressure management.

### 10. Authentication Architecture
**Q:** Design a complete authentication system with JWT access tokens and refresh tokens. How would you handle token rotation, secure storage, and graceful token expiration?

### 11. Rate Limiting & Security
**Q:** Implement a sophisticated rate limiting strategy with different limits for authenticated vs. anonymous users. How would you handle distributed rate limiting across multiple servers?

### 12. Type Guards & Narrowing
**Q:** Create custom type guards for discriminated unions. How does TypeScript's type narrowing work with `typeof`, `instanceof`, and custom guards? Show examples with complex types.

### 13. Monorepo Architecture
**Q:** You're setting up a monorepo with Turborepo containing shared types, backend services, and frontend apps. How would you structure packages, manage shared types, and optimize build times?

### 14. WebSocket Real-Time Communication
**Q:** Implement a real-time notification system using WebSockets. How would you handle authentication, connection management, reconnection logic, and scaling across multiple servers?

### 15. Database Query Optimization
**Q:** Your API endpoint is making 50+ database queries. How would you identify the issue using Prisma's query logging? Implement solutions using select, include, and query batching.

### 16. Error Handling Middleware
**Q:** Design a comprehensive error handling system for an ElysiaJS API. How would you differentiate between validation errors, business logic errors, and system errors? Show proper HTTP status codes and client responses.

### 17. Testing Strategies
**Q:** Write comprehensive tests for a service that interacts with a database and external APIs. How would you mock dependencies? Compare integration testing strategies using Jest/Vitest.

### 18. Generic Types & Constraints
**Q:** Create a generic Repository pattern that works with different entity types. Use generic constraints, conditional types, and utility types to ensure type safety across all CRUD operations.

### 19. Memory Leaks & Profiling
**Q:** How would you identify and fix memory leaks in a Node.js/Bun application? What tools would you use? Discuss common causes like event listener leaks and closure issues.

### 20. Distributed Systems Design
**Q:** Design a distributed job queue system using TypeScript. How would you handle job prioritization, retries, dead letter queues, and ensure exactly-once processing?

## Tags

#interview #questions #typescript #backend #bun #elysia #assessment
