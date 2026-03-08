---
agentx:
  version: 1
  created_at: "2026-03-07T00:00:00.000Z"
  type: workflows
  filename: hipaa.workflows.agentx-v1.md
  domain: HIPAA Compliance
  triggers:
    - nats: "playbook.hipaa.>"
    - http: "POST /api/workflows/hipaa/run"
---

# HIPAA Workflows v1

> **Purpose:** Executable workflows for HIPAA compliance operations within the Playbook platform.
> Covers PHI handling, audit trail generation, encryption verification, and breach notification.
> Complements `hipaa.algos.agentx-v1.md` (validation rules) and `hipaa.playbook.agentx-v1.md` (knowledge).

---

## WorkflowCatalog

```yaml
# HIPAA WorkflowCatalog
domain: "hipaa"
version: 1
created_at: "2026-03-07T00:00:00Z"

workflows:
  HIPAA.VALIDATE.001:
    id: "HIPAA.VALIDATE.001"
    name: "PHI Access Validation"
    description: "Validates that a PHI access request is HIPAA-compliant before granting access"
    trigger:
      type: "event"
      source: "nats:playbook.hipaa.phi-access-requested"
    input:
      - name: "requesterId"
        type: string
        required: true
      - name: "patientId"
        type: string
        required: true
      - name: "purpose"
        type: string
        required: true
      - name: "accessType"
        type: "read | write | delete"
        required: true
    steps:
      - id: "step-1"
        name: "Validate requester identity"
        type: action
        action: validateRequesterIdentity
        on_success: "step-2"
        on_failure: "fail"
      - id: "step-2"
        name: "Check minimum necessary standard"
        type: action
        action: checkMinimumNecessary
        on_success: "step-3"
        on_failure: "fail"
      - id: "step-3"
        name: "Log PHI access attempt"
        type: emit
        subject: "playbook.hipaa.phi-access-logged"
        payload:
          event: "phi-access-attempt"
        on_success: "step-4"
        on_failure: "step-4"
      - id: "step-4"
        name: "Grant or deny access"
        type: condition
        condition: "state['step-1'].valid && state['step-2'].compliant"
        on_true: "step-5"
        on_false: "step-6"
      - id: "step-5"
        name: "Emit access granted"
        type: emit
        subject: "playbook.hipaa.phi-access-granted"
        on_success: "complete"
        on_failure: "complete"
      - id: "step-6"
        name: "Emit access denied"
        type: emit
        subject: "playbook.hipaa.phi-access-denied"
        on_success: "complete"
        on_failure: "complete"
    output:
      type: PHIAccessResult
      fields: ["granted", "reason", "auditTrailId"]

  HIPAA.AUDIT.010:
    id: "HIPAA.AUDIT.010"
    name: "Audit Trail Generation"
    description: "Generates a compliant HIPAA audit trail entry for any PHI-related operation"
    trigger:
      type: "event"
      source: "nats:playbook.hipaa.phi-access-logged"
    input:
      - name: "operationType"
        type: "read | write | delete | share"
        required: true
      - name: "userId"
        type: string
        required: true
      - name: "patientId"
        type: string
        required: true
      - name: "timestamp"
        type: string
        required: true
    steps:
      - id: "step-1"
        name: "Build audit record"
        type: action
        action: buildAuditRecord
        on_success: "step-2"
        on_failure: "fail"
      - id: "step-2"
        name: "Sign audit record"
        type: action
        action: signAuditRecord
        on_success: "step-3"
        on_failure: "fail"
      - id: "step-3"
        name: "Persist to audit log"
        type: action
        action: persistAuditRecord
        on_success: "step-4"
        on_failure: "rollback-1"
      - id: "step-4"
        name: "Emit audit created"
        type: emit
        subject: "playbook.hipaa.audit-record-created"
        on_success: "complete"
        on_failure: "complete"
    rollback:
      - id: "rollback-1"
        name: "Delete partial audit record"
        type: action
        action: deletePartialAuditRecord
    output:
      type: AuditRecord
      fields: ["auditId", "hash", "timestamp", "persisted"]

  HIPAA.BREACH.020:
    id: "HIPAA.BREACH.020"
    name: "Breach Notification Workflow"
    description: |
      Executes the full HIPAA breach notification procedure:
      discovery → risk assessment → notification → HHS report.
      Must complete within 60 days of breach discovery.
    trigger:
      type: "manual"
    input:
      - name: "breachId"
        type: string
        required: true
      - name: "discoveryDate"
        type: string
        required: true
      - name: "affectedPatientIds"
        type: "string[]"
        required: true
      - name: "breachDescription"
        type: string
        required: true
    steps:
      - id: "step-1"
        name: "Run risk assessment algos"
        type: action
        action: runAlgosValidation
        params:
          specialty: "hipaa"
          ruleId: "HIPAA.BREACH.001"
        on_success: "step-2"
        on_failure: "fail"
      - id: "step-2"
        name: "Classify breach severity"
        type: action
        action: classifyBreachSeverity
        on_success: "step-3"
        on_failure: "fail"
      - id: "step-3"
        name: "Branch on severity"
        type: condition
        condition: "state['step-2'].severity === 'high'"
        on_true: "step-4a"
        on_false: "step-4b"
      - id: "step-4a"
        name: "Notify affected patients (high severity)"
        type: parallel
        steps: ["notify-patients", "notify-media", "prepare-hhs"]
        join: "all"
        on_success: "step-5"
        on_failure: "fail"
      - id: "step-4b"
        name: "Notify affected patients (low severity)"
        type: action
        action: notifyAffectedPatients
        on_success: "step-5"
        on_failure: "fail"
      - id: "step-5"
        name: "Human approval: HHS report"
        type: human
        prompt: "Review the HHS breach report before submission. Approve to submit."
        timeout: "48h"
        on_timeout: "fail"
        on_success: "step-6"
        on_failure: "fail"
      - id: "step-6"
        name: "Submit HHS report"
        type: action
        action: submitHHSReport
        on_success: "step-7"
        on_failure: "fail"
      - id: "step-7"
        name: "Emit breach closed"
        type: emit
        subject: "playbook.hipaa.breach-notification-complete"
        on_success: "complete"
        on_failure: "complete"
    output:
      type: BreachNotificationResult
      fields:
        ["hhsConfirmationId", "patientsNotified", "notificationDate", "status"]
```

