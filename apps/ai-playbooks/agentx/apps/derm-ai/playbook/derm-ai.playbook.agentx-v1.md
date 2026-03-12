---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: derm-ai.playbook.agentx-v1.md
---

# Derm AI — Medical Rules & Codes Playbook

> **Purpose:** Clinical rules and codes for dermatology encounters. Aligned with CMS, AMA CPT®, and dermatology-specific documentation requirements.

**Sources:** AMA CPT®, CMS Medicare Claims Processing Manual, American Academy of Dermatology (AAD) guidelines

---

## 1. Definition and Scope

### 1.1 Dermatology Coding

Dermatology coding covers:

- **E/M visits:** Office/outpatient 99202–99215 (same as primary care)
- **Skin procedures:** Biopsies, shave removals, excisions (benign/malignant), destruction, Mohs micrographic surgery
- **CPT range:** 11100–11646 (biopsy/excision), 17000–17286 (destruction), 17311–17315 (Mohs)
- **Documentation:** Lesion size, location, morphology, benign vs malignant, margins

### 1.2 E/M MDM Reference

E/M level selection uses **MDM or Time** (whichever supports level). **Two of three** MDM elements (Problems, Data, Risk) must meet the level. See `enm-ai.playbook.agentx-v1.md` Sections 3–3.7 for full MDM tables, Data element breakdown (Category 1/2/3), and clinical examples.

**Derm-typical levels:** Straightforward (99212) — simple rash, refill; Low (99213) — single lesion eval, acne; Moderate (99214) — multiple lesions, biopsy interpretation, medication management; High (99215) — melanoma workup, complex inflammatory disease.

### 1.3 CMS Alignment

- Lesion size determines excision code selection (e.g., 11400–11471 by size)
- Pathology required for malignant lesions; documentation must support medical necessity
- NCCI edits apply to E/M + procedure same-day (modifier 25)

---

## 2. Procedure Categories

### 2.1 Skin Biopsy

| Code | Description |
|------|-------------|
| 11102 | Tangential biopsy (shave), single lesion |
| 11103 | Tangential biopsy, each additional lesion |
| 11104 | Punch biopsy, single lesion |
| 11105 | Punch biopsy, each additional lesion |
| 11106 | Incisional biopsy, single lesion |
| 11107 | Incisional biopsy, each additional lesion |

### 2.2 Shave Removal (Tangent)

| Code | Description |
|------|-------------|
| 11300 | Shave removal, trunk/arms/legs, ≤0.5 cm |
| 11301 | Shave removal, trunk/arms/legs, 0.6–1.0 cm |
| 11302 | Shave removal, trunk/arms/legs, 1.1–2.0 cm |
| 11303 | Shave removal, trunk/arms/legs, 2.1–3.0 cm |
| 11305 | Shave removal, scalp/neck/hands/feet/genitalia, ≤0.5 cm |
| 11306 | Shave removal, scalp/neck/hands/feet/genitalia, 0.6–1.0 cm |
| 11307 | Shave removal, scalp/neck/hands/feet/genitalia, 1.1–2.0 cm |
| 11308 | Shave removal, scalp/neck/hands/feet/genitalia, 2.1–3.0 cm |
| 11310 | Shave removal, face/ears/eyelids/nose/lips/mucous membrane, ≤0.5 cm |
| 11311 | Shave removal, face/ears/eyelids/nose/lips/mucous membrane, 0.6–1.0 cm |
| 11312 | Shave removal, face/ears/eyelids/nose/lips/mucous membrane, 1.1–2.0 cm |
| 11313 | Shave removal, face/ears/eyelids/nose/lips/mucous membrane, 2.1–3.0 cm |

### 2.3 Excision — Benign (11400–11471)

| Code | Description | Size |
|------|-------------|------|
| 11400 | Excision benign, trunk/arms/legs | ≤0.5 cm |
| 11401 | Excision benign, trunk/arms/legs | 0.6–1.0 cm |
| 11402 | Excision benign, trunk/arms/legs | 1.1–2.0 cm |
| 11403 | Excision benign, trunk/arms/legs | 2.1–3.0 cm |
| 11404 | Excision benign, trunk/arms/legs | 3.1–4.0 cm |
| 11406 | Excision benign, scalp/neck/hands/feet/genitalia | ≤0.5 cm |
| 11420 | Excision benign, face/ears/eyelids/nose/lips | ≤0.5 cm |
| 11421 | Excision benign, face/ears/eyelids/nose/lips | 0.6–1.0 cm |

