---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: algos
  filename: 1040-simple.algos.agentx-v1.md
  domain: 1040-simple
---

# Form 1040 (Simple) Algos v1

> Validation rules for the simplest US federal tax return. At runtime, content is analyzed against these rules to ensure conformance. Produces a deep-ai-agent for the 1040-simple domain.

## Overview

These algos define the validation flow for Form 1040 (Simple) content. SSN, filing status, W-2 wages, and the math flow (income → AGI → taxable income → tax) must conform. The Playback Runner (or grape) loads this playbook and algos to analyze pasted content at runtime.

## Validation Rules

### TX.ID.001 — SSN/TIN format
- **Check:** SSN is XXX-XX-XXXX or 9 digits
- **Fail:** Invalid or missing SSN
- **Remediation:** Provide valid SSN (e.g. 123-45-6789)

### TX.ID.002 — Filing status required
- **Check:** filing_status is Single (for simple scenario)
- **Fail:** Missing or invalid; must be Single
- **Remediation:** Set filing_status to Single

### TX.W2.010 — W-2 wages required
- **Check:** At least one W-2 with box 1 (wages) > 0
- **Fail:** No W-2 or zero wages
- **Remediation:** Add W-2 with wages

### TX.W2.011 — W-2 box 1 = Line 1a
- **Check:** Sum of W-2 box 1 = Line 1a (wages, salaries, tips)
- **Fail:** Mismatch
- **Remediation:** Reconcile W-2 total with Line 1a

### TX.MATH.020 — AGI flow
- **Check:** Line 11 (AGI) = Line 9 (total income) for simple (no Schedule 1 adjustments)
- **Fail:** AGI inconsistent
- **Remediation:** For simple return, AGI = total income

### TX.MATH.021 — Taxable income
- **Check:** Line 15 = Line 11 − Line 14 (standard deduction). 2024 Single: $14,600.
- **Fail:** Math error
- **Remediation:** Recalculate: taxable = AGI − standard deduction

### TX.MATH.022 — Tax from table
- **Check:** Line 16 (tax) matches IRS Tax Table for Line 15 and Single status
- **Fail:** Tax amount incorrect
- **Remediation:** Use IRS Tax Table for correct amount

### TX.SIGN.030 — Signature and date
- **Check:** Return signed and dated
- **Fail:** Missing signature or date
- **Remediation:** Sign and date the return

## RuleCatalog

```yaml
# 1040-simple RuleCatalog
specialty: "1040-simple"
version: 1
created_at: "2025-03-12T00:00:00.000Z"
flow:
  - id: "TX.ID.001"
    name: "SSN/TIN format"
    order: 1
  - id: "TX.ID.002"
    name: "Filing status required"
    order: 2
  - id: "TX.W2.010"
    name: "W-2 wages required"
    order: 3
  - id: "TX.W2.011"
    name: "W-2 box 1 = Line 1a"
    order: 4
  - id: "TX.MATH.020"
    name: "AGI flow"
    order: 5
  - id: "TX.MATH.021"
    name: "Taxable income"
    order: 6
  - id: "TX.MATH.022"
    name: "Tax from table"
    order: 7
  - id: "TX.SIGN.030"
    name: "Signature and date"
    order: 8
rules:
  TX.ID.001:
    id: "TX.ID.001"
    name: "SSN/TIN format"
    type: "interpreted"
    inputs: ["taxpayer"]
    output: "PASS_FAIL"
    handler: "evaluateIdentificationRule"
    description: "SSN is XXX-XX-XXXX or 9 digits"
    remediation: "Provide valid SSN"
    shortCircuit: false
  TX.ID.002:
    id: "TX.ID.002"
    name: "Filing status required"
    type: "interpreted"
    inputs: ["form1040"]
    output: "PASS_FAIL"
    handler: "evaluateIdentificationRule"
    description: "filing_status is Single"
    remediation: "Set filing_status to Single"
    shortCircuit: false
  TX.W2.010:
    id: "TX.W2.010"
    name: "W-2 wages required"
    type: "interpreted"
    inputs: ["w2s"]
    output: "PASS_FAIL"
    handler: "evaluateMathRule"
    description: "At least one W-2 with wages > 0"
    remediation: "Add W-2 with wages"
    shortCircuit: false
  TX.W2.011:
    id: "TX.W2.011"
    name: "W-2 box 1 = Line 1a"
    type: "interpreted"
    inputs: ["w2s", "form1040"]
    output: "PASS_FAIL"
    handler: "evaluateMathRule"
    description: "Sum W-2 box 1 equals Line 1a"
    remediation: "Reconcile W-2 total with Line 1a"
    shortCircuit: false
  TX.MATH.020:
    id: "TX.MATH.020"
    name: "AGI flow"
    type: "interpreted"
    inputs: ["form1040"]
    output: "PASS_FAIL"
    handler: "evaluateMathRule"
    description: "Line 11 = Line 9 for simple"
    remediation: "AGI = total income for simple return"
    shortCircuit: false
  TX.MATH.021:
    id: "TX.MATH.021"
    name: "Taxable income"
    type: "interpreted"
    inputs: ["form1040"]
    output: "PASS_FAIL"
    handler: "evaluateMathRule"
    description: "Line 15 = Line 11 - Line 14"
    remediation: "Recalculate taxable = AGI - standard deduction"
    shortCircuit: false
  TX.MATH.022:
    id: "TX.MATH.022"
    name: "Tax from table"
    type: "interpreted"
    inputs: ["form1040"]
    output: "PASS_FAIL"
    handler: "evaluateMathRule"
    description: "Line 16 matches Tax Table"
    remediation: "Use IRS Tax Table"
    shortCircuit: false
  TX.SIGN.030:
    id: "TX.SIGN.030"
    name: "Signature and date"
    type: "interpreted"
    inputs: ["form1040"]
    output: "PASS_FAIL"
    handler: "evaluateIdentificationRule"
    description: "Return signed and dated"
    remediation: "Sign and date the return"
    shortCircuit: false
```

