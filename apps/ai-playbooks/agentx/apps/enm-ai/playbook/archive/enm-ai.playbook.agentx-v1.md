---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: enm-ai.playbook.agentx-v1.md
---

# E/M AI — Medical Rules & Codes Playbook

> **Purpose:** Comprehensive clinical and coding rules for Evaluation and Management (E/M). Aligned with CMS and AMA guidelines. For physicians and coders.

**Sources:** American Medical Association (AMA) CPT®, CMS Medicare Claims Processing Manual Ch. 12, CMS Place of Service Codes, ICD-10-CM

---

## 1. Definition and Scope

### 1.1 E/M Coding

Evaluation and Management (E/M) coding:

- Uses **CPT codes 99202–99499**
- Bills **patient encounters** based on the **provider's work**, not the procedure
- Covers office visits, hospital care, emergency department, consultations, nursing facility, home visits, and related services
- Levels reflect **Medical Decision Making (MDM)** complexity and/or **Time**

### 1.2 CMS Alignment

- CMS follows AMA CPT E/M guidelines (2021+ revisions)
- Code selection: **MDM or Time** (whichever supports the level)
- History and physical exam elements **no longer required** for level selection when using MDM or time
- Documentation must support medical necessity and chosen level

---

## 2. Level Determination: MDM or Time

Levels are determined by **either**:

1. **Medical Decision Making (MDM)** — Complexity of problems, data, and risk
2. **Time** — Total time on the date of the encounter

**Rule:** Use whichever supports the higher level when both are documented. Do not add MDM and time together.

---

## 3. Medical Decision Making (MDM) — Complete Table (CMS/AMA 2021+)

MDM has **three elements**. To meet a given level, **two of three** must meet or exceed that level. *Source: AMA CPT® 2021 E/M guidelines; CMS adopted same criteria.*

### 3.1 Element 1: Number and Complexity of Problems Addressed

*Per CPT: A problem is "a disease, condition, illness, injury, symptom, sign, finding, complaint, or other matter addressed at the encounter."*

| Level | CMS/AMA Guidelines — Problems Addressed |
|-------|----------------------------------------|
| **Minimal** (Straightforward) | 1 self-limited or minor problem (e.g., cold, insect bite, uncomplicated rash) |
| **Low** | 2 or more self-limited or minor problems **OR** 1 stable chronic illness **OR** 1 acute, uncomplicated illness or injury **OR** 1 stable acute illness |
| **Moderate** | 1 or more chronic illnesses with exacerbation, progression, or side effects of treatment **OR** 2 or more stable chronic illnesses **OR** 1 undiagnosed new problem with uncertain prognosis **OR** 1 acute illness with systemic symptoms **OR** 1 acute complicated injury |
| **High** | 1 or more chronic illnesses with severe exacerbation, progression, or threat to life **OR** 1 acute or chronic illness or injury that poses a threat to life or bodily function **OR** 1 abrupt change in neurologic status |

### 3.2 Element 2: Amount and/or Complexity of Data to Be Reviewed and Analyzed

*Each unique test, order, or document contributes. A lab panel (e.g., 80047) = 1 unique test.*

**Category 1 — Tests, documents, or independent historian:**
- Review of prior external note(s) from each unique source
- Review of result(s) of each unique test
- Ordering of each unique test
- Assessment requiring independent historian(s)

**Category 2 — Independent interpretation:** Independent interpretation of a test performed by another physician/QHP (not separately reported)

**Category 3 — Discussion:** Discussion of management or test interpretation with external physician/QHP (not separately reported). *External = not same group/specialty.*