### 2.4 Excision — Malignant (11600–11646)

| Code | Description | Size |
|------|-------------|------|
| 11600 | Excision malignant, trunk/arms/legs | ≤0.5 cm |
| 11601 | Excision malignant, trunk/arms/legs | 0.6–1.0 cm |
| 11602 | Excision malignant, trunk/arms/legs | 1.1–2.0 cm |
| 11603 | Excision malignant, trunk/arms/legs | 2.1–3.0 cm |
| 11604 | Excision malignant, trunk/arms/legs | 3.1–4.0 cm |
| 11606 | Excision malignant, scalp/neck/hands/feet/genitalia | ≤0.5 cm |
| 11620 | Excision malignant, face/ears/eyelids/nose/lips | ≤0.5 cm |
| 11621 | Excision malignant, face/ears/eyelids/nose/lips | 0.6–1.0 cm |

### 2.5 Destruction (17000–17286)

| Code | Description |
|------|-------------|
| 17000 | Destruction, premalignant (e.g., actinic keratosis), first lesion |
| 17003 | Destruction, premalignant, second through 14th lesions |
| 17004 | Destruction, premalignant, 15+ lesions |
| 17110 | Destruction, flat warts, molluscum, milia; up to 14 lesions |
| 17111 | Destruction, flat warts, molluscum, milia; 15+ lesions |
| 17250 | Chemical cautery, benign lesion |
| 17260 | Cryosurgery, malignant lesion; ≤0.5 cm |
| 17261 | Cryosurgery, malignant lesion; 0.6–1.0 cm |
| 17262 | Cryosurgery, malignant lesion; 1.1–2.0 cm |
| 17263 | Cryosurgery, malignant lesion; 2.1–3.0 cm |
| 17280 | Electrosurgery, malignant lesion; ≤0.5 cm |
| 17281 | Electrosurgery, malignant lesion; 0.6–1.0 cm |
| 17282 | Electrosurgery, malignant lesion; 1.1–2.0 cm |
| 17283 | Electrosurgery, malignant lesion; 2.1–3.0 cm |

### 2.6 Mohs Micrographic Surgery (17311–17315)

| Code | Description |
|------|-------------|
| 17311 | Mohs, first stage, up to 5 blocks |
| 17312 | Mohs, second stage, up to 5 blocks |
| 17313 | Mohs, third stage, up to 5 blocks |
| 17314 | Mohs, fourth stage, up to 5 blocks |
| 17315 | Mohs, fifth stage, up to 5 blocks |

### 2.7 Phototherapy / Photodynamic

| Code | Description |
|------|-------------|
| 96567 | Photodynamic therapy, per session |
| 96912 | Photochemotherapy, UVB |
| 96913 | Photochemotherapy, PUVA |

---

## 3. ICD-10 Codes — Dermatology

### 3.1 Acne

| Code | Description |
|------|-------------|
| L70.0 | Acne vulgaris |
| L70.1 | Acne conglobata |
| L70.2 | Acne varioliformis |
| L70.8 | Other acne |

### 3.2 Dermatitis / Eczema

| Code | Description |
|------|-------------|
| L20.9 | Atopic dermatitis, unspecified |
| L23.9 | Allergic contact dermatitis, unspecified |
| L24.9 | Irritant contact dermatitis, unspecified |
| L25.9 | Unspecified contact dermatitis |
| L21.9 | Seborrheic dermatitis, unspecified |
| L30.9 | Dermatitis, unspecified |

### 3.3 Psoriasis

| Code | Description |
|------|-------------|
| L40.0 | Psoriasis vulgaris |
| L40.9 | Psoriasis, unspecified |
| L40.50 | Arthropathic psoriasis, unspecified |

### 3.4 Premalignant / Actinic

| Code | Description |
|------|-------------|
| L57.0 | Actinic keratosis |
| L57.1 | Actinic reticuloid |
| L82.1 | Inflamed seborrheic keratosis |

### 3.5 Benign Lesions

| Code | Description |
|------|-------------|
| L82.0 | Irritated seborrheic keratosis |
| L82.1 | Inflamed seborrheic keratosis |
| D23.9 | Other benign neoplasm of skin, unspecified |
| L91.8 | Other hypertrophic disorders of skin (skin tags) |
| L72.0 | Epidermal cyst |
| L72.1 | Trichilemmal cyst |

### 3.6 Malignant — Basal Cell Carcinoma (BCC)

