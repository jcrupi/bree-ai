---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: urgent-ai.algos.agentx-v1.md
---

# Urgent AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for urgent care E/M validation, procedure bundling, and compliance. Aligned with CMS and AMA. For implementation by coding-ai and urgent-ai backend services.

**Use by AI:** This document contains **real rules** (implementable logic) and **pseudo rules** (templates for AI to generate backend code). Use real rules for validation logic; use pseudo rules to generate Python classes, API endpoints, and service integrations.

---

## 1. Overview

Urgent AI validation follows a **deterministic sequence** of rule groups. Given the same encounter, policy, and rule version, the system produces the same findings in the same order.

**Sources:** AMA CPT®, CMS Medicare Claims Processing Manual Ch. 12, NCCI Policy Manual

### 1.1 Document Structure

| Section | Type | Use |
|---------|------|-----|
| Real Rules (5–11) | Implementable | Direct translation to validation engine code |
| Pseudo Rules | AI templates | Generate backend services, APIs, models |
| Code Tables (3, 4) | Reference data | Constants, mappings for implementation |

---

## 2. Validation Flow

```
                    ENCOUNTER INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Encounter Integrity │
              │    (URG.ID.001)         │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. Patient Status Gate │
              │    (URG.PAT.010)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. Documentation Gate  │
              │    (URG.DOC.020)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 4. MDM or Time Gate     │
              │    (URG.MDM.030)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. Place of Service    │
              │    (URG.POS.040)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 6. ICD-10 Medical      │
              │    Necessity (URG.ICD.050)│
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 7. E/M + Procedure     │
              │    Modifier 25 (URG.MOD.060)│
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALIDATION COMPLETE
```

---

## 3. Complete CPT Code Tables (Reference)

### 3.1 Office/Outpatient — Urgent Care Primary Codes

| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99202 | Straightforward | 15 | 29 |
| 99203 | Low | 30 | 44 |
| 99204 | Moderate | 45 | 59 |
| 99205 | High | 60 | 74 |
| 99211 | N/A | 5 | — |
| 99212 | Straightforward | 10 | 19 |
| 99213 | Low | 20 | 29 |
| 99214 | Moderate | 30 | 39 |
| 99215 | High | 40 | 54 |

### 3.2 Procedures Commonly Billed with E/M

| Code | Description |
|------|-------------|
| 12011–12018 | Simple repair, face |
| 12031–12037 | Layer closure, trunk/extremity |
| 29125–29126 | Arm splint/cast |
| 29515–29540 | Leg splint/cast |
| 96372 | Therapeutic injection |
| 80053 | Comprehensive metabolic panel |
| 85025 | CBC |
| 87804 | Influenza rapid test |

---

## 4. Place of Service to Code Mapping (URG.POS.040)

| POS | Allowed | Notes |
|-----|---------|-------|
| 11 (Office) | 99202–99215 | Standard |
| 20 (Urgent Care) | 99202–99215 | When payer recognizes |
| 22 (Outpatient hospital) | 99202–99215 | Hospital-based urgent care |

**Reject:** 99281–99285 (ED codes) for urgent care setting.

---

## 5. Algorithm: Encounter Integrity (URG.ID.001)

**Input:** encounter (date_of_service, provider_id, place_of_service, patient_id)

**Output:** PASS | FAIL

**Steps:**

1. For each field in [date_of_service, provider_id, place_of_service, patient_id]:
   - If null or empty → RETURN FAIL, remediation: "Add required encounter field: {field}"

2. If date_of_service > today → RETURN FAIL, remediation: "Date of service cannot be in the future"

3. If place_of_service not in {11, 20, 22} → RETURN FAIL, remediation: "Invalid place of service for urgent care. Use 11 (Office), 20 (Urgent Care Facility), or 22 (Outpatient hospital)."

4. RETURN PASS

---

## 6. Algorithm: Patient Status Gate (URG.PAT.010)

**Input:** patient_status (new | established)

**Output:** PASS | FAIL

**Steps:**

1. New = no face-to-face E/M by same physician/specialty in past 3 years
2. Established = face-to-face E/M within past 3 years
3. If patient_status not in [new, established] → RETURN FAIL
4. RETURN PASS

---

## 7. Algorithm: Documentation Gate (URG.DOC.020)

**Input:** note (chief_complaint, history, exam, assessment, plan)

**Output:** PASS | FAIL

**Steps:**

