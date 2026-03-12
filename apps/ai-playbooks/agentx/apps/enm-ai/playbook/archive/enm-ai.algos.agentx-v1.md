---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: enm-ai.algos.agentx-v1.md
---

# E/M AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for E/M level validation, compliance checking, and remediation. Aligned with CMS and AMA. For implementation by coding.ai and em.ai backend services.

**Use by AI:** This document contains **real rules** (implementable logic) and **pseudo rules** (templates for AI to generate backend code). Use real rules for validation logic; use pseudo rules to generate Python classes, API endpoints, and service integrations.

---

## 1. Overview

EM.AI validation follows a **deterministic sequence** of rule groups. Given the same encounter, policy, and rule version, the system produces the same findings in the same order.

**Sources:** AMA CPT®, CMS Medicare Claims Processing Manual Ch. 12

### 1.1 Document Structure

| Section | Type | Use |
|---------|------|-----|
| Real Rules (5–13) | Implementable | Direct translation to validation engine code |
| Pseudo Rules (18) | AI templates | Generate backend services, APIs, models |
| Code Tables (3, 4, 16, 17) | Reference data | Constants, mappings for implementation |

---

## 2. Validation Flow

```
                    ENCOUNTER INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Encounter Integrity │
              │    (EM.ID.001)         │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. Patient Status Gate │
              │    (EM.PAT.010)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. Documentation Gate  │
              │    (EM.DOC.060)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 4. MDM Complexity Gate │
              │    (EM.MDM.020)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. Time Gate           │
              │    (EM.TIM.030)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 6. Level Consistency    │
              │    (EM.LVL.040)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 7. Place of Service    │
              │    (EM.POS.050)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 8. ICD-10 Medical      │
              │    Necessity (EM.ICD.070)│
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 9. Add-On Code Check   │
              │    (EM.ADD.080)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALIDATION COMPLETE
```

---

## 3. Complete CPT Code Tables (Reference)

### 3.1 Office/Outpatient

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

### 3.2 Hospital Inpatient

| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99221 | Straightforward/Low | 30 | 44 |
| 99222 | Moderate | 45 | 59 |
| 99223 | High | 60 | 74 |
| 99231 | Straightforward/Low | 15 | 24 |
| 99232 | Moderate | 25 | 39 |
| 99233 | High | 40 | 54 |

### 3.3 Emergency Department (MDM only; no time)

| Code | MDM |
|------|-----|
| 99281 | Minimal |
| 99282 | Low |
| 99283 | Moderate |
| 99284 | High |
| 99285 | High |

### 3.4 Consultations

| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99242 | Straightforward | 20 | 29 |
| 99243 | Low | 30 | 44 |
| 99244 | Moderate | 45 | 59 |
| 99245 | High | 55 | 64 |
| 99252 | Straightforward | 35 | 44 |
| 99253 | Low | 45 | 59 |
| 99254 | Moderate | 60 | 74 |
| 99255 | High | 80 | 89 |

### 3.5 Nursing Facility

| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99304 | Straightforward/Low | 25 | 34 |
| 99305 | Moderate | 35 | 44 |
| 99306 | High | 45 | 59 |
| 99307 | Straightforward | 10 | 14 |
| 99308 | Low | 15 | 29 |
| 99309 | Moderate | 30 | 44 |
| 99310 | High | 45 | 59 |

### 3.6 Home Services

| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99341 | Straightforward | 15 | 29 |
| 99342 | Low | 30 | 44 |
| 99343 | Moderate | 45 | 59 |
| 99344 | Moderate | 60 | 74 |
| 99345 | High | 75 | 89 |
| 99347 | Straightforward | 20 | 29 |
| 99348 | Low | 30 | 39 |
| 99349 | Moderate | 40 | 54 |
| 99350 | High | 55 | 69 |

### 3.7 Critical Care

