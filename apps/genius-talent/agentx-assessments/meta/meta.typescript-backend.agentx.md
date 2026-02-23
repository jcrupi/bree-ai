---
# AgentX meta spec: TypeScript Backend. Use this document to generate
# interview question agentx files (basic, advanced, domain). Multiple versions allowed.
kind: meta
title: TypeScript Backend Development
slug: typescript-backend
version: "1.0.0"
description: Standards and required skills for TypeScript/Node backend roles. Use to generate basic, advanced, and domain-specific interview question agentx files.

generate:
  basic: typescript-backend-basic.agentx.md
  advanced: typescript-backend-advanced.agentx.md
  domains:
    - slug: healthcare
      file: typescript-backend.healthcare.domain.agentx.md
    - slug: financial
      file: typescript-backend.financial.domain.agentx.md

instructions: |
  From this meta spec, generate agentx markdown files for interview questions.
  - basic: foundational concepts, types, async, REST (junior/mid).
  - advanced: architecture, performance, security, scale (senior+).
  - domain: apply backend skills to the named domain (e.g. healthcare APIs, financial compliance).
  Each generated file MUST have YAML front matter with kind (basic|advanced|domain), slug, version, and parent_meta pointing to this slug.
---

# Backend TypeScript Standards - Genius Talent

## Runtime & Framework

- **Runtime**: Bun (for performance and DX) or Node.js 20+
- **Framework**: ElysiaJS (high-performance, TypeScript-first web framework)
- **API Style**: RESTful with type-safe clients (Eden)

## Type Safety

- Enable `strict` mode in `tsconfig.json`.
- Avoid `any` at all costs; use `unknown` if the type is truly dynamic.
- Use Zod for runtime schema validation and type inference.

## Required Skills

### TypeScript Mastery
- **Advanced Types**: Generics, conditional types, mapped types, template literal types, and type inference
- **Type Guards**: Custom type guards, discriminated unions, and type narrowing techniques
- **Utility Types**: Proficiency with built-in utilities (Partial, Pick, Omit, Record, etc.)
- **Strict Mode**: Working effectively with strict null checks, noImplicitAny, and strictFunctionTypes
- **Decorators**: Understanding of experimental features and metadata reflection

### Runtime & Framework
- **Bun**: Leveraging Bun's performance advantages, built-in APIs, and fast package installation
- **Node.js**: Deep understanding of event loop, streams, buffers, and async patterns
- **ElysiaJS**: High-performance web framework, plugin system, and Eden type-safe client generation
- **Express Alternative**: Knowledge of Fastify, Koa, or Hono for framework comparison

### API Development
- **RESTful Design**: Resource modeling, HTTP methods, status codes, and API versioning
- **Type-Safe APIs**: Eden client generation, end-to-end type safety from server to client
- **Validation**: Zod schemas for runtime validation, type inference, and error handling
- **Authentication**: JWT tokens, session management, OAuth2 flows, and refresh token strategies
- **Rate Limiting**: API throttling, request quotas, and DDoS protection

### Database & ORM
- **Prisma**: Schema design, migrations, relationships, and query optimization
- **Drizzle ORM**: Lightweight ORM alternative, type-safe queries
- **PostgreSQL**: Advanced queries, indexing, JSONB operations, and performance tuning
- **Redis**: Caching strategies, pub/sub, session storage, and rate limiting
- **Database Design**: Normalization, denormalization trade-offs, and schema evolution

### Async & Performance
- **Promises & Async/Await**: Error handling, parallel execution, and Promise combinators
- **Streams**: Readable/Writable streams, backpressure handling, and stream pipelines
- **Worker Threads**: CPU-intensive task offloading and parallel processing
- **Performance**: Profiling, memory leak detection, and optimization techniques
- **Caching**: In-memory caching, Redis, HTTP caching headers, and cache invalidation

### Testing & Quality
- **Unit Testing**: Vitest or Jest, mocking dependencies, and test coverage
- **Integration Testing**: API testing, database testing with TestContainers
- **E2E Testing**: Playwright or Cypress for end-to-end workflows
- **Type Testing**: Testing types with `expectTypeOf` and type-level tests
- **Code Quality**: ESLint, Prettier, Biome for consistent code style

### Build & Tooling
- **Package Managers**: Bun, pnpm, npm, yarn - understanding trade-offs
- **Bundlers**: esbuild, Rollup, tsup for library bundling
- **Monorepos**: Turborepo, Nx for managing multiple packages
- **TypeScript Config**: Compiler options, project references, and path mapping
- **Module Systems**: ESM vs CommonJS, dynamic imports, and compatibility

### Architecture & Patterns
- **Clean Architecture**: Layered architecture, dependency injection, and separation of concerns
- **Design Patterns**: Repository, Factory, Strategy, and Observer patterns in TypeScript
- **Domain-Driven Design**: Entities, value objects, aggregates, and bounded contexts
- **SOLID Principles**: Single responsibility, dependency inversion, and interface segregation
- **Error Handling**: Custom error classes, error middleware, and structured logging

### DevOps & Production
- **Docker**: Containerization, multi-stage builds, and production optimization
- **CI/CD**: GitHub Actions, automated testing, and deployment pipelines
- **Logging**: Structured logging with Pino or Winston, log aggregation
- **Monitoring**: APM tools (New Relic, DataDog), metrics collection, and alerting
- **Environment Management**: .env files, configuration validation, and secrets management

### Security
- **OWASP Top 10**: Understanding and preventing common vulnerabilities
- **Input Validation**: Schema validation, sanitization, and SQL injection prevention
- **Authentication**: Secure password hashing (bcrypt, argon2), token management
- **Authorization**: Role-based access control (RBAC), permission systems
- **Secure Headers**: Helmet.js, CSP, CORS configuration

### Soft Skills
- **Problem Solving**: Debugging async issues, memory leaks, and performance bottlenecks
- **Code Review**: Type safety enforcement, best practice advocacy, and constructive feedback
- **Documentation**: API documentation, README files, and inline documentation
- **Collaboration**: Working with frontend teams, sharing types, and API contracts
- **Continuous Learning**: Staying updated with TypeScript releases and ecosystem changes

## Tags

#backend #typescript #node #elysia #bun
