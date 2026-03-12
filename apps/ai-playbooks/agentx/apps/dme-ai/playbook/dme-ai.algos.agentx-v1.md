---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: algo
  filename: dme-ai.algos.agentx-v1.md
---

# DME AI — Validation Algorithms AgentX

> **Purpose:** Deterministic algorithms for DME order validation, medical necessity checks, CMN/DIF validation, and compliance. Aligned with CMS DMEPOS policy and LCD/NCD.

**Use by AI:** Implementable logic for document_parser, dme_validator, cmn_checker, and validation engines.

---

## 1. Overview

DME AI validation follows a **deterministic sequence**. Given the same order, documentation, and rule version, the system produces the same findings in the same order.

**Key components:**
- Document parser (HCPCS extraction, diagnosis extraction)
- CMN/DIF checker (when required)
- Medical necessity validator
- Prior authorization gate

---

## 2. Validation Flow

```
                    DME ORDER INPUT
                          │
                          ▼
              ┌───────────────────────┐
              │ 1. Order Integrity     │
              │    (DME.ORD.001)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 2. HCPCS Validity      │
              │    (DME.HCP.010)      │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 3. CMN/DIF Gate        │
              │    (DME.CMN.020)      │
              └───────────┬───────────┘
                          │ PASS (or N/A)
                          ▼
              ┌───────────────────────┐
              │ 4. Medical Necessity  │
              │    (DME.MN.030)       │
              └───────────┬───────────┘
                          │ PASS
                          ▼
              ┌───────────────────────┐
              │ 5. Prior Auth Gate     │
              │    (DME.PA.040)       │
              └───────────┬───────────┘
                          │ PASS (or N/A)
                          ▼
              ┌───────────────────────┐
              │ 6. Documentation Gate │
              │    (DME.DOC.050)      │
              └───────────┬───────────┘
                          │ PASS
                          ▼
                    VALID / REMEDIATE
```

---

## 3. Order Integrity (DME.ORD.001)

```
ALGORITHM: ValidateOrderIntegrity
INPUT: order (HCPCS, quantity, patient_id, date, provider_id)

OUTPUT: (valid, errors)

PSEUDOCODE:
─────────────────────────────────────────
1. errors = []
2. IF order.hcpcs is empty:
     errors.append("HCPCS code required")
3. IF order.quantity <= 0:
     errors.append("Quantity must be positive")
4. IF order.patient_id is empty:
     errors.append("Patient identifier required")
5. IF order.date is future:
     errors.append("Order date cannot be in future")
6. IF order.provider_id is empty:
     errors.append("Prescribing provider required")
7. IF order.hcpcs format invalid (not A-Z + 4 digits):
     errors.append("Invalid HCPCS format")
8. RETURN (len(errors) == 0, errors)
```

---

## 4. HCPCS Validity (DME.HCP.010)

```
ALGORITHM: ValidateHCPCS
INPUT: hcpcs_code

OUTPUT: (valid, category)

PSEUDOCODE:
─────────────────────────────────────────
1. DMEPOS_PREFIXES = ["E", "K", "L", "A", "B"]
2. prefix = hcpcs_code[0] if len(hcpcs_code) >= 1 else ""
3. IF prefix not in DMEPOS_PREFIXES:
     RETURN (false, null)
4. # Basic format: letter + 4 digits (e.g., E0601, K0823)
5. IF not re.match(r'^[A-Z]\d{4}$', hcpcs_code):
     RETURN (false, null)
6. category = MAP_PREFIX_TO_CATEGORY(prefix)
7. RETURN (true, category)
```

---

## 5. CMN/DIF Gate (DME.CMN.020)

```
ALGORITHM: CheckCMNRequired
INPUT: hcpcs_code

OUTPUT: (cmn_required, cmn_form_type)

CMN_REQUIRED_CODES = {
  "E0270", "E0277", "E0290", "E0291", "E0292", "E0293", "E0294",
  "E0295", "E0296", "E0297", "E0301", "E0302", "E0303", "E0304",
  "E0371", "E0372", "E0373", "E0390", "E0424", "E0431", "E0433",
  "E0434", "E0439", "E0441", "E0442", "E0443", "E0444", "E0455",
  "E0461", "E0470", "E0471", "E0472", "E0480", "E0481", "E0482",
  "E0483", "E0484", "E0490", "E0500", "E0555", "E0556", "E0560",
  "E0561", "E0562", "E0570", "E0585", "E0601", "E0602", "E0603",
  "E0604", "E0605", "E0606", "E0607", "E0610", "E0615", "E0616",
  "E0617", "E0618", "E0619", "E0621", "E0623", "E0625", "E0627",
  "E0628", "E0629", "E0630", "E0635", "E0636", "E0637", "E0638",
  "E0639", "E0640", "E0641", "E0642", "E0650", "E0651", "E0652",
  "E0655", "E0656", "E0657", "E0658", "E0659", "E0660", "E0665",
  "E0666", "E0667", "E0668", "E0669", "E0670", "E0671", "E0672",
  "E0673", "E0675", "E0676", "E0677", "E0678", "E0679", "E0680",
  "E0690", "E0691", "E0692", "E0693", "E0694", "E0700", "E0701",
  "E0710", "E0711", "E0720", "E0730", "E0731", "E0740", "E0755",
  "E0760", "E0761", "E0762", "E0764", "E0765", "E0766", "E0767",
  "E0769", "E0770", "E0774", "E0776", "E0779", "E0780", "E0781",
  "E0782", "E0783", "E0784", "E0785", "E0786", "E0791", "E0800",
  "E0810", "E0811", "E0820", "E0821", "E0830", "E0840", "E0849",
  "E0850", "E0855", "E0856", "E0857", "E0858", "E0859", "E0860",
  "E0861", "E0862", "E0863", "E0864", "E0865", "E0866", "E0867",
  "E0868", "E0869", "E0870", "E0880", "E0890", "E0910", "E0911",
  "E0912", "E0920", "E0930", "E0931", "E0935", "E0936", "E0940",
  "E0941", "E0942", "E0943", "E0944", "E0945", "E0946", "E0947",
  "E0948", "E0949", "E0950", "E0951", "E0952", "E0953", "E0954",
  "E0955", "E0956", "E0957", "E0958", "E0959", "E0960", "E0961",
  "E0962", "E0963", "E0964", "E0965", "E0966", "E0967", "E0968",
  "E0969", "E0970", "E0971", "E0972", "E0973", "E0974", "E0975",
  "E0976", "E0977", "E0978", "E0979", "E0980", "E0981", "E0982",
  "E0983", "E0984", "E0985", "E0986", "E0987", "E0988", "E0989",
  "E0990", "E0991", "E0992", "E0993", "E0994", "E0995", "E0996",
  "E0997", "E0998", "E0999", "E1000", "E1390", "E1391", "E1392",
  "K0823", "K0824", "K0825", "K0826", "K0827", "K0828", "K0829",
  "K0830", "K0831", "K0832", "K0833", "K0834", "K0835", "K0836",
  "K0837", "K0838", "K0839", "K0840", "K0841", "K0842", "K0843"
}

PSEUDOCODE:
─────────────────────────────────────────
1. IF hcpcs_code in CMN_REQUIRED_CODES:
     RETURN (true, "CMN")
2. RETURN (false, null)
```