| Level | CMS/AMA Guidelines — Data Required |
|-------|-----------------------------------|
| **Minimal** | None or minimal |
| **Low** (Limited) | **1 of 2:** (1) Any combination of **2** from Category 1 (order test, review test, review prior note) **OR** (2) Assessment requiring independent historian(s) |
| **Moderate** | **1 of 3:** (1) Any combination of **3** from Category 1 (includes independent historian) **OR** (2) Independent interpretation (Category 2) **OR** (3) Discussion (Category 3) |
| **High** (Extensive) | **2 of 3:** Must meet requirements of at least **2** of the 3 categories (3+ from Category 1, independent interpretation, or discussion) |

### 3.3 Element 3: Risk of Morbidity or Mortality

*Per CPT: "Level of risk is based upon consequences of the problem(s) addressed when appropriately treated. Risk includes medical decision making related to the need to initiate or forego further testing, treatment, and/or hospitalization."*

| Level | CMS/AMA Guidelines — Risk of Complications/Morbidity/Mortality |
|-------|---------------------------------------------------------------|
| **Minimal** | Minimal risk. Examples: rest, gargles, elastic bandages, superficial dressings |
| **Low** | Low risk. Examples: OTC drugs, minor surgery with no risk, physical therapy, IV fluids without additives |
| **Moderate** | Moderate risk. Examples: prescription drug management; decision regarding minor surgery with identified patient or procedure risk factors; decision regarding elective major surgery without identified risk factors; diagnosis or treatment significantly limited by social determinants of health |
| **High** | High risk. Examples: drug therapy requiring intensive monitoring for toxicity; decision regarding emergency major surgery; decision regarding hospitalization; decision regarding elective major surgery with identified patient or procedure risk factors; decision not to resuscitate or to de-escalate care because of poor prognosis; decision regarding hospice or palliative care; life-threatening illness or injury |

### 3.4 MDM Summary for Coders

| MDM Level | Problems | Data | Risk |
|-----------|----------|------|------|
| Straightforward | Minimal | Minimal | Minimal |
| Low | Low | Low (1 of 2) | Low |
| Moderate | Moderate | Moderate (1 of 3) | Moderate |
| High | High | High (2 of 3) | High |

### 3.5 High MDM — Documentation Checklist (e.g., 99255, 99223, 99285)

To bill High MDM codes (e.g., 99255 inpatient consultation), **document two of three** elements at High level:

**Problems (High):** Document at least one of:
- Chronic illness with severe exacerbation, progression, or threat to life
- Acute or chronic illness/injury posing threat to life or bodily function
- Abrupt change in neurologic status

**Data (High):** Document **2 of 3:**
- **Category 1:** 3+ items — review prior external note(s), review test result(s), order test(s), independent historian
- **Category 2:** Independent interpretation of test (not separately reported)
- **Category 3:** Discussion of management with external physician/QHP (not separately reported)

**Risk (High):** Document at least one of:
- Drug therapy requiring intensive monitoring
- Decision regarding emergency major surgery
- Decision regarding hospitalization
- Drug therapy requiring monitoring for toxicity
- Decision regarding hospice or palliative care
- Life-threatening illness or injury

**Example 99255 documentation:** "Consulted for acute respiratory failure. Reviewed prior ICU note, CXR, ABG, and discussed management with intensivist. Recommended intubation and transfer to ICU. Decision to hospitalize. Total time 85 minutes."

### 3.6 Clinical Examples by MDM Level (Office/Outpatient)

*Use these scenarios to calibrate MDM level selection. Two of three elements (Problems, Data, Risk) must meet the level.*

