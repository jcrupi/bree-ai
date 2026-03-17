# Coding AI — Multi-Specialty Support AgentX

> **Purpose:** Specifies how coding.ai (coding-ai) must extend to support EM, Derm, Pain, and Urgent specialties. Use as an implementation specification for coding-ai changes.

**Related:**
- `apps/coding-ai/` — Coding engine codebase
- `apps/playbook-ai/agentx/specialty-backend-generation.agentx.md` — Backend generation and rules
- `apps/playbook-ai/agentx/icd-cpt-mappings-multi-specialty.agentx.md` — ICD/CPT mappings for Pain, Derm, EM, Emergency
- `apps/enm-ai/`, `apps/derm-ai/`, `apps/pain-ai/`, `apps/urgent-ai/` — Playbook.ai specialty apps

---

## 1. Overview

The coding-ai is an AI-powered medical coding system that:
- Accepts medical record text or PDF
- Predicts ICD-10 and CPT codes filtered by **specialty**
- Validates against NCCI, LCD, NCD, CMS rules
- Returns codes with confidence scores and validation results

**Current specialties:** WOUNDCARE, SNFS, GENERAL (and others in allowed list)

**Target specialties:** Add full support for **EM** (E/M), **DERMATOLOGY** (Derm), **PAIN**, **URGENT** (urgent care / emergency)

---

## 2. Architecture: How Specialty Filtering Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CODING ENGINE PROCESSING PIPELINE                                                │
└─────────────────────────────────────────────────────────────────────────────────┘

  POST /process  { medical_record, specialty, provider_npi }
  POST /process-pdf  { file, specialty?, provider_npi }
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. SPECIALTY RESOLUTION                                                           │
│    • If specialty provided: use as-is (validated against allowed_specialties)    │
│    • If not provided (/process-pdf): SpecialtyDetector auto-detects from content  │
│    • specialty_detection_data: keywords → specialty mapping                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. TEXT PROCESSING                                                                │
│    • Chunking (4K tokens), summarization for long docs                             │
│    • NER, ClinicalBERT, Longformer models → raw predictions                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. CODE MAPPING & FILTERING                                                       │
│    • icd_mappings: WHERE specialty = :specialty (or compatible)                  │
│    • cpt_mappings: WHERE specialty = :specialty (or compatible)                   │
│    • Custom generators (fallback when model confidence < 0.7) use same filter     │
│    • Result: ONLY codes for the requested specialty are returned                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. VALIDATION & RESPONSE                                                          │
│    • NCCI, LCD, NCD, CMS validation                                               │
│    • Return: icd_codes[], cpt_codes[], modifiers[], validation                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key tables:**
- `icd_mappings` — (icd_code, description, category, **specialty**, keywords, severity, is_common)
- `cpt_mappings` — (cpt_code, description, category, **specialty**, keywords, typical_setting, is_common)
- `specialty_detection_data` — (specialty, keywords, sample_icds, sample_cpts, context_phrases)
- `woundcare_datasets` / `snfs_datasets` — specialty-specific training/example datasets

---

## 3. Current State vs Target State

### 3.1 Specialty Support Matrix

| Specialty | Allowed | ICD Mappings | CPT Mappings | Datasets | Auto-Detect |
|-----------|---------|--------------|--------------|----------|-------------|
| WOUNDCARE | ✅ | ✅ 150+ | ✅ | woundcare_datasets (50) | ✅ |
| SNFS | ✅ | ✅ 200+ | ✅ | snfs_datasets (50) | ✅ |
| GENERAL | ✅ | ✅ | ✅ | — | ✅ (default) |
| PAIN | ❌ Not in list | ✅ 103 | ✅ 104 | — | ❌ |
| DERMATOLOGY | ✅ | ⚠️ Sparse | ⚠️ Sparse | ❌ | ❌ |
| EMERGENCY | ✅ | ⚠️ Sparse | ⚠️ Sparse | ❌ | ❌ |
| EM | ❌ | Use GENERAL | Use GENERAL | ❌ | ❌ |

