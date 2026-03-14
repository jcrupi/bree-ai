---
agentx:
  version: 1
  created_at: "2026-03-12T04:57:00Z"
  type: algos
  filename: disability.algos.agentx-v1.md
  domain: disability
  specialty: Disability Benefits (SSDI / SSI)
---

# Disability Benefits Algos
**Domain:** Social Security Disability (SSDI & SSI)
**Version:** 1
**Owner:** Bree AI — Tax & Compliance

---

## Overview

Executable validation rules for disability benefit applications. Each rule evaluates one specific criterion from the SSA's eligibility determination process, producing PASS / FAIL / INVESTIGATING findings.

---

## Validation Rules Summary

| Rule ID | Rule Name | Gate | When FAIL |
|---|---|---|---|
| DIS.SGA.001 | SGA Threshold Check (Step 1) | Step 1 | Claimant is earning above SGA → Not disabled |
| DIS.INS.002 | SSDI Insured Status | Pre-Step 1 | No work credits / past DLI → SSDI not available |
| DIS.IMP.003 | Severity + Duration of Impairment (Step 2) | Step 2 | Impairment not severe or insufficient duration |
| DIS.LST.004 | Blue Book Listing Match (Step 3) | Step 3 | Listing not met/equaled |
| DIS.MED.005 | Acceptable Medical Source | Pre-RFC | Evidence not from AMS |
| DIS.RFC.006 | RFC Completeness | Step 4 | RFC missing exertional/non-exertional categories |
| DIS.PRW.007 | Past Relevant Work Classification | Step 4 | PRW not properly classified per DOT/O*NET |
| DIS.VOC.008 | Step 5 Vocational Analysis | Step 5 | Grid rule or VE analysis incomplete |
| DIS.ONS.009 | Onset Date Support | Pre-Step | AOD unsupported by medical record |
| DIS.APP.010 | Appeal Window Compliance | Admin | Filing deadline missed |

---

## RuleCatalog YAML

```yaml
RuleCatalog:
  domain: disability
  version: "1.0.0"
  flow:
    - id: DIS.INS.002
    - id: DIS.SGA.001
    - id: DIS.IMP.003
    - id: DIS.LST.004
    - id: DIS.MED.005
    - id: DIS.RFC.006
    - id: DIS.PRW.007
    - id: DIS.VOC.008
    - id: DIS.ONS.009
    - id: DIS.APP.010
  rules:
    DIS.INS.002:
      name: "SSDI Insured Status"
      category: eligibility
      description: "SSDI claimant must have sufficient work credits and be within Date Last Insured"
      inputs: [ssdi_or_ssi, work_credits, date_last_insured, alleged_onset_date]
      outputs: [insured_status_valid]
    DIS.SGA.001:
      name: "SGA Threshold Check"
      category: step1
      description: "Claimant must not be engaged in Substantial Gainful Activity above monthly threshold"
      inputs: [monthly_earnings, blind_status, year]
      outputs: [sga_exceeds_threshold]
    DIS.IMP.003:
      name: "Severity and Duration of Impairment"
      category: step2
      description: "Impairment must be medically determinable, severe, and expected to last 12+ months or result in death"
      inputs: [impairments, expected_duration_months, results_in_death]
      outputs: [severe_impairment_established]
    DIS.LST.004:
      name: "Blue Book Listing Match"
      category: step3
      description: "Check if any impairment meets or medically equals a Blue Book listing"
      inputs: [impairments, listing_criteria_met, medical_equivalence_opinion]
      outputs: [listing_met_or_equaled]
    DIS.MED.005:
      name: "Acceptable Medical Source Validation"
      category: evidence
      description: "Medical opinions and findings must come from Acceptable Medical Sources (AMS)"
      inputs: [treating_providers, provider_license_type, provider_specialization]
      outputs: [ams_established]
    DIS.RFC.006:
      name: "RFC Completeness Check"
      category: rfc
      description: "RFC must address all relevant exertional and non-exertional limitations"
      inputs: [rfc_exertional_level, rfc_nonexertional_limits, mental_rfc_categories]
      outputs: [rfc_complete]
    DIS.PRW.007:
      name: "Past Relevant Work Classification"
      category: step4
      description: "PRW must fall within 15-year window, performed at SGA level, for sufficient duration, classified per DOT"
      inputs: [work_history, job_titles, dot_codes, sga_level_during_prw, prw_recency_years]
      outputs: [prw_properly_classified]
    DIS.VOC.008:
      name: "Step 5 Vocational Analysis"
      category: step5
      description: "Grid rules or VE testimony must support whether claimant can perform other work"
      inputs: [rfc_level, age_category, education_level, skill_transferability, grid_rule_result]
      outputs: [vocational_analysis_complete]
    DIS.ONS.009:
      name: "Onset Date Support"
      category: documentation
      description: "Alleged or established onset date must be supported by objective medical evidence"
      inputs: [alleged_onset_date, earliest_medical_evidence_date, treating_source_opinion_on_onset]
      outputs: [onset_date_supported]
    DIS.APP.010:
      name: "Appeal Window Compliance"
      category: procedural
      description: "All appeals must be filed within 60 days of the prior adjudicative decision"
      inputs: [decision_date, appeal_filed_date, good_cause_exception]
      outputs: [appeal_timely]
```

