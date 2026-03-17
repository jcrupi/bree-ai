# Playbook.ai — Specialty Backend Generation & Rules Engine Options

> **Purpose:** Describes how we take a specialty's `playbook.agentx` and `algos.agentx` and (1) generate the backend service like wound.ai using the coding engine, (2) represent rules in two forms: **declarative rules engine** vs **LLM-handoff agentx**, and (3) classify rules by implementation: **regex/pattern** (Tier 1), **structured logic** (Tier 2), **AI reasoning** (Tier 3). Use for implementation planning and architecture decisions.

**Related:**
- `apps/wound-ai/` — Reference implementation
- `apps/enm-ai/agentx/enm-ai-design.agentx.md` — E/M AI design pattern
- `apps/coding-ai/` — Shared coding engine
- `apps/*/playbook.agentx.md`, `*.algos.agentx.md` — Source playbooks and algos

---

## 1. High-Level Flow: Playbook + Algos → Backend Service

### 1.1 Input Artifacts

For any specialty (e.g., wound-ai, enm-ai, pain-ai, derm-ai, urgent-ai):

| Artifact | Purpose | Example |
|----------|---------|---------|
| `{specialty}.playbook.agentx.md` | Clinical rules, codes, documentation standards | ICD-10/CPT tables, measurement rules, etiology-specific requirements |
| `{specialty}.algos.agentx.md` or `{Specialty}Algos.md` | Validation algorithms, rule flow, deterministic logic | Rule groups (MR.ID.001, WND.MEAS.010), pseudocode, API contracts |

### 1.2 Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INPUT: playbook.agentx + algos.agentx for specialty X                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CODING ENGINE INTEGRATION                                                    │
│ • Coding engine supports specialties: WOUNDCARE, GENERAL, SNFS, etc.       │
│ • Data loaders: woundcare_loader.py, general_loader.py (per specialty)      │
│ • API: POST /process, POST /process-pdf → icd_codes[], cpt_codes[]          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GENERATED BACKEND (like wound.ai)                                            │
│ • main.py / FastAPI or Elysia server                                         │
│ • services/coding_service.py — HTTP client to coding engine                   │
│ • services/validation_service.py — Rule execution (see Options A/B below)   │
│ • services/document_parser.py — Extract text, parse structure                 │
│ • models/, database/schema.py — Canonical objects, rule_catalog, etc.        │
│ • API: /assess-{specialty}, /generate-codes, /validate-{specialty}           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ RULES EXECUTION — Two Options (see Section 2 & 3)                            │
│ Option A: Declarative rules file → Rules engine (deterministic, code-run)   │
│ Option B: AgentX rules → LLM prompt on each request (flexible, AI-interpreted)│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Wound.ai Reference Architecture

| Component | Wound.ai | Generated for New Specialty |
|-----------|----------|------------------------------|
| **Coding engine** | `CODING_AI_URL`, specialty `WOUNDCARE` | Same URL, specialty from config (e.g., `GENERAL` for E/M) |
| **Data loader** | `woundcare_loader.py` | `{specialty}_loader.py` (50+ datasets per specialty) |
| **Coder** | `wound_coder.py` (ICD/CPT mappings) | Generated from playbook code tables |
| **Validation** | `validation_service.py`, `orchestrator.py` | Generated from algo.agentx rule flow |
| **Rule storage** | `rule_catalog`, `rule_definition` (PostgreSQL) | Same schema; rules populated from Option A or B |
| **AgentX** | `wound-chart.agentx`, `meta.wound.agentx` | `{specialty}-encounter.agentx`, `meta.{specialty}.agentx` |

### 1.4 Wound.ai Flow — How It Works

