---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: derm-ai.algos.agentx-v1.md
---

# Derm AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for dermatology procedure validation, lesion-documentation checks, and compliance. Aligned with CMS and AMA. For implementation by coding-ai and derm-ai backend services.

**Use by AI:** This document contains **real rules** (implementable logic) and **pseudo rules** (templates for AI to generate backend code). Use real rules for validation logic; use pseudo rules to generate Python classes, API endpoints, and service integrations.

---

## 1. Overview

Derm AI validation follows a **deterministic sequence** of rule groups. Given the same encounter, procedure, and rule version, the system produces the same findings in the same order.

**Sources:** AMA CPT®, CMS Medicare Claims Processing Manual, NCCI Policy Manual

### 1.1 Document Structure

| Section | Type | Use |
|---------|------|-----|
| Real Rules (5–12) | Implementable | Direct translation to validation engine code |
| Pseudo Rules | AI templates | Generate backend services, APIs, models |
| Code Tables (3, 4) | Reference data | Constants, mappings for implementation |

---

## 2. Validation Flow

```
                    ENCOUNTER / PROCEDURE INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Encounter Integrity │
              │    (DERM.ID.001)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. Lesion Documentation│
              │    (DERM.LES.010)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. Size–Code Match     │
              │    (DERM.SIZE.020)      │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 4. CPT–ICD Match       │
              │    (DERM.MAP.030)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. Benign vs Malignant  │
              │    (DERM.BM.040)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 6. NCCI / Modifier     │
              │    (DERM.NCCI.050)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 7. E/M + Procedure      │
              │    Modifier 25 (DERM.EM.060)│
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALIDATION COMPLETE
```

---

## 3. CPT Size Ranges (Reference)

### 3.1 Shave Removal — Trunk/Arms/Legs (11300–11303)

| Code | Size (cm) |
|------|-----------|
| 11300 | ≤0.5 |
| 11301 | 0.6–1.0 |
| 11302 | 1.1–2.0 |
| 11303 | 2.1–3.0 |

### 3.2 Excision Benign — Trunk/Arms/Legs (11400–11406)