---

## Validation Flow Diagram

```
  [Claimant Input]
        │
        ▼
 ┌──────────────────────────────────┐
 │ DIS.INS.002: SSDI Insured?       │
 │ (skip if SSI only)               │
 └──────────────────────────────────┘
        │ PASS → continue
        │ FAIL → SSDI ineligible (SSI may still apply)
        ▼
 ┌──────────────────────────────────┐
 │ DIS.SGA.001: SGA Threshold?      │
 └──────────────────────────────────┘
        │ PASS (under SGA) → continue
        │ FAIL (over SGA) → NOT DISABLED
        ▼
 ┌──────────────────────────────────┐
 │ DIS.IMP.003: Severe Impairment?  │
 └──────────────────────────────────┘
        │ PASS → continue
        │ FAIL → NOT DISABLED
        ▼
 ┌──────────────────────────────────┐
 │ DIS.LST.004: Blue Book Listing?  │
 └──────────────────────────────────┘
        │ PASS (listing met) → DISABLED
        │ FAIL (listing not met) → continue
        ▼
 ┌──────────────────────────────────┐
 │ DIS.MED.005: Valid AMS Evidence? │
 └──────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────┐
 │ DIS.RFC.006: RFC Complete?       │
 └──────────────────────────────────┘
        │
        ▼
 ┌──────────────────────────────────┐
 │ DIS.PRW.007: PRW Classified?     │
 └──────────────────────────────────┘
        │ PASS (can do PRW) → NOT DISABLED
        │ FAIL (cannot do PRW) → continue
        ▼
 ┌──────────────────────────────────┐
 │ DIS.VOC.008: Other Work?         │
 └──────────────────────────────────┘
        │ PASS (can do other work) → NOT DISABLED
        │ FAIL (cannot do other work) → DISABLED
        ▼
 ┌──────────────────────────────────┐
 │ DIS.ONS.009: Onset Date Support? │
 │ DIS.APP.010: Timely Filing?      │
 └──────────────────────────────────┘
```

---

## Algorithm Blocks

---

### DIS.INS.002 — SSDI Insured Status

**Input:** `ssdi_or_ssi`, `work_credits`, `date_last_insured`, `alleged_onset_date`
**Output:** `insured_status_valid` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. If claim type is SSI only → PASS (no insured status required)
2. Check if `alleged_onset_date` ≤ `date_last_insured`
   - If AOD > DLI → FAIL ("Onset after Date Last Insured; SSDI insured status not met")