### 3.2 Playbook.ai → Coding Engine Mapping

| Playbook.ai App | Coding Engine Specialty | Primary Codes |
|-----------------|-------------------------|---------------|
| enm-ai | GENERAL (or SNFS for nursing facility) | 99202–99205, 99211–99215, 99281–99285, etc. |
| derm-ai | DERMATOLOGY | 11100–11646, 17000–17286, 17311–17315, E/M |
| pain-ai | PAIN | 64479–64495, 62310–62323, 64633–64636, M54.x |
| urgent-ai | EMERGENCY (or URGENT) | 99281–99285, 12001–12007, 29125–29126, S00–T14 |

---

## 4. Extension Requirements

### 4.1 Add PAIN to Allowed Specialties

**File:** `apps/coding-ai/main.py`

**Change 1:** `MedicalRecordRequest.validate_specialty` (line ~117)

```python
allowed = ['SNFS', 'WOUNDCARE', 'GENERAL', 'CARDIOLOGY', 'ORTHOPEDICS',
           'NEUROLOGY', 'DERMATOLOGY', 'GASTROENTEROLOGY', 'PULMONARY',
           'NEPHROLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY', 'PSYCHIATRY',
           'PEDIATRICS', 'GERIATRICS', 'EMERGENCY', 'SURGERY',
           'PAIN']  # ADD
```

**Change 2:** `process_pdf` allowed_specialties (line ~757)

```python
allowed_specialties = ['SNFS', 'WOUNDCARE', 'GENERAL', 'CARDIOLOGY', 'ORTHOPEDICS',
                      'NEUROLOGY', 'DERMATOLOGY', 'GASTROENTEROLOGY', 'PULMONARY',
                      'NEPHROLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY', 'PSYCHIATRY',
                      'PEDIATRICS', 'GERIATRICS', 'EMERGENCY', 'SURGERY',
                      'PAIN']  # ADD
```

**Change 3:** Auto-detect for PAIN in `/process-pdf` (line ~740)

```python
pain_keywords = ["low back pain", "cervicalgia", "radiculopathy", "sciatica", 
                 "spinal stenosis", "facet", "epidural", "pain management"]
pain_score = sum(1 for k in pain_keywords if k in text_lower)
# Add pain_score to detection logic; if pain_score > threshold → specialty = "PAIN"
```

---

### 4.2 Dermatology Data Loader

**New file:** `apps/coding-ai/data_loaders/dermatology_loader.py`

**Purpose:** Populate `icd_mappings` and `cpt_mappings` with `specialty='DERMATOLOGY'`

**ICD-10 (from derm-ai.playbook.agentx.md):**
- L00–L99 (skin conditions): L20.9 (eczema), L40.9 (psoriasis), L70.0 (acne), L30.9 (dermatitis), C43.x (melanoma), etc.
- Keywords: rash, eczema, psoriasis, melanoma, biopsy, excision, skin lesion, acne, dermatitis, BCC, SCC

**CPT (from derm-ai.playbook.agentx.md):**
- Biopsy: 11102–11107
- Shave: 11300–11313
- Excision benign: 11400–11471
- Excision malignant: 11600–11646
- Destruction: 17000–17286
- Mohs: 17311–17315
- E/M: 99202–99215

**Implementation pattern:**

```python
class DermatologyDataLoader:
    def __init__(self, db_manager):
        self.db = db_manager

    def load_datasets(self):
        icd_codes = self._get_dermatology_icd_codes()
        cpt_codes = self._get_dermatology_cpt_codes()
        # INSERT INTO icd_mappings ... ON CONFLICT DO UPDATE
        # INSERT INTO cpt_mappings ... ON CONFLICT (cpt_code) DO UPDATE
```

**Registration:** In `main.py` init, add check for DERMATOLOGY in icd_mappings/cpt_mappings; if count low, run dermatology_loader.

