# Domain PostgreSQL Schema

PostgreSQL schema for the Geni domain. Implements the entities and value objects defined in the domain model.

**Part of:** [Zod Domain Driven Design](README.md) — driven by [zod-domain.agentx.md](zod-domain.agentx.md)

---

## Domain Model Reference

**This schema implements:** [domain.agentx.md](domain.agentx.md)

**Zod schemas:** [domain-classes.agentx.md](domain-classes.agentx.md) — Zod defines JSONB structure; use for validation.

Each table maps to a domain entity. Embedded value objects (JdParsed, CultureData, FeedbackData, etc.) are stored as JSONB. Use the domain model for field semantics, validation rules, and status enums.

---

## Entity → Table Mapping

| Domain Entity | PostgreSQL Table |
|---------------|------------------|
| Company | `companies` |
| User | `users` |
| Position | `positions` |
| Assessment | `assessments` |
| Message | `messages` |
| (Candidate) | Denormalized in `assessments`; Phase 3: `talent_profiles` |
| candidate_notes | Supporting table |

---

## Schema (PostgreSQL 15+)

### companies

**Domain:** [Company](domain.agentx.md#company)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  website VARCHAR(512),
  subscription_tier VARCHAR(50) DEFAULT 'professional',
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### users

**Domain:** [User](domain.agentx.md#user)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  user_role VARCHAR(50) DEFAULT 'view_only' CHECK (user_role IN ('view_only', 'editor', 'administrator')),
  password_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

---

### positions

**Domain:** [Position](domain.agentx.md#position-job--role)

Stores JdParsed, CultureData, Question[], ScoringWeights, ScoreRanges as JSONB per domain model.

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSONB,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  created_by UUID REFERENCES users(id),
  assessment_link VARCHAR(1024),
  scoring_weights JSONB DEFAULT '{"technical": 40, "cultural": 25, "experience": 20, "market": 15}',
  jd_original TEXT,
  jd_parsed JSONB,
  culture_data JSONB,
  questions JSONB,
  branding JSONB,
  score_ranges JSONB,
  job_genie_references JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positions_company_id ON positions(company_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_positions_created_at ON positions(created_at);
```

---

### assessments

**Domain:** [Assessment](domain.agentx.md#assessment)

Stores conversation_data, feedback_data, resume_parsed_data as JSONB per domain model.

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id),
  candidate_email VARCHAR(255) NOT NULL,
  candidate_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  cultural_score INTEGER CHECK (cultural_score >= 0 AND cultural_score <= 100),
  experience_score INTEGER CHECK (experience_score >= 0 AND experience_score <= 100),
  market_score INTEGER CHECK (market_score >= 0 AND market_score <= 100),
  conversation_data JSONB,
  feedback_data JSONB,
  resume_file_path VARCHAR(1024),
  resume_parsed_data JSONB,
  resume_uploaded_at TIMESTAMPTZ,
  recruiter_status VARCHAR(50) CHECK (recruiter_status IN ('reviewing', 'advanced', 'rejected')),
  recruiter_notes TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessments_position_id ON assessments(position_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_overall_score ON assessments(overall_score);
CREATE INDEX idx_assessments_candidate_email ON assessments(candidate_email);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
```

---

### messages

**Domain:** [Message](domain.agentx.md#message)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('assistant', 'user')),
  content TEXT NOT NULL,
  phase VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_assessment_id ON messages(assessment_id);
```

---

### candidate_notes

Supporting table for recruiter notes on assessments.

```sql
CREATE TABLE candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidate_notes_assessment_id ON candidate_notes(assessment_id);
```

---

## Phase 3: Talent Network

### talent_profiles

**Domain:** Candidate opt-in profile (future).

```sql
CREATE TABLE talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_email VARCHAR(255) UNIQUE NOT NULL,
  candidate_name VARCHAR(255),
  opt_in BOOLEAN DEFAULT false,
  skills JSONB,
  experience_years INTEGER,
  location VARCHAR(255),
  remote_preference VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_talent_profiles_opt_in ON talent_profiles(opt_in);
CREATE INDEX idx_talent_profiles_skills ON talent_profiles USING GIN(skills);
```

---

## Legacy: roles

For backward compatibility during migration. `roles` → `positions`; use `position_id` in assessments.

```sql
-- Optional: keep during migration from role_id to position_id
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## JSONB Column Schemas (Domain Reference)

| Column | Domain Type | Notes |
|--------|-------------|-------|
| jd_parsed | [JdParsed](domain.agentx.md#jdparsed) | required_skills, experience_years, cultural_traits, etc. |
| culture_data | [CultureData](domain.agentx.md#culturedata) | values, work_style, perks, cultural_traits |
| questions | [Question](domain.agentx.md#question)[] | question, dimension, related_to, weight |
| scoring_weights | [ScoringWeights](domain.agentx.md#scoringweights) | technical, cultural, experience, market (sum 100) |
| score_ranges | [ScoreRanges](domain.agentx.md#scoreranges) | advance, pipeline_min, suggest_min, reject_max |
| feedback_data | [FeedbackData](domain.agentx.md#feedbackdata) | overall_summary, strengths, improvements, next_steps, ai_recommendation |
| resume_parsed_data | [ResumeParsed](domain.agentx.md#resumeparsed) | skills, work_experience, years_experience, summary |
| conversation_data | object | conversation state, phases |

**Validation:** Use Zod schemas from [domain-classes.agentx.md](domain-classes.agentx.md) to validate JSONB on read/write.

---

## Migrations

```bash
# Create migration
npm run migrate create initial-schema

# Run migrations
npm run migrate up

# Rollback
npm run migrate down
```

---

## Related

| Document | Purpose |
|----------|---------|
| [domain.agentx.md](domain.agentx.md) | Domain model (entities, value objects) |
| [domain-classes.agentx.md](domain-classes.agentx.md) | Zod schemas + TypeScript types |
| [zod-domain.agentx.md](zod-domain.agentx.md) | Zod schema-first design |
| [domain-agents.agentx.md](domain-agents.agentx.md) | Domain AI agents |