3. Verify `work_credits` ≥ required credits for claimant's age:
   - Age < 24: 6 credits in prior 3 years
   - Age 24-30: Credits for half the period between age 21 and onset
   - Age ≥ 31: 40 credits total, 20 in last 10 years
4. If credits insufficient → FAIL
5. Otherwise → PASS

---

### DIS.SGA.001 — SGA Threshold Check (Step 1)

**Input:** `monthly_earnings`, `blind_status`, `year`
**Output:** `sga_exceeds_threshold` (PASS = under SGA | FAIL = over SGA)

**Steps:**
1. Determine SGA threshold for given `year`:
   - 2024: $1,550/month non-blind; $2,590/month blind
   - 2023: $1,470/month non-blind; $2,460/month blind
2. If `blind_status` = true, use blind threshold
3. Subtract applicable subsidies or impairment-related work expenses (IRWE)
4. If net earnings > threshold → FAIL ("SGA exceeded; claimant not disabled at Step 1")
5. Check if in Trial Work Period (TWP) — if yes, note but continue evaluation
6. If earnings ≤ threshold or in TWP → PASS

---

### DIS.IMP.003 — Severity and Duration of Impairment (Step 2)

**Input:** `impairments[]`, `expected_duration_months`, `results_in_death`
**Output:** `severe_impairment_established` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. For each impairment, check if it is medically determinable:
   - Must have objective medical signs, laboratory findings, or imaging
   - Claimant's subjective symptoms alone are NOT sufficient
2. Assess severity: Does impairment more than minimally limit the ability to perform basic work activities?
   - Basic work activities: Walking, standing, sitting, lifting, carrying, understanding, communicating, handling objects
3. If no impairment is severe → FAIL
4. Check duration: `expected_duration_months` ≥ 12 OR `results_in_death` = true
5. If duration requirement not met → FAIL
6. If severe and duration met → PASS

---

### DIS.LST.004 — Blue Book Listing Match (Step 3)

**Input:** `impairments[]`, `listing_criteria_met{}`, `medical_equivalence_opinion`
**Output:** `listing_met_or_equaled` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. For each impairment, identify the relevant Blue Book body system and listing number
2. Compare clinical findings against specific listing criteria:
   - A and B criteria (for mental disorders), or
   - Specific laboratory/imaging/severity thresholds (physical disorders)
3. If listing criteria are EXACTLY met → PASS (listing met)
4. If literal criteria not met, assess medical equivalence:
   - Does the combination/severity of findings equal the listing in medical significance?
   - Requires medical source opinion supporting equivalence
5. If equivalence established → PASS
6. If neither met nor equaled → FAIL (proceed to Step 4)
7. If evidence insufficient to compare → INVESTIGATING

---

### DIS.MED.005 — Acceptable Medical Source Validation

**Input:** `treating_providers[]`, `provider_license_type`, `provider_specialization`
**Output:** `ams_established` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Verify each treating source is a licensed AMS:
   - MD, DO, licensed psychologist, licensed optometrist (vision), licensed podiatrist (feet/ankles), APRN (since 3/27/2017)
2. If primary evidence comes from non-AMS sources only (chiropractor, naturopath, etc.) → FAIL
3. Confirm records include:
   - Treatment notes with objective findings
   - At least one complete physical or mental status exam
4. Assess supportability and consistency under 20 CFR 404.1520c
5. If AMS evidence present and adequate → PASS

---

### DIS.RFC.006 — RFC Completeness Check

**Input:** `rfc_exertional_level`, `rfc_nonexertional_limits[]`, `mental_rfc_categories{}`
**Output:** `rfc_complete` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Confirm `rfc_exertional_level` is defined: Sedentary / Light / Medium / Heavy / Very Heavy
2. Assess all non-exertional limitations relevant to impairments:
   - Postural, manipulative, visual, communicative, environmental