1. Require chief_complaint non-empty
2. Require assessment (diagnosis) non-empty
3. Require plan non-empty
4. If using MDM: require problems, data, or risk documented
5. If using time: require total time documented in minutes
6. RETURN PASS or FAIL with remediation

---

## 8. Algorithm: MDM or Time Gate (URG.MDM.030)

**Input:** chosen_code, mdm_level, time_minutes, time_documented

**Output:** PASS | FAIL

**MDM scoring:** Two of three elements (Problems, Data, Risk) must meet level. Use `enm-ai.algos.agentx-v1.md` Section 8 (EM.MDM.020) for full Data element breakdown (Category 1/2/3), Problems, and Risk criteria.

**Steps:**

1. Load CODE_MDM_TABLE[chosen_code] and CODE_TIME_TABLE[chosen_code]
2. If using MDM: verify mdm_level meets chosen_code requirement
3. If using time: verify time_minutes in range and time_documented
4. At least one (MDM or time) must support chosen_code
5. RETURN PASS or FAIL

---

## 9. Algorithm: ICD-10 Medical Necessity (URG.ICD.050)

**Input:** icd10_codes, chosen_code, chief_complaint

**Output:** PASS | FAIL

**Steps:**

1. Primary ICD-10 must support medical necessity for encounter
2. Optional: call coding-ai LCD validators for payer-specific rules
3. If icd10_codes empty → RETURN FAIL
4. RETURN PASS

---

## 10. Algorithm: Modifier 25 (URG.MOD.060)

**Input:** em_code, procedure_codes, modifier_25_applied

**Output:** PASS | FAIL

**Steps:**

1. When E/M (99202–99215) and procedure (e.g., 12011, 96372) billed same day:
   - Require modifier 25 on E/M if E/M is separately identifiable
2. If procedure_codes non-empty and em_code present and not modifier_25_applied:
   - RETURN FAIL, remediation: "Modifier 25 required when E/M is separately identifiable from procedure"
3. RETURN PASS

---

## 11. Pseudo: Coding Engine Integration

```
GENERATE: Integration between urgent.ai and coding-ai

TEMPLATE:
- coding-ai provides:
  - POST /process: { medical_record, specialty: "GENERAL" } -> { icd_codes[], cpt_codes[], success }
  - POST /process-pdf: { file, specialty: "GENERAL" } -> same
  - GET /health -> { status }
- urgent.ai consumes: Call coding-ai to get suggested ICD-10/CPT from note; use for URG.ICD.050
- urgent.ai provides: POST /assess-urgent, POST /validate-urgent, POST /generate-codes
- Flow: User submits note -> coding-ai extracts codes (GENERAL) -> urgent.ai validates E/M + procedures
```

---

## 12. Pseudo: Urgent AI Service Structure

```
GENERATE: urgent-ai backend modeled after wound-ai and enm-ai

TEMPLATE:
- services/coding_service.py: Same as wound-ai, default specialty="GENERAL"
- services/validation_service.py: Implements URG.ID.001 through URG.MOD.060
- main.py: FastAPI app with /assess-urgent, /generate-codes, /validate-urgent
- Environment: CODING_AI_URL
- AgentX: urgent-ai.playbook.agentx.md, urgent-ai.algos.agentx.md
```

---

## 13. Shared Logic with EM.AI

Urgent care E/M validation reuses logic from `enm-ai.algos.agentx-v1.md`:

- MDM scoring (EM.MDM.020)
- Time ranges (EM.TIM.030)
- POS mapping (EM.POS.050) — with urgent-specific POS 11, 20, 22
- ICD medical necessity (EM.ICD.070)

**Implementation:** Consider shared validation module or import from enm-ai validation service.

---

## 14. Remediation Prompts (Complete)

| Finding | Remediation |
|---------|-------------|
| Missing encounter field | Add required encounter field: {field} |
| Future date | Date of service cannot be in the future |
| Invalid POS | Invalid place of service for urgent care. Use 11 (Office), 20 (Urgent Care Facility), or 22 (Outpatient hospital). |
| Patient status invalid | Patient status must be new or established. |
| Documentation incomplete | Documentation incomplete. Missing: chief complaint, assessment, or plan. |
| MDM/time mismatch | MDM level or documented time does not support chosen code. |
| ICD-10 missing | Primary diagnosis (ICD-10) required to support medical necessity. |
| Modifier 25 required | Modifier 25 required when E/M is separately identifiable from procedure. |

---

**END OF ALGO**

*Deterministic validation. Same inputs → same outputs. Aligned with CMS and AMA.*