*Note: Full CMN code list is LCD-specific. Above is representative. Implement with LCD lookup.*

---

## 6. Medical Necessity Validation (DME.MN.030)

```
ALGORITHM: ValidateMedicalNecessity
INPUT: order, documentation

OUTPUT: (valid, gaps)

PSEUDOCODE:
─────────────────────────────────────────
1. gaps = []
2. IF documentation.diagnosis is empty:
     gaps.append("ICD-10 diagnosis required")
3. IF documentation.clinical_indication is empty:
     gaps.append("Clinical indication required")
4. IF documentation.functional_limitation is empty AND order.category in ["wheelchair", "walker", "hospital_bed"]:
     gaps.append("Functional limitation required for mobility/positioning")
5. # Face-to-face required for certain items
6. F2F_REQUIRED = ["E0601", "K0823", "K0001", ...]  # CPAP, power wheelchair, manual wheelchair
7. IF order.hcpcs in F2F_REQUIRED AND documentation.face_to_face_date is empty:
     gaps.append("Face-to-face encounter required within 6 months")
8. RETURN (len(gaps) == 0, gaps)
```

---

## 7. Prior Authorization Gate (DME.PA.040)

```
ALGORITHM: CheckPriorAuthRequired
INPUT: hcpcs_code, state, mac

OUTPUT: (pa_required, pa_status)

PA_REQUIRED_CODES = ["E0601", "E0470", "K0823", "K0824", "K0825", ...]

PSEUDOCODE:
─────────────────────────────────────────
1. IF hcpcs_code not in PA_REQUIRED_CODES:
     RETURN (false, null)
2. # Check MAC-specific PA requirements (LCD)
3. pa_status = lookup_pa_status(order_id, mac)
4. IF pa_status is empty:
     RETURN (true, "PENDING")
5. RETURN (true, pa_status)
```

---

## 8. Documentation Gate (DME.DOC.050)

```
ALGORITHM: ValidateDocumentation
INPUT: order, documentation

OUTPUT: (valid, remediation)

PSEUDOCODE:
─────────────────────────────────────────
1. remediation = []
2. # Written order before delivery (WOPD)
3. IF order.delivery_date exists AND documentation.written_order_date is empty:
     remediation.append("Written order must exist before delivery (WOPD)")
4. IF documentation.written_order_date > order.delivery_date:
     remediation.append("Written order date cannot be after delivery")
5. # CMN validity (12 months typical)
6. IF order.cmn_required AND documentation.cmn_expiry < order.service_date:
     remediation.append("CMN expired; new CMN required")
7. RETURN (len(remediation) == 0, remediation)
```

---

## 9. HCPCS → Category Mapping

```
ALGORITHM: MapHCPCSToCategory
INPUT: hcpcs_code

OUTPUT: category

MAPPING (prefix-based):
  E0xxx–E1xxx → DME
  K0xxx–K1xxx → Orthotics/Prosthetics (mobility)
  L0xxx–L9xxx → Orthotics/Prosthetics
  A4xxx, A7xxx → Supplies
  B4xxx → Enteral
```

---

## 10. Remediation Output Format

When validation fails, return structured remediation:

```
{
  "valid": false,
  "errors": ["CMN required for E0601", "Face-to-face not documented"],
  "remediation": [
    "Obtain and attach CMN Form 484.03 (CPAP) signed by treating physician",
    "Document face-to-face encounter within 6 months of order"
  ],
  "rule_refs": ["DME.CMN.020", "DME.MN.030"]
}
```

---

## 11. Block Logic Summary

| Rule | On FAIL |
|------|---------|
| DME.ORD.001 (Order Integrity) | SIGN_BLOCK |
| DME.HCP.010 (HCPCS Validity) | SIGN_BLOCK |
| DME.CMN.020 (CMN/DIF) | CLAIM_BLOCK |
| DME.MN.030 (Medical Necessity) | CLAIM_BLOCK |
| DME.PA.040 (Prior Auth) | CLAIM_BLOCK |
| DME.DOC.050 (Documentation) | CLAIM_BLOCK |

---

**END OF ALGO**

*Deterministic validation. Same inputs → same outputs. Aligned with CMS DMEPOS and LCD/NCD.*
