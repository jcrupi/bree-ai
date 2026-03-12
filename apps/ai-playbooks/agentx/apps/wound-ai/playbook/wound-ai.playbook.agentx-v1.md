---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: wound-ai.playbook.agentx-v1.md
---

# Wound AI — Medical Rules & Codes Playbook

> **Purpose:** Clinical rules and codes for processing wound charts. Use when extracting, validating, or coding wound care documentation.

**Sources:** NPUAP staging, CMS LCD/NCD, AMA CPT®, ICD-10-CM

**Related:** `wound-ai.algos.agentx-v1.md` — validation algorithms, staging reconciliation, implementation details

**Traceability:** Each section includes a **Code impact** line pointing to the implementation files. Code comments reference back here via `agentx/playbook/wound-ai.playbook.agentx-v1.md#<section>`. See `playbook-to-code-mapping.agentx.md` for the bidirectional linkage guide.

---

## 1. Wound Types Supported

| Type | Description |
|------|-------------|
| Pressure ulcer (Stage 1–4) | NPUAP staging; tissue loss from pressure |
| Pressure ulcer (unstageable) | Base obscured by slough/eschar; deep tissue injury |
| Diabetic foot ulcer (DFU) | Ulcer on foot in diabetic patient |
| Venous stasis ulcer (VLU) | Lower extremity venous insufficiency |
| Arterial ulcer | Ischemic wound from peripheral artery disease |
| Surgical wound | Post-operative wound |
| Traumatic wound | Injury-related |
| Burn (1st, 2nd, 3rd degree) | Thermal injury |

---

## 2. Pressure Ulcer Staging (NPUAP)

| Stage | Description | Severity |
|-------|-------------|----------|
| Stage 1 | Non-blanchable erythema intact skin | Mild |
| Stage 2 | Partial-thickness skin loss; blister or shallow open ulcer | Mild |
| Stage 3 | Full-thickness skin loss; subcutaneous fat visible | Moderate |
| Stage 4 | Full-thickness tissue loss; bone, tendon, muscle exposed | Severe |
| Unstageable | Base obscured by slough or eschar | Severe |

---

## 3. Staging Detection & Validation (Priority Rule)

**Rule:** Explicitly documented stage in clinical documentation **MUST** take precedence over AI-inferred stage.

### 3.1 Document Phrasing Patterns

Extract stage from these patterns (case-insensitive):

| Pattern | Stage |
|---------|-------|
| Stage 4, Stage IV, pressure ulcer stage 4, pressure injury stage 4 | Stage 4 |
| Stage 3, Stage III, pressure ulcer stage 3, pressure injury stage 3 | Stage 3 |
| Stage 2, Stage II, pressure ulcer stage 2, pressure injury stage 2 | Stage 2 |
| Stage 1, Stage I, pressure ulcer stage 1, pressure injury stage 1 | Stage 1 |
| Unstageable, deep tissue injury | Unstageable |

### 3.2 Validation Logic

1. **Document parser** extracts wound_type (e.g. `pressure_ulcer_stage_4`) from chart text via regex.
2. **Coding engine** (AI) predicts ICD-10 codes from full medical record.
3. **Reconciliation:** When document parser finds explicit stage (1–4) and AI prediction differs:
   - **Override** AI-predicted ICD with stage-appropriate ICD from wound_coder.
   - Use location (sacrum, hip, etc.) to select correct ICD variant.

### 3.3 Do NOT Default to Stage 2

- When stage cannot be determined from documentation → use `pressure_ulcer_unstageable`.
- Never infer Stage 2 when documentation is ambiguous.

**Code impact:** `services/document_parser.py` — `STAGE_PATTERNS`, `_parse_wound_type_and_severity()`; `services/staging_validation_service.py` — `reconcile_icd_with_documented_stage()`; `systems/coding/wound_coder.py` — `ICD10_MAPPINGS`, `generate_icd10_codes()`.

---

## 4. Severity Classification

| Severity | Use When |
|----------|----------|
| Mild | Stage 1–2 pressure ulcer; minimal tissue loss |
| Moderate | Stage 3 ulcer; venous ulcer; diabetic foot ulcer; moderate tissue loss |
| Severe | Stage 4; unstageable; full-thickness; bone involvement |

---

## 5. Anatomical Locations

### Standard locations (for coding and normalization)

