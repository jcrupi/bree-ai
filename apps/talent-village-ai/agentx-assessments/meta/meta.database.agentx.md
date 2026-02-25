#!/usr/bin/env bash
exec "$(dirname "$0")/../bin/agentx-gen" "$0" "$@"
---
# AgentX meta spec: Database. Use this document to generate
# interview question agentx files (basic, advanced, domain). Multiple versions allowed.
kind: meta
title: Database Design & Engineering
slug: database
version: "1.0.0"
description: Standards and required skills for database and data-layer roles. Use to generate basic, advanced, and domain-specific interview question agentx files.

generate:
  basic: database-basic.agentx.md
  advanced: database-advanced.agentx.md
  domains:
    - slug: healthcare
      file: database.healthcare.domain.agentx.md
    - slug: financial
      file: database.financial.domain.agentx.md

instructions: |
  From this meta spec, generate agentx markdown files for interview questions.
  - basic: SQL fundamentals, schema basics, CRUD, simple queries (junior/mid).
  - advanced: indexing, transactions, scaling, migrations, performance (senior+).
  - domain: apply database skills to the named domain (e.g. healthcare HIPAA, financial audit trails).
  Each generated file MUST have YAML front matter with kind (basic|advanced|domain), slug, version, and parent_meta pointing to this slug.
---

# Database Design & Engineering Standards - TalentVillage.ai

## Core Stack

- **Relational**: PostgreSQL (primary), SQLite for local/dev
- **ORM / Query**: Prisma, Drizzle; raw SQL when needed
- **Caching**: Redis for sessions, rate limits, hot data
- **Migrations**: Versioned, reversible, zero-downtime where possible

## Schema & Modeling

- Normalize to 3NF unless denormalization is justified (read performance, reporting).
- Use clear naming: snake_case tables/columns, plural table names.
- Document constraints, FKs, and indexes in schema; avoid “invisible” invariants.
- Prefer UUID or ULID for public identifiers; auto-increment only for internal PKs when appropriate.

## Required Skills

### SQL & Query Design
- **DML/DDL**: SELECT, INSERT, UPDATE, DELETE; CREATE/ALTER TABLE, INDEX, CONSTRAINT
- **Joins**: INNER, LEFT, RIGHT, FULL; join order and impact on plans
- **Aggregations**: GROUP BY, HAVING, window functions (ROW_NUMBER, RANK, LAG/LEAD)
- **Subqueries & CTEs**: Readable complex queries, recursion where applicable
- **Transactions**: ACID, isolation levels, deadlocks, and when to use explicit transactions
- **Query Optimization**: EXPLAIN/ANALYZE, index usage, avoiding N+1 and full scans

### Schema Design
- **Normalization**: 1NF–3NF, BCNF; when to denormalize
- **Keys & Constraints**: Primary, foreign, unique; check constraints; cascades
- **Data Types**: Choosing types (int vs bigint, varchar vs text, JSON/JSONB), time zones
- **Relationships**: One-to-one, one-to-many, many-to-many; junction tables
- **Schema Evolution**: Adding columns, backfilling, breaking vs non-breaking changes
- **Naming Conventions**: Consistency across tables, columns, indexes, constraints

### Indexing & Performance
- **B-Tree Indexes**: When they help (equality, range, sort); when they don’t
- **Composite Indexes**: Column order, covering indexes, partial indexes
- **Specialized Indexes**: GIN/GiST for JSONB, full-text; hash for equality-only
- **Index Maintenance**: Bloat, REINDEX, VACUUM; monitoring slow queries
- **Connection & Pooling**: Connection pools, statement timeouts, connection exhaustion

### ORMs & Type-Safe Access
- **Prisma**: Schema, migrations, relations, transactions, raw SQL escape hatch
- **Drizzle**: SQL-like API, migrations, type inference
- **Raw SQL**: When to bypass ORM (complex reports, bulk ops, performance-critical paths)
- **Type Safety**: Mapping DB types to application types; avoiding N+1 via includes/joins

### Migrations & DevOps
- **Versioned Migrations**: Linear history, no edit-after-apply; rollback strategy
- **Zero-Downtime**: Adding nullable columns, backfill, then add constraint; blue/green
- **Seeding**: Reproducible dev/test data; idempotent where possible
- **Environments**: Dev, staging, prod parity; sanitized dumps for local

### Caching & Consistency
- **Redis**: Cache-aside, write-through; TTL and invalidation strategies
- **Consistency**: Strong vs eventual; cache invalidation on writes
- **Sessions & Rate Limits**: Storing session data and counters in Redis
- **Pub/Sub**: Event distribution (where appropriate); not as primary queue

### Data Integrity & Security
- **Constraints**: Enforce invariants in DB; not only in application code
- **SQL Injection**: Parameterized queries only; never string-concatenate user input
- **Sensitive Data**: Hashing (passwords), encryption at rest (PII); key management
- **Access Control**: DB users, least privilege, audit logging for sensitive tables
- **Backups**: Scheduled backups, point-in-time recovery, restore testing

### Analytics & Reporting
- **Read Replicas**: Offloading reporting from primary; replication lag awareness
- **Materialized Views**: Precomputed aggregates; refresh strategies
- **ETL Concepts**: Batch vs stream; idempotency and incremental loads
- **JSON/JSONB**: When to use; indexing and querying in PostgreSQL

### Soft Skills
- **Collaboration**: Working with backend/frontend on API and schema contracts
- **Documentation**: Schema docs, migration runbooks, runbook for outages
- **Trade-offs**: When to denormalize, when to add an index, when to use a cache
- **Continuous Learning**: New DB features, tuning, and operational practices

## Tags

#database #sql #postgresql #prisma #drizzle #redis
