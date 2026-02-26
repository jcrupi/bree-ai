# Geni Business Problem & Philosophy

Shared business context for Geni. Use this document for both v3.7 refactor and v4.0 greenfield builds. It defines *why* Geni exists and *how* it should behave.

**Part of:** [Zod Domain Driven Design](README.md) — informs → [domain.agentx.md](domain.agentx.md)

---

## The Problem

### For Recruiters

- **Manual screening is slow.** Reviewing resumes and conducting initial phone screens takes 20–30 minutes per candidate. At scale, recruiters spend hours on work that doesn't require human judgment.
- **Inconsistent evaluation.** Different recruiters ask different questions and weight answers differently. Bias and fatigue affect outcomes.
- **Configuration is tedious.** Setting up a new role—extracting requirements, writing questions, defining scoring—takes hours. Most tools assume static forms, not dynamic conversations.

### For Candidates

- **Ghosting and black holes.** Candidates apply and hear nothing for weeks. They don't know if they're being considered or why they were rejected.
- **Rigid, unnatural assessments.** Many screening tools feel like exams: multiple choice, timed tests, rigid scripts. They don't let candidates tell their story.
- **No feedback.** Candidates rarely get useful feedback on why they weren't selected or how to improve.

---

## The Solution: Geni

**Geni** (by Genius Match) is an AI-powered recruiting platform that replaces manual screening with a **12-minute conversational assessment**. Candidates chat naturally with an AI; recruiters get quantified scores, transcripts, and recommendations.

### Core Value Propositions

| Stakeholder | Value |
|-------------|-------|
| **Recruiters** | Screen candidates in minutes, not hours. Consistent, bias-reduced evaluation. 3-minute role setup via AI (paste JD → auto-configure). |
| **Candidates** | Natural conversation, not a test. Immediate feedback with strengths and improvement areas. Clear next steps. |
| **Companies** | Faster time-to-hire, better candidate experience, scalable screening. |

---

## Philosophy

### 1. Conversation Over Forms

Screening should feel like a **casual chat**, not a form or exam. The AI asks open-ended questions, follows up on interesting answers, and adapts to the candidate. Rigid scripts and multiple-choice tests are avoided.

### 2. Candidate-First

- **Immediate feedback.** Candidates see their scores and feedback as soon as they finish. No black holes.
- **Constructive, not punitive.** Feedback highlights strengths and offers actionable improvement areas. It helps candidates grow.
- **Clear next steps.** Candidates know what happens next (timeline, contact, similar roles).

### 3. Recruiter Efficiency

- **Speed.** Create a role and share a link in under 3 minutes. AI parses job descriptions and extracts requirements.
- **Prioritization.** Recruiters see scored, ranked candidates. AI recommendations (advance, pipeline, suggest, reject) reduce decision fatigue.
- **Transparency.** Full conversation transcripts and per-dimension scores support informed decisions.

### 4. Multi-Dimensional Assessment

Candidates are evaluated across four pillars:

| Pillar | Weight | Purpose |
|--------|--------|---------|
| **Technical** | 40% | Skills, problem-solving, depth |
| **Cultural** | 25% | Values fit, collaboration, communication |
| **Experience** | 20% | Relevant background, accomplishments |
| **Market** | 15% | Availability, salary alignment, competitiveness |

Weights are configurable per position. Credentials (licenses, certifications) are verified, not probed with behavioral questions.

### 5. Trust Through Transparency

- Candidates see how they're scored.
- Recruiters see the full transcript and AI reasoning.
- No hidden algorithms. Score bands and feedback logic are explainable.

---

## Vision (Roadmap)

- **Phase 1:** Core screening (conversation, scoring, feedback, recruiter dashboard)
- **Phase 2:** Auto-configuration (JD parsing, culture scraping, 3-minute setup)
- **Phase 3:** Talent network (candidate opt-in, cross-company discovery)
- **Phase 4:** Career agent (AI works for candidates 24/7)

---

## Non-Negotiables

When building or refactoring Geni, these principles must hold:

1. **12-minute target.** The assessment should complete in ~12 minutes. Not 5, not 30.
2. **Natural conversation.** No rigid scripts. AI adapts to candidate responses.
3. **Immediate feedback.** Candidates get scores and feedback as soon as they finish.
4. **Four pillars.** Technical, Cultural, Experience, Market. Configurable weights.
5. **Mobile + desktop.** Works on both. No desktop-only assumptions.
6. **Accessibility.** WCAG 2.1 AA. Screen readers, keyboard nav, contrast.
7. **Privacy.** GDPR/CCPA compliant. Clear data handling.

---

## Related

- [domain.agentx.md](domain.agentx.md) – Domain model (entities, value objects derived from business)
- [zod-domain.agentx.md](zod-domain.agentx.md) – Zod schema-first implementation design
- [README.md](README.md) – Document flow overview