| Code | Description |
|------|-------------|
| C44.31 | BCC of skin of nose |
| C44.41 | BCC of skin of scalp |
| C44.51 | BCC of skin of trunk |
| C44.61 | BCC of skin of upper limb |
| C44.71 | BCC of skin of lower limb |
| C44.90 | BCC of skin, unspecified |

### 3.7 Malignant — Squamous Cell Carcinoma (SCC)

| Code | Description |
|------|-------------|
| C44.32 | SCC of skin of nose |
| C44.42 | SCC of skin of scalp |
| C44.52 | SCC of skin of trunk |
| C44.62 | SCC of skin of upper limb |
| C44.72 | SCC of skin of lower limb |
| C44.92 | SCC of skin, unspecified |

### 3.8 Malignant — Melanoma

| Code | Description |
|------|-------------|
| C43.30 | Malignant melanoma of unspecified part of face |
| C43.31 | Malignant melanoma of nose |
| C43.51 | Malignant melanoma of trunk |
| C43.61 | Malignant melanoma of right upper limb |
| C43.71 | Malignant melanoma of right lower limb |

### 3.9 Other Common

| Code | Description |
|------|-------------|
| L98.1 | Dermatitis factitia |
| L29.9 | Pruritus, unspecified |
| L98.8 | Other specified disorders of skin |
| B07.0 | Plantar wart |
| B07.8 | Other viral warts |

---

## 4. Documentation Requirements

### 4.1 Required for All Procedures

- **Lesion location:** Anatomic site (trunk, face, scalp, etc.)
- **Lesion size:** Greatest diameter in cm (determines code selection)
- **Clinical description:** Morphology (e.g., raised, pigmented, ulcerated)
- **Diagnosis:** Benign vs malignant (or suspected)
- **Procedure note:** Method, anesthesia, closure

### 4.2 Excision-Specific

- **Size:** Measure lesion before excision; report excised diameter (includes margins)
- **Margins:** Document margin width when clinically relevant
- **Pathology:** Malignant lesions require pathology; document pending if sent

### 4.3 Destruction-Specific

- **Lesion count:** For 17000–17004, 17110–17111: document number of lesions
- **Method:** Cryo, electrosurgery, chemical, laser

### 4.4 Mohs-Specific

- **Stage/block count:** Document stages and blocks per stage
- **Diagnosis:** BCC, SCC, or other indicated malignancy

---

## 5. NCCI and Modifier Rules

### 5.1 Same-Day E/M + Procedure

- **Modifier 25:** E/M separately identifiable from procedure
- Document distinct E/M service (e.g., full skin exam, new problem discussion)

### 5.2 Multiple Lesions

- **Modifier 59 / XE:** Distinct procedural service when same procedure on different lesions
- Or use add-on codes (11103, 11105, 11107) for additional biopsies

### 5.3 Bilateral / Multiple Sites

- Report each lesion separately with appropriate modifiers per payer

### 5.4 Repeat Procedure

- **Modifier 76:** Repeat procedure by same physician
- **Modifier 77:** Repeat procedure by different physician

---

## 6. Place of Service

| POS | Description |
|-----|-------------|
| 11 | Office |
| 22 | Outpatient hospital |
| 24 | Ambulatory surgical center (ASC) |

---

## 7. Coding Engine Specialty

- **Specialty:** `DERMATOLOGY`
- Coding engine supports DERMATOLOGY; use when calling `/process` or `/process-pdf`
- Use `specialty="DERMATOLOGY"` for dermatology-specific code extraction

---

## 8. Chart Validity — Dermatology Signals

A document is a **valid dermatology encounter** when it contains ≥2 of:

- Lesion location (anatomic site)
- Lesion size (greatest diameter in cm)
- Clinical description (morphology, benign vs malignant)
- Procedure note (method, anesthesia, closure)
- Diagnosis (ICD-10) supporting procedure

**Reject** if: no lesion documentation, no procedure when CPT suggests procedure, or non-dermatology content.

---

## 9. Contradiction Detection

**Flag** when:

- Lesion size does not match CPT code range (e.g., 1.2 cm lesion with 11400 which requires ≤0.5 cm)
- Benign excision code (11400–11471) with malignant diagnosis (C43, C44)
- Malignant excision code (11600–11646) with benign-only diagnosis
- Modifier 25 missing when E/M and procedure billed same day and E/M is separately identifiable
- Destruction lesion count (17003, 17004, 17110, 17111) not documented

---

**END OF PLAYBOOK**

*Aligned with AMA CPT®, CMS, and AAD guidelines. Verify payer-specific policies.*