| Code | Time Min | Time Max |
|------|----------|----------|
| 99291 | 30 | 74 |
| 99292 | 30 (each add'l) | — |

---

## 4. Place of Service to Code Mapping (POS_TO_CODES)

| POS | Allowed Code Ranges |
|-----|---------------------|
| 02 (Telehealth) | 99202–99215 (with modifier 95; verify payer policy) |
| 11 (Office) | 99202–99215, 99242–99245 |
| 12 (Home) | 99341–99350 |
| 21 (Inpatient) | 99221–99239, 99252–99255 |
| 22 (Outpatient hospital) | 99202–99215 |
| 23 (ED) | 99281–99285 |
| 31, 32 (SNF/NF) | 99304–99318 |

**Implementation:** Expand ranges to explicit code lists for validation (e.g., 11 → [99202, 99203, 99204, 99205, 99211, 99212, 99213, 99214, 99215, 99242, 99243, 99244, 99245]). Add POS 02 to valid POS set in EM.ID.001 when telehealth is supported.

---

## 5. Algorithm: Encounter Integrity (EM.ID.001)

**Input:** encounter (date_of_service, provider_id, place_of_service, patient_id)

**Output:** PASS | FAIL

**Steps:**

1. For each field in [date_of_service, provider_id, place_of_service, patient_id]:
   - If null or empty → RETURN FAIL, remediation: "Add required encounter field: {field}"

2. If date_of_service > today → RETURN FAIL, remediation: "Date of service cannot be in the future"

3. If place_of_service not in valid POS set → RETURN FAIL, remediation: "Invalid place of service. Use CMS POS codes (11, 12, 21, 22, 23, 31, 32)."

4. RETURN PASS

**Block:** SIGN_BLOCK

---

## 6. Algorithm: Patient Status Gate (EM.PAT.010)

**Input:** encounter, patient_history (prior visits by same specialty, same group)

**Output:** PASS | FAIL, patient_status (new | established)

**Steps:**

1. If no prior visits in same specialty → patient_status = "new", RETURN PASS

2. most_recent = max(visit_date for visit in patient_history)

3. If (encounter.date_of_service - most_recent).days > 1095 (3 years) → patient_status = "new", RETURN PASS

4. Else → patient_status = "established", RETURN PASS

5. If documented patient_status in note conflicts with computed → RETURN FAIL, remediation: "Patient status (new/established) inconsistent with visit history. Same-specialty visit within 3 years = established."

**Block:** CLAIM_BLOCK

---

## 7. Algorithm: Documentation Completeness (EM.DOC.060)

**Input:** note_text

**Output:** PASS | FAIL, missing_sections[]

**Steps:**

1. missing = []
2. If no chief complaint or reason for visit → missing.append("chief complaint")
3. If no history (HPI, ROS, or relevant history) → missing.append("history")
4. If no assessment or diagnosis → missing.append("assessment")
5. If no plan or treatment → missing.append("plan")
6. If len(missing) > 0 → RETURN FAIL, remediation: "Documentation incomplete. Missing: " + ", ".join(missing)
7. RETURN PASS

**Block:** SIGN_BLOCK

---

## 8. Algorithm: MDM Complexity Gate (EM.MDM.020)

**Input:** note_text, extracted_mdm (problems, data_items, risk_level)

**Output:** PASS | FAIL, mdm_level

**MDM Scoring (two of three must meet):**

**Problems:**
- Minimal (Straightforward): 1 self-limited/minor (e.g., cold, insect bite, uncomplicated rash)
- Low: 2+ self-limited OR 1 stable chronic OR 1 acute uncomplicated OR 1 stable acute
- Moderate: 1 chronic w/ exacerbation OR 2+ stable chronic OR 1 undiagnosed new OR 1 acute w/ systemic symptoms OR 1 acute complicated injury
- High: 1 chronic w/ severe exacerbation OR 1 life-threatening OR 1 abrupt neurologic change

**Data (AMA/CMS 2021+ — count unique items):**

*Category 1 — Tests, documents, independent historian:*
- Review of prior external note(s) from each unique source (PCP note = 1, specialist note = 1)
- Review of result(s) of each unique test (CBC = 1, BMP = 1; lab panel 80047 = 1)
- Ordering of each unique test
- Assessment requiring independent historian(s) (e.g., dementia, minor)

*Category 2 — Independent interpretation:*
- Independent interpretation of test performed by another physician/QHP (not separately reported)

*Category 3 — Discussion:*
- Discussion of management or test interpretation with external physician/QHP (not same group/specialty)

| Level | Data Required |
|-------|---------------|
| Minimal | None or minimal |
| Low (Limited) | 1 of 2: (1) Any combination of 2 from Category 1 OR (2) Independent historian |
| Moderate | 1 of 3: (1) Any combination of 3 from Category 1 OR (2) Category 2 OR (3) Category 3 |
| High (Extensive) | 2 of 3: Must meet at least 2 categories (3+ Cat 1, interpretation, or discussion) |

**Risk:**
- Minimal: rest, OTC, gargles, superficial dressings
- Low: PT, minor surgery no risk, IV fluids without additives
- Moderate: prescription drug mgmt, elective major surgery, limited by SDOH
- High: drug monitoring for toxicity, emergency surgery, hospitalization, hospice, DNR/palliative

**Steps:**

1. problems_level = score_problems(extracted_mdm.problems)
2. data_level = score_data(extracted_mdm.data_items)
3. risk_level = score_risk(extracted_mdm.risk_level)
4. mdm_level = min of (problems_level, data_level, risk_level) such that at least 2 of 3 meet
5. If documented MDM does not match computed → RETURN FAIL, remediation: "MDM level does not match documented problems, data, or risk. Two of three elements must meet level."
6. RETURN PASS, mdm_level

**Block:** CLAIM_BLOCK

---

## 9. Algorithm: Time Gate (EM.TIM.030)

**Input:** documented_time_minutes, chosen_code

**Output:** PASS | FAIL

**Steps:**

1. If chosen_code in [99281-99285, 99291, 99292] → skip time check (ED/critical care), RETURN PASS

2. Get (time_min, time_max) from CODE_TIME_TABLE[chosen_code]

3. If documented_time_minutes is null or 0 and level selected by time → RETURN FAIL, remediation: "Document total time on date of encounter to support time-based level selection."

4. If documented_time_minutes < time_min → RETURN FAIL, remediation: "Documented time ({X} min) does not meet minimum for {code} ({Y} min)."

5. RETURN PASS

**Block:** CLAIM_BLOCK

---

## 10. Algorithm: Level Consistency (EM.LVL.040)

**Input:** chosen_code, mdm_level, documented_time_minutes

**Output:** PASS | FAIL

**Steps:**

1. expected_codes = CODES_FOR_MDM_AND_TIME(mdm_level, documented_time_minutes, place_of_service)

2. If chosen_code not in expected_codes → RETURN FAIL, remediation: "Chosen code {code} does not match MDM level ({mdm}) or time ({time} min). Expected codes for this encounter: {expected_codes}."

3. RETURN PASS

**Block:** CLAIM_BLOCK

---

## 11. Algorithm: Place of Service (EM.POS.050)

**Input:** place_of_service, chosen_code

**Output:** PASS | FAIL

**Steps:**

1. allowed = POS_TO_CODES[place_of_service]

2. If chosen_code not in allowed → RETURN FAIL, remediation: "Code {code} not appropriate for place of service {pos}. Allowed codes: {allowed}."

3. RETURN PASS

**Block:** CLAIM_BLOCK

---

## 12. Algorithm: ICD-10 Medical Necessity (EM.ICD.070)

**Input:** primary_icd10, secondary_icd10_list, chosen_code, mdm_level

**Output:** PASS | FAIL

**Steps:**

1. If primary_icd10 is null or empty → RETURN FAIL, remediation: "Primary diagnosis (ICD-10) required to support medical necessity."

2. If primary_icd10 is unspecified (e.g., .9) and more specific code exists for documented condition → RETURN FAIL (warning), remediation: "Use most specific ICD-10 code when documented."

3. If chosen_code is high-level (99205, 99215, 99223, 99233, etc.) and primary_icd10 suggests minimal complexity (e.g., Z00.00, single self-limited) → RETURN FAIL, remediation: "Primary diagnosis does not support high-complexity E/M level. Document diagnosis that justifies level."

4. RETURN PASS

**Block:** CLAIM_BLOCK

---

## 13. Algorithm: Add-On Code Check (EM.ADD.080)

**Input:** chosen_code, add_on_codes[], payer (Medicare | other)

**Output:** PASS | FAIL

**Steps:**

1. If 99417 in add_on_codes and payer == Medicare → RETURN FAIL, remediation: "Use G2212 for Medicare prolonged services; 99417 is not paid by Medicare."

2. If G2212 in add_on_codes and payer != Medicare → RETURN FAIL, remediation: "G2212 is Medicare-specific; use 99417 for non-Medicare payers."

3. If 99417 or G2212 in add_on_codes and chosen_code not in [99205, 99215] → RETURN FAIL, remediation: "Prolonged service add-on (99417/G2212) only with 99205 or 99215."

4. If G2211 in add_on_codes and chosen_code not in office E/M range → RETURN FAIL, remediation: "G2211 only with office/outpatient E/M codes."

5. RETURN PASS

**Block:** CLAIM_BLOCK

---

## 14. Block Logic Summary

| Rule | On FAIL |
|------|---------|
| EM.ID.001 (Encounter Integrity) | SIGN_BLOCK |
| EM.DOC.060 (Documentation) | SIGN_BLOCK |
| EM.PAT.010 (Patient Status) | CLAIM_BLOCK |
| EM.MDM.020 (MDM) | CLAIM_BLOCK |
| EM.TIM.030 (Time) | CLAIM_BLOCK |
| EM.LVL.040 (Level Consistency) | CLAIM_BLOCK |
| EM.POS.050 (Place of Service) | CLAIM_BLOCK |
| EM.ICD.070 (ICD-10) | CLAIM_BLOCK |
| EM.ADD.080 (Add-On) | CLAIM_BLOCK |

---

## 15. Remediation Prompts (Complete)

| Finding | Remediation |
|---------|-------------|
| Missing encounter field | Add required encounter field: {field} |
| Future date | Date of service cannot be in the future |
| Invalid POS | Invalid place of service. Use CMS POS codes (11, 12, 21, 22, 23, 31, 32). |
| Patient status mismatch | Patient status inconsistent with visit history. Same-specialty visit within 3 years = established. |
| Documentation incomplete | Documentation incomplete. Missing: {sections} |
| MDM mismatch | MDM level does not match documented problems, data, or risk. Two of three elements must meet level. |
| Time not documented | Document total time on date of encounter to support time-based level selection. |
| Time insufficient | Documented time ({X} min) does not meet minimum for {code} ({Y} min). |
| Code-level mismatch | Chosen code {code} does not match MDM or time. Expected: {codes} |
| Place of service mismatch | Code {code} not appropriate for place of service {pos}. |
| ICD-10 missing | Primary diagnosis (ICD-10) required to support medical necessity. |
| ICD-10 unspecified | Use most specific ICD-10 code when documented. |
| ICD-10 vs level | Primary diagnosis does not support E/M level. Document diagnosis that justifies level. |
| 99417 Medicare | Use G2212 for Medicare prolonged services; 99417 is not paid by Medicare. |
| G2212 non-Medicare | G2212 is Medicare-specific; use 99417 for non-Medicare payers. |
| Prolonged base | Prolonged service add-on (99417/G2212) only with 99205 or 99215. |
| G2211 scope | G2211 only with office/outpatient E/M codes. |

---

## 16. CODE_TIME_TABLE (Complete)

```
99202: (15, 29)
99203: (30, 44)
99204: (45, 59)
99205: (60, 74)
99211: (5, null)
99212: (10, 19)
99213: (20, 29)
99214: (30, 39)
99215: (40, 54)
99221: (30, 44)
99222: (45, 59)
99223: (60, 74)
99231: (15, 24)
99232: (25, 39)
99233: (40, 54)
99242: (20, 29)
99243: (30, 44)
99244: (45, 59)
99245: (55, 64)
99252: (35, 44)
99253: (45, 59)
99254: (60, 74)
99255: (80, 89)
99304: (25, 34)
99305: (35, 44)
99306: (45, 59)
99307: (10, 14)
99308: (15, 29)
99309: (30, 44)
99310: (45, 59)
99341: (15, 29)
99342: (30, 44)
99343: (45, 59)
99344: (60, 74)
99345: (75, 89)
99347: (20, 29)
99348: (30, 39)
99349: (40, 54)
99350: (55, 69)
99291: (30, 74)
```

---

## 17. MDM to Code Mapping (Office New)

| MDM | Codes |
|-----|-------|
| Straightforward | 99202 |
| Low | 99203 |
| Moderate | 99204 |
| High | 99205 |

### Office Established

| MDM | Codes |
|-----|-------|
| Straightforward | 99212 |
| Low | 99213 |
| Moderate | 99214 |
| High | 99215 |

---

## 18. Real Rules (Implementable Logic)

Real rules are deterministic conditions that map directly to backend code. Each rule has: **id**, **condition**, **action**, **severity**.

### EM.ID.001 — Encounter Integrity (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.ID.001 |
| severity | SIGN_BLOCK |
| condition | `date_of_service is None or date_of_service == ""` |
| action | FAIL, remediation: "Add required encounter field: date_of_service" |
| condition | `provider_id is None or provider_id == ""` |
| action | FAIL, remediation: "Add required encounter field: provider_id" |
| condition | `place_of_service is None or place_of_service == ""` |
| action | FAIL, remediation: "Add required encounter field: place_of_service" |
| condition | `patient_id is None or patient_id == ""` |
| action | FAIL, remediation: "Add required encounter field: patient_id" |
| condition | `date_of_service > today()` |
| action | FAIL, remediation: "Date of service cannot be in the future" |
| condition | `place_of_service not in {11, 12, 21, 22, 23, 31, 32}` |
| action | FAIL, remediation: "Invalid place of service. Use CMS POS codes (11, 12, 21, 22, 23, 31, 32)." |

### EM.PAT.010 — Patient Status (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.PAT.010 |
| severity | CLAIM_BLOCK |
| condition | `len(patient_history) == 0` |
| action | PASS, patient_status = "new" |
| condition | `(date_of_service - max(visit.date for visit in patient_history)).days > 1095` |
| action | PASS, patient_status = "new" |
| condition | `documented_status != computed_status` |
| action | FAIL, remediation: "Patient status inconsistent with visit history. Same-specialty visit within 3 years = established." |

### EM.DOC.060 — Documentation (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.DOC.060 |
| severity | SIGN_BLOCK |
| condition | `not has_chief_complaint(note_text)` |
| action | FAIL, missing.append("chief complaint") |
| condition | `not has_history(note_text)` |
| action | FAIL, missing.append("history") |
| condition | `not has_assessment(note_text)` |
| action | FAIL, missing.append("assessment") |
| condition | `not has_plan(note_text)` |
| action | FAIL, missing.append("plan") |
| condition | `len(missing) > 0` |
| action | FAIL, remediation: "Documentation incomplete. Missing: " + ", ".join(missing) |

### EM.TIM.030 — Time (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.TIM.030 |
| severity | CLAIM_BLOCK |
| condition | `chosen_code in {99281, 99282, 99283, 99284, 99285, 99291, 99292}` |
| action | PASS (skip time check) |
| condition | `documented_time is None or documented_time == 0` |
| action | FAIL, remediation: "Document total time on date of encounter to support time-based level selection." |
| condition | `documented_time < CODE_TIME_TABLE[chosen_code].min` |
| action | FAIL, remediation: f"Documented time ({documented_time} min) does not meet minimum for {chosen_code} ({CODE_TIME_TABLE[chosen_code].min} min)." |

### EM.POS.050 — Place of Service (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.POS.050 |
| severity | CLAIM_BLOCK |
| condition | `chosen_code not in POS_TO_CODES[place_of_service]` |
| action | FAIL, remediation: f"Code {chosen_code} not appropriate for place of service {place_of_service}." |

### EM.ADD.080 — Add-On Codes (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.ADD.080 |
| severity | CLAIM_BLOCK |
| condition | `"99417" in add_on_codes and payer == "Medicare"` |
| action | FAIL, remediation: "Use G2212 for Medicare prolonged services; 99417 is not paid by Medicare." |
| condition | `"G2212" in add_on_codes and payer != "Medicare"` |
| action | FAIL, remediation: "G2212 is Medicare-specific; use 99417 for non-Medicare payers." |
| condition | `("99417" in add_on_codes or "G2212" in add_on_codes) and chosen_code not in {99205, 99215}` |
| action | FAIL, remediation: "Prolonged service add-on (99417/G2212) only with 99205 or 99215." |
| condition | `"G2211" in add_on_codes and chosen_code not in range(99202, 99216)` |
| action | FAIL, remediation: "G2211 only with office/outpatient E/M codes." |

### EM.MDM.020 — MDM Complexity (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.MDM.020 |
| severity | CLAIM_BLOCK |
| condition | `computed_mdm_level != documented_mdm_level` |
| action | FAIL, remediation: "MDM level does not match documented problems, data, or risk. Two of three elements must meet level." |
| logic | `computed_mdm_level = score_mdm(problems, data_items, risk_factors)` per PSEUDO-006 |

### EM.LVL.040 — Level Consistency (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.LVL.040 |
| severity | CLAIM_BLOCK |
| condition | `chosen_code not in expected_codes` |
| action | FAIL, remediation: f"Chosen code {chosen_code} does not match MDM ({mdm_level}) or time ({time} min). Expected: {expected_codes}." |
| logic | `expected_codes = codes_for_mdm_and_time(mdm_level, time, place_of_service, patient_status)` |

### EM.ICD.070 — ICD-10 Medical Necessity (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.ICD.070 |
| severity | CLAIM_BLOCK |
| condition | `primary_icd10 is None or primary_icd10 == ""` |
| action | FAIL, remediation: "Primary diagnosis (ICD-10) required to support medical necessity." |
| condition | `is_high_level_code(chosen_code) and is_minimal_complexity_icd(primary_icd10)` |
| action | FAIL, remediation: "Primary diagnosis does not support high-complexity E/M level. Document diagnosis that justifies level." |
| condition | `primary_icd10.endswith(".9") and more_specific_exists(primary_icd10, note_text)` |
| action | FAIL (warning), remediation: "Use most specific ICD-10 code when documented." |

---

## 19. Pseudo Rules (AI Code Generation Templates)

Pseudo rules are templates for AI to generate backend code. Use these to create coding.ai and em.ai services.

### PSEUDO-001: Base Rule Engine Class

```
GENERATE: Python class for E/M validation rule engine

TEMPLATE:
- Class name: {RuleName}Engine (e.g., EncounterIntegrityEngine)
- Inherit from: BaseRuleEngine (or equivalent with evaluate() returning Finding)
- Constructor: rule_id="{RULE_ID}", rule_name="{Rule Name}"
- Method: evaluate(encounter, **kwargs) -> Finding
- Return: _create_pass_finding(severity) or _create_fail_finding(severity, remediation_prompt=...)
- Severity: SIGN_BLOCK | CLAIM_BLOCK
- Finding fields: rule_id, rule_name, severity, status (PASS|FAIL), remediation_prompt, mr_pointers
```

### PSEUDO-002: Validation Orchestrator

```
GENERATE: Validation orchestrator that runs rules in sequence

TEMPLATE:
- Class: EMValidationOrchestrator
- Method: validate(encounter: EMEncounter) -> ValidationResult
- Steps: For each rule in [EM.ID.001, EM.DOC.060, EM.PAT.010, EM.MDM.020, EM.TIM.030, EM.LVL.040, EM.POS.050, EM.ICD.070, EM.ADD.080]:
  - result = rule_engine.evaluate(encounter=encounter, ...)
  - if result.status == FAIL and result.severity == SIGN_BLOCK: return ValidationResult(blocked=True, findings=[...])
  - findings.append(result)
- Return: ValidationResult(blocked=False, findings=findings) when all pass or only CLAIM_BLOCK
```

### PSEUDO-003: EM Encounter Data Model

```
GENERATE: Pydantic/dataclass for E/M encounter input

TEMPLATE:
EMEncounter:
  date_of_service: date
  provider_id: str
  place_of_service: str  # 11, 12, 21, 22, 23, 31, 32
  patient_id: str
  patient_status: Optional[str]  # "new" | "established"
  chosen_code: str  # e.g., "99214"
  documented_time_minutes: Optional[int]
  primary_icd10: Optional[str]
  secondary_icd10: Optional[List[str]]
  add_on_codes: Optional[List[str]]  # G2211, G2212, 99417
  payer: Optional[str]  # "Medicare" | "other"
  note_text: Optional[str]
  mdm_level: Optional[str]  # straightforward | low | moderate | high
  patient_history: Optional[List[PriorVisit]]  # for EM.PAT.010
```

### PSEUDO-004: EM Validation API Endpoint

```
GENERATE: FastAPI endpoint for E/M validation

TEMPLATE:
@app.post("/validate-em", response_model=EMValidationResponse)
async def validate_em(request: EMValidationRequest):
  """
  Validate E/M encounter. Returns findings and block status.
  """
  encounter = transform_request_to_encounter(request)
  result = em_orchestrator.validate(encounter)
  return EMValidationResponse(
    blocked=result.blocked,
    block_type="SIGN_BLOCK" if any(f.severity=="SIGN_BLOCK" and f.status=="FAIL" for f in result.findings) else "CLAIM_BLOCK" if ... else None,
    findings=[FindingResponse(...) for f in result.findings],
    recommended_codes=infer_recommended_codes(encounter)  # optional
  )
```

### PSEUDO-005: Coding.ai Integration Contract

```
GENERATE: Integration between em.ai and coding.ai (coding-ai)

TEMPLATE:
- coding.ai (coding-ai) provides:
  - POST /extract-codes: { medical_record, specialty } -> { icd_codes[], cpt_codes[], success }
  - POST /process-pdf: { file_bytes, filename, specialty } -> { icd_codes[], cpt_codes[], success }
  - GET /health -> { status }
- em.ai consumes: Call coding.ai to get suggested ICD-10/CPT from note; use as primary_icd10 for EM.ICD.070
- em.ai provides: POST /validate-em with encounter -> validation result
- Flow: User submits note -> coding.ai extracts codes -> em.ai validates chosen E/M level against MDM/time/POS/ICD
- Shared: ICD-10 medical necessity check (EM.ICD.070) can optionally call coding.ai LCD/NCD validators for payer-specific rules
```

### PSEUDO-006: MDM Scoring Function

```
GENERATE: Pure function to compute MDM level from extracted data

TEMPLATE:
def score_mdm(problems: List[Problem], data_items: List[DataItem], risk_factors: List[str]) -> str:
  """
  Returns: "straightforward" | "low" | "moderate" | "high"
  Two of three elements must meet level.
  """
  p_level = score_problems(problems)  # minimal|low|moderate|high
  d_level = score_data(data_items)   # minimal|low|moderate|high
  r_level = score_risk(risk_factors) # minimal|low|moderate|high
  levels = [p_level, d_level, r_level]
  # Find highest level where >=2 elements meet
  for target in ["high", "moderate", "low", "minimal"]:
    if sum(1 for L in levels if meets_level(L, target)) >= 2:
      return target
  return "minimal"
```

### PSEUDO-007: CODE_TIME_TABLE Lookup

```
GENERATE: Constant dict or module for code-to-time mapping

TEMPLATE:
CODE_TIME_TABLE: Dict[str, Tuple[int, Optional[int]]] = {
  "99202": (15, 29), "99203": (30, 44), "99204": (45, 59), "99205": (60, 74),
  "99211": (5, None), "99212": (10, 19), "99213": (20, 29), "99214": (30, 39), "99215": (40, 54),
  # ... (full table from Section 16)
}
def get_time_range(code: str) -> Optional[Tuple[int, Optional[int]]]:
  return CODE_TIME_TABLE.get(code)
```

### PSEUDO-008: POS_TO_CODES Lookup

```
GENERATE: Constant dict mapping place_of_service to allowed CPT codes

TEMPLATE:
POS_TO_CODES: Dict[str, Set[str]] = {
  "11": {"99202", "99203", "99204", "99205", "99211", "99212", "99213", "99214", "99215", "99242", "99243", "99244", "99245"},
  "12": {"99341", "99342", "99343", "99344", "99345", "99347", "99348", "99349", "99350"},
  "21": {"99221", "99222", "99223", "99231", "99232", "99233", "99252", "99253", "99254", "99255"},
  "22": {"99202", "99203", "99204", "99205", "99211", "99212", "99213", "99214", "99215"},
  "23": {"99281", "99282", "99283", "99284", "99285"},
  "31": {"99304", "99305", "99306", "99307", "99308", "99309", "99310", "99315", "99316"},
  "32": {"99304", "99305", "99306", "99307", "99308", "99309", "99310", "99315", "99316"},
}
def is_code_allowed_for_pos(code: str, pos: str) -> bool:
  return code in POS_TO_CODES.get(pos, set())
```

### PSEUDO-009: E/M Level Suggestion (Optional)

```
GENERATE: Function to suggest E/M code from MDM and time

TEMPLATE:
def suggest_em_code(
  patient_status: str,  # "new" | "established"
  mdm_level: str,
  documented_time: Optional[int],
  place_of_service: str
) -> List[str]:
  """
  Returns list of appropriate codes. Use MDM or time (whichever supports higher level).
  """
  # 1. Get codes for MDM level from MDM_TO_CODE mapping
  # 2. Get codes for time from CODE_TIME_TABLE (find codes where time in range)
  # 3. Intersect with POS_TO_CODES[place_of_service]
  # 4. Return sorted by level (highest first)
```

### PSEUDO-010: Documentation Parser Helpers

```
GENERATE: Helper functions to detect documentation sections in note_text

TEMPLATE:
def has_chief_complaint(text: str) -> bool:
  # Regex or keyword: "chief complaint", "CC:", "reason for visit", "presenting"
  return bool(re.search(r'(chief complaint|CC:|reason for visit|presenting)', text, re.I))

def has_history(text: str) -> bool:
  # "HPI", "history", "ROS", "review of systems"
  return bool(re.search(r'(HPI|history of present|ROS|review of systems)', text, re.I))

def has_assessment(text: str) -> bool:
  # "assessment", "diagnosis", "impression", "A&P"
  return bool(re.search(r'(assessment|diagnosis|impression|A&P)', text, re.I))

def has_plan(text: str) -> bool:
  # "plan", "treatment", "follow"
  return bool(re.search(r'(plan|treatment|follow.?up)', text, re.I))
```

---

## 20. Service Architecture (AI Generation Reference)

```
enm-ai/
├── main.py                 # FastAPI app, /validate-em endpoint
├── validation/
│   ├── orchestrator.py     # EMValidationOrchestrator (PSEUDO-002)
│   ├── engines/
│   │   ├── base.py         # BaseRuleEngine (PSEUDO-001)
│   │   ├── encounter_integrity.py   # EM.ID.001
│   │   ├── documentation.py        # EM.DOC.060
│   │   ├── patient_status.py        # EM.PAT.010
│   │   ├── mdm_gate.py              # EM.MDM.020
│   │   ├── time_gate.py             # EM.TIM.030
│   │   ├── level_consistency.py     # EM.LVL.040
│   │   ├── place_of_service.py      # EM.POS.050
│   │   ├── icd_necessity.py         # EM.ICD.070
│   │   └── addon_check.py           # EM.ADD.080
│   └── constants.py        # CODE_TIME_TABLE, POS_TO_CODES (PSEUDO-007, 008)
├── models/
│   └── encounter.py        # EMEncounter (PSEUDO-003)
└── services/
    └── coding_client.py    # HTTP client to coding.ai (PSEUDO-005)
```

## 21. Expanded Algorithms

### 21.1 Algorithm: Preventive Medicine (EM.PREV.090)
**Input:** encounter (age, patient_status), chosen_code
**Steps:**
1. If chosen_code not in 99381–99397 → skip, RETURN PASS
2. Get `expected_code` from PREVENTIVE_AGE_TABLE based on `age` and `patient_status`.
3. If chosen_code != expected_code → RETURN FAIL, remediation: "Code {chosen_code} does not match patient age ({age}) or status ({status}). Expected: {expected_code}."
4. RETURN PASS

### 21.2 Algorithm: Care Management Units (EM.CARE.100)
**Input:** encounter (care_mgmt_minutes, staff_type), chosen_code
**Steps:**
1. If chosen_code in [99490, 99439, 99491, 99437, 99424-99427]:
2. Check `care_mgmt_minutes` against CPT time thresholds.
3. If minutes < threshold → RETURN FAIL, remediation: "Documented care management time ({minutes} min) is insufficient for {chosen_code}."
4. RETURN PASS

---

## 22. RuleCatalog

```yaml
# enm-ai RuleCatalog
specialty: "enm-ai"
version: 1
created_at: "2025-03-06T00:00:00Z"
flow:
  - id: "EM.ID.001"
    name: "Encounter Integrity"
  - id: "EM.PAT.010"
    name: "Patient Status"
  - id: "EM.DOC.060"
    name: "Documentation Completeness"
  - id: "EM.MDM.020"
    name: "MDM Complexity Gate"
  - id: "EM.TIM.030"
    name: "Time Gate"
  - id: "EM.PREV.090"
    name: "Preventive Medicine"
  - id: "EM.CARE.100"
    name: "Care Management Units"
  - id: "EM.LVL.040"
    name: "Level Consistency"
  - id: "EM.POS.050"
    name: "Place of Service"
  - id: "EM.ICD.070"
    name: "ICD-10 Medical Necessity"
  - id: "EM.ADD.080"
    name: "Add-On Code Check"

rules:
  EM.ID.001:
    id: "EM.ID.001"
    handler: "evaluateEncounterIntegrity"
    inputs: ["encounter"]
  EM.PREV.090:
    id: "EM.PREV.090"
    handler: "evaluatePreventiveRule"
    inputs: ["encounter"]
  EM.CARE.100:
    id: "EM.CARE.100"
    handler: "evaluateCareManagementRule"
    inputs: ["encounter"]
  # ... other rules mapping to TypeScript handlers
```

---

**END OF ALGO**

*Deterministic validation. Same inputs → same outputs. Aligned with CMS and AMA. Real rules = implementable. Pseudo rules = AI code generation templates.*
```
