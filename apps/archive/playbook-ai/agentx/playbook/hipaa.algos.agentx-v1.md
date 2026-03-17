---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: algos
  filename: hipaa.algos.agentx-v1.md
  domain: hipaa
---

# HIPAA Compliance Algos v1

> Validation rules for HIPAA compliance. At runtime, content is analyzed against these rules to ensure conformance. Produces a deep-ai-agent for the HIPAA domain.

## Overview

These algos define the validation flow for HIPAA compliance content. PHI identification, access controls, encryption, audit logging, BAA requirements, and breach notification must conform. The Playback Runner (or grape) loads this playbook and algos to analyze pasted content at runtime.

## Validation Rules

### HIP.PHI.001 — PHI identification
- **Check:** Content identifies PHI elements (18 identifiers) when present
- **Fail:** PHI present but not flagged or protected
- **Remediation:** Identify and flag all PHI; apply appropriate safeguards

### HIP.PHI.002 — De-identification
- **Check:** When de-identified, no 18 identifiers remain; safe harbor or expert determination applied
- **Fail:** De-identified data still contains identifiers
- **Remediation:** Remove or transform remaining identifiers per safe harbor

### HIP.ACC.010 — Access controls
- **Check:** Unique user IDs, automatic logoff, encryption, access logs
- **Fail:** Missing access control requirements
- **Remediation:** Implement unique IDs, session timeout, encryption, logging

### HIP.ACC.011 — Minimum necessary
- **Check:** Disclosures limited to minimum necessary for the purpose
- **Fail:** Over-disclosure of PHI
- **Remediation:** Limit disclosure scope to what is necessary

### HIP.SEC.020 — Encryption at rest
- **Check:** ePHI encrypted at rest (AES-256 or equivalent)
- **Fail:** ePHI stored unencrypted
- **Remediation:** Encrypt ePHI at rest using approved algorithms

### HIP.SEC.021 — Encryption in transit
- **Check:** ePHI transmitted over TLS 1.2+ or equivalent
- **Fail:** Unencrypted transmission of ePHI
- **Remediation:** Use TLS 1.2+ for all ePHI transmission

### HIP.AUD.030 — Audit logging
- **Check:** Access to ePHI is logged (who, what, when)
- **Fail:** No audit trail for PHI access
- **Remediation:** Implement audit logging for all PHI access

### HIP.BAA.040 — BAA required
- **Check:** Business Associate has signed BAA before PHI access
- **Fail:** PHI shared with BA without BAA
- **Remediation:** Obtain signed BAA before sharing PHI with BA

### HIP.BRCH.050 — Breach notification
- **Check:** Breach response includes: containment, assessment, notification (60 days), documentation
- **Fail:** Missing breach notification requirements
- **Remediation:** Document breach response; notify within 60 days per HIPAA

### HIP.CONS.060 — Authorization for non-routine use
- **Check:** Non-routine disclosures require valid patient authorization
- **Fail:** PHI disclosed without required authorization
- **Remediation:** Obtain valid patient authorization before non-routine disclosure

## RuleCatalog

```yaml
# hipaa RuleCatalog
specialty: "hipaa"
version: 1
created_at: "2025-03-12T00:00:00.000Z"
flow:
  - id: "HIP.PHI.001"
    name: "PHI identification"
    order: 1
  - id: "HIP.PHI.002"
    name: "De-identification"
    order: 2
  - id: "HIP.ACC.010"
    name: "Access controls"
    order: 3
  - id: "HIP.ACC.011"
    name: "Minimum necessary"
    order: 4
  - id: "HIP.SEC.020"
    name: "Encryption at rest"
    order: 5
  - id: "HIP.SEC.021"
    name: "Encryption in transit"
    order: 6
  - id: "HIP.AUD.030"
    name: "Audit logging"
    order: 7
  - id: "HIP.BAA.040"
    name: "BAA required"
    order: 8
  - id: "HIP.BRCH.050"
    name: "Breach notification"
    order: 9
  - id: "HIP.CONS.060"
    name: "Authorization for non-routine use"
    order: 10
rules:
  HIP.PHI.001:
    id: "HIP.PHI.001"
    name: "PHI identification"
    type: "interpreted"
    inputs: ["content"]
    output: "PASS_FAIL"
    description: "PHI elements identified and protected"
    remediation: "Identify and flag all PHI; apply safeguards"
    shortCircuit: false
  HIP.PHI.002:
    id: "HIP.PHI.002"
    name: "De-identification"
    type: "interpreted"
    inputs: ["content"]
    output: "PASS_FAIL"
    description: "De-identified data has no 18 identifiers"
    remediation: "Remove or transform remaining identifiers"
    shortCircuit: false
  HIP.ACC.010:
    id: "HIP.ACC.010"
    name: "Access controls"
    type: "interpreted"
    inputs: ["policies", "system_description"]
    output: "PASS_FAIL"
    description: "Unique IDs, logoff, encryption, logs"
    remediation: "Implement access control requirements"
    shortCircuit: false
  HIP.ACC.011:
    id: "HIP.ACC.011"
    name: "Minimum necessary"
    type: "interpreted"
    inputs: ["disclosures", "content"]
    output: "PASS_FAIL"
    description: "Disclosures limited to minimum necessary"
    remediation: "Limit disclosure scope"
    shortCircuit: false
  HIP.SEC.020:
    id: "HIP.SEC.020"
    name: "Encryption at rest"
    type: "interpreted"
    inputs: ["system_description", "policies"]
    output: "PASS_FAIL"
    description: "ePHI encrypted at rest"
    remediation: "Encrypt ePHI at rest"
    shortCircuit: false
  HIP.SEC.021:
    id: "HIP.SEC.021"
    name: "Encryption in transit"
    type: "interpreted"
    inputs: ["system_description", "policies"]
    output: "PASS_FAIL"
    description: "ePHI transmitted over TLS 1.2+"
    remediation: "Use TLS 1.2+ for transmission"
    shortCircuit: false
  HIP.AUD.030:
    id: "HIP.AUD.030"
    name: "Audit logging"
    type: "interpreted"
    inputs: ["policies", "system_description"]
    output: "PASS_FAIL"
    description: "PHI access is logged"
    remediation: "Implement audit logging"
    shortCircuit: false
  HIP.BAA.040:
    id: "HIP.BAA.040"
    name: "BAA required"
    type: "interpreted"
    inputs: ["baa", "business_associates"]
    output: "PASS_FAIL"
    description: "BA has signed BAA before PHI access"
    remediation: "Obtain signed BAA"
    shortCircuit: false
  HIP.BRCH.050:
    id: "HIP.BRCH.050"
    name: "Breach notification"
    type: "interpreted"
    inputs: ["breach_policy", "content"]
    output: "PASS_FAIL"
    description: "Breach response includes containment, assessment, notification, documentation"
    remediation: "Document breach response; notify within 60 days"
    shortCircuit: false
  HIP.CONS.060:
    id: "HIP.CONS.060"
    name: "Authorization for non-routine use"
    type: "interpreted"
    inputs: ["disclosures", "authorizations"]
    output: "PASS_FAIL"
    description: "Non-routine disclosures have valid authorization"
    remediation: "Obtain valid patient authorization"
    shortCircuit: false
```

