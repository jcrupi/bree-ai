---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: wound-ai.algos.agentx-v1.md
---

# Wound AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for wound assessment, staging validation, compliance checking, and remediation. Aligned with NPUAP, CMS LCD/NCD, and wound care documentation standards.

**Use by AI:** Implementable logic for document_parser, staging_validation_service, wound_coder, and validation engines.

**Traceability:** Each section includes a **Code impact** line pointing to the implementation files. Section 8 table lists all algorithm → file mappings. Code comments reference back here via `agentx/playbook/wound-ai.algos.agentx-v1.md#<section>`. See `playbook-to-code-mapping.agentx.md` for the bidirectional linkage guide.

---

## 1. Overview

Wound AI validation follows a **deterministic sequence**. Given the same document, policy, and rule version, the system produces the same findings in the same order.

**Key components:**
- Document parser (regex-based extraction)
- Staging validation (prioritize documented stage over AI)
- Coding engine (coding.ai API)
- Wound coder (stage + location → ICD-10)

---

## 2. Staging Detection & Reconciliation Algorithm

### 2.1 Document Parser — Stage Extraction (STAGE.PARSE.001)

```
ALGORITHM: ParseWoundTypeAndSeverity
INPUT: text (wound block)

OUTPUT: (wound_type, severity)

PSEUDOCODE:
─────────────────────────────────────────
1. text_lower = text.lower()
2. patterns = [
     ("stage iv pressure", "pressure_ulcer_stage_4", "severe"),
     ("stage 4 pressure", "pressure_ulcer_stage_4", "severe"),
     ("pressure ulcer stage 4", "pressure_ulcer_stage_4", "severe"),
     ("pressure injury stage 4", "pressure_ulcer_stage_4", "severe"),
     ("stage 3 pressure", "pressure_ulcer_stage_3", "moderate"),
     ("stage 2 pressure", "pressure_ulcer_stage_2", "moderate"),
     ("stage 1 pressure", "pressure_ulcer_stage_1", "mild"),
     ("unstageable pressure", "pressure_ulcer_unstageable", "severe"),
     ("deep tissue injury", "pressure_ulcer_unstageable", "severe"),
     ("venous stasis ulcer", "venous_stasis_ulcer", "moderate"),
     ("diabetic foot ulcer", "diabetic_foot_ulcer", "moderate"),
     ...
   ]
3. FOR each (pattern, wound_type, severity) IN patterns:
     IF re.search(pattern, text_lower):
       RETURN (wound_type, severity)
4. IF "pressure" in text_lower:
     RETURN ("pressure_ulcer_unstageable", "moderate")  # Do NOT default to Stage 2
5. RETURN ("pressure_ulcer_unstageable", "moderate")
```

**Code impact:** `services/document_parser.py` — `STAGE_PATTERNS`, `_parse_wound_type_and_severity()`.

### 2.2 Staging Reconciliation (STAGE.RECON.010)

```
ALGORITHM: ReconcileICDWithDocumentedStage
INPUT:
  wound_type (from document parser, e.g. pressure_ulcer_stage_4)
  location (from document parser, e.g. sacrum)
  ai_icd_codes (from coding engine)

OUTPUT: icd_codes (final list)

PSEUDOCODE:
─────────────────────────────────────────
1. documented_stage = _extract_stage_from_wound_type(wound_type)
   # pressure_ulcer_stage_4 → 4, pressure_ulcer_stage_2 → 2, etc.

2. IF documented_stage == null:
   RETURN ai_icd_codes  # Non-pressure or unknown; use AI

3. ai_stages = [extract_stage_from_icd(c) for c in ai_icd_codes]
   # L89.152 → 2, L89.154 → 4, L89.130 → 0 (unstageable)

4. has_conflict = false
   IF any ai_stage in (1,2,3,4):
     max_ai = max(ai_stages where stage in 1-4)
     IF max_ai != documented_stage:
       has_conflict = true
       LOG "Staging conflict: documented=Stage {documented}, AI=Stage {max_ai}. Prioritizing documented."

5. IF has_conflict OR no pressure ulcer in ai_icd_codes:
   wound_coder = WoundCoder()
   codes = wound_coder.generate_icd10_codes(wound_type, location)
   RETURN [c["code"] for c in codes]

6. RETURN ai_icd_codes
```

**Code impact:** `services/staging_validation_service.py` — `reconcile_icd_with_documented_stage()`.

### 2.3 Wound Coder — Stage + Location → ICD (STAGE.CODE.020)

```
ALGORITHM: GenerateICD10FromStageAndLocation
INPUT: wound_type, location

OUTPUT: [icd_code]

MAPPING:
  pressure_ulcer_stage_1: [L89.151, L89.211, L89.101]  # sacrum, hip, other
  pressure_ulcer_stage_2: [L89.152, L89.212, L89.102]
  pressure_ulcer_stage_3: [L89.153, L89.213, L89.103]
  pressure_ulcer_stage_4: [L89.154, L89.214, L89.104]
  pressure_ulcer_unstageable: [L89.130, L89.310, L89.810]

LOCATION_INDEX:
  sacrum, sacral, coccyx, midline → 0
  hip, trochanter → 1
  else → 2

RETURN mapping[wound_type][location_index]
```

