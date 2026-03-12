---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: behavioral-health-ai.playbook.agentx-v1.md
---

# Behavioral Health AI — Medical Rules & Codes Playbook

> **Purpose:** Clinical rules and codes for behavioral health. Covers psychiatry, psychology, clinical social work (LCSW), licensed professional counselors (LPC), marriage and family therapists (MFT), and related disciplines. Aligned with DSM-5-TR, ICD-10-CM, and AMA CPT®.

**Sources:** DSM-5-TR (American Psychiatric Association), ICD-10-CM, AMA CPT®, CMS Medicare Claims Processing Manual Ch. 12

---

## 1. Definition and Scope

### 1.1 Behavioral Health Coding

Behavioral health coding covers:

- **E/M visits:** Office/outpatient 99202–99215 (same as primary care)
- **Psychotherapy:** 90832, 90834, 90837 (individual); 90846, 90847 (family); 90853 (group)
- **Psychiatry:** E/M + psychotherapy same-day (modifier 25 when separately identifiable)
- **Place of service:** 11 (Office), 22 (Outpatient hospital), 51 (Psychiatric facility)
- **Documentation:** Must support medical necessity, DSM-5-TR diagnosis, treatment plan

### 1.2 DSM-5-TR Alignment

- All diagnoses must map to DSM-5-TR criteria and ICD-10-CM
- Documentation should reference DSM criteria when supporting diagnosis
- Severity specifiers (mild, moderate, severe) affect coding and medical necessity

---

## 2. DSM-5-TR — Complete Chapter Reference

*Per APA DSM-5-TR (2022). All 19 disorder chapters.*

| Ch | DSM-5-TR Chapter | Representative ICD-10-CM Ranges |
|----|------------------|--------------------------------|
| 1 | Neurodevelopmental Disorders | F70–F89, F90–F98 |
| 2 | Schizophrenia Spectrum and Other Psychotic Disorders | F20–F29 |
| 3 | Bipolar and Related Disorders | F30–F39 (bipolar) |
| 4 | Depressive Disorders | F32, F33, F34.1 |
| 5 | Anxiety Disorders | F40, F41 |
| 6 | **Obsessive-Compulsive and Related Disorders** | F42, **F63.2 (trichotillomania)**, L98.1 |
| 7 | Trauma- and Stressor-Related Disorders | F43 |
| 8 | Dissociative Disorders | F44 |
| 9 | Somatic Symptom and Related Disorders | F45 |
| 10 | Feeding and Eating Disorders | F50 |
| 11 | Elimination Disorders | F98.0, F98.1 |
| 12 | Sleep-Wake Disorders | G47 |
| 13 | Sexual Dysfunctions | F52 |
| 14 | Gender Dysphoria | F64 |
| 15 | Disruptive, Impulse-Control, and Conduct Disorders | F63, F91 |
| 16 | Substance-Related and Addictive Disorders | F10–F19 |
| 17 | Neurocognitive Disorders | F01–F03, G31.83 |
| 18 | Personality Disorders | F60 |
| 19 | Paraphilic Disorders | F65 |

---

## 3. Trichotillomania (Hair-Pulling Disorder)

**DSM-5-TR placement:** **Obsessive-Compulsive and Related Disorders** (Chapter 6)

Trichotillomania is grouped with OCD, body dysmorphic disorder, hoarding disorder, and excoriation (skin-picking) disorder because of shared features: repetitive behaviors, difficulty controlling urges, and distress/impairment.

### 3.1 Diagnostic Criteria (DSM-5-TR Summary)

- Recurrent pulling out of one's hair, resulting in hair loss
- Repeated attempts to decrease or stop hair pulling
- The hair pulling causes clinically significant distress or impairment
- Not attributable to another medical condition or mental disorder

### 3.2 ICD-10-CM

| Code | Description |
|------|-------------|
| F63.2 | Trichotillomania (hair-pulling disorder) |
| L98.1 | Dermatitis factitia (when skin/scalp damage documented) |

### 3.3 Related OCD-Spectrum Disorders (Same Chapter)

