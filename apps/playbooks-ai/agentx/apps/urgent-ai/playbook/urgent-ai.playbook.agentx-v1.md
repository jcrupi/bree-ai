---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: urgent-ai.playbook.agentx-v1.md
---

# Urgent AI — Medical Rules & Codes Playbook

> **Purpose:** Clinical rules and codes for urgent care encounters. Aligned with CMS, AMA CPT®, and common urgent care workflows. Models quick-visit E/M, common conditions, and documentation requirements.

**Sources:** AMA CPT®, CMS Medicare Claims Processing Manual Ch. 12, Urgent Care Association (UCA) guidelines

---

## 1. Definition and Scope

### 1.1 Urgent Care Coding

Urgent care coding covers:

- **E/M visits:** Office/outpatient codes 99202–99215 (same as primary care)
- **Common conditions:** Minor injuries, URI, UTI, ear infections, lacerations, sprains, rashes
- **Place of service:** Typically 11 (Office) or 20 (Urgent Care Facility — when recognized by payer)
- **Documentation:** Often streamlined; must still support MDM or time for level selection

### 1.2 Urgent vs Emergency vs Primary Care

| Setting | Codes | Typical Acuity |
|--------|-------|-----------------|
| Urgent care | 99202–99215 | Non–life-threatening, same-day need |
| Emergency dept | 99281–99285 | Variable; may be life-threatening |
| Primary care office | 99202–99215 | Scheduled, chronic + acute |

**Rule:** Urgent care uses office E/M codes. Do not use ED codes (99281–99285) for urgent care.

---

## 2. E/M Level Determination

### 2.1 MDM or Time

Same as office E/M: use **MDM** or **Time** (whichever supports level). **Two of three** MDM elements (Problems, Data, Risk) must meet the level. See `enm-ai.playbook.agentx-v1.md` Sections 3–3.7 for full MDM tables, Data element breakdown (Category 1/2/3), and clinical examples.

### 2.2 MDM Quick Reference — Urgent Care

| MDM Level | Problems | Data | Risk |
|-----------|----------|------|------|
| **Straightforward** | 1 self-limited (e.g., cold, minor rash) | None/minimal | Minimal (OTC) |
| **Low** | 2+ self-limited OR 1 acute uncomplicated (UTI, OM) | 2 from Cat 1 OR independent historian | Low (Rx, PT) |
| **Moderate** | 1 chronic exacerbation OR 2+ stable chronic OR 1 undiagnosed new | 3 from Cat 1 OR interpretation OR discussion | Moderate (Rx mgmt) |
| **High** | 1 chronic severe exacerbation OR life-threatening | 2 of 3 categories | High (hospitalization, emergency) |

### 2.3 Urgent Care Typical Levels and Scenarios

| Code | MDM | Common Urgent Scenarios |
|------|-----|-------------------------|
| 99211 | N/A | BP check, flu shot, simple dressing, med administration (5+ min) |
| 99212 | Straightforward | Simple URI, minor rash, medication refill, uncomplicated allergy |
| 99213 | Low | UTI (review UA, prescribe abx), otitis media, simple laceration repair, single acute uncomplicated |
| 99214 | Moderate | Multiple problems, asthma exacerbation, fracture evaluation, new chest pain workup |
| 99215 | High | Chest pain with positive workup, dehydration with IV, complex injury, decision to hospitalize |

### 2.4 Time Ranges (Office — Established)

| Code | MDM | Time (min) |
|------|-----|------------|
| 99211 | N/A | 5+ |
| 99212 | Straightforward | 10–19 |
| 99213 | Low | 20–29 |
| 99214 | Moderate | 30–39 |
| 99215 | High | 40–54 |

---

## 3. Common ICD-10 Codes — Urgent Care

### 3.1 Upper Respiratory

| Code | Description |
|------|-------------|
| J00 | Acute nasopharyngitis (common cold) |
| J02.9 | Acute pharyngitis, unspecified |
| J06.9 | Acute upper respiratory infection, unspecified |
| J11.1 | Influenza with respiratory manifestations |
| J18.9 | Pneumonia, unspecified |
| J20.9 | Acute bronchitis, unspecified |

### 3.2 Urinary

| Code | Description |
|------|-------------|
| N39.0 | Urinary tract infection, site not specified |
| N30.00 | Acute cystitis, unspecified |

### 3.3 Ear

| Code | Description |
|------|-------------|
| H66.90 | Otitis media, unspecified |
| H66.91 | Otitis media, right ear |
| H66.92 | Otitis media, left ear |
| H60.90 | Unspecified otitis externa |

### 3.4 Skin / Wounds

| Code | Description |
|------|-------------|
| L23.9 | Allergic contact dermatitis, unspecified |
| L24.9 | Irritant contact dermatitis, unspecified |
| L08.9 | Localized infection of skin, unspecified |
| S01.90XA | Unspecified open wound of head, initial encounter |
| S61.419A | Laceration without foreign body, unspecified hand, initial encounter |