Wound.ai processes wound charts through a multi-phase pipeline. The coding engine is called for ICD/CPT extraction; validation runs separately via the orchestrator.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WOUND.AI REQUEST FLOW                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘

  POST /assess-wound (PDF/TXT/image)     POST /assess-agentx-note (AgentX text)
  POST /generate-codes (text only)       POST /validate-wound (validation only)
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: EXTRACTION                                                                │
│ • PDF: PyPDF2 or Vision API (if scanned) → text                                   │
│ • TXT: Decode directly → text                                                     │
│ • Image: Vision API → text                                                         │
│ • AgentX: Use note text as-is                                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: PARSING (document_parser)                                                 │
│ • parse_wound_document() / parse_wound_document_with_highlights()                   │
│ • Extract: wound_type, location, length_cm, width_cm, depth_cm, area_cm2            │
│ • Guardrails: _has_wound_chart_signals() — reject non-wound docs                    │
│ • Reject if no parsed_wound and no wound signals                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: CODING ENGINE (CodingService)                                            │
│ • PDF: coding_service.process_pdf(file_bytes, filename, specialty="WOUNDCARE")     │
│ • TXT/AgentX: coding_service.extract_codes(medical_record, specialty="WOUNDCARE")  │
│ • Returns: icd_codes[], cpt_codes[], modifiers[], validation                      │
│ • On failure: fallback to defaults (e.g. L89.152, 97597)                          │
└──────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: RESPONSE                                                                  │
│ • Build WoundAssessmentResponse: wound_id, measurements, icd10_codes, cpt_codes    │
│ • chart_audit_report, coding_call (attempted, success, duration_ms)                │
└──────────────────────────────────────────────────────────────────────────────────┘

  POST /validate-wound (separate flow)
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ VALIDATION FLOW (no coding engine)                                                 │
│ 1. CanonicalTransformer: assessment_data → patient, encounter, episode, etc.     │
│ 2. ValidationOrchestrator: 14-step deterministic sequence (WoundAlgos.md)        │
│ 3. Engines: encounter_integrity, measurement_integrity, dfu_soc_offloading,       │
│    contradiction_engine, utilization_engine, wastage_engine                        │
│ 4. Return: findings, block_type (SIGN_BLOCK/CLAIM_BLOCK), remediation_prompts     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Wound.ai → Coding Engine API Contract

Wound.ai uses `CodingService` (`services/coding_service.py`) to call the coding engine. Configuration: `CODING_AI_URL` (e.g. `http://127.0.0.1:7779`).

#### Coding Engine Endpoints

| Endpoint | Method | Wound.ai Call | Purpose |
|----------|--------|---------------|---------|
| `/process` | POST | `extract_codes(medical_record, specialty="WOUNDCARE")` | Extract codes from text |
| `/process-pdf` | POST | `process_pdf(file_bytes, filename, specialty="WOUNDCARE")` | Extract codes from PDF |
| `/health` | GET | `health_check()` | Verify coding engine is up |

#### Request: POST /process

```json
{
  "specialty": "WOUNDCARE",
  "provider_npi": "1234567890",
  "medical_record": "Stage 3 pressure ulcer right heel 3x4cm..."
}
```

#### Request: POST /process-pdf (multipart)

- `file`: PDF or TXT file
- `specialty`: `WOUNDCARE` (form field)
- `provider_npi`: `1234567890` (form field)

#### Response (both endpoints)

```json
{
  "success": true,
  "icd_codes": [
    { "code": "L89.613", "description": "...", "confidence": 0.92, "source": "model" }
  ],
  "cpt_codes": [
    { "code": "11042", "description": "...", "confidence": 0.88, "source": "model" }
  ],
  "modifiers": [],
  "validation": {
    "lcd_compliant": true,
    "ncd_compliant": true,
    "ncci_valid": true,
    "cms_compliant": true,
    "issues": []
  },
  "processing_time": 2.5
}
```

#### CodingService Implementation Summary

```python
# services/coding_service.py
class CodingService:
    def __init__(self, coding_engine_url=None):
        self.coding_engine_url = os.getenv("CODING_AI_URL", "").strip().rstrip("/")

    async def extract_codes(self, medical_record, specialty="WOUNDCARE", provider_npi=None):
        # POST {coding_engine_url}/process
        # Body: { specialty, provider_npi, medical_record }
        # Returns: { success, icd_codes, cpt_codes, modifiers, validation }

    async def process_pdf(self, file_bytes, filename, specialty="WOUNDCARE", provider_npi=None):
        # POST {coding_engine_url}/process-pdf
        # Multipart: file, specialty, provider_npi
        # Returns: same as extract_codes

    def format_code_response(self, coding_result, include_validation=True):
        # Maps coding-ai response to wound-ai API format (icd10_codes, cpt_codes, etc.)

    async def health_check(self):
        # GET {coding_engine_url}/health
```

