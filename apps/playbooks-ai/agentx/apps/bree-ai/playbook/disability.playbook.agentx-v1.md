---
agentx:
  version: 1
  created_at: "2026-03-12T04:57:00Z"
  type: playbook
  filename: disability.playbook.agentx-v1.md
  domain: disability
  specialty: Disability Benefits (SSDI / SSI)
---

# Disability Benefits Playbook
**Domain:** Social Security Disability (SSDI & SSI)
**Version:** 1
**Owner:** Bree AI — Tax & Compliance

---

## Overview

This playbook guides the analysis and preparation of disability benefit applications under the Social Security Administration (SSA) programs:

- **SSDI (Social Security Disability Insurance)** — Work-based, requires sufficient work credits.
- **SSI (Supplemental Security Income)** — Needs-based, no work credit requirement.

The SSA uses a **5-Step Sequential Evaluation Process** to determine disability. Every step must be evaluated in order. An unfavorable determination at any step ends the evaluation.

---

## Domain Entities

### Claimant
The individual applying for disability benefits.
- **Fields:** Name, SSN/TIN, Date of Birth, Alleged Onset Date (AOD), Last Insured Date (SSDI only)
- **Key States:** Applied, DDS Review, ALJ Hearing, Appeals Council, Federal Court

### Impairment
A medically determinable physical or mental condition that limits the claimant's ability to function.
- **Types:** Severe, Non-Severe, Listing-Level (per SSA Blue Book)
- **Duration Requirement:** Must be expected to last ≥ 12 months OR result in death

### Residual Functional Capacity (RFC)
The maximum functional capacity in a work setting despite impairments.
- **Exertional Levels:** Sedentary, Light, Medium, Heavy, Very Heavy
- **Non-Exertional Limits:** Mental, visual, communicative, postural limitations

### Substantial Gainful Activity (SGA)
An earnings threshold used to determine if claimant is working above disability level.
- **2024 SGA Threshold:** $1,550/month (non-blind); $2,590/month (blind)

### Listing of Impairments (Blue Book)
SSA's catalog of conditions that are presumptively disabling if met exactly.
- **Body Systems:** Musculoskeletal, Cardiovascular, Respiratory, Mental Disorders, Neurological, etc.

### Work Credits (SSDI)
Earned through employment. Required to be insured for SSDI.
- **General Rule:** 40 credits total, 20 earned in last 10 years before disability onset
- **Exception (younger workers):** Fewer credits required for claimants under 31

### Dictionary of Occupational Titles (DOT) / O*NET
SSA reference for job classifications and skill/exertion levels.

### Vocational Expert (VE)
Expert witness at ALJ hearings who testifies about job availability given the claimant's RFC and limitations.

---

## The 5-Step Sequential Evaluation

### Step 1 — Substantial Gainful Activity (SGA)
**Question:** Is the claimant currently working at SGA level?
- **YES → Not Disabled** (evaluation stops)
- **NO → Continue to Step 2**
- Special rules apply for trial work periods, subsidized work, and self-employment

### Step 2 — Severity of Impairment
**Question:** Does the claimant have a severe impairment (or combination of impairments)?
- **Severe** = more than minimal effect on basic work activities
- **NOT Severe → Not Disabled** (evaluation stops)
- **Severe → Continue to Step 3**

### Step 3 — Meeting or Equaling a Listing
**Question:** Does the impairment meet or medically equal a Blue Book listing?
- **MEETS/EQUALS Listing → Disabled** (evaluation stops, favorable)
- **Does NOT meet → Continue to Step 4**
- Assess "medical equivalence" — clinically equivalent findings even if literal criteria not met

### Step 4 — Past Relevant Work (PRW)
**Question:** Can the claimant perform their Past Relevant Work (PRW)?
- PRW = Work performed in the last 15 years, at SGA level, for sufficient duration to learn job
- SSA uses RFC vs. PRW demands (from DOT/VE)
- **CAN perform PRW → Not Disabled** (evaluation stops)
- **CANNOT perform PRW → Continue to Step 5**

### Step 5 — Other Work in National Economy
**Question:** Can the claimant perform any other work in significant numbers in the national economy?
- SSA considers RFC + Age + Education + Work Experience (Medical-Vocational Grid Rules)
- **CAN do other work → Not Disabled**
- **CANNOT do other work → Disabled** (favorable)

---

## RFC Assessment Categories

### Exertional RFC
| Level | Lifting (Occ./Freq.) | Standing/Walking | Sitting (Max) |
|---|---|---|---|
| Sedentary | 10 lbs / negligible | 2 hrs/day | 6 hrs/day |
| Light | 20 lbs / 10 lbs | 6 hrs/day | 6 hrs/day |
| Medium | 50 lbs / 25 lbs | 6 hrs/day | — |
| Heavy | 100 lbs / 50 lbs | 6 hrs/day | — |
| Very Heavy | >100 lbs / >50 lbs | 6 hrs/day | — |

