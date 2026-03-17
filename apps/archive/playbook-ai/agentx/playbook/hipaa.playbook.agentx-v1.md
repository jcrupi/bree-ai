---
agentx:
  version: 1
  created_at: "2025-03-12T00:00:00.000Z"
  type: playbook
  filename: hipaa.playbook.agentx-v1.md
  domain: hipaa
---

# HIPAA Compliance Playbook v1

> Validate healthcare content and processes for HIPAA compliance. At runtime, content is analyzed to ensure it conforms to the playbook and algos. Produces a deep-ai-agent for the HIPAA compliance domain.

## Overview

HIPAA (Health Insurance Portability and Accountability Act) governs the privacy and security of Protected Health Information (PHI). This playbook defines entities, rules, and validation logic for assessing whether policies, procedures, or data handling practices conform to HIPAA requirements. At runtime, pasted content (policies, BAAs, disclosure logs, or system descriptions) is analyzed for conformance.

## Domain

**HIPAA Compliance** — Privacy Rule, Security Rule, and Breach Notification. Covers PHI identification, access controls, minimum necessary, encryption, audit logging, and breach response.

## Entities

- **PHI** — Protected Health Information. 18 identifiers: name, SSN, DOB, address, phone, fax, email, medical record number, health plan number, account number, license/certificate numbers, vehicle identifiers, device identifiers, URLs, IP addresses, biometrics, full-face photos, other unique identifiers. Relates to: Disclosure, Request.
- **Covered Entity** — Health plan, healthcare clearinghouse, or healthcare provider that transmits health information electronically. Relates to: Business Associate, PHI.
- **Business Associate** — Entity that performs functions involving PHI on behalf of a Covered Entity. Relates to: BAA, Covered Entity.
- **BAA** — Business Associate Agreement. Required contract between Covered Entity and Business Associate. Has: permitted uses, safeguards, breach notification obligations. Relates to: Covered Entity, Business Associate.
- **Disclosure** — Release of PHI outside the entity. Has: purpose, recipient, date, consent_obtained, minimum_necessary. Relates to: PHI, Request.
- **Request** — Access or disclosure request. Has: requester, purpose, scope, authorization. Relates to: PHI, Disclosure.
- **Consent** — Patient authorization for use/disclosure. Has: scope, expiration, revocable. Relates to: PHI, Disclosure.
- **AuditLog** — Record of PHI access. Has: user, action, timestamp, resource. Relates to: PHI.

## Rules

### HIP.PHI.001 — PHI identification
- **Check:** Content identifies PHI elements (18 identifiers) when present
- **Fail:** PHI present but not flagged or protected

### HIP.PHI.002 — De-identification
- **Check:** When de-identified, no 18 identifiers remain; safe harbor or expert determination applied
- **Fail:** De-identified data still contains identifiers

### HIP.ACC.010 — Access controls
- **Check:** Unique user IDs, automatic logoff, encryption, access logs
- **Fail:** Missing access control requirements

### HIP.ACC.011 — Minimum necessary
- **Check:** Disclosures limited to minimum necessary for the purpose
- **Fail:** Over-disclosure of PHI

### HIP.SEC.020 — Encryption at rest
- **Check:** ePHI encrypted at rest (AES-256 or equivalent)
- **Fail:** ePHI stored unencrypted

### HIP.SEC.021 — Encryption in transit
- **Check:** ePHI transmitted over TLS 1.2+ or equivalent
- **Fail:** Unencrypted transmission of ePHI

### HIP.AUD.030 — Audit logging
- **Check:** Access to ePHI is logged (who, what, when)
- **Fail:** No audit trail for PHI access

### HIP.BAA.040 — BAA required
- **Check:** Business Associate has signed BAA before PHI access
- **Fail:** PHI shared with BA without BAA

### HIP.BRCH.050 — Breach notification
- **Check:** Breach response includes: containment, assessment, notification (60 days), documentation
- **Fail:** Missing breach notification requirements

### HIP.CONS.060 — Authorization for non-routine use
- **Check:** Non-routine disclosures require valid patient authorization
- **Fail:** PHI disclosed without required authorization

## API Surface

- `POST /api/hipaa/validate` — Run content through playbook
- `POST /api/playback` — Playback Runner

## AgentX Notes

- `hipaa.algos.agentx-v1.md` — Validation rules, RuleCatalog, flow