| MDM Level | Code (Est.) | Scenario | Problems | Data | Risk |
|-----------|-------------|----------|----------|------|------|
| **Straightforward** | 99212 | Simple URI, cold symptoms, no fever. OTC recommendations. | 1 self-limited (URI) | None/minimal | Minimal (OTC) |
| **Straightforward** | 99212 | Medication refill for stable condition. No changes. | 1 stable chronic | Minimal | Minimal |
| **Low** | 99213 | UTI, prescribed antibiotic. Reviewed urinalysis. | 1 acute uncomplicated | 1–2 (review UA) | Low (Rx) |
| **Low** | 99213 | Otitis media, prescribed antibiotic. No systemic symptoms. | 1 acute uncomplicated | Limited | Low |
| **Low** | 99213 | Two minor problems: rash + allergy. OTC + topical. | 2 self-limited | Limited | Low |
| **Moderate** | 99214 | Asthma exacerbation. Reviewed PFTs, adjusted inhaler. | 1 chronic w/ exacerbation | 3+ or interpretation | Moderate (Rx mgmt) |
| **Moderate** | 99214 | New chest pain, uncertain etiology. Ordered EKG, troponin. Discussed with cardiology. | 1 undiagnosed new | 3+ or discussion | Moderate |
| **Moderate** | 99214 | Two stable chronic illnesses (DM2, HTN). Medication adjustments. | 2+ stable chronic | 3+ | Moderate |
| **High** | 99215 | CHF exacerbation with pulmonary edema. Reviewed echo, BNP. Decision to hospitalize. | 1 chronic severe exacerbation | 2 of 3 (review + interpretation) | High (hospitalization) |
| **High** | 99215 | Chest pain with positive troponin. Discussed with cardiology. Decision for cath. | Life-threatening | 2 of 3 | High |

### 3.7 99211 Usage and Data Element Examples

**99211 — Minimal service, MDM N/A:**
- May not require presence of physician; often nurse/MA visit
- Examples: BP check, medication administration (e.g., B12 injection), simple dressing change, flu shot
- Document 5+ minutes. Do not use when MDM or time supports higher level.

**Data Element — What counts (Category 1):**
- **Review prior external note:** Each unique source (e.g., PCP note, specialist note) = 1 each
- **Review test result:** Each unique test (CBC = 1, BMP = 1; comprehensive metabolic panel = 1)
- **Order test:** Each unique test ordered
- **Independent historian:** Assessment requiring info from parent, caregiver, or other historian (e.g., dementia patient)

**Data Element — Category 2 (Independent interpretation):**
- Physician interprets a test performed by another provider (e.g., reads own EKG when not separately reported)
- Must document interpretation; cannot double-count if test is separately reported

**Data Element — Category 3 (Discussion):**
- Discussion of management or test interpretation with external physician/QHP
- External = not same group or different specialty in same practice

---

## 4. Time

### 4.1 Definition

**Total time** = All time on the **date of the encounter** including:

- Face-to-face and non–face-to-face time
- Preparing to see patient
- Obtaining and/or reviewing history
- Performing examination
- Counseling and educating patient/family
- Ordering medications, tests, procedures
- Referring and communicating with other providers
- Documenting in the medical record
- Care coordination
- Interpreting results (when not separately reported)

**Excluded:** Time for separately reported services; travel.

### 4.2 Documentation

Document **total time in minutes**. Round to nearest minute. Time must be documented when using time to select level.

---

## 5. Patient Status

| Status | Definition (CMS/AMA) |
|--------|----------------------|
| **New** | No face-to-face E/M service by this physician (or same specialty, same group) within the **past 3 years** |
| **Established** | Face-to-face E/M service by this physician (or same specialty, same group) within the **past 3 years** |

**Same specialty:** Same taxonomy/specialty (e.g., 207R00000X = Internal Medicine). Different subspecialties in same group may count as same specialty per CMS.

---

## 6. Complete CPT Code Reference

**MDM levels (Straightforward, Low, Moderate, High):** All code tables below use the same MDM criteria. Two of three elements (Problems, Data, Risk) must meet the level. See **Section 3.1–3.5** for definitions; **Section 3.6** for clinical examples.

---

### 6.1 Office/Outpatient — New Patient (99202–99205)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99202 | Straightforward | 15–29 | Office visit, new patient |
| 99203 | Low | 30–44 | Office visit, new patient |
| 99204 | Moderate | 45–59 | Office visit, new patient |
| 99205 | High | 60–74 | Office visit, new patient |