#### Where Wound.ai Calls the Coding Engine

| Endpoint | When Coding Engine Is Called |
|----------|-----------------------------|
| `POST /assess-wound` | After parsing; PDF → `process_pdf`, TXT/image → `extract_codes` |
| `POST /assess-agentx-note` | After receiving AgentX text; `extract_codes(medical_record="Wound Assessment (AgentX)\n\n{note_text}")` |
| `POST /generate-codes` | Directly; `extract_codes(wound_documentation)` |
| `POST /validate-wound` | Never — validation uses ValidationOrchestrator only |

### 1.6 Extending the Coding Engine for EM, Derm, Pain, Urgent

The coding engine filters ICD/CPT predictions by `specialty`. To support enm-ai, derm-ai, pain-ai, and urgent-ai, extend the engine as follows.

#### Current State

| Specialty | Status | Data Source |
|-----------|--------|-------------|
| WOUNDCARE | ✅ Full | `woundcare_loader.py` → woundcare_datasets; icd_mappings/cpt_mappings |
| SNFS | ✅ Full | `snf_loader.py` → snfs_datasets; icd_mappings/cpt_mappings |
| GENERAL | ✅ Supported | icd_mappings/cpt_mappings (general medicine, E/M) |
| PAIN | ⚠️ Partial | `pain_management_icd_loader.py`, `pain_management_cpt_loader.py` — PAIN may need to be added to `allowed_specialties` |
| DERMATOLOGY | ⚠️ In list | In allowed_specialties; may lack dedicated ICD/CPT mappings |
| EMERGENCY | ⚠️ In list | In allowed_specialties; may lack dedicated mappings |

#### Mapping: Playbook.ai Specialty → Coding Engine Specialty

| Playbook.ai App | Coding Engine Specialty | Notes |
|----------------|-------------------------|-------|
| enm-ai | GENERAL or SNFS | E/M codes 99202–99499; SNFS for nursing facility visits |
| derm-ai | DERMATOLOGY | Skin conditions, biopsies, excisions |
| pain-ai | PAIN | Already has pain_management loaders |
| urgent-ai | EMERGENCY or GENERAL | Urgent care E/M + minor procedures |

#### Extension Steps

**1. Add specialty to allowed list** (if not present)

In `main.py`, `MedicalRecordRequest.validate_specialty` and `process-pdf` allowed_specialties:

```python
allowed = ['SNFS', 'WOUNDCARE', 'GENERAL', 'CARDIOLOGY', 'ORTHOPEDICS',
           'NEUROLOGY', 'DERMATOLOGY', 'GASTROENTEROLOGY', 'PULMONARY',
           'NEPHROLOGY', 'ENDOCRINOLOGY', 'ONCOLOGY', 'PSYCHIATRY',
           'PEDIATRICS', 'GERIATRICS', 'EMERGENCY', 'SURGERY',
           'PAIN', 'EM', 'URGENT']  # Add PAIN, EM, URGENT if needed
```

**2. Create data loaders** (per specialty)

| Specialty | Loader | Table / Target | Content |
|-----------|--------|----------------|---------|
| EM | `em_loader.py` or extend GENERAL | `em_datasets` or `icd_mappings`/`cpt_mappings` with specialty=GENERAL | E/M scenarios: 99202–99205, 99211–99215, 99281–99285, etc. |
| DERM | `dermatology_loader.py` | `icd_mappings`, `cpt_mappings` with specialty=DERMATOLOGY | Skin conditions (L00–L99), biopsies (11100–11101), excisions (11600–11646) |
| PAIN | ✅ Exists | `pain_management_icd_loader`, `pain_management_cpt_loader` | Ensure PAIN in allowed list; verify loaders run at init |
| URGENT | `urgent_loader.py` or use EMERGENCY | `urgent_datasets` or `icd_mappings`/`cpt_mappings` with specialty=EMERGENCY | Urgent care E/M, laceration repair, splinting, etc. |

**3. Data loader pattern** (from woundcare_loader, snf_loader)