### Non-Exertional RFC Limitations
- **Postural:** Climb, balance, stoop, kneel, crouch, crawl
- **Manipulative:** Reaching, handling, fingering, feeling
- **Visual:** Near/far acuity, depth perception, accommodation, field of vision
- **Communicative:** Hearing, speaking
- **Environmental:** Temperature extremes, wetness, fumes, vibration, hazards

### Mental RFC Categories (MRFC — 20 CFR Part 404, Subpart P)
- **Understanding/Memory:** Short/long instructions, locations, remote info
- **Sustained Concentration/Persistence:** Maintain attention, work pace, schedules
- **Social Interaction:** Supervisors, coworkers, public
- **Adaptation:** Response to changes, travel, avoiding hazards, planning

---

## Medical Evidence Requirements

### Acceptable Medical Sources (AMS)
- Licensed physician (MD/DO)
- Licensed psychologist
- Licensed optometrist, podiatrist, speech-language pathologist (for their specialties)
- Advanced Practice Registered Nurses (APRN) — since 3/27/2017

### Objective Medical Evidence
- Laboratory findings (blood tests, imaging, EMG, etc.)
- Physical/mental status examination findings
- Diagnostic imaging (X-ray, MRI, CT)
- Treatment records and medication history

### Opinion Evidence Weight (post-March 2017 rules)
Under 20 CFR 404.1520c, SSA considers:
1. **Supportability** — How well supported by objective evidence
2. **Consistency** — Consistency with other evidence in the record
3. Relationship with claimant (examining vs. non-examining)
4. Specialization of the provider

---

## Key Programs and Rules

### SSDI vs. SSI Comparison
| Feature | SSDI | SSI |
|---|---|---|
| Work History | Required (insured status) | Not required |
| Income Limit | SGA applies | $1,971/month (2024) |
| Asset Limit | None | $2,000 individual / $3,000 couple |
| Medicare | After 24-month waiting period | Medicaid immediately |
| Onset Date | Alleged onset or established onset | Application filing date |

### Trial Work Period (SSDI)
- 9 months (not necessarily consecutive) within a 60-month rolling window
- 2024 TWP threshold: $1,110/month
- Claimant can continue receiving benefits during TWP

### Compassionate Allowances (CAL)
Conditions fast-tracked through adjudication (e.g., ALS, pancreatic cancer, early-onset Alzheimer's).

### Medical-Vocational Grid Rules (Grids)
Matrix rules (20 CFR Part 404, Subpart P, Appendix 2) based on:
- RFC level
- Age (younger person <50, closely approaching advanced age 50-54, advanced age 55+, closely approaching retirement age 60+)
- Education (illiterate, limited, high school, more than high school)
- Skill level (unskilled, semi-skilled, skilled / transferable skills)

---

## Appeals Process

```
Initial Application
      ↓ (deny)
Reconsideration
      ↓ (deny)
Administrative Law Judge (ALJ) Hearing
      ↓ (deny)
Appeals Council Review
      ↓ (deny)
Federal District Court
```

**Key Deadlines:**
- Reconsideration: 60 days from denial notice
- ALJ Request: 60 days from reconsideration denial
- Appeals Council: 60 days from ALJ decision
- Federal Court: 60 days from Appeals Council action

---

## Common Disabling Conditions by Body System

| Body System (Blue Book Part) | Examples |
|---|---|
| 1.00 — Musculoskeletal | Spine disorders (DDD, herniated disc), joint dysfunction, fractures |
| 4.00 — Cardiovascular | Chronic heart failure, coronary artery disease, arrhythmias |
| 5.00 — Digestive | Liver disease, IBD, short bowel syndrome |
| 6.00 — Genitourinary | Chronic kidney disease (CKD stages 3-5) |
| 11.00 — Neurological | Epilepsy, Parkinson's, Multiple Sclerosis, TBI |
| 12.00 — Mental Disorders | Major depression, schizophrenia, PTSD, intellectual disability, autism |
| 13.00 — Cancer | Most cancers with specified TNM staging and treatment criteria |
| 14.00 — Immune | HIV/AIDS, lupus, inflammatory arthritis |

---

## Rules and Logic Summary

| Rule | Description |
|---|---|
| DIS.SGA.001 | Claimant must demonstrate SGA threshold assessment at Step 1 |
| DIS.IMP.002 | Impairment(s) must be severe and expected to last ≥ 12 months or death |
| DIS.LST.003 | Evidence must be compared against Blue Book listing criteria at Step 3 |
| DIS.RFC.004 | RFC must address all work-related limitations (exertional + non-exertional) |
| DIS.PRW.005 | Past Relevant Work must be classified per DOT/O*NET and compared to RFC |
| DIS.VOC.006 | Step 5 vocational analysis must consider age/education/work experience + Grid rules |
| DIS.MED.007 | Medical evidence must come from Acceptable Medical Sources (AMS) |
| DIS.INS.008 | SSDI claimants must establish insured status (Date Last Insured — DLI) |
| DIS.ONS.009 | Alleged onset date (AOD) must be supported by objective medical evidence |
| DIS.APP.010 | Appeals must be filed within 60-day windows at each adjudicative level |