### 6.2 Office/Outpatient — Established Patient (99211–99215)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99211 | N/A | 5+ | May not require physician; minimal service |
| 99212 | Straightforward | 10–19 | Office visit, established |
| 99213 | Low | 20–29 | Office visit, established |
| 99214 | Moderate | 30–39 | Office visit, established |
| 99215 | High | 40–54 | Office visit, established |

### 6.3 Hospital Inpatient — Initial (99221–99223)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99221 | Straightforward/Low | 30–44 | Initial hospital care |
| 99222 | Moderate | 45–59 | Initial hospital care |
| 99223 | High | 60–74 | Initial hospital care |

### 6.4 Hospital Inpatient — Subsequent (99231–99233)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99231 | Straightforward/Low | 15–24 | Subsequent hospital care |
| 99232 | Moderate | 25–39 | Subsequent hospital care |
| 99233 | High | 40–54 | Subsequent hospital care |

#### Documentation Requirements for 99233 (High MDM, 40–54 min)

**99233 — Subsequent hospital care, high complexity.** Use MDM or time (whichever supports level).

- **Required:** Chief complaint/reason for visit; relevant history; exam; assessment; plan
- **Time:** Total time 40–54 minutes on date of encounter (if using time)
- **High MDM (if using MDM):** Two of three elements must meet High (see Section 3.5)

**99233 High MDM examples:**
- ICU patient with septic shock; titrating vasopressors; reviewed labs, ABG, CXR; decision to continue current therapy
- Post-op with acute respiratory failure; discussed with intensivist; decision to intubate
- CHF exacerbation with pulmonary edema; diuresis; reviewed echo, BNP; decision regarding hospitalization extension

### 6.5 Hospital Observation (99217–99220) — Note: 99217–99220 deleted 2023; observation now uses 99221–99223, 99231–99239

### 6.6 Emergency Department (99281–99285)

| Code | MDM | Description |
|------|-----|-------------|
| 99281 | N/A | ED visit, minimal |
| 99282 | Low | ED visit |
| 99283 | Moderate | ED visit |
| 99284 | High | ED visit |
| 99285 | High | ED visit, high severity |

*ED codes do not use time; use MDM only.*

### 6.7 Critical Care (99291–99292)

| Code | Time | Description |
|------|------|-------------|
| 99291 | First 30–74 min | Critical care, first 30–74 minutes |
| 99292 | Each add'l 30 min | Critical care, each additional 30 minutes |

*Critical care is time-based. 99291 = 30–74 min; 99292 = each additional 30 min beyond 74.*

### 6.8 Consultations — Office/Outpatient (99242–99245)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99242 | Straightforward | 20–29 | Office consultation |
| 99243 | Low | 30–44 | Office consultation |
| 99244 | Moderate | 45–59 | Office consultation |
| 99245 | High | 55–64 | Office consultation |

### 6.9 Consultations — Inpatient (99252–99255)

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99252 | Straightforward | 35–44 | Inpatient consultation |
| 99253 | Low | 45–59 | Inpatient consultation |
| 99254 | Moderate | 60–74 | Inpatient consultation |
| 99255 | High | 80–89 | Inpatient consultation |

#### Documentation Requirements for Inpatient Consultations

**99255 (High MDM, 80–89 min) — Required documentation:**

- **Request:** Written or electronic request from attending/other physician; reason for consultation
- **History:** Chief complaint; HPI; relevant past medical, family, social history
- **Exam:** Focused or comprehensive exam pertinent to consultation question
- **Assessment:** Clinical impression; differential; findings supporting complexity
- **Recommendations:** Clear, specific recommendations to requesting physician
- **Time:** Total time 80–89 minutes on date of encounter (if using time)
- **High MDM (if using MDM):** Two of three elements must meet High:
  - **Problems:** 1+ chronic illness with severe exacerbation, progression, or threat to life; OR 1+ acute/chronic illness/injury posing threat to life or bodily function; OR abrupt change in neurologic status
  - **Data:** 2 of 3 — (1) 3+ items from Category 1 (review prior notes, tests, order tests, independent historian) OR (2) Independent interpretation of test OR (3) Discussion with external physician/QHP
  - **Risk:** Drug therapy requiring intensive monitoring; decision regarding emergency major surgery; decision regarding hospitalization; drug therapy requiring monitoring for toxicity; hospice/palliative care decision; life-threatening illness/injury