```python
# data_loaders/dermatology_loader.py
class DermatologyDataLoader:
    def __init__(self, db_manager):
        self.db = db_manager

    def load_datasets(self):
        # Option A: Specialty-specific table (like woundcare_datasets)
        # INSERT INTO derm_datasets (dataset_name, medical_record, icd_codes, cpt_codes, ...)

        # Option B: Add to icd_mappings / cpt_mappings with specialty='DERMATOLOGY'
        # INSERT INTO icd_mappings (icd_code, description, category, specialty, keywords, ...)
        # INSERT INTO cpt_mappings (cpt_code, description, specialty, keywords, ...)
```

**4. Register loader at init** (main.py)

```python
# In load_data_parallel / initialization:
if 'derm_datasets' not in tables_with_data:
    data_loaders.append(("Dermatology", dermatology_loader.load_datasets))

# Or for icd/cpt mappings: add DERMATOLOGY entries via icd_data_loader / cpt_data_loader
```

**5. Specialty detection** (for /process-pdf when specialty not provided)

In `specialty_detection_data_loader.py`, add patterns for new specialties:

```python
# Add to specialty_detection_data:
("DERMATOLOGY", "rash, eczema, psoriasis, melanoma, biopsy, excision, skin lesion, acne, dermatitis", 
 "L20.9,L40.9,C43.9,L70.0,L30.9", "11100,11101,11600,17000,10060", "dermatology, skin clinic"),
("PAIN", "low back pain, cervicalgia, radiculopathy, sciatica, spinal stenosis, pain management, epidural, facet", 
 "M54.5,M54.2,M54.16,M54.30,M48.06", "64483,64484,64490,64491,64493", "pain clinic, spine center"),
("EMERGENCY", "urgent care, emergency, laceration, fracture, acute, trauma", 
 "S01.90XA,S72.001A,R10.9", "99281,99282,99283,99284,99285,12001", "urgent care, ED, emergency"),
```

**6. Backend CodingService calls**

Each specialty backend passes the correct specialty:

```python
# enm-ai: coding_service.extract_codes(medical_record, specialty="GENERAL")
# derm-ai: coding_service.extract_codes(medical_record, specialty="DERMATOLOGY")
# pain-ai: coding_service.extract_codes(medical_record, specialty="PAIN")
# urgent-ai: coding_service.extract_codes(medical_record, specialty="EMERGENCY")
```

#### Summary Checklist

| Step | EM | Derm | Pain | Urgent |
|------|----|------|------|--------|
| Add to allowed_specialties | Use GENERAL | DERMATOLOGY | PAIN | EMERGENCY |
| Data loader | em_loader or GENERAL mappings | dermatology_loader | ✅ Exists | urgent_loader or EMERGENCY |
| Specialty detection patterns | E/M keywords | Derm keywords | Pain keywords | Urgent/ED keywords |
| Backend specialty param | GENERAL | DERMATOLOGY | PAIN | EMERGENCY |

---

## 2. Option A: Declarative Rules File — Run Like a Rules Engine

### 2.1 Concept

Rules are represented in a **declarative, machine-executable format** (JSON/YAML). A generic rules engine loads the file and evaluates conditions against canonical data. No LLM involved at runtime.

### 2.2 Declarative Rule Format

Rules can be stored as:

**A. JSON Rule Definition (matches `rule_definition` schema)**

```json
{
  "catalog_version": "wound-v1.0",
  "rules": [
    {
      "rule_code": "WND.MEAS.010",
      "rule_name": "Serial Measurement Gate",
      "severity": "SIGN_BLOCK",
      "order_index": 2,
      "inputs": ["wound_assessment", "assessments_ordered"],
      "conditions": [
        {
          "field": "length_cm",
          "operator": "is_null_or_zero",
          "on_fail": {
            "status": "FAIL",
            "remediation_prompt": "Measurement missing: length_cm",
            "mr_pointers": [{"object": "wound_assessment", "field": "length_cm"}]
          }
        },
        {
          "field": "area_cm2",
          "expression": "round(length_cm * width_cm, 2)",
          "operator": "gt",
          "operand": 0,
          "on_fail": {
            "status": "FAIL",
            "remediation_prompt": "Area cannot be zero"
          }
        },
        {
          "type": "static_dimensions_check",
          "when": "len(assessments) >= 2",
          "compare": ["length_cm", "width_cm", "depth_cm"],
          "on_fail": {
            "status": "FAIL",
            "severity": "RISK_FLAG",
            "remediation_prompt": "Measurements identical to prior visit; confirm re-measurement"
          }
        }
      ],
      "outputs": {
        "area_cm2": "computed",
        "trend_direction": "derived"
      }
    },
    {
      "rule_code": "DFU.SOC.100",
      "rule_name": "DFU SOC Offloading Gate",
      "severity": "SIGN_BLOCK",
      "applicability": {
        "etiology": "DFU",
        "policy_soc_required": true
      },
      "conditions": [
        {
          "field": "offloading_device_selected",
          "operator": "not_in",
          "operand": ["advised", "patient_declined", null],
          "on_fail": {
            "status": "FAIL",
            "remediation_prompt": "Offloading device must be selected and applied"
          }
        },
        {
          "field": "offloading_reapplied",
          "operator": "eq",
          "operand": true,
          "on_fail": {
            "status": "FAIL",
            "remediation_prompt": "Confirm offloading device was applied"
          }
        }
      ]
    }
  ]
}
```