### 3.5 Musculoskeletal — Sprains / Strains

| Code | Description |
|------|-------------|
| S93.401A | Sprain of unspecified ligament of right ankle, initial encounter |
| S93.402A | Sprain of unspecified ligament of left ankle, initial encounter |
| S43.401A | Sprain of unspecified ligament of right shoulder, initial encounter |
| M25.511 | Pain in right shoulder |
| M25.512 | Pain in left shoulder |

### 3.6 Gastrointestinal

| Code | Description |
|------|-------------|
| A09 | Diarrhea and gastroenteritis |
| K21.9 | Gastro-esophageal reflux disease without esophagitis |
| R10.9 | Unspecified abdominal pain |

### 3.7 Other Common

| Code | Description |
|------|-------------|
| R07.9 | Chest pain, unspecified |
| R51 | Headache |
| R05 | Cough |
| R50.9 | Fever, unspecified |
| G43.909 | Migraine, unspecified, not intractable |

---

## 4. Procedure Codes — Urgent Care

### 4.1 Laceration Repair

| Code | Description |
|------|-------------|
| 12011 | Simple repair, face, ≤2.5 cm |
| 12013 | Simple repair, face, 2.6–5.0 cm |
| 12014 | Simple repair, face, 5.1–7.5 cm |
| 12031 | Layer closure, scalp/axilla/trunk/extremity, ≤7.5 cm |
| 12032 | Layer closure, 7.6–12.5 cm |

### 4.2 Splinting / Casting

| Code | Description |
|------|-------------|
| 29125 | Short arm splint |
| 29126 | Short arm cast |
| 29515 | Short leg splint |
| 29540 | Long leg cast |

### 4.3 Injections

| Code | Description |
|------|-------------|
| 96372 | Therapeutic injection, subcutaneous/intramuscular |
| 96374 | IV push, single or initial drug |
| 96375 | IV push, each additional drug |
| 96376 | IV infusion, ≤1 hr, single drug |
| 96377 | IV infusion, add'l hour |
| 96413 | Chemotherapy, IV infusion, ≤1 hr |

**Note:** 96413 is chemotherapy; for urgent care use 96372, 96374, 96376 for common IV fluids. Verify NCCI edits.

### 4.4 Point-of-Care Testing

| Code | Description |
|------|-------------|
| 80053 | Comprehensive metabolic panel |
| 85025 | CBC with differential |
| 81025 | Urine pregnancy test |
| 87804 | Influenza, A or B, rapid |

---

## 5. Documentation Requirements

### 5.1 Minimum for Urgent Visit

- **Chief complaint:** Reason for visit
- **History:** Relevant HPI, allergies, medications
- **Exam:** Focused exam pertinent to complaint
- **Assessment:** Diagnosis(es)
- **Plan:** Treatment, prescriptions, follow-up

### 5.2 MDM Documentation

When using MDM for level:

- **Problems:** Number and complexity addressed
- **Data:** Tests reviewed/ordered (e.g., rapid strep, UA, X-ray)
- **Risk:** Prescription management, referral, procedure

### 5.3 Time Documentation

When using time for level:

- Document total time in minutes
- Include face-to-face and non–face-to-face (e.g., charting, calls)

---

## 6. Place of Service

| POS | Description |
|-----|-------------|
| 11 | Office |
| 20 | Urgent Care Facility (when payer recognizes) |

**Note:** Some payers map POS 20 to office; others have specific urgent care logic. Verify per payer.

---

## 7. Coding Engine Specialty

- **Recommended specialty:** `GENERAL`
- Coding engine GENERAL specialty covers office E/M, common ICD-10, and urgent care procedures
- Use `specialty="GENERAL"` when calling coding-ai `/process` or `/process-pdf`

---

## 8. Urgent Care Workflow Notes

- **Rapid triage:** Chief complaint drives focused documentation
- **Common bundles:** URI + cough; UTI + UA; laceration + repair
- **Modifier 25:** When E/M is separately identifiable from procedure (e.g., laceration repair)
- **Modifier 59 / XE:** Distinct procedural service when needed per NCCI

---

## 9. Chart Validity — Urgent Care Signals

A document is a **valid urgent care encounter** when it contains ≥2 of:

- Chief complaint, reason for visit
- Focused history (HPI, allergies, medications)
- Focused exam pertinent to complaint
- Assessment or diagnosis
- Plan (treatment, prescriptions, follow-up)

**Reject** if: non-clinical content, procedure-only note with no E/M documentation, or emergency-level acuity requiring ED codes.

---

## 10. Contradiction Detection

**Flag** when:

- ED codes (99281–99285) used for urgent care setting — use 99202–99215
- Place of service not 11 or 20 for urgent care
- Modifier 25 missing when E/M and procedure billed same day and E/M is separately identifiable
- ICD-10 diagnosis does not support medical necessity for level or procedure

---

**END OF PLAYBOOK**

*Aligned with AMA CPT®, CMS, and UCA guidelines. Verify payer-specific policies.*