**99255 High MDM examples:**
- Severe sepsis with multi-organ involvement; decision to admit ICU; discussion with intensivist
- Acute MI with cardiogenic shock; decision for emergent cath; review of multiple labs, EKG, echo
- Stroke with NIHSS 15+; decision for tPA/thrombectomy; independent interpretation of CT/MRI; discussion with neurology
- GI bleed with hemodynamic instability; decision for emergent endoscopy; transfusion; discussion with gastroenterology

**99254 (Moderate MDM, 60–74 min):** Same structure; Moderate problems/data/risk per Section 3.

**99253 (Low MDM, 45–59 min):** Same structure; Low problems/data/risk per Section 3.

**99252 (Straightforward, 35–44 min):** Same structure; Minimal problems/data/risk per Section 3.

### 6.10 Nursing Facility — Initial (99304–99306)

**MDM criteria:** See Section 3.1–3.5. Use MDM or Time (whichever supports level).

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99304 | Straightforward/Low | 25–34 | Initial nursing facility care |
| 99305 | Moderate | 35–44 | Initial nursing facility care |
| 99306 | High | 45–59 | Initial nursing facility care |

### 6.11 Nursing Facility — Subsequent (99307–99310)

**MDM criteria:** See Section 3.1–3.5.

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99307 | Straightforward | 10–14 | Subsequent nursing facility care |
| 99308 | Low | 15–29 | Subsequent nursing facility care |
| 99309 | Moderate | 30–44 | Subsequent nursing facility care |
| 99310 | High | 45–59 | Subsequent nursing facility care |

### 6.12 Nursing Facility — Discharge (99315–99316)

| Code | Time (min) | Description |
|------|------------|-------------|
| 99315 | 30 or less | Nursing facility discharge |
| 99316 | >30 | Nursing facility discharge |

### 6.13 Home Services — New Patient (99341–99345)

**MDM criteria:** Same as all E/M settings. Two of three elements (Problems, Data, Risk) must meet the level. See **Section 3.1–3.5** for definitions of Straightforward, Low, Moderate, High.

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99341 | Straightforward | 15–29 | Home visit, new patient |
| 99342 | Low | 30–44 | Home visit, new patient |
| 99343 | Moderate | 45–59 | Home visit, new patient |
| 99344 | Moderate | 60–74 | Home visit, new patient |
| 99345 | High | 75–89 | Home visit, new patient |

### 6.14 Home Services — Established Patient (99347–99350)

**MDM criteria:** See Section 3.1–3.5. Use MDM or Time (whichever supports level).

| Code | MDM | Time (min) | Description |
|------|-----|------------|-------------|
| 99347 | Straightforward | 20–29 | Home visit, established |
| 99348 | Low | 30–39 | Home visit, established |
| 99349 | Moderate | 40–54 | Home visit, established |
| 99350 | High | 55–69 | Home visit, established |

**Home visit MDM examples:**
- **99347 (Straightforward):** Medication refill, stable chronic; minimal data; OTC/minor tx
- **99348 (Low):** UTI, prescribed antibiotic; reviewed prior note; low risk
- **99349 (Moderate):** CHF exacerbation, diuresis; reviewed labs, adjusted meds; moderate risk (Rx mgmt)
- **99350 (High):** Acute change, decision to hospitalize; 2 of 3 data categories; high risk