**Code impact:** `systems/coding/wound_coder.py` — `ICD10_MAPPINGS`, `generate_icd10_codes()`, `_location_to_index()`.

---

## 3. Validation Orchestrator Flow

```
                    ENCOUNTER / CHART INPUT
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 1. Document Parser          │
              │    Parse wound blocks        │
              │    Extract: stage, location, │
              │    size, pain, recommendations│
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 2. Coding Engine (coding.ai) │
              │    AI predicts ICD/CPT       │
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 3. Staging Reconciliation    │
              │    (STAGE.RECON.010)         │
              │    Prioritize documented     │
              │    stage over AI prediction  │
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 4. Universal Gates           │
              │    (MR.ID.001, WND.MEAS.010) │
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 5. Etiology-Specific Gates  │
              │    DFU offloading, VLU comp  │
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 6. Contradiction Engine      │
              │    (INF.300, INF.310)        │
              └──────────────┬──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ 7. Utilization / Wastage    │
              │    (UTIL.500, BILL.600)      │
              └──────────────┬──────────────┘
                            │
                            ▼
                    VALIDATION COMPLETE
```

**Code impact:** `validation/orchestrator.py` — `ValidationOrchestrator.validate()`.

---

## 4. Universal Gates

### 4.1 Encounter Integrity (MR.ID.001)

- Required fields: date_of_service, rendering_clinician_id, place_of_service, patient_id
- Laterality consistency between wound and procedures
- Signature status

**Code impact:** `validation/engines/encounter_integrity.py` — `EncounterIntegrityGate.evaluate()`.

### 4.2 Serial Measurement Integrity (WND.MEAS.010)

- Required: length_cm, width_cm, depth_cm, measurement_timestamp
- Area = length × width (rounded to 2 decimals)
- Area cannot be zero
- Static dimensions: flag identical measurements to prior visit
- Trend: no improvement over ≥3 visits → document rationale

**Code impact:** `validation/engines/measurement_integrity.py` — `SerialMeasurementGate.evaluate()`.

---

## 5. Contradiction Engine (INF.300)

**Infection contradiction:** Note claims "no active infection" but ≥2 of:

- Culture ordered
- Antibiotics active
- Fever >38.5°C
- Cellulitis noted
- Purulent drainage
- "Antibiotics started" in narrative

**Osteomyelitis (DFU):** Note claims "no active OM" but evidence: imaging with OM, bone involvement, exposed bone

**Code impact:** `validation/engines/contradiction_engine.py` — `ContradictionEngine.evaluate()`.

---

## 6. Utilization Engine (UTIL.500)

- Spacing: min days between applications (policy-defined)
- Episode limit: max applications per episode
- Continued use: objective improvement required after threshold

**Code impact:** `validation/engines/utilization_engine.py` — `UtilizationEngine.evaluate()`.

---

## 7. Wastage Engine (BILL.600)

- used = min(wound_area, prepared_size)
- discarded = prepared_size - used
- JW modifier when discarded > 0

**Code impact:** `validation/engines/wastage_engine.py` — `WastageEngine.evaluate()`.

---

## 8. Implementation Files

| Algorithm | File | Key symbols |
|-----------|------|-------------|
| STAGE.PARSE.001 | `services/document_parser.py` | `STAGE_PATTERNS`, `_parse_wound_type_and_severity()` |
| STAGE.RECON.010 | `services/staging_validation_service.py` | `reconcile_icd_with_documented_stage()` |
| STAGE.CODE.020 | `systems/coding/wound_coder.py` | `ICD10_MAPPINGS`, `generate_icd10_codes()`, `_location_to_index()` |
| MR.ID.001 | `validation/engines/encounter_integrity.py` | `EncounterIntegrityGate.evaluate()` |
| WND.MEAS.010 | `validation/engines/measurement_integrity.py` | `SerialMeasurementGate.evaluate()` |
| INF.300 | `validation/engines/contradiction_engine.py` | `ContradictionEngine.evaluate()` |
| DFU.SOC.100 | `validation/engines/dfu_soc_offloading.py` | `DFUSocOffloadingGate.evaluate()` |
| VLU.SOC.100 | `validation/engines/vlu_compression_gate.py` | `VLUCompressionGate.evaluate()` |
| PERF.010 | `validation/engines/perfusion_gate.py` | `PerfusionGate.evaluate()` |
| UTIL.500 | `validation/engines/utilization_engine.py` | `UtilizationEngine.evaluate()` |
| BILL.600 | `validation/engines/wastage_engine.py` | `WastageEngine.evaluate()` |

---

**END OF ALGORITHMS**

*See wound-ai.playbook.agentx-v1.md for clinical rules and code tables. Deterministic validation. Same inputs → same outputs.*