---

### 4.3 E/M (EM) Data Loader

**New file:** `apps/coding-ai/data_loaders/em_loader.py`

**Purpose:** Ensure GENERAL has robust E/M code coverage. Option A: Add `em_datasets` (50 E/M scenarios). Option B: Enrich `icd_mappings`/`cpt_mappings` with GENERAL + E/M-specific keywords.

**E/M CPT (from enm-ai.playbook.agentx.md):**
- Office: 99202–99205 (new), 99211–99215 (established)
- ED: 99281–99285
- Nursing facility: 99304–99310
- Home: 99341–99350
- Consultations: 99242–99245

**ICD-10:** General medicine (I10, E11.9, J44.9, M54.5, etc.) — often already in GENERAL.

**Implementation:** Create `em_datasets` table (like snfs_datasets) with 50 E/M encounter scenarios: medical_record, expected_icds, expected_cpts, record_type (OFFICE_EM, ED_EM, NURSING_FACILITY, etc.).

---

### 4.4 Urgent Care / Emergency Data Loader

**New file:** `apps/coding-ai/data_loaders/urgent_loader.py`

**Purpose:** Populate `icd_mappings` and `cpt_mappings` with `specialty='EMERGENCY'` (or add `URGENT` as alias).

**CPT:**
- ED E/M: 99281–99285
- Laceration repair: 12001–12007, 13100–13153
- Splinting: 29125–29126, 29240–29280
- Minor procedures: 10060 (I&D), 11012 (debridement), etc.

**ICD-10:**
- Injury: S00–T14 (laceration, fracture, sprain)
- Acute: R10.9 (abdominal pain), R07.9 (chest pain), J06.9 (URI), etc.

**Implementation:** Same pattern as dermatology_loader — INSERT into icd_mappings/cpt_mappings with specialty='EMERGENCY'.

**Optional:** Add `URGENT` to allowed_specialties and map it to same data as EMERGENCY (or slight variant for urgent-care-specific codes).

---

### 4.5 Specialty Detection Patterns

**File:** `apps/coding-ai/data_loaders/specialty_detection_data_loader.py`

**Add rows to `specialty_detection_data`:**

| Specialty | Keywords | Sample ICDs | Sample CPTs | Context |
|-----------|----------|-------------|------------|---------|
| DERMATOLOGY | rash, eczema, psoriasis, melanoma, biopsy, excision, skin lesion, acne, dermatitis, BCC, SCC, shave, punch | L20.9,L40.9,C43.9,L70.0,L30.9 | 11100,11101,11600,17000,10060 | dermatology, skin clinic |
| PAIN | low back pain, cervicalgia, radiculopathy, sciatica, spinal stenosis, pain management, epidural, facet, medial branch, RFA | M54.5,M54.2,M54.16,M54.30,M48.06 | 64483,64484,64490,64491,64493 | pain clinic, spine center |
| EMERGENCY | urgent care, emergency, laceration, fracture, acute, trauma, ED, sutures, splint | S01.90XA,S72.001A,R10.9 | 99281,99282,99283,99284,99285,12001 | urgent care, ED, emergency |
| GENERAL (E/M) | office visit, established patient, new patient, MDM, complexity, level 3, level 4 | I10,E11.9,J44.9,M54.5 | 99213,99214,99203,99204 | primary care, office |

---

## 5. Implementation Checklist

### Phase 1: PAIN (Minimal — Already Has Loaders)

| Task | File | Action |
|------|------|--------|
| Add PAIN to allowed_specialties | main.py | MedicalRecordRequest + process-pdf |
| Add PAIN auto-detect | main.py | process-pdf logic |
| Verify pain loaders run | main.py | Already registered; confirm PAIN in allowed |

### Phase 2: DERMATOLOGY