### 6.15 Prolonged Services

| Code | Use | Description |
|------|-----|-------------|
| 99417 | Add-on to 99205/99215 | Prolonged office/outpatient E/M (non-Medicare); 15-min increments beyond base |
| G2212 | Add-on to 99205/99215 | Prolonged office/outpatient E/M (Medicare); use instead of 99417 for Medicare |
| 99354 | Direct face-to-face | Prolonged service, first hour (use with 99205/99215 when 99417/G2212 not applicable) |
| 99355 | Add-on | Prolonged service, each add'l 30 min |
| 99358 | Non–face-to-face | Prolonged E/M before/after visit, first 30 min |
| 99359 | Add-on | Prolonged E/M before/after, each add'l 30 min |
| 99418 | Add-on | Prolonged inpatient/SNF (Medicare: G0317) |

**Prolonged time thresholds (office):**

- 99205: Base 60–74 min; prolonged starts at 75+ min (99417) or per Medicare (G2212)
- 99215: Base 40–54 min; prolonged starts at 55+ min

### 6.16 Add-On Complexity Codes

| Code | Description |
|------|-------------|
| G2211 | Visit complexity; ongoing care for single serious or complex condition; add-on to office E/M |
| G0545 | Additional complexity add-on (2025) |

---

## 7. ICD-10-CM and Medical Necessity

### 7.1 Role of ICD-10

- **CPT** = procedure/service (what was done)
- **ICD-10-CM** = diagnosis (why it was done)
- ICD-10 codes support **medical necessity** for the E/M level
- Diagnosis must support the complexity documented

### 7.2 Common ICD-10 Codes by Category (Representative)

#### Cardiovascular

| Code | Description |
|------|-------------|
| I10 | Essential (primary) hypertension |
| I11.0 | Hypertensive heart disease with heart failure |
| I11.9 | Hypertensive heart disease without heart failure |
| I12.0 | Hypertensive chronic kidney disease, stage 4 |
| I12.9 | Hypertensive chronic kidney disease, unspecified |
| I25.10 | Atherosclerotic heart disease without angina |
| R03.0 | Elevated blood pressure reading, diagnosis unknown |

#### Endocrine/Metabolic

| Code | Description |
|------|-------------|
| E11.9 | Type 2 diabetes mellitus without complications |
| E11.65 | Type 2 diabetes with hyperglycemia |
| E11.22 | Type 2 diabetes with chronic kidney disease |
| E78.5 | Hyperlipidemia, unspecified |
| E66.9 | Obesity, unspecified |
| E66.01 | Morbid obesity |

#### Respiratory

| Code | Description |
|------|-------------|
| J06.9 | Acute upper respiratory infection, unspecified |
| J18.9 | Pneumonia, unspecified |
| J44.9 | COPD, unspecified |
| J45.20 | Mild intermittent asthma, uncomplicated |
| J45.30 | Mild persistent asthma, uncomplicated |

#### Musculoskeletal

| Code | Description |
|------|-------------|
| M25.511 | Pain in right shoulder |
| M54.5 | Low back pain |
| M17.11 | Unilateral primary osteoarthritis, right knee |
| M79.3 | Panniculitis, unspecified |

#### Gastrointestinal

| Code | Description |
|------|-------------|
| K21.9 | GERD without esophagitis |
| K59.1 | Functional diarrhea |
| K80.20 | Calculus of gallbladder without cholecystitis |

#### Mental Health

| Code | Description |
|------|-------------|
| F32.9 | Major depressive disorder, single episode, unspecified |
| F41.1 | Generalized anxiety disorder |
| F33.1 | Major depressive disorder, recurrent, moderate |

#### Symptoms/Signs

| Code | Description |
|------|-------------|
| R07.9 | Chest pain, unspecified |
| R10.9 | Unspecified abdominal pain |
| R51 | Headache |
| R53 | Malaise and fatigue |

