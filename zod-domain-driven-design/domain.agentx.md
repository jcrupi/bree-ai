# Geni Domain Model

AI-agent-oriented domain model definition for the GeniusMatch/Geni recruiting platform. Single source of truth for entities, value objects, and relationships.

**Part of:** [Zod Domain Driven Design](README.md) — informed by [business.agentx.md](business.agentx.md) → informs [zod-domain.agentx.md](zod-domain.agentx.md)

---

## Entity Relationship Overview

```mermaid
erDiagram
    Company ||--o{ User : has
    Company ||--o{ Position : has
    Position ||--o{ Assessment : has
    Assessment ||--o{ Message : contains
    Assessment }o--|| Candidate : for
    Position }o--o| JdParsed : parsed_from
    Position }o--o| CultureData : culture_from
    Assessment }o--o| FeedbackData : produces
    Assessment }o--o| ResumeParsed : resume
```

---

## Core Entities

### Company

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| name | string | Company name |
| domain | string? | Company domain (e.g. `acme.com`) |
| website | string? | Company website URL |
| subscription_tier | string | `professional` (default) |
| api_key | string? | API key for integrations |
| created_at | datetime | |
| updated_at | datetime | |

---

### User

App users (recruiters/staff) with permission levels.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| company_id | string? | FK to Company |
| email | string | Unique, email format |
| name | string? | Display name |
| user_role | string | `view_only` \| `editor` \| `administrator` |
| password_hash | string? | Bcrypt hash |
| status | string | `active` \| `inactive` |
| last_login | string? | ISO datetime |
| created_at | string | ISO datetime |
| updated_at | string? | ISO datetime |

**Constants:** `USER_ROLES = ("view_only", "editor", "administrator")`

---

### Position (Job / Role)

Job posting created by recruiter. Replaces legacy `Role` entity.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| company_id | string | FK to Company |
| title | string | Job title |
| description | string? | Job description |
| requirements | object? | Legacy requirements blob |
| status | string | `active` \| `paused` \| `closed` |
| created_by | string? | FK to User |
| assessment_link | string? | Public assessment URL |
| scoring_weights | ScoringWeights? | Pillar weights |
| jd_original | string? | Raw job description text |
| jd_parsed | JdParsed? | Parsed JD data |
| culture_data | CultureData? | Scraped culture info |
| questions | Question[]? | Generated assessment questions |
| branding | object? | Company branding overrides |
| score_ranges | ScoreRanges? | Advance/pipeline/suggest/reject thresholds |
| job_genie_references | string[]? | URLs for Job Geni context |
| created_at | string | ISO datetime |
| updated_at | string? | ISO datetime |

---

### Assessment

Candidate assessment for a position.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| position_id | string | FK to Position |
| candidate_email | string | Candidate email |
| candidate_name | string? | Candidate name |
| status | string | `in_progress` \| `completed` \| `abandoned` |
| started_at | datetime | |
| completed_at | datetime? | |
| overall_score | int? | 0–100 |
| technical_score | int? | 0–100 |
| cultural_score | int? | 0–100 |
| experience_score | int? | 0–100 |
| market_score | int? | 0–100 |
| conversation_data | object? | Messages, phases, state |
| feedback_data | FeedbackData? | Generated feedback |
| resume_file_path | string? | Path to uploaded resume |
| resume_parsed_data | ResumeParsed? | Parsed resume |
| resume_uploaded_at | datetime? | |
| recruiter_status | string? | `reviewing` \| `advanced` \| `rejected` |
| recruiter_notes | string? | |
| duration_seconds | int? | |
| created_at | datetime | |
| updated_at | datetime | |

---

### Message

Single message in an assessment conversation.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| assessment_id | string | FK to Assessment |
| role | string | `assistant` \| `user` |
| content | string | Message text |
| phase | string? | Conversation phase |
| timestamp | datetime | |

---

## Value Objects & Embedded Types

### ScoringWeights

Pillar weights must sum to 100.

| Field | Type | Default |
|-------|------|---------|
| technical | int | 40 |
| cultural | int | 25 |
| experience | int | 20 |
| market | int | 15 |

---

### ScoreRanges

Position score thresholds for UI (advance, pipeline, suggest, reject).

| Field | Type | Default |
|-------|------|---------|
| advance | int | 85 |
| pipeline_min | int | 70 |
| pipeline_max | int | 84 |
| suggest_min | int | 60 |
| suggest_max | int | 69 |
| reject_max | int | 59 |

---

### JdParsed