## Validation Flow

```
│ 1. PHI identification      │
│    (HIP.PHI.001)           │
        │ PASS
        ▼
│ 2. De-identification       │
│    (HIP.PHI.002)           │
        │ PASS
        ▼
│ 3. Access controls         │
│    (HIP.ACC.010)           │
        │ PASS
        ▼
│ 4. Minimum necessary       │
│    (HIP.ACC.011)           │
        │ PASS
        ▼
│ 5. Encryption at rest      │
│    (HIP.SEC.020)           │
        │ PASS
        ▼
│ 6. Encryption in transit   │
│    (HIP.SEC.021)           │
        │ PASS
        ▼
│ 7. Audit logging           │
│    (HIP.AUD.030)           │
        │ PASS
        ▼
│ 8. BAA required            │
│    (HIP.BAA.040)           │
        │ PASS
        ▼
│ 9. Breach notification     │
│    (HIP.BRCH.050)          │
        │ PASS
        ▼
│ 10. Authorization         │
│     (HIP.CONS.060)         │
        │ PASS
        ▼
     CONFORMANT
```

## Algorithm Blocks

### 1. Algorithm: PHI Identification (HIP.PHI.001)

**Input:** content

**Output:** PASS | FAIL

**Steps:**

1. Scan content for 18 HIPAA identifiers (name, SSN, DOB, address, etc.)
2. If PHI present and not flagged/protected → RETURN FAIL
3. RETURN PASS

### 2. Algorithm: De-identification (HIP.PHI.002)

**Input:** content

**Output:** PASS | FAIL

**Steps:**

1. If content claims de-identification, scan for 18 identifiers
2. If any identifier remains → RETURN FAIL
3. Verify safe harbor or expert determination referenced
4. RETURN PASS

### 3. Algorithm: Access Controls (HIP.ACC.010)

**Input:** policies, system_description

**Output:** PASS | FAIL

**Steps:**

1. Check for unique user IDs
2. Check for automatic logoff/session timeout
3. Check for encryption of ePHI
4. Check for access logging
5. If any missing → RETURN FAIL
6. RETURN PASS

### 4. Algorithm: Minimum Necessary (HIP.ACC.011)

**Input:** disclosures, content

**Output:** PASS | FAIL

**Steps:**

1. For each disclosure, verify scope matches purpose
2. If over-disclosure evident → RETURN FAIL
3. RETURN PASS

### 5. Algorithm: Encryption at Rest (HIP.SEC.020)

**Input:** system_description, policies

**Output:** PASS | FAIL

**Steps:**

1. Check for encryption at rest (AES-256 or equivalent)
2. If ePHI stored unencrypted → RETURN FAIL
3. RETURN PASS

### 6. Algorithm: Encryption in Transit (HIP.SEC.021)

**Input:** system_description, policies

**Output:** PASS | FAIL

**Steps:**

1. Check for TLS 1.2+ or equivalent for ePHI transmission
2. If unencrypted transmission → RETURN FAIL
3. RETURN PASS

### 7. Algorithm: Audit Logging (HIP.AUD.030)

**Input:** policies, system_description

**Output:** PASS | FAIL

**Steps:**

1. Check for audit trail (who, what, when) for PHI access
2. If no audit logging → RETURN FAIL
3. RETURN PASS

### 8. Algorithm: BAA Required (HIP.BAA.040)

**Input:** baa, business_associates

**Output:** PASS | FAIL

**Steps:**

1. For each BA with PHI access, verify signed BAA exists
2. If PHI shared without BAA → RETURN FAIL
3. RETURN PASS

### 9. Algorithm: Breach Notification (HIP.BRCH.050)

**Input:** breach_policy, content

**Output:** PASS | FAIL

**Steps:**

1. Check for containment, assessment, notification (60 days), documentation
2. If any missing → RETURN FAIL
3. RETURN PASS

### 10. Algorithm: Authorization for Non-Routine Use (HIP.CONS.060)

**Input:** disclosures, authorizations

**Output:** PASS | FAIL

**Steps:**

1. For non-routine disclosures, verify valid patient authorization
2. If disclosure without authorization → RETURN FAIL
3. RETURN PASS