**B. YAML Rule Catalog (alternative, more readable)**

```yaml
catalog_version: wound-v1.0
rules:
  - rule_code: WND.MEAS.010
    rule_name: Serial Measurement Gate
    severity: SIGN_BLOCK
    order_index: 2
    inputs: [wound_assessment, assessments_ordered]
    conditions:
      - field: length_cm
        operator: is_null_or_zero
        on_fail:
          status: FAIL
          remediation_prompt: "Measurement missing: length_cm"
      - field: area_cm2
        expression: "round(length_cm * width_cm, 2)"
        operator: gt
        operand: 0
        on_fail:
          status: FAIL
          remediation_prompt: "Area cannot be zero"
  - rule_code: DFU.SOC.100
    rule_name: DFU SOC Offloading Gate
    severity: SIGN_BLOCK
    applicability:
      etiology: DFU
    conditions:
      - field: offloading_device_selected
        operator: not_in
        operand: [advised, patient_declined, null]
```

### 2.3 Rules Engine Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RULES ENGINE (generic, language-agnostic)                                     │
│                                                                               │
│ 1. Load rule catalog from file: rules/wound-v1.0.json (or .yaml)               │
│ 2. For each rule in order_index:                                              │
│    a. Check applicability (etiology, policy, etc.)                           │
│    b. Resolve inputs from canonical record                                    │
│    c. Evaluate conditions sequentially                                       │
│    d. On first fail: emit Finding, stop rule (or continue if CLAIM_BLOCK)     │
│    e. On pass: continue to next condition                                     │
│ 3. Aggregate findings, set block status (SIGN_BLOCK / CLAIM_BLOCK)           │
│ 4. Return validation result                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Implementation Options for Declarative Engine

| Approach | Pros | Cons |
|----------|------|------|
| **JSON + custom interpreter** | Full control, audit trail, deterministic | Need to implement operator set (eq, gt, in, etc.) |
| **JSON + JsonLogic / json-rules-engine** | Standard format, existing libs | May not cover all rule types (e.g., trend analysis) |
| **YAML + Python/JS evaluator** | Readable, versionable | Same as above |
| **Database-backed (rule_catalog table)** | Dynamic updates, no deploy for rule changes | Requires admin UI, migration from agentx |
| **Compiled from agentx** | Single source of truth (agentx) | Build step: agentx → JSON/YAML |

### 2.5 Generation: Playbook + Algos → Declarative Rules File

```
playbook.agentx (tables, code mappings)     algos.agentx (pseudocode, rule flow)
                    │                                    │
                    └────────────────┬───────────────────┘
                                     ▼
                    ┌────────────────────────────────────┐
                    │ CODE GEN / EXTRACTION SCRIPT        │
                    │ • Parse agentx markdown              │
                    │ • Extract rule_code, conditions,    │
                    │   severity, remediation from algo   │
                    │ • Map playbook codes to lookup      │
                    │   tables in rules                    │
                    └────────────────────────────────────┘
                                     │
                                     ▼
                    rules/{specialty}-v1.0.json  (or .yaml)
```

**Example extraction:** From `WoundAlgos.md` Section 4.2 (SerialMeasurementGate), the pseudocode maps to conditions like `length_cm == null`, `area_cm2 == 0`, `static_count == 3`.

