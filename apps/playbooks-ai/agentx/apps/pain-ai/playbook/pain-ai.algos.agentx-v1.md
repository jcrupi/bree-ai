---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: pain-ai.algos.agentx-v1.md
---

# Pain AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for pain management procedure validation, prior authorization checks, and compliance. Aligned with CMS LCDs and NCCI. For implementation by coding-ai and pain-ai backend services.

**Use by AI:** This document contains **real rules** (implementable logic) and **pseudo rules** (templates for AI to generate backend code). Use real rules for validation logic; use pseudo rules to generate Python classes, API endpoints, and service integrations.

---

## 1. Overview

Pain AI validation follows a **deterministic sequence** of rule groups. Given the same procedure request, policy, and rule version, the system produces the same findings in the same order.

**Sources:** CMS LCD L38958, L38959, L38960; NCCI Policy Manual; AMA CPT®

### 1.1 Document Structure

| Section | Type | Use |
|---------|------|-----|
| Real Rules (5–12) | Implementable | Direct translation to validation engine code |
| Pseudo Rules | AI templates | Generate backend services, APIs, models |
| Code Tables (3, 4) | Reference data | Constants, mappings for implementation |

---

## 2. Validation Flow

```
                    PROCEDURE REQUEST INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Encounter Integrity │
              │    (PAIN.ID.001)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. Diagnosis Validity   │
              │    (PAIN.DX.010)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. Imaging Requirement │
              │    (PAIN.IMG.020)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 4. Conservative Care   │
              │    (PAIN.CON.030)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. CPT–ICD Match        │
              │    (PAIN.MAP.040)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 6. NCCI / Modifier      │
              │    (PAIN.NCCI.050)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 7. Prior Auth Check     │
              │    (PAIN.PA.060)         │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 8. Frequency Limits    │
              │    (PAIN.FREQ.070)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALIDATION COMPLETE
```

---

## 3. CPT Code Tables (Reference)

### 3.1 Epidural Injections

| Code | Description | Region |
|------|-------------|--------|
| 62310 | Epidural, cervical/thoracic | C/T |
| 62311 | Epidural, lumbar/sacral | L/S |
| 62320 | Epidural C/T, no imaging | C/T |
| 62321 | Epidural C/T, with imaging | C/T |
| 62322 | Caudal, no imaging | L/S |
| 62323 | Caudal, with imaging | L/S |
| 64479 | TFESI C/T, single level | C/T |
| 64480 | TFESI C/T, add'l level | C/T |
| 64483 | TFESI L/S, single level | L/S |
| 64484 | TFESI L/S, add'l level | L/S |

### 3.2 Facet Injections

| Code | Description | Region |
|------|-------------|--------|
| 64490 | Facet C/T, single | C/T |
| 64491 | Facet C/T, second | C/T |
| 64492 | Facet C/T, third+ | C/T |
| 64493 | Facet L/S, single | L/S |
| 64494 | Facet L/S, second | L/S |
| 64495 | Facet L/S, third+ | L/S |

### 3.3 Radiofrequency Ablation

| Code | Description |
|------|-------------|
| 64633 | RFA C/T, first level |
| 64634 | RFA C/T, second level |
| 64635 | RFA C/T, third+ levels |
| 64636 | RFA L/S, first level |
| 64637 | RFA L/S, each add'l level |

---

## 4. CPT–ICD Medical Necessity Mapping

| CPT Category | Required ICD-10 Category |
|--------------|-------------------------|
| Epidural (623xx, 6447x–6448x) | Radiculopathy, spinal stenosis, disc herniation, lumbar/cervical pain |
| Facet (6449x–64495) | Facet arthropathy, spinal pain, cervicalgia, lumbar pain |
| RFA (64633–64637) | Same as facet; requires prior positive diagnostic block |
| SI joint (27096) | Sacroiliitis, SI joint dysfunction |

**Implementation:** Load from coding-ai LCD tables; validate that primary_icd10 is in allowed set for requested cpt_code.

---

## 5. Algorithm: Encounter Integrity (PAIN.ID.001)

**Input:** procedure_request (date_of_service, provider_id, place_of_service, patient_id, cpt_code, icd10_codes)

**Output:** PASS | FAIL

**Steps:**

1. For each field in [date_of_service, provider_id, place_of_service, patient_id, cpt_code]:
   - If null or empty → RETURN FAIL, remediation: "Add required field: {field}"

2. If date_of_service > today → RETURN FAIL, remediation: "Date of service cannot be in the future"

3. If place_of_service not in {11, 22, 24} → RETURN FAIL, remediation: "Invalid place of service. Use 11 (Office), 22 (Outpatient hospital), or 24 (ASC)."

4. If icd10_codes is empty → RETURN FAIL, remediation: "At least one ICD-10 diagnosis required"

5. RETURN PASS

---

## 6. Algorithm: Diagnosis Validity (PAIN.DX.010)

**Input:** icd10_codes, cpt_code

