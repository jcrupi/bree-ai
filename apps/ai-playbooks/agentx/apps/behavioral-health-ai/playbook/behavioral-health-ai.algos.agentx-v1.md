---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: behavioral-health-ai.algos.agentx-v1.md
---

# Behavioral Health AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for behavioral health encounter validation, DSM-5-TR diagnosis mapping, and psychotherapy/E/M compliance. Aligned with APA DSM-5-TR, ICD-10-CM, and AMA CPT®.

**Use by AI:** Implementable logic for coding-ai and behavioral-health-ai backend services.

---

## 1. Overview

Behavioral health validation follows a deterministic sequence. DSM-5-TR diagnoses map to ICD-10-CM; E/M and psychotherapy codes require documentation support.

**Sources:** DSM-5-TR (APA), ICD-10-CM, AMA CPT®, CMS

---

## 2. Validation Flow

```
                    ENCOUNTER INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Encounter Integrity │
              │    (BH.ID.001)          │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. DSM–ICD Mapping     │
              │    (BH.DSM.010)        │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. E/M or Psychotherapy │
              │    (BH.CPT.020)         │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 4. Medical Necessity   │
              │    (BH.MN.030)         │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. E/M + Psych Same Day│
              │    Modifier 25 (BH.MOD.040)│
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALIDATION COMPLETE
```

---

## 3. DSM-5-TR to ICD-10-CM Mapping (Key Codes)

| DSM-5-TR Chapter | Key ICD-10-CM |
|------------------|---------------|
| Neurodevelopmental | F70–F89, F90–F98 |
| Schizophrenia spectrum | F20–F29 |
| Bipolar | F30–F31 |
| Depressive | F32, F33, F34.1 |
| Anxiety | F40, F41 |
| **OCD and Related (incl. trichotillomania)** | **F42, F63.2, F45.22** |
| Trauma/stressor | F43 |
| Dissociative | F44 |
| Somatic | F45 |
| Feeding/eating | F50 |
| Elimination | F98.0, F98.1 |
| Sleep-wake | G47 |
| Sexual | F52 |
| Gender dysphoria | F64 |
| Impulse-control | F63, F91 |
| Substance | F10–F19 |
| Neurocognitive | F01–F03, G31.83 |
| Personality | F60 |
| Paraphilic | F65 |

### 3.1 Trichotillomania (BH.DSM.TRI)

- **DSM-5-TR:** Obsessive-Compulsive and Related Disorders (Ch. 6)
- **ICD-10-CM:** F63.2
- **Rule:** When documentation indicates hair-pulling disorder, require F63.2. Do not use L98.1 alone unless dermatitis factitia (skin damage) is primary.

---

## 4. Algorithm: DSM–ICD Mapping (BH.DSM.010)

**Input:** diagnosis_text, chosen_icd10

**Output:** PASS | FAIL

**Steps:**

1. If chosen_icd10 empty → RETURN FAIL
2. Lookup chosen_icd10 in DSM_ICD_TABLE (playbook Section 5)
3. If diagnosis_text suggests DSM chapter and chosen_icd10 not in that chapter's range → RETURN FAIL
4. Special case: trichotillomania → require F63.2
5. RETURN PASS

---

## 5. Algorithm: E/M + Psychotherapy Same Day (BH.MOD.040)

**Input:** em_code, psychotherapy_codes, modifier_25_applied

**Output:** PASS | FAIL

**Steps:**

1. When E/M (99202–99215) and psychotherapy (90832, 90834, 90837, etc.) billed same day:
   - Require modifier 25 on E/M if E/M is separately identifiable
2. If psychotherapy_codes non-empty and em_code present and not modifier_25_applied:
   - RETURN FAIL, remediation: "Modifier 25 required when E/M is separately identifiable from psychotherapy"
3. RETURN PASS

---

## 6. Place of Service

| POS | Allowed Codes |
|-----|---------------|
| 11 (Office) | 99202–99215, 90791, 90792, 90832–90853 |
| 22 (Outpatient hospital) | Same |
| 51 (Psychiatric facility) | Inpatient E/M, 90832–90853 |
| 52 (Partial hospitalization) | 90832–90853 |

---

**END OF ALGOS**

*Trichotillomania: DSM-5-TR Ch. 6 — Obsessive-Compulsive and Related Disorders. ICD-10-CM F63.2.*