---

## 3. Option B: AgentX Rules — Handed to LLM on Each Request

### 3.1 Concept

Rules remain in **human-readable agentx markdown**. On each validation/coding request, the relevant sections of `playbook.agentx` and `algo.agentx` are included in the **LLM prompt** as context. The AI interprets the rules and returns structured findings.

### 3.2 Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REQUEST: Validate encounter (canonical record or raw note)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROMPT ASSEMBLY                                                              │
│                                                                              │
│ System: "You are a medical coding validator. Apply the rules below."        │
│                                                                              │
│ Context (injected):                                                          │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ## From playbook.agentx:                                                 │ │
│ │ - ICD-10 codes for pressure ulcers (L89.151–L89.154 by stage/site)      │ │
│ │ - Measurement rules: length×width, area cannot be zero                   │ │
│ │ - DFU offloading required; "advised" is not sufficient                  │ │
│ │ - Infection contradiction: flag if "no infection" + 2+ signals         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ## From algo.agentx (rules engine representation):                      │ │
│ │ - Rule WND.MEAS.010: Check length, width, depth, area; static dims      │ │
│ │ - Rule DFU.SOC.100: Offloading device selected and applied              │ │
│ │ - Rule INF.300: Contradiction when no_infection + culture/abx/fever     │ │
│ │ - Severity: SIGN_BLOCK vs CLAIM_BLOCK                                   │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ User: "Validate this encounter: {encounter_json}"                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ LLM RESPONSE (structured output)                                             │
│ {                                                                           │
│   "findings": [                                                             │
│     {"rule_id": "WND.MEAS.010", "status": "PASS"},                          │
│     {"rule_id": "DFU.SOC.100", "status": "FAIL", "remediation_prompt": "..."}│
│   ],                                                                        │
│   "overall_status": "BLOCKED",                                              │
│   "block_type": "SIGN_BLOCK"                                                 │
│ }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 AgentX as "Rules Engine" Representation

The algo.agentx can be **transformed** into a compact "rules engine" section optimized for LLM consumption:

**Original (algo.agentx):** Long pseudocode, prose.

**LLM-optimized agentx (generated or hand-maintained):**

```markdown
# Wound AI — Rules Engine (LLM Reference)

> Use these rules to validate wound encounters. Return structured findings.

## Rule Sequence (evaluate in order)

### WND.MEAS.010 — Serial Measurement Gate (SIGN_BLOCK)
- **Inputs:** wound_assessment (length_cm, width_cm, depth_cm, measurement_timestamp)
- **Conditions:**
  1. length_cm, width_cm, depth_cm must be present and > 0
  2. area_cm2 = length × width, rounded to 2 decimals; must be > 0
  3. If ≥2 prior assessments: flag if all three dimensions identical (RISK_FLAG)
  4. If ≥3 assessments: flag if no improvement in area (RISK_FLAG)
- **On fail:** Return Finding(rule_id, FAIL, remediation_prompt, mr_pointers)

### DFU.SOC.100 — DFU Offloading Gate (SIGN_BLOCK)
- **Applicability:** etiology == DFU
- **Conditions:**
  1. offloading_device_selected must be present; "advised" or "patient_declined" → FAIL
  2. offloading_reapplied == true
- **On fail:** "Offloading device must be selected and applied"

### INF.300 — Infection Contradiction (SIGN_BLOCK)
- **Conditions:** If "no active infection" attested AND ≥2 of: culture_ordered, antibiotics_active, fever, cellulitis, purulent drainage → FAIL
- **On fail:** "Clarify infection status; document resolution or plan"
```

This compact form is **injected into the LLM prompt** on each request.

### 3.4 Implementation

| Component | Responsibility |
|-----------|----------------|
| **Rule loader** | Read `playbook.agentx` + `algo.agentx` (or pre-generated `rules-engine.agentx.md`) |
| **Prompt builder** | Assemble system + context (rules) + user (encounter) |
| **LLM client** | Call OpenAI/Anthropic with structured output schema |
| **Response parser** | Parse JSON findings, map to `Finding` struct |

### 3.5 Pros and Cons