| Raw / Chart Term | Normalized |
|------------------|------------|
| Sacrum, sacral, coccyx, midline | sacrum |
| Right greater trochanter, trochanteric | hip_right |
| Left greater trochanter | hip_left |
| Right heel, heel (R) | heel_right |
| Left heel, heel (L) | heel_left |
| Right ankle, right lateral malleolus | ankle_right |
| Left ankle, left lateral malleolus | ankle_left |
| Buttock, gluteal | buttock |
| Left lower leg | left_lower_leg |
| Right lower leg | right_lower_leg |
| Foot, toe, metatarsal | foot |
| Shoulder | shoulder |
| Back, spine | back |
| Elbow (right/left) | elbow_right / elbow_left |

**Code impact:** `services/document_parser.py` — `_normalize_location()`; `systems/coding/wound_coder.py` — `_location_to_index()`.

---

## 6. Measurement Rules

### Required fields

- **Length** (cm): longest dimension
- **Width** (cm): perpendicular to length
- **Depth** (cm): when documented

### Area calculation

- Area (cm²) = length × width, rounded to 2 decimals
- Area cannot be zero; if computed zero, document must be corrected

### Units

- All measurements in **centimeters** (cm)
- Convert if other units explicitly stated (e.g., inches)

### Static dimensions

- If length, width, and depth are identical to prior visit: flag for clinician confirmation
- Document: "Measurements identical to prior visit; confirm re-measurement or note lack of change"

### Trend

- If wound shows no improvement or worsening over ≥3 visits: document clinical rationale for continued therapy

**Code impact:** `validation/engines/measurement_integrity.py` — `SerialMeasurementGate.evaluate()` (depth optional per "when documented").

---

## 7. ICD-10 Codes

### Pressure ulcers (by stage and location)

| Stage | Sacrum | Hip | Other |
|-------|--------|-----|-------|
| Stage 1 | L89.151 | L89.211 | L89.101 |
| Stage 2 | L89.152 | L89.212 | L89.102 |
| Stage 3 | L89.153 | L89.213 | L89.103 |
| Stage 4 | L89.154 | L89.214 | L89.104 |
| Unstageable | L89.130 | L89.310 | L89.810 |

### Diabetic foot ulcer

- E11.621 — Type 2 diabetes with foot ulcer
- E11.622 — Type 2 diabetes with other skin ulcer
- L97.519 — Non-pressure chronic ulcer of unspecified part of unspecified foot

### Venous ulcer

- I83.019 — Varicose veins of unspecified lower extremity with ulcer
- I83.029 — Varicose veins of left lower extremity with ulcer
- L97.219 — Non-pressure chronic ulcer of unspecified part of unspecified lower leg

### Arterial ulcer

- I70.261 — Atherosclerosis of native arteries of lower extremity with gangrene
- L97.119 — Non-pressure chronic ulcer of unspecified part of unspecified foot

### Surgical wound

- T81.31XA — Disruption of external operation wound
- T81.32XA — Disruption of internal operation wound

### Traumatic wound

- S01.90XA — Unspecified open wound of head
- S01.91XA — Laceration without foreign body of head

### Burns

- T20.10XA — Burn of unspecified degree of unspecified site
- T20.20XA — Burn of second degree
- T21.10XA — Burn of unspecified degree of trunk
- T21.20XA — Burn of second degree of trunk

**Code impact:** `systems/coding/wound_coder.py` — `ICD10_MAPPINGS`, `generate_icd10_codes()`, `_location_to_index()`.

---

## 8. CPT Codes (Procedures)

| Procedure | CPT Code | Description |
|-----------|----------|-------------|
| Selective debridement | 97597 | Debridement, open wound, first 20 sq cm or less |
| Selective debridement, additional | 97598 | Each additional 20 sq cm |
| Non-selective debridement | 97602 | Removal of devitalized tissue, non-selective |
| Negative pressure wound therapy | 97605 | NPWT, wound(s) ≤50 sq cm total |
| Negative pressure wound therapy | 97606 | NPWT, wound(s) >50 sq cm total |
| Skin substitute application | 15275 | Application of skin substitute graft, first 25 sq cm or less |
| Skin substitute application, add'l | 15276 | Each additional 25 sq cm |

**Code impact:** `systems/coding/wound_coder.py` — `CPT_MAPPINGS`.

---

## 9. Chart Validity — Clinical Signals

A document is a **valid wound chart** when it contains ≥2 of:

- Wound, ulcer
- Pressure ulcer, venous ulcer, diabetic foot ulcer
- Stage, staging
- Debridement
- Granulation tissue
- Exudate, drainage
- Periwound
- CPT, ICD (in wound context)

**Reject** if: generic research, non-wound content, or no wound-care evidence.

**Code impact:** `main.py` — `_has_wound_chart_signals()`.

---

## 10. Wound Documentation Requirements

### Required for each wound