## Validation Flow

```
│ 1. SSN/TIN format        │
│    (TX.ID.001)           │
        │ PASS
        ▼
│ 2. Filing status         │
│    (TX.ID.002)           │
        │ PASS
        ▼
│ 3. W-2 wages required    │
│    (TX.W2.010)           │
        │ PASS
        ▼
│ 4. W-2 = Line 1a         │
│    (TX.W2.011)           │
        │ PASS
        ▼
│ 5. AGI flow              │
│    (TX.MATH.020)         │
        │ PASS
        ▼
│ 6. Taxable income        │
│    (TX.MATH.021)         │
        │ PASS
        ▼
│ 7. Tax from table        │
│    (TX.MATH.022)         │
        │ PASS
        ▼
│ 8. Signature and date   │
│    (TX.SIGN.030)         │
        │ PASS
        ▼
     CONFORMANT
```

## Algorithm Blocks

### 1. Algorithm: SSN Format (TX.ID.001)

**Input:** taxpayer

**Output:** PASS | FAIL

**Steps:**

1. Extract SSN from taxpayer
2. If missing → RETURN FAIL
3. Normalize: remove dashes, expect 9 digits
4. If not 9 digits → RETURN FAIL
5. RETURN PASS

### 2. Algorithm: Filing Status (TX.ID.002)

**Input:** form1040

**Output:** PASS | FAIL

**Steps:**

1. Extract filing_status
2. If missing → RETURN FAIL
3. If not "Single" (for simple) → RETURN FAIL
4. RETURN PASS

### 3. Algorithm: W-2 Wages Required (TX.W2.010)

**Input:** w2s

**Output:** PASS | FAIL

**Steps:**

1. If w2s empty → RETURN FAIL
2. Sum box 1 (wages) across all W-2s
3. If sum <= 0 → RETURN FAIL
4. RETURN PASS

### 4. Algorithm: W-2 Matches Line 1a (TX.W2.011)

**Input:** w2s, form1040

**Output:** PASS | FAIL

**Steps:**

1. Sum W-2 box 1 = total_wages
2. Line 1a = form1040.lines[1a]
3. If |total_wages - Line 1a| > 0.01 → RETURN FAIL
4. RETURN PASS

### 5. Algorithm: AGI Flow (TX.MATH.020)

**Input:** form1040

**Output:** PASS | FAIL

**Steps:**

1. Line 9 = total income, Line 11 = AGI
2. For simple: Line 11 must equal Line 9
3. If Line 11 != Line 9 → RETURN FAIL
4. RETURN PASS

### 6. Algorithm: Taxable Income (TX.MATH.021)

**Input:** form1040

**Output:** PASS | FAIL

**Steps:**

1. Line 15 = Line 11 - Line 14 (standard deduction)
2. 2024 Single standard deduction = 14600
3. If Line 15 != Line 11 - 14600 (within rounding) → RETURN FAIL
4. RETURN PASS

### 7. Algorithm: Tax From Table (TX.MATH.022)

**Input:** form1040

**Output:** PASS | FAIL

**Steps:**

1. Look up IRS Tax Table for Line 15 (taxable), Single
2. Line 16 must match table amount
3. If mismatch → RETURN FAIL
4. RETURN PASS

### 8. Algorithm: Signature and Date (TX.SIGN.030)

**Input:** form1040

**Output:** PASS | FAIL

**Steps:**

1. If signature missing → RETURN FAIL
2. If date missing → RETURN FAIL
3. RETURN PASS