| Pros | Cons |
|------|------|
| No code gen for rules; change agentx → change behavior | Non-deterministic; same input can yield different outputs |
| Handles ambiguous cases, narrative reasoning | Latency and cost per request |
| Easy to add new rules (edit markdown) | Harder to audit "why" for compliance |
| Single source: agentx is both docs and runtime | Token limits may truncate large playbooks |

---

## 4. Rule Classification: Regex vs Structured Logic vs AI Reasoning

Not all rules require the same execution mechanism. Classifying rules by implementation type helps choose Option A vs Option B and optimizes cost, latency, and auditability.

### 4.1 Three-Tier Classification

| Tier | Type | Implementation | Example |
|------|------|----------------|---------|
| **1** | Regex / pattern | Regex or string match | Keyword presence, phrase detection |
| **2** | Structured logic | Field checks, math, lookups | Null checks, numeric comparisons, code lookup |
| **3** | AI reasoning | LLM interpretation | MDM complexity, documentation support, risk assessment |

### 4.2 Tier 1: Regex / Pattern Rules (No AI)

| Rule type | Example | Implementation |
|-----------|---------|----------------|
| **Keyword presence** | "purulent", "antibiotics started", "no active infection" | Regex or `string.contains()` |
| **Simple contradiction** | "no infection" + "antibiotics started" in same note | Regex for both phrases |
| **Anatomical normalization** | "sacrum", "coccyx", "midline" → sacrum | Regex + mapping table |
| **Format validation** | Date format, NPI format, code format | Regex |
| **Phrase detection** | "advised" or "patient declined" for offloading | Regex match on field value |

These are deterministic and fit **Option A** (declarative rules engine). Can be expressed as `operator: "regex_match"` or `operator: "contains"` with a pattern.

### 4.3 Tier 2: Structured Logic Rules (No AI)

| Rule type | Example | Implementation |
|-----------|---------|----------------|
| **Required field presence** | length_cm, width_cm, date_of_service | Null/empty check |
| **Numeric constraints** | area > 0, days_between >= 7 | Comparison operators |
| **Code lookup** | ICD-10 in allowed list for stage/site | Set membership |
| **Computed fields** | area = length × width | Expression evaluation |
| **Multi-field comparison** | All three dimensions identical to prior visit | Structured comparison |

Also deterministic; fit **Option A**. Use operators: `eq`, `gt`, `gte`, `in`, `not_in`, `is_null`, `expression`.

### 4.4 Tier 3: AI Reasoning Rules (LLM Required)

| Rule type | Example | Why AI |
|-----------|---------|--------|
| **MDM complexity** | Is this "moderate" or "high"? | Clinical context and nuance |
| **Level support** | Does documentation support 99214? | Judging adequacy of documentation |
| **Problem count/relatedness** | Are these 2 problems or 1? | Semantic understanding |
| **Risk assessment** | Threat to life or bodily function? | Interpretation of narrative |
| **Narrative vs numeric** | "Adequate perfusion" vs numeric ABI | Distinguishing acceptable wording |
| **Ambiguous findings** | Does "improving" imply measurable improvement? | Context and intent |

These require **Option B** (LLM handoff). No fixed regex or operator can capture the interpretive logic.

### 4.5 Mapping to Execution Path

```
                    RULE EVALUATION
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────────┐   ┌──────────┐
    │ Tier 1   │   │ Tier 2       │   │ Tier 3   │
    │ Regex    │   │ Structured   │   │ AI       │
    │ Pattern  │   │ Logic        │   │ Reasoning│
    └────┬─────┘   └──────┬───────┘   └────┬─────┘
         │                │                │
         └────────────────┼────────────────┘
                          ▼
              ┌─────────────────────────┐
              │ Option A: Rules Engine  │  ← Tiers 1 & 2
              │ (deterministic, fast)   │
              └─────────────────────────┘
                          │
                          │ If any rule is Tier 3:
                          ▼
              ┌─────────────────────────┐
              │ Option B: LLM Handoff   │  ← Tier 3 only
              │ (interpretive, flexible)│
              └─────────────────────────┘
```

**Practical approach:** Run Tiers 1 and 2 in the rules engine first. Only invoke the LLM for rules classified as Tier 3, or when Tiers 1–2 pass and Tier 3 rules apply. This minimizes AI cost and keeps most rules fast and auditable.

---

