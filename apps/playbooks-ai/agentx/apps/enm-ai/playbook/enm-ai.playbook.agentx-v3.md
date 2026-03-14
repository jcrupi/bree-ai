---
agentx:
  version: 3
  created_at: "2026-03-13T10:55:00Z"
  type: playbook
  filename: enm-ai.playbook.agentx-v3.md
---

# E/M AI — Medical Rules & Codes Playbook (SNF Optimized)

> **Purpose:** Comprehensive clinical and coding rules for Evaluation and Management (E/M). Aligned with CMS and AMA guidelines. Enhanced for Skilled Nursing Facility (SNF) and Subsequent Nursing Facility Care (99309).

**Sources:** American Medical Association (AMA) CPT®, CMS Medicare Claims Processing Manual Ch. 12, CMS Place of Service Codes (31, 32), ICD-10-CM

---

## 1. Definition and Scope

### 1.1 E/M Coding

Evaluation and Management (E/M) coding:

- Uses **CPT codes 99202–99499**
- Bills **patient encounters** based on the **provider's work**, not the procedure
- Covers office visits, hospital care, emergency department, consultations, nursing facility, home visits, and related services
- Levels reflect **Medical Decision Making (MDM)** complexity and/or **Time**

### 1.2 SNF / Nursing Facility Support (POS 31, 32)

- **POS 31 (Skilled Nursing Facility):** For patients in a short-term, post-acute, or rehabilitative stay.
- **POS 32 (Nursing Facility):** For long-term care patients.
- **Rules Mapping:** Nursing facility services use the same MDM framework (Problems, Data, Risk) but have specific CPT ranges (99304–99310) and time thresholds.

---

## 2. Level Determination: MDM or Time

Levels are determined by **either**:

1. **Medical Decision Making (MDM)** — Complexity of problems, data, and risk
2. **Time** — Total time on the date of the encounter

**Rule:** Use whichever supports the higher level when both are documented.

---

## 3. Medical Decision Making (MDM) — Complete Table (CMS/AMA 2021+)

MDM has **three elements**. To meet a given level, **two of three** must meet or exceed that level.

### 3.1 Element 1: Number and Complexity of Problems Addressed

| Level | CMS/AMA Guidelines — Problems Addressed |
|-------|----------------------------------------|
| **Minimal** | 1 self-limited or minor problem |
| **Low** | 2+ self-limited **OR** 1 stable chronic illness **OR** 1 acute, uncomplicated illness |
| **Moderate** | 1+ chronic illnesses with exacerbation **OR** 2+ stable chronic illnesses **OR** 1 undiagnosed new problem w/ uncertain prognosis (e.g., new skin lesion, new neuro symptom) |
| **High** | 1+ chronic illnesses with severe exacerbation (threat to life) **OR** 1 acute illness/injury posing threat to life/bodily function |

### 3.2 Element 2: Data Complexity

| Level | Data Required |
|-------|---------------|
| **Low** | 1 of 2 Category 1 (2 items: review test, order test, review prior note) |
| **Moderate** | 1 of 3: (1) 3 items Cat 1 **OR** (2) Independent interpretation **OR** (3) Discussion with external provider |
| **High** | 2 of 3 Categories |

### 3.3 Element 3: Risk

| Level | Risk of Complications |
|-------|-----------------------|
| **Moderate** | Prescription drug management; decision for minor surgery with risk; social determinants of health |
| **High** | Drug monitoring for toxicity; decision for emergency major surgery; decision regarding hospitalization |

---

## 6. Complete CPT Code Reference

### 6.11 Nursing Facility — Initial (99304–99306)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99304 | Straightforward/Low | 25 | Initial nursing facility care |
| 99305 | Moderate | 35 | Initial nursing facility care |
| 99306 | High | 45 | Initial nursing facility care |

### 6.12 Nursing Facility — Subsequent (99307–99310)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99307 | Straightforward | 10 | Subsequent nursing facility care |
| 99308 | Low | 15 | Subsequent nursing facility care |
| **99309** | **Moderate** | **30** | **Subsequent nursing facility care** |
| 99310 | High | 45 | Subsequent nursing facility care |

#### Deep Dive: 99309 — Moderate Complexity (Subsequent SNF/NF)

To qualify for **99309**, the provider must document **Moderate MDM** or **30 minutes** of total time.

**Qualifying Scenario (Moderate MDM - 2 of 3):**
1. **Problems (Moderate):** Patient with 2+ stable chronic conditions (e.g., HTN and DM2) OR 1 chronic condition with exacerbation (e.g., worsening CHF in SNF).
2. **Data (Moderate):** Review of 3 test results/notes OR independent interpretation of imaging.
3. **Risk (Moderate):** Prescription drug management (e.g., adjusting warfarin, insulin, or antibiotics).

**Optimization Tip:** If you have 1 stable chronic illness (Low) but you reviewed 3 types of data (Moderate) AND adjusted a prescription medication (Moderate), the encounter qualifies for **99309**.

---

## 11. Optimization Analysis — "Upsell" Logic

When evaluating a chart, the system should not only state what it qualifies for but offer proactive remediation:

1. **If close to a higher level (e.g., 99308 to 99309):**
   - "This encounter currently qualifies for 99308. However, if you document the **review of one additional test result** (reaching 3 data items) or specify the **risk associated with prescription drug management**, you could qualify for **99309**."
2. **If missing critical elements:**
   - "To support 99309, ensure the Plan section explicitly mentions 'Prescription Drug Management' or 'Decision for minor surgery'."

---

**END OF PLAYBOOK v3**