Output of JD parser agent.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Job title |
| industry | string | e.g. `healthcare`, `general` |
| required_skills | RequiredSkill[] | Skills with level, weight, test_method |
| experience_years | { min: int, max: int } | e.g. `{ min: 3, max: 5 }` |
| responsibilities | string[] | |
| nice_to_haves | string[] | |
| work_style | string | |
| communication_style | string | |
| cultural_traits | CulturalTrait[] | |
| deal_breakers | string[] | |
| salary_range | string? | |
| location | string | |
| remote_policy | string | |

---

### RequiredSkill

| Field | Type | Description |
|-------|------|-------------|
| skill | string | Skill name |
| level | int | 1–5 | 
| weight | string | `high` \| `medium` \| `low` |
| test_method | string | e.g. `Problem solving`, `Verification` |

---

### CulturalTrait

| Field | Type | Description |
|-------|------|-------------|
| trait | string | Trait name |
| importance | string | `critical` \| `high` \| `medium` |
| red_flag | string? | |

---

### CultureData

Output of culture scraper agent.

| Field | Type | Description |
|-------|------|-------------|
| values | string[] | Company values |
| work_style | object | |
| perks | string[] | |
| team_size | string | |
| tech_stack | string[] | |
| keywords | string[] | |
| cultural_traits | (string \| CulturalTrait)[] | |

---

### Question

Generated assessment question.

| Field | Type | Description |
|-------|------|-------------|
| question | string | Question text |
| dimension | string | `technical` \| `cultural` \| `experience` \| `scenario` |
| related_to | string | Skill or topic |
| weight | int | 1–10 |

---

### FeedbackData

Generated feedback for completed assessment.

| Field | Type | Description |
|-------|------|-------------|
| overall_summary | string[] | Bullet summary |
| skill_breakdown | { technical: string[], cultural: string[], experience: string[], market: string[] } | |
| strengths | string[] | 4–6 bullets |
| improvements | string[] | 3–5 bullets |
| next_steps | { message: string, timeline: string, options: string[] } | |
| ai_recommendation | { action: string, summary: string } | Action: `advance`, `pipeline`, `suggest`, `reject` |

---

### ResumeParsed

Output of resume parser.

| Field | Type | Description |
|-------|------|-------------|
| skills | string[] | |
| work_experience | WorkExperience[] | |
| years_experience | int? | |
| summary | string? | |
| parse_error | string? | If parse failed |

---

### WorkExperience

| Field | Type | Description |
|-------|------|-------------|
| title | string | Job title |
| company | string | Company name |
| achievements | string[]? | |

---

### DetailedScores

Per-pillar scoring breakdown (from scoring agent).

| Field | Type | Description |
|-------|------|-------------|
| technical | { individual_skill_scores: Record<string, { score, reasoning, strengths?, weaknesses? }>, strengths?, weaknesses?, reasoning } | |
| cultural | { value_matches?, potential_challenges?, reasoning } | |
| experience | { estimated_years?, estimated_level?, reasoning } | |
| market | { availability?, market_competitiveness?, reasoning } | |

---

## Score Bands

Aligned with `frontend/lib/scoringBands.ts` and `backend scoring_agent.py`.

| Band | Range | Label |
|------|-------|-------|
| Exceptional | 93–100 | Exceptional Mastery |
| Strong | 83–92 | Strong Demonstration |
| Good | 71–82 | Good Details |
| Moderate | 56–70 | Moderate Details |
| Basic | 41–55 | Basic Details |
| Developing | 26–40 | Minimal Detail |
| Not assessed | 0–25 | Not Assessed |

---

## Status Enums

| Entity | Field | Values |
|--------|-------|--------|
| User | status | `active`, `inactive` |
| User | user_role | `view_only`, `editor`, `administrator` |
| Position | status | `active`, `paused`, `closed` |
| Assessment | status | `in_progress`, `completed`, `abandoned` |
| Assessment | recruiter_status | `reviewing`, `advanced`, `rejected` |
| Message | role | `assistant`, `user` |

---

## Legacy: Role

`Role` is deprecated in favor of `Position`. Schema is equivalent; `role_id` in assessments has been migrated to `position_id`.

---

## Related

| Document | Purpose |
|----------|---------|
| [business.agentx.md](business.agentx.md) | Business context (informs this model) |
| [zod-domain.agentx.md](zod-domain.agentx.md) | Zod schema-first design |
| [domain-classes.agentx.md](domain-classes.agentx.md) | Zod schemas + TypeScript types |
| [domain-postgres.agentx.md](domain-postgres.agentx.md) | PostgreSQL schema |
| [domain-agents.agentx.md](domain-agents.agentx.md) | Domain AI agents mapping |