#### Screening/Preventive

| Code | Description |
|------|-------------|
| Z12.11 | Screening mammogram for breast cancer |
| Z12.4 | Screening for malignant neoplasm of cervix |
| Z00.00 | Encounter for general adult exam without abnormal findings |
| Z23 | Encounter for immunization |

#### History/Status

| Code | Description |
|------|-------------|
| Z79.899 | Other long-term (current) drug therapy |
| Z87.891 | Personal history of nicotine dependence |
| Z68.30 | BMI 30.0–30.9, adult |
| Z68.41 | BMI 40.0–44.9, adult |

#### Infectious/Exposure

| Code | Description |
|------|-------------|
| Z20.822 | Contact with and exposure to COVID-19 |
| B34.9 | Viral infection, unspecified |
| J00 | Acute nasopharyngitis [common cold] |

#### Genitourinary

| Code | Description |
|------|-------------|
| N39.0 | Urinary tract infection, site not specified |
| N18.9 | Chronic kidney disease, unspecified |

#### Skin

| Code | Description |
|------|-------------|
| L23.9 | Allergic contact dermatitis, unspecified cause |
| L08.9 | Local infection of skin and subcutaneous tissue, unspecified |

#### Neurologic

| Code | Description |
|------|-------------|
| G43.909 | Migraine, unspecified, not intractable |
| G47.00 | Insomnia, unspecified |

### 7.3 Medical Necessity Rules

- **Primary diagnosis** must support the chief complaint and level of service
- **Secondary diagnoses** add complexity when addressed
- Avoid **unspecified** codes when more specific code is documented
- **R03.0** (elevated BP) vs **I10** (hypertension): Use I10 only when hypertension is diagnosed; R03.0 for isolated elevated reading

---

## 8. CMS Place of Service (POS) Codes

| POS | Description | Typical E/M Codes |
|-----|-------------|-------------------|
| 02 | Telehealth (when applicable) | 99202–99215 (with modifier 95) |
| 11 | Office | 99202–99215 |
| 12 | Home | 99341–99350 |
| 21 | Inpatient hospital | 99221–99239 |
| 22 | Outpatient hospital | 99202–99215 |
| 23 | Emergency room | 99281–99285 |
| 31 | Skilled nursing facility | 99304–99318 |
| 32 | Nursing facility | 99304–99318 |
| 34 | Hospice | As applicable |

---

## 9. Documentation Requirements (CMS/AMA)

### 9.1 Required Elements (All Encounters)

- **Chief complaint** or reason for visit
- **History** (HPI and/or relevant history)
- **Assessment** (diagnosis/clinical impression)
- **Plan** (treatment, medications, follow-up)

### 9.2 When Using MDM for Level

- Document **problems addressed** (number and complexity)
- Document **data reviewed** (tests, notes, interpretation, discussion)
- Document **risk** (treatment decisions, drug management, surgery, etc.)

### 9.3 When Using Time for Level

- Document **total time in minutes**
- Time includes all activities on date of service (see Section 4.1)

### 9.4 2021+ Revisions

- No requirement for **history** or **exam** elements to match level when using MDM or time
- Document what was performed; level is based on MDM or time

---

## 10. NCCI, LCD/NCD, and Modifiers

- **NCCI:** National Correct Coding Initiative edits apply; do not report E/M with procedure when bundled
- **LCD/NCD:** Local and National Coverage Determinations may restrict certain codes; verify payer policy
- **Modifier 25:** Significant, separately identifiable E/M service on same day as procedure. Use when E/M is above and beyond the procedure (e.g., new problem addressed during procedure visit).
- **Modifier 57:** Decision for surgery; use when E/M results in decision for major surgery same day or next day

### 10.1 Physician Documentation Tips by MDM Level