- Wound identifier (e.g., WOUND #1)
- Location (anatomical site)
- Wound type / stage
- Measurements (length, width; depth when applicable)
- Severity

### Optional but recommended

- Pain level (0–10)
- Exudate amount and type
- Periwound condition
- Odor
- Infection signs
- Tissue type (granulation, slough, eschar)
- Source excerpt from chart

---

## 11. Etiology-Specific Rules

### Diabetic foot ulcer (DFU)

- **Offloading required:** Device must be selected and applied
- "Advised" or "patient declined" is not sufficient
- Document: offloading device type and that it was reapplied

### Venous leg ulcer (VLU)

- **Compression required:** Compression therapy must be documented and reapplied

### Pressure ulcer

- **Redistribution:** Pressure redistribution must be documented

**Code impact:** `validation/engines/dfu_soc_offloading.py` — DFU offloading; `validation/engines/vlu_compression_gate.py` — VLU compression.

---

## 12. Perfusion Requirements

For wound types requiring perfusion:

- **ABI** (ankle-brachial index): numeric value, date, laterality
- **TBI** (toe-brachial index): when ABI not reliable
- **TcPO2** (transcutaneous oxygen): when applicable

**Rule:** Narrative alone (e.g., "adequate perfusion") is not sufficient. Use numeric values with date and laterality.

**Code impact:** `validation/engines/perfusion_gate.py` — `PerfusionGate.evaluate()`.

---

## 13. Infection Contradiction

**Flag** when note states "no active infection" but ≥2 of:

- Culture ordered
- Antibiotics active
- Fever documented (>38.5°C)
- Cellulitis noted
- Purulent drainage documented
- "Purulent" in narrative
- "Antibiotics started" in narrative

**Action:** Clarify infection status and document resolution evidence or plan.

### Osteomyelitis (DFU)

**Flag** when note states "no active osteomyelitis" but evidence includes:

- Imaging with osteomyelitis
- Bone involvement documented
- Exposed bone

**Action:** Clarify with imaging and clinical documentation.

**Code impact:** `validation/engines/contradiction_engine.py` — `ContradictionEngine.evaluate()` (fever >38.5°C = 101.3°F).

---

## 14. Utilization Rules (Medicare)

### Spacing between applications

- Minimum **7 days** between skin substitute applications (unless policy specifies otherwise)

### Episode limit

- Maximum **12 applications** per episode (unless policy specifies otherwise)

### Continued use

- After threshold applications: document objective improvement (area reduction or %)

**Rule:** If no measurable improvement, document clinical rationale for continued therapy in Assessment/Plan.

**Code impact:** `validation/engines/utilization_engine.py` — `UtilizationEngine.evaluate()` (7-day spacing, 12 apps/episode default).

---

## 15. Wastage (JW/JZ)

### When product is prepared but not fully used

- **Used** = min(wound area, prepared size)
- **Discarded** = prepared size − used

### If discarded > 0

- Apply **JW modifier** (discarded portion) when policy allows

### If discarded = 0

- Apply **JZ modifier** (no waste) when policy requires

### Hard fail if

- Wound area > prepared size without multi-unit documentation

**Code impact:** `validation/engines/wastage_engine.py` — `WastageEngine.evaluate()`.

---

## 16. FDA Language (351 vs 361)

- **Avoid:** "cure," "treat," "intended use" for 361 products
- **Use:** Compliant phrasing per FDA 351 vs 361 distinction

---

## 17. Exudate Amounts

| Term | Typical Use |
|------|-------------|
| None | No drainage |
| Minimal | Scant |
| Moderate | Moderate drainage |
| Large / Heavy | Copious drainage |

---

## 18. Exudate Types

| Term | Description |
|------|-------------|
| Serous | Clear, watery |
| Serosanguineous | Blood-tinged |
| Sanguineous | Bloody |
| Purulent | Pus, infection |

---

## 19. Tissue Types (Wound Bed)

- Granulation tissue
- Slough
- Eschar
- Necrotic tissue
- Epithelial

---

## 20. Documentation Standards

- **NPUAP** — Pressure ulcer staging
- **PEDIS** — Diabetic foot classification
- **CEAP** — Venous disease classification
- **TIME** — Wound bed preparation (Tissue, Infection, Moisture, Edge)
- **Medicare** — LCD/NCD documentation requirements

---

## 21. Assessment and Plan

### Assessment

- Clinical assessment statements supporting ICD-10 and medical necessity

### Plan

- Treatment plan items
- Dressing changes
- Offloading/compression
- Follow-up schedule

---

**END OF PLAYBOOK**

*Clinical reference only. Implementation details in wound-ai.algos.agentx-v1.md. Aligned with NPUAP, CMS LCD/NCD, and AMA CPT®.*