## 5. Comparison: Option A vs Option B

| Dimension | Option A: Declarative Rules Engine | Option B: LLM Handoff |
|-----------|-----------------------------------|------------------------|
| **Determinism** | Yes — same input → same output | No — may vary by run |
| **Audit trail** | Full — every condition logged | Partial — LLM reasoning not fully traceable |
| **Latency** | Low — in-process evaluation | Higher — API call per request |
| **Cost** | Minimal (compute only) | Per-token cost |
| **Flexibility** | Limited to predefined operators | High — handles novel cases |
| **Compliance** | Strong — 21 CFR Part 11 style | Weaker — harder to prove rule application |
| **Rule updates** | Deploy new JSON/YAML or DB update | Edit agentx, redeploy or hot-reload |
| **Best for** | Tiers 1 & 2 (regex, structured) | Tier 3 (AI reasoning) |

### 5.1 Hybrid Approach

Many production systems use **both**:

- **Option A** for **Tiers 1 & 2**: regex/pattern and structured logic — measurement integrity, utilization, JW/JZ, FDA language, keyword presence. Must be deterministic for claims.
- **Option B** for **Tier 3**: AI reasoning — MDM complexity, documentation support, risk assessment, narrative interpretation. Acceptable to be advisory or interpretive.

```
                    REQUEST
                        │
                        ▼
              ┌─────────────────────┐
              │ Option A: Tiers 1&2 │  ← Regex + structured logic. Deterministic.
              │ (declarative rules) │
              └──────────┬──────────┘
                         │ PASS
                         ▼
              ┌─────────────────────┐
              │ Option B: Tier 3   │  ← AI reasoning. MDM, level support, nuance.
              │ (agentx in prompt)  │
              └──────────┬──────────┘
                         │
                         ▼
                    RESPONSE
```

---

## 6. Backend Service Generation Checklist

When generating a new specialty backend from playbook.agentx + algo.agentx:

### 6.1 Coding Engine Integration

- [ ] Add `{specialty}_loader.py` to coding-ai with 50+ datasets
- [ ] Register specialty in coding engine config (e.g., `PAIN`, `DERM`, `URGENT`)
- [ ] Add `services/coding_service.py` with `extract_codes(medical_record, specialty=...)`

### 6.2 Validation Service

- [ ] Classify rules: Tier 1 (regex), Tier 2 (structured), Tier 3 (AI)
- [ ] Choose Option A, B, or Hybrid based on rule mix
- [ ] If Option A: Generate `rules/{specialty}-v1.0.json` from algo.agentx (Tiers 1 & 2)
- [ ] If Option B: Create `rules-engine.agentx.md` for Tier 3 rules
- [ ] Implement `validation_service.py` with rule execution flow from algo.agentx

### 6.3 API Endpoints

- [ ] `POST /assess-{specialty}` — Full flow: extract → coding engine → validate
- [ ] `POST /generate-codes` — Coding engine only
- [ ] `POST /validate-{specialty}` — Validation only (for testing)

### 6.4 AgentX & Test Data

- [ ] `test_data/` with sample encounters
- [ ] `meta.{specialty}-encounter.agentx.md` — Extraction schema
- [ ] `GET /agentx-notes`, `POST /assess-agentx-note` — For AgentX-based testing

### 6.5 Deployment

- [ ] Dockerfile, docker-compose service
- [ ] `CODING_AI_URL`, `OPENAI_API_KEY` (if Option B) env vars

---

## 7. Summary

| Step | Action |
|------|--------|
| **Input** | `{specialty}.playbook.agentx.md` + `{specialty}.algos.agentx.md` |
| **Rule classification** | Tier 1 (regex), Tier 2 (structured), Tier 3 (AI) |
| **Coding engine** | Add data loader, register specialty, use existing `/process` API |
| **Backend** | Generate FastAPI/Elysia app with coding_service, validation_service |
| **Rules — Option A** | Tiers 1 & 2: Declarative JSON/YAML → rules engine (deterministic) |
| **Rules — Option B** | Tier 3: AgentX in LLM prompt (interpretive) |
| **Hybrid** | Option A for Tiers 1 & 2, Option B for Tier 3 |

---

**END OF SPECIALTY BACKEND GENERATION AGENTX**