| Code | Size (cm) |
|------|-----------|
| 11400 | ≤0.5 |
| 11401 | 0.6–1.0 |
| 11402 | 1.1–2.0 |
| 11403 | 2.1–3.0 |
| 11404 | 3.1–4.0 |
| 11406 | 4.1+ (add 11408 per add'l 2 cm) |

### 3.3 Excision Malignant — Trunk/Arms/Legs (11600–11606)

| Code | Size (cm) |
|------|-----------|
| 11600 | ≤0.5 |
| 11601 | 0.6–1.0 |
| 11602 | 1.1–2.0 |
| 11603 | 2.1–3.0 |
| 11604 | 3.1–4.0 |
| 11606 | 4.1+ (add 11608 per add'l 2 cm) |

### 3.4 Anatomic Site Groups

| Group | Codes | Body Areas |
|-------|-------|------------|
| Trunk/arms/legs | 11300–11303, 11400–11406, 11600–11606 | Trunk, arms, legs |
| Scalp/neck/hands/feet/genitalia | 11305–11308, 11426–11446, 11626–11646 | Scalp, neck, hands, feet, genitalia |
| Face/ears/eyelids/nose/lips | 11310–11313, 11420–11426, 11620–11626 | Face, ears, eyelids, nose, lips |

---

## 4. CPT–ICD Medical Necessity Mapping

| CPT Category | Required ICD-10 Category |
|--------------|-------------------------|
| Biopsy (11102–11107) | Lesion, neoplasm, rash, or condition requiring histology |
| Shave (11300–11313) | Benign lesion, seborrheic keratosis, skin tag, etc. |
| Excision benign (11400–11471) | Benign neoplasm, cyst, benign lesion |
| Excision malignant (11600–11646) | BCC, SCC, melanoma, malignant neoplasm |
| Destruction premalignant (17000–17004) | Actinic keratosis, premalignant |
| Destruction malignant (17260–17286) | Malignant lesion (BCC, SCC when appropriate) |
| Mohs (17311–17315) | BCC, SCC, other indicated malignancy |

---

## 5. Algorithm: Encounter Integrity (DERM.ID.001)

**Input:** encounter (date_of_service, provider_id, place_of_service, patient_id)

**Output:** PASS | FAIL

**Steps:**

1. For each field in [date_of_service, provider_id, place_of_service, patient_id]:
   - If null or empty → RETURN FAIL, remediation: "Add required encounter field: {field}"

2. If date_of_service > today → RETURN FAIL, remediation: "Date of service cannot be in the future"

3. If place_of_service not in {11, 22, 24} → RETURN FAIL, remediation: "Invalid place of service. Use 11 (Office), 22 (Outpatient hospital), or 24 (ASC)."

4. RETURN PASS

---

## 6. Algorithm: Lesion Documentation (DERM.LES.010)

**Input:** procedure_request (cpt_code, lesion_location, lesion_size_cm, lesion_count)

**Output:** PASS | FAIL

**Steps:**

1. If cpt_code in EXCISION_OR_SHAVE_CODES:
   - Require lesion_location non-empty
   - Require lesion_size_cm > 0
2. If cpt_code in DESTRUCTION_MULTIPLE_CODES (17003, 17004, 17110, 17111):
   - Require lesion_count >= 2 (or 15 for 17004, 17111)
3. If missing required field → RETURN FAIL
4. RETURN PASS

---

## 7. Algorithm: Size–Code Match (DERM.SIZE.020)

**Input:** cpt_code, lesion_size_cm, anatomic_site

**Output:** PASS | FAIL

**Steps:**

1. Load SIZE_RANGE for cpt_code from playbook tables
2. If lesion_size_cm not in SIZE_RANGE[cpt_code] → RETURN FAIL
3. Verify anatomic_site matches cpt_code body-area group
4. RETURN PASS or FAIL with remediation

---

## 8. Algorithm: CPT–ICD Match (DERM.MAP.030)

**Input:** cpt_code, icd10_codes

**Output:** PASS | FAIL

**Steps:**

1. Load CPT_ICD_MAP for cpt_code
2. primary_icd10 = icd10_codes[0]
3. If primary_icd10 not in CPT_ICD_MAP[cpt_code] → RETURN FAIL
4. RETURN PASS

---

## 9. Algorithm: Benign vs Malignant (DERM.BM.040)

**Input:** cpt_code, icd10_codes

**Output:** PASS | FAIL

**Steps:**

1. If cpt_code in BENIGN_CODES (11400–11471):
   - primary_icd10 must not be malignant (C43, C44.x1, C44.x2, etc.)
2. If cpt_code in MALIGNANT_CODES (11600–11646, 17260–17286, 17311–17315):
   - primary_icd10 must be malignant or premalignant
3. RETURN PASS or FAIL

---

## 10. Algorithm: NCCI / Modifier (DERM.NCCI.050)

**Input:** cpt_codes, modifiers

**Output:** PASS | FAIL

**Steps:**

1. Check NCCI column 2: no unbundling
2. Multiple lesions: modifier 59/XE when required
3. RETURN PASS

---

## 11. Algorithm: E/M Modifier 25 (DERM.EM.060)

**Input:** em_code, procedure_codes, modifier_25_applied

**Output:** PASS | FAIL

**Steps:**

1. When E/M and procedure billed same day: require modifier 25 on E/M if separately identifiable
2. Same logic as URG.MOD.060 / EM.ADD.080
3. RETURN PASS

---

## 12. Pseudo: Coding Engine Integration

```
GENERATE: Integration between derm.ai and coding-ai

TEMPLATE:
- coding-ai provides:
  - POST /process: { medical_record, specialty: "DERMATOLOGY" } -> { icd_codes[], cpt_codes[], success }
  - POST /process-pdf: { file, specialty: "DERMATOLOGY" } -> same
  - GET /health -> { status }
- derm.ai consumes: Call coding-ai to get suggested ICD-10/CPT from note; use for DERM.MAP.030, DERM.BM.040
- derm.ai provides: POST /assess-derm, POST /generate-codes, POST /validate-derm
- Flow: User submits note -> coding-ai extracts codes (DERMATOLOGY) -> derm.ai validates procedure + lesion documentation
```

---

## 13. Pseudo: Derm AI Service Structure

```
GENERATE: derm-ai backend modeled after wound-ai and enm-ai

TEMPLATE:
- services/coding_service.py: Same as wound-ai, default specialty="DERMATOLOGY"
- services/validation_service.py: Implements DERM.ID.001 through DERM.EM.060
- main.py: FastAPI app with /assess-derm, /generate-codes, /validate-derm
- Environment: CODING_AI_URL
- AgentX: derm-ai.playbook.agentx-v1.md, derm-ai.algos.agentx-v1.md
```

---

## 14. Remediation Prompts (Complete)

| Finding | Remediation |
|---------|-------------|
| Missing encounter field | Add required encounter field: {field} |
| Future date | Date of service cannot be in the future |
| Invalid POS | Invalid place of service. Use 11 (Office), 22 (Outpatient hospital), or 24 (ASC). |
| Lesion location missing | Document lesion location (anatomic site). |
| Lesion size missing | Document lesion size (greatest diameter in cm). |
| Size-code mismatch | Lesion size does not match CPT code range. Verify size and code. |
| CPT-ICD mismatch | ICD-10 does not support medical necessity for procedure. |
| Benign vs malignant mismatch | Procedure code does not match diagnosis (benign vs malignant). |
| Modifier 25 required | Modifier 25 required when E/M is separately identifiable from procedure. |

---

**END OF ALGO**

*Deterministic validation. Same inputs → same outputs. Aligned with CMS and AMA.*