---

## 1. Workflow: PHI Access Validation (HIPAA.VALIDATE.001)

**Trigger:** `nats:playbook.hipaa.phi-access-requested`
**Input:** `requesterId`, `patientId`, `purpose`, `accessType`
**Output:** `{ granted: boolean, reason: string, auditTrailId: string }`

### 1.1 Flow Diagram

```
TRIGGER: playbook.hipaa.phi-access-requested
             │
             ▼
┌────────────────────────────────┐
│  Step 1: Validate Identity     │  ── FAIL ──▶ [FAIL: unauthorized]
│  (action: validateRequester)   │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 2: Minimum Necessary     │  ── FAIL ──▶ [FAIL: not-minimum-necessary]
│  (action: checkMinimumNecessary│
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 3: Log Access Attempt    │
│  (emit: phi-access-logged)     │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────┐
│  Step 4: Grant or Deny?        │
│  (condition: valid && compliant│
└──────────────┬─────────────────┘
         ┌─────┴──────┐
       true          false
         │             │
         ▼             ▼
  [emit: granted]  [emit: denied]
         │             │
         └──────┬───────┘
                ▼
           [COMPLETE]
```

### 1.2 Steps

| Step   | Type      | Action / Condition                                   | On Success | On Failure |
| ------ | --------- | ---------------------------------------------------- | ---------- | ---------- |
| step-1 | action    | `validateRequesterIdentity`                          | step-2     | fail       |
| step-2 | action    | `checkMinimumNecessary`                              | step-3     | fail       |
| step-3 | emit      | `playbook.hipaa.phi-access-logged`                   | step-4     | step-4     |
| step-4 | condition | `state['step-1'].valid && state['step-2'].compliant` | step-5     | step-6     |
| step-5 | emit      | `playbook.hipaa.phi-access-granted`                  | complete   | complete   |
| step-6 | emit      | `playbook.hipaa.phi-access-denied`                   | complete   | complete   |

---

## 2. Workflow: Audit Trail Generation (HIPAA.AUDIT.010)

**Trigger:** `nats:playbook.hipaa.phi-access-logged`
**Input:** `operationType`, `userId`, `patientId`, `timestamp`
**Output:** `{ auditId, hash, timestamp, persisted }`

### 2.1 Flow Diagram

```
TRIGGER: playbook.hipaa.phi-access-logged
             │
             ▼
┌────────────────────────────────┐
│  Step 1: Build Audit Record    │  ── FAIL ──▶ [FAIL]
│  (action: buildAuditRecord)    │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 2: Sign Record           │  ── FAIL ──▶ [FAIL]
│  (action: signAuditRecord)     │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 3: Persist to Audit Log  │  ── FAIL ──▶ [ROLLBACK: deletePartial]
│  (action: persistAuditRecord)  │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 4: Emit audit-created    │
│  (emit: audit-record-created)  │
└──────────────┬─────────────────┘
               │
           [COMPLETE]
```

### 2.2 Rollback

| Rollback ID | Action                     | Undoes                   |
| ----------- | -------------------------- | ------------------------ |
| rollback-1  | `deletePartialAuditRecord` | step-3 (partial persist) |

---

## 3. Workflow: Breach Notification (HIPAA.BREACH.020)

**Trigger:** Manual (compliance officer initiates)
**Input:** `breachId`, `discoveryDate`, `affectedPatientIds[]`, `breachDescription`
**Output:** `{ hhsConfirmationId, patientsNotified, notificationDate, status }`
**Deadline:** Must complete within 60 days of `discoveryDate`

### 3.1 Flow Diagram