| Level | What to Document |
|-------|------------------|
| **Straightforward** | Single self-limited problem; minimal data; low-risk treatment |
| **Low** | 1–2 problems; note labs/imaging reviewed or ordered; document stable chronic illness or uncomplicated acute |
| **Moderate** | Chronic illness with exacerbation; 2+ chronic conditions; document data reviewed (2+ items); prescription changes; elective surgery decision |
| **High** | Life-threatening or severe exacerbation; document extensive data (3+ items or independent interpretation); hospitalization decision; drug monitoring for toxicity |

---

## 11. Chart Validity — E/M Signals

A document is a **valid E/M encounter** when it contains:

- Chief complaint or reason for visit
- History (HPI, ROS, or relevant history)
- Assessment or diagnosis
- Plan or treatment

**Reject** if: procedure-only note, no encounter documentation, or non-clinical content.

---

## 12. Contradiction Detection

**Flag** when:

- Time documented does not support chosen level
- MDM level does not match documented problems/data/risk
- New vs established status inconsistent with 3-year rule
- Place of service does not match code
- ICD-10 diagnosis does not support medical necessity for level
- 99417 submitted to Medicare (use G2212)

---

## 13. Telehealth

- Same E/M codes (99202–99215) apply for telehealth when appropriate
- Place of service may be 02 (telehealth) or 11 with modifier 95
- Verify payer-specific telehealth policies

## 14. Expanded Services

### 14.1 Preventive Medicine Services (New Patient: 99381–99387)
| Code | Age | Description |
|------|-----|-------------|
| 99381 | <1 year | Initial preventive medicine, new patient |
| 99382 | 1–4 years | Initial preventive medicine, new patient |
| 99383 | 5–11 years | Initial preventive medicine, new patient |
| 99384 | 12–17 years | Initial preventive medicine, new patient |
| 99385 | 18–39 years | Initial preventive medicine, new patient |
| 99386 | 40–64 years | Initial preventive medicine, new patient |
| 99387 | 65+ years | Initial preventive medicine, new patient |

### 14.2 Preventive Medicine Services (Established Patient: 99391–99397)
| Code | Age | Description |
|------|-------------|-----------------------------------|
| 99391 | <1 year | Periodic preventive medicine, established |
| 99392 | 1–4 years | Periodic preventive medicine, established |
| 99393 | 5–11 years | Periodic preventive medicine, established |
| 99394 | 12–17 years | Periodic preventive medicine, established |
| 99395 | 18–39 years | Periodic preventive medicine, established |
| 99396 | 40–64 years | Periodic preventive medicine, established |
| 99397 | 65+ years | Periodic preventive medicine, established |

### 14.3 Care Management Services
- **Chronic Care Management (99490, 99439, 99491, 99437):** Monthly time-based reporting for patients with multiple chronic conditions.
- **Principal Care Management (99424–99427):** Monthly time-based reporting for a single high-risk condition.
- **Transitional Care Management (99495–99496):** Post-discharge communication and face-to-face visit within 7–14 days.

### 14.4 Counseling & Behavioral Interventions
- **Risk Factor Reduction (99401–99404):** Time-based individual counseling (15, 30, 45, 60 min).
- **Behavioral Change (99406–99409):** Tobacco cessation (3–10 min vs >10 min) and Alcohol/Substance screening.
- **Group Counseling (99411–99412):** Group risk factor reduction (30 vs 60 min).

## 15. E/M Modifiers

| Modifier | Description | Use Case |
|----------|-------------|----------|
| **24** | Unrelated E/M during post-op | Reporting visit unrelated to global surgery |
| **25** | Separate E/M on same day | E/M service provided with a procedure |
| **95** | Synchronous Telemedicine | Real-time audio/video interaction |
| **93** | Audio-only Telemedicine | Synchronous telephone/audio interaction |
| **57** | Decision for Surgery | Made during E/M for a major surgery |

---

**END OF PLAYBOOK**

*Aligned with AMA CPT® and CMS. For physician and coder use. Verify payer-specific policies.*