**Output:** PASS | FAIL

**Steps:**

1. Load CPT_ICD_MAP for cpt_code (from LCD)
2. For primary_icd10 in icd10_codes:
   - If primary_icd10 in CPT_ICD_MAP[cpt_code] → RETURN PASS
3. RETURN FAIL, remediation: "ICD-10 {primary_icd10} does not support medical necessity for {cpt_code} per LCD"

---

## 7. Algorithm: Imaging Requirement (PAIN.IMG.020)

**Input:** procedure_request (cpt_code, imaging_documented, imaging_date)

**Output:** PASS | FAIL

**Steps:**

1. If cpt_code in [62310, 62311, 64479, 64483, 64490, 64493, 64633, 64636, ...]:
   - Require MRI or CT within past 12 months (or per LCD)
2. If not imaging_documented → RETURN FAIL, remediation: "MRI or CT required within 12 months"
3. If imaging_date older than 12 months → RETURN FAIL, remediation: "Imaging must be within 12 months"
4. RETURN PASS

---

## 8. Algorithm: Conservative Care (PAIN.CON.030)

**Input:** conservative_care (pt_weeks, hep_weeks, nsaid_weeks, other)

**Output:** PASS | FAIL

**Steps:**

1. Require ≥4 weeks of at least one: PT, home exercise, NSAIDs, activity modification
2. If no conservative_care documented → RETURN FAIL, remediation: "Document ≥4 weeks failed conservative care"
3. RETURN PASS

---

## 9. Algorithm: NCCI / Modifier (PAIN.NCCI.050)

**Input:** cpt_codes (list), modifiers, same_day_em

**Output:** PASS | FAIL

**Steps:**

1. Check NCCI column 2: if primary + column-2 code billed, RETURN FAIL
2. If same_day_em and procedure: require modifier 25 on E/M when separately reported
3. If bilateral: require modifier 50 or RT/LT per payer
4. RETURN PASS

---

## 10. Algorithm: Prior Auth Check (PAIN.PA.060)

**Input:** cpt_code, payer_id, pa_required, pa_status

**Output:** PASS | FAIL | PA_REQUIRED

**Steps:**

1. If cpt_code in PA_REQUIRED_CODES[payer_id]:
   - If pa_status not in [APPROVED, PENDING] → RETURN PA_REQUIRED
2. RETURN PASS

---

## 11. Algorithm: Frequency Limits (PAIN.FREQ.070)

**Input:** cpt_code, patient_id, prior_procedures_same_code, limit_per_year

**Output:** PASS | FAIL

**Steps:**

1. limit = FREQUENCY_LIMITS.get(cpt_code, 4)  # e.g., epidurals 2–4/year per LCD
2. If len(prior_procedures_same_code) >= limit → RETURN FAIL, remediation: "Frequency limit exceeded. Max {limit} per year for {cpt_code}."
3. RETURN PASS

---

## 12. Algorithm: RFA Diagnostic Block Requirement (PAIN.RFA.080)

**Input:** cpt_code, diagnostic_block_documented, diagnostic_block_positive

**Output:** PASS | FAIL

**Steps:**

1. If cpt_code not in [64633, 64634, 64635, 64636, 64637] → RETURN PASS (skip)

2. If not diagnostic_block_documented → RETURN FAIL, remediation: "RFA requires prior positive diagnostic medial branch block. Document diagnostic block and ≥50% pain relief."

3. If not diagnostic_block_positive → RETURN FAIL, remediation: "RFA requires positive diagnostic block (≥50% pain relief). Document response before RFA."

4. RETURN PASS

---

## 13. Pseudo: Coding Engine Integration

```
GENERATE: Integration between pain.ai and coding-ai

TEMPLATE:
- coding-ai provides:
  - POST /process: { medical_record, specialty: "PAIN" } -> { icd_codes[], cpt_codes[], success }
  - POST /process-pdf: { file, specialty: "PAIN" } -> same
  - GET /health -> { status }
- pain.ai consumes: Call coding-ai to get suggested ICD-10/CPT from note; use for PAIN.MAP.040, PAIN.DX.010
- pain.ai provides: POST /assess-pain, POST /validate-pain, POST /prior-auth-check
- Flow: User submits note -> coding-ai extracts codes (PAIN specialty) -> pain.ai validates procedure + PA
```

---

## 14. Pseudo: Pain AI Service Structure

```
GENERATE: pain-ai backend modeled after wound-ai and enm-ai

TEMPLATE:
- services/coding_service.py: Same as wound-ai, default specialty="PAIN"
- services/validation_service.py: Implements PAIN.ID.001 through PAIN.RFA.080
- main.py: FastAPI app with /assess-pain, /generate-codes, /validate-pain, /prior-auth-check
- Environment: CODING_AI_URL, PRIOR_AUTH_URL (optional)
```

---

**END OF ALGO**

*Deterministic validation. Same inputs → same outputs. Aligned with CMS LCDs and NCCI.*