| Disorder | ICD-10-CM |
|----------|-----------|
| Obsessive-compulsive disorder | F42 |
| Body dysmorphic disorder | F45.22 |
| Hoarding disorder | F42.3 |
| Excoriation (skin-picking) disorder | L98.1, F42.4 |
| Trichotillomania | F63.2 |

---

## 4. CPT Codes — Behavioral Health

### 4.1 E/M Office/Outpatient (99202–99215)

Same as primary care. Use MDM or Time. See `enm-ai.playbook.agentx-v1.md` for MDM criteria.

### 4.2 Psychotherapy

| Code | Description | Time |
|------|-------------|------|
| 90832 | Psychotherapy, 30 min | 16–37 min |
| 90834 | Psychotherapy, 45 min | 38–52 min |
| 90837 | Psychotherapy, 60 min | 53+ min |
| 90846 | Family therapy (without patient) | 26+ min |
| 90847 | Family therapy (with patient) | 26+ min |
| 90853 | Group psychotherapy | 45+ min |

### 4.3 E/M + Psychotherapy Same Day

- **Modifier 25:** When E/M is separately identifiable from psychotherapy
- Document distinct E/M service (e.g., medication management, new problem)
- Cannot report 99211 with psychotherapy

### 4.4 Psychiatric Diagnostic Evaluation

| Code | Description |
|------|-------------|
| 90791 | Psychiatric diagnostic evaluation |
| 90792 | Psychiatric diagnostic evaluation with medical services |

---

## 5. ICD-10-CM — Key Behavioral Health Codes

### 5.1 Depressive Disorders

| Code | Description |
|------|-------------|
| F32.0 | Major depressive disorder, single episode, mild |
| F32.1 | Major depressive disorder, single episode, moderate |
| F32.2 | Major depressive disorder, single episode, severe |
| F33.0 | Major depressive disorder, recurrent, mild |
| F33.1 | Major depressive disorder, recurrent, moderate |
| F34.1 | Dysthymic disorder |

### 5.2 Anxiety Disorders

| Code | Description |
|------|-------------|
| F41.0 | Panic disorder |
| F41.1 | Generalized anxiety disorder |
| F40.10 | Social anxiety disorder |
| F40.00 | Agoraphobia |
| F43.10 | Post-traumatic stress disorder |

### 5.3 Obsessive-Compulsive and Related (Incl. Trichotillomania)

| Code | Description |
|------|-------------|
| F42 | Obsessive-compulsive disorder |
| F63.2 | Trichotillomania |
| F45.22 | Body dysmorphic disorder |
| F42.3 | Hoarding disorder |

### 5.4 Substance-Related

| Code | Description |
|------|-------------|
| F10.10 | Alcohol use disorder, mild |
| F10.20 | Alcohol use disorder, moderate/severe |
| F11.10 | Opioid use disorder, mild |
| F12.10 | Cannabis use disorder, mild |

### 5.5 Bipolar and Psychotic

| Code | Description |
|------|-------------|
| F31.0 | Bipolar I, current hypomanic |
| F31.10 | Bipolar I, current manic, mild |
| F20.0 | Schizophrenia, paranoid type |
| F25.0 | Schizoaffective disorder, bipolar type |

---

## 6. Documentation Requirements

### 6.1 Psychiatric Note

- Chief complaint / reason for visit
- History (HPI, psychiatric history, medications)
- Mental status exam (MSE)
- Assessment: DSM-5-TR diagnosis with ICD-10-CM
- Plan: treatment, medications, follow-up

### 6.2 Medical Necessity

- Diagnosis must support level of care
- Treatment plan must align with evidence-based guidelines
- Document severity and functional impairment

---

## 7. Place of Service

| POS | Description |
|-----|-------------|
| 11 | Office |
| 22 | Outpatient hospital |
| 51 | Inpatient psychiatric facility |
| 52 | Psychiatric facility—partial hospitalization |
| 53 | Community mental health center |

---

**END OF PLAYBOOK**

*Aligned with DSM-5-TR, ICD-10-CM, and AMA CPT®. Trichotillomania: DSM-5-TR Ch. 6 — Obsessive-Compulsive and Related Disorders; ICD-10-CM F63.2.*