| Task | File | Action |
|------|------|--------|
| Create dermatology_loader.py | data_loaders/ | ICD + CPT for DERMATOLOGY |
| Register loader | main.py | Check icd_mappings/cpt_mappings for DERMATOLOGY; run if missing |
| Add dermatology detection | specialty_detection_data_loader.py | New rows |
| Add derm_datasets (optional) | dermatology_loader.py | 50 training scenarios |

### Phase 3: E/M (GENERAL Enhancement)

| Task | File | Action |
|------|------|--------|
| Create em_loader.py | data_loaders/ | em_datasets or enrich GENERAL mappings |
| Add E/M detection | specialty_detection_data_loader.py | GENERAL/E/M keywords |
| Optional: EM alias | main.py | EM → GENERAL in allowed_specialties |

### Phase 4: URGENT / EMERGENCY

| Task | File | Action |
|------|------|--------|
| Create urgent_loader.py | data_loaders/ | ICD + CPT for EMERGENCY |
| Register loader | main.py | Check and run if missing |
| Add emergency detection | specialty_detection_data_loader.py | New rows |
| Optional: URGENT alias | main.py | URGENT → EMERGENCY or separate |

---

## 6. Data Loader Template

```python
# data_loaders/dermatology_loader.py
"""
Dermatology Data Loader - ICD-10 and CPT codes for dermatology
"""

import logging
from database.db_manager import DatabaseManager

logger = logging.getLogger(__name__)

class DermatologyDataLoader:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def load_datasets(self):
        icd_codes = self._get_icd_codes()
        cpt_codes = self._get_cpt_codes()

        query_icd = """
            INSERT INTO icd_mappings 
            (icd_code, description, category, specialty, keywords, severity, is_common)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (icd_code) DO UPDATE SET
                description = EXCLUDED.description,
                specialty = EXCLUDED.specialty,
                keywords = EXCLUDED.keywords
        """
        self.db.execute_many(query_icd, [(c['code'], c['description'], c['category'], 
                                          'DERMATOLOGY', c['keywords'], c.get('severity','Medium'), 1) for c in icd_codes])

        query_cpt = """
            INSERT INTO cpt_mappings 
            (cpt_code, description, category, specialty, keywords, typical_setting, is_common)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (cpt_code) DO UPDATE SET
                description = EXCLUDED.description,
                specialty = EXCLUDED.specialty,
                keywords = EXCLUDED.keywords
        """
        self.db.execute_many(query_cpt, [(c['code'], c['description'], c['category'], 
                                          'DERMATOLOGY', c['keywords'], 'Office', 1) for c in cpt_codes])

        logger.info(f"✓ Loaded {len(icd_codes)} dermatology ICD codes, {len(cpt_codes)} CPT codes")

    def _get_icd_codes(self): ...
    def _get_cpt_codes(self): ...
```

---

## 7. Backend Integration (Calling Apps)

Each Playbook.ai specialty backend must pass the correct `specialty` when calling the coding-ai:

| App | CodingService Call |
|-----|-------------------|
| wound-ai | `extract_codes(medical_record, specialty="WOUNDCARE")` |
| enm-ai | `extract_codes(medical_record, specialty="GENERAL")` |
| derm-ai | `extract_codes(medical_record, specialty="DERMATOLOGY")` |
| pain-ai | `extract_codes(medical_record, specialty="PAIN")` |
| urgent-ai | `extract_codes(medical_record, specialty="EMERGENCY")` |

---

## 8. Summary

| Specialty | Allowed | Loader | Detection | Status |
|-----------|---------|--------|-----------|--------|
| PAIN | Add | ✅ Exists | Add | Phase 1 |
| DERMATOLOGY | ✅ | Create | Add | Phase 2 |
| GENERAL (E/M) | ✅ | Enhance | Add | Phase 3 |
| EMERGENCY/URGENT | ✅ | Create | Add | Phase 4 |

---

**END OF CODING ENGINE MULTI-SPECIALTY SUPPORT AGENTX**
