---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: playbook
  filename: 1040-simple.playbook.agentx-v1.md
  domain: 1040-simple
---

# Form 1040 (Simple) Playbook v1

> Validate the simplest US federal tax return. At runtime, content is analyzed to ensure it conforms to the playbook and algos. Produces a deep-ai-agent for the 1040-simple domain.

## Overview

Form 1040 (Simple) covers the easiest filing scenario: single filer, W-2 wage income only, standard deduction, no dependents. The playbook defines required fields, math flow, and validation rules. At runtime, pasted content (W-2 data, form lines, or a draft return) is analyzed for conformance.

## Domain

**US Federal Form 1040 — Simple filing** — Single, W-2 only, standard deduction. No Schedule A, C, D, E, or SE. No dependents. Tax year 2024.

## Entities

- **Taxpayer** — Filer. Has: name, SSN (XXX-XX-XXXX), filing_status. Relates to: Form1040, W2.
- **W2** — Wage statement. Has: employer_name, wages (box 1), fed_withheld (box 2), employer_ein. Relates to: Taxpayer.
- **Form1040** — The return. Has: tax_year, filing_status, lines 1–24. Relates to: Taxpayer, W2.
- **Line** — A form line. Has: line_number, amount, source. Relates to: Form1040.
- **FilingStatus** — Single, Married Filing Jointly, etc. For simple: Single only.
- **StandardDeduction** — 2024 Single: $14,600. Relates to: Form1040.

## Rules

### TX.ID.001 — SSN/TIN format
- **Check:** SSN is XXX-XX-XXXX or 9 digits
- **Fail:** Invalid or missing SSN

### TX.ID.002 — Filing status required
- **Check:** filing_status is one of Single, MFJ, MFS, HOH, QSS
- **Fail:** Missing or invalid; for simple, must be Single

### TX.W2.010 — W-2 wages required
- **Check:** At least one W-2 with box 1 (wages) > 0
- **Fail:** No W-2 or zero wages

### TX.W2.011 — W-2 box 1 = total wages
- **Check:** Sum of W-2 box 1 = Line 1a (wages)
- **Fail:** Mismatch

### TX.MATH.020 — AGI flow
- **Check:** Line 11 (AGI) = Line 9 (total income) for simple (no adjustments)
- **Fail:** AGI inconsistent with income

### TX.MATH.021 — Taxable income
- **Check:** Line 15 (taxable income) = Line 11 (AGI) − Line 14 (standard deduction)
- **Fail:** Math error

### TX.MATH.022 — Tax from table
- **Check:** Line 16 (tax) matches tax table for Line 15 amount and filing status
- **Fail:** Tax amount incorrect for bracket

### TX.SIGN.030 — Signature and date
- **Check:** Return signed and dated
- **Fail:** Missing signature or date

## API Surface

- `POST /api/1040/validate` — Run content through playbook
- `POST /api/playback` — Playback Runner

## AgentX Notes

- `1040-simple.algos.agentx-v1.md` — Validation rules, RuleCatalog, flow