```
TRIGGER: manual (compliance officer)
             │
             ▼
┌────────────────────────────────┐
│  Step 1: Run Algos Validation  │  ── FAIL ──▶ [FAIL: not-reportable]
│  (HIPAA.BREACH.001 rule)       │
└──────────────┬─────────────────┘
               │ PASS
               ▼
┌────────────────────────────────┐
│  Step 2: Classify Severity     │  ── FAIL ──▶ [FAIL]
│  (action: classifyBreach)      │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 3: Branch on Severity    │
│  (condition: severity === high)│
└──────────────┬─────────────────┘
        ┌──────┴───────┐
       HIGH            LOW
        │               │
        ▼               ▼
┌──────────────┐  ┌────────────────────┐
│ Step 4a:     │  │ Step 4b:           │
│ PARALLEL:    │  │ Notify Patients    │
│ • patients   │  │ (action)           │
│ • media      │  └─────────┬──────────┘
│ • HHS prep   │            │
└──────┬───────┘            │
       │                    │
       └─────────┬──────────┘
                 │
                 ▼
┌────────────────────────────────┐
│  Step 5: 🧑 Human Approval     │  ── TIMEOUT (48h) ──▶ [FAIL]
│  Review HHS report             │
└──────────────┬─────────────────┘
               │ APPROVED
               ▼
┌────────────────────────────────┐
│  Step 6: Submit HHS Report     │  ── FAIL ──▶ [FAIL]
│  (action: submitHHSReport)     │
└──────────────┬─────────────────┘
               │ OK
               ▼
┌────────────────────────────────┐
│  Step 7: Emit breach-complete  │
│  (emit: breach-notification-   │
│   complete)                    │
└──────────────┬─────────────────┘
               │
           [COMPLETE]
```

### 3.2 Special Step — Parallel Execution (step-4a)

```
step-4a runs these concurrently (join: all — all must complete):
  ├─ notify-patients  (action: notifyAffectedPatients)
  ├─ notify-media     (action: issueMediaNotice)       ← only if >500 patients affected
  └─ prepare-hhs      (action: prepareHHSReport)
```

### 3.3 Special Step — Human Approval (step-5)

```
type: human
prompt: "Review the HHS breach report before submission. Approve to submit."
timeout: 48h
on_timeout: fail   ← escalation required if no approval within 48h
```

---

## 4. Adapter Reference (hipaa.adapter.ts)

| Handler                     | Called by                   | Returns                                      |
| --------------------------- | --------------------------- | -------------------------------------------- |
| `validateRequesterIdentity` | HIPAA.VALIDATE.001 step-1   | `{ valid, userId, roles }`                   |
| `checkMinimumNecessary`     | HIPAA.VALIDATE.001 step-2   | `{ compliant, reason }`                      |
| `buildAuditRecord`          | HIPAA.AUDIT.010 step-1      | `AuditRecord`                                |
| `signAuditRecord`           | HIPAA.AUDIT.010 step-2      | `{ signed, hash }`                           |
| `persistAuditRecord`        | HIPAA.AUDIT.010 step-3      | `{ persisted, auditId }`                     |
| `deletePartialAuditRecord`  | HIPAA.AUDIT.010 rollback-1  | `void`                                       |
| `runAlgosValidation`        | HIPAA.BREACH.020 step-1     | AlgosValidationResult                        |
| `classifyBreachSeverity`    | HIPAA.BREACH.020 step-2     | `{ severity: 'high'\|'low', affectedCount }` |
| `notifyAffectedPatients`    | HIPAA.BREACH.020 step-4a/4b | `{ notified, failedCount }`                  |
| `issueMediaNotice`          | HIPAA.BREACH.020 step-4a    | `{ published, mediaOutlets }`                |
| `prepareHHSReport`          | HIPAA.BREACH.020 step-4a    | `HHSReport`                                  |
| `submitHHSReport`           | HIPAA.BREACH.020 step-6     | `{ hhsConfirmationId }`                      |

---

## 5. NATS Event Map

```
PUBLISHED BY THIS DOMAIN:
  playbook.hipaa.phi-access-logged         ← step 3 of HIPAA.VALIDATE.001
  playbook.hipaa.phi-access-granted        ← step 5 of HIPAA.VALIDATE.001
  playbook.hipaa.phi-access-denied         ← step 6 of HIPAA.VALIDATE.001
  playbook.hipaa.audit-record-created      ← step 4 of HIPAA.AUDIT.010
  playbook.hipaa.breach-notification-complete ← step 7 of HIPAA.BREACH.020

SUBSCRIBED BY THIS DOMAIN:
  playbook.hipaa.phi-access-requested      → triggers HIPAA.VALIDATE.001
  playbook.hipaa.phi-access-logged         → triggers HIPAA.AUDIT.010
```

---

_This is AI-readable. Ask about how a workflow step invokes algos validation, the
parallel execution of breach notification steps, the human approval gate, or
the NATS event chain connecting HIPAA.VALIDATE.001 → HIPAA.AUDIT.010._