3. For mental impairments, assess all four MRFC categories:
   - (a) Understand/Memory (b) Concentration/Persistence (c) Social Interaction (d) Adaptation
4. RFC must be supported by substantial objective medical evidence
5. If any applicable limitation category is absent → FAIL (RFC incomplete)
6. If all categories addressed with supporting evidence → PASS

---

### DIS.PRW.007 — Past Relevant Work Classification (Step 4)

**Input:** `work_history[]`, `dot_codes[]`, `sga_level_during_prw`, `prw_recency_years`
**Output:** `prw_properly_classified` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Identify past jobs performed within last 15 years from current date or alleged onset date
2. Confirm each PRW was performed at SGA level (earnings ≥ SGA threshold for that year)
3. Confirm each PRW was performed long enough to learn the job (generally 30 days)
4. Classify each PRW per DOT/O*NET: job title, exertional level, skill level (SVP)
5. Compare the demands of each PRW against claimant's RFC:
   - As the claimant "actually performed" the job (composite jobs)
   - As the job is "generally performed" in the national economy (DOT description)
6. If RFC precludes all PRW demands → FAIL (cannot do PRW; proceed to Step 5)
7. If RFC allows any PRW → PASS (claimant not disabled at Step 4)

---

### DIS.VOC.008 — Step 5 Vocational Analysis

**Input:** `rfc_level`, `age_category`, `education_level`, `skill_transferability`, `grid_rule_result`
**Output:** `vocational_analysis_complete` (PASS = jobs exist | FAIL = no jobs)

**Steps:**
1. Determine age category:
   - Younger (< 50), Closely Approaching Advanced (50–54), Advanced (55+), Closely Approaching Retirement (60+)
2. Determine education level: Illiterate, Marginal, Limited (6–11 grade), High School, More than HS
3. Assess transferable skills (for claimants with semi-skilled/skilled PRW):
   - Same or similar tools, work processes, products, or services
4. Apply Medical-Vocational Grid Rules (Appendix 2):
   - If grid rule directs "disabled" → DISABLED
   - If grid rule directs "not disabled" → NOT DISABLED
   - If non-exertional impairments erode occupational base → VE testimony required
5. If VE testimony used: confirm VE identified jobs available in significant numbers (general rule: 25,000+ nationally)
6. If jobs identified with specific DOT codes and counts → PASS (not disabled)
7. If no jobs exist in significant numbers → FAIL (disabled)

---

### DIS.ONS.009 — Onset Date Support

**Input:** `alleged_onset_date`, `earliest_medical_evidence_date`, `treating_source_opinion_on_onset`
**Output:** `onset_date_supported` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Compare `alleged_onset_date` to `earliest_medical_evidence_date`
   - If AOD precedes earliest objective medical evidence by > 6 months → INVESTIGATING
2. Check for SSA-787 (Claimant's Statement on Endurance / Symptoms) supporting retroactive onset
3. For non-medical onset (traumatic event, layoff): corroborate with other evidence
4. For mental impairments: personality patterns may support earlier onset with longitudinal records
5. If treating source has provided opinion supporting specific onset date with clinical rationale → PASS
6. If onset date unsupported by objective evidence → FAIL (onset may need amendment)

---

### DIS.APP.010 — Appeal Window Compliance

**Input:** `decision_date`, `appeal_filed_date`, `good_cause_exception`
**Output:** `appeal_timely` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Calculate days between `decision_date` and `appeal_filed_date`
   - 5 additional days added for mailing time per SSA policy
   - Total window = 65 days from decision date
2. If `appeal_filed_date` ≤ `decision_date` + 65 days → PASS
3. If `appeal_filed_date` > 65 days:
   - Evaluate `good_cause_exception`:
     - Serious illness, SSA misinformation, unusual/unavoidable circumstances
   - If good cause documented → INVESTIGATING (ALJ must decide)
   - If no good cause → FAIL ("Appeal untimely; dismissal likely")
4. PASS if within window
