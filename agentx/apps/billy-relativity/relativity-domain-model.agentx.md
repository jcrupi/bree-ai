---
title: Relativity eDiscovery — Domain Model
type: domain-model
scope: billy-relativity
stack: Relativity, RelativityOne, REST API, OAuth2
last_updated: 2026-03-08
ai_context: true
tags:
  [relativity, ediscovery, domain-model, arm, workspace, matter, client, oauth2]
see_also:
  - apps/billy-relativity.agentx.md
---

# Relativity eDiscovery — Domain Model

Relativity is a SaaS/self-hosted eDiscovery and legal review platform.
All resources live inside a **Workspace** and most operations are scoped to one.
The outer shell is a hierarchy of **Instance → Client → Matter → Workspace**.

---

## Hierarchy Overview

```
Instance (RelativityOne tenant)
 └── Client                       ← law firm or corporate legal department
      └── Matter                  ← legal case or investigation
           └── Workspace          ← the actual Relativity environment for that matter
                ├── Custodians    ← people whose data is collected
                ├── Data Sources  ← email, fileserver, O365, Slack…
                ├── Processing    ← extract text, dedup, build index
                ├── Review Sets   ← batches of documents for attorneys
                ├── Documents     ← the core unit of review
                ├── Tags / Coding ← attorney decisions on each document
                ├── Productions   ← export packages delivered to opposing counsel
                └── Holds         ← legal hold notices sent to custodians
```

---

## Core Domain Objects

### Instance

The top-level tenant in RelativityOne (or the Relativity server for on-prem).

| Field        | Type   | Notes                                                |
| ------------ | ------ | ---------------------------------------------------- |
| `rel_ins`    | GUID   | Relativity instance ID (appears in JWT as `rel_ins`) |
| `baseUrl`    | string | e.g. `https://ey-us.relativity.one`                  |
| `rel_origin` | string | IP of the instance (JWT claim)                       |

---

### Client

Represents the law firm, company, or organization that owns matters.
Maps to Relativity's **Client** object (ArtifactType 19).

| Field          | Type   | Notes                                |
| -------------- | ------ | ------------------------------------ |
| `artifactID`   | int    | Unique ID in the Relativity database |
| `name`         | string | e.g. "Ernst & Young LLP"             |
| `number`       | string | Client reference code                |
| `status`       | enum   | `Active` \| `Inactive`               |
| `industry`     | string | e.g. "Financial Services"            |
| `contactEmail` | string | Primary contact                      |
| `keywords`     | string | Free-text search tags                |
| `notes`        | string | Free-text notes                      |

---

### Matter

A legal case, investigation, or project. Always belongs to one Client.
Maps to Relativity's **Matter** object (ArtifactType 20).

| Field          | Type   | Notes                                              |
| -------------- | ------ | -------------------------------------------------- |
| `artifactID`   | int    | Unique ID                                          |
| `name`         | string | Human-readable matter name                         |
| `matterNumber` | string | **Format: `E-########`** (EY convention, 8 digits) |
| `status`       | enum   | `Active` \| `Inactive` \| `Closed`                 |
| `clientID`     | int    | FK → Client.artifactID                             |
| `created`      | date   | Creation timestamp                                 |
| `keywords`     | string |                                                    |

> **Validation rule (EY):** `matterNumber` must match `/^E-\d{8}$/`.
> Missing or malformed matter numbers trigger the Alert Admins workflow.

---

### Workspace

The primary operational unit in Relativity. All documents, review, and
processing happen inside a workspace. One Matter can have many workspaces
(e.g. "Phase 1 Review", "Phase 2 Hot Docs").
Maps to Relativity's **Workspace** object (ArtifactType 8).

| Field                   | Type     | Notes                                      |
| ----------------------- | -------- | ------------------------------------------ |
| `artifactID`            | int      | Unique ID                                  |
| `name`                  | string   | e.g. "EY Matter 2025 - Phase 1"            |
| `statusName`            | enum     | `Active` \| `Inactive` \| `Upgrading`      |
| `matterID`              | int      | FK → Matter.artifactID                     |
| `clientID`              | int      | FK → Client.artifactID                     |
| `resourcePoolName`      | string   | Processing and storage resource allocation |
| `defaultFileRepository` | string   | UNC/S3 path for native files               |
| `enableDataGrid`        | bool     | Structured analytics / DataGrid enabled    |
| `created`               | datetime |                                            |
| `lastModified`          | datetime |                                            |
| `keywords`              | string   |                                            |
| `notes`                 | string   |                                            |
| `templateWorkspaceID`   | int?     | Template used when creating this workspace |

---

### Document

The atomic unit of review. Every file ingested into a workspace
becomes one or more Documents (with family relationships for attachments).
Maps to Relativity's **Document** object (ArtifactType 10).

| Field                  | Type      | Notes                                          |
| ---------------------- | --------- | ---------------------------------------------- |
| `artifactID`           | int       |                                                |
| `controlNumber`        | string    | Bates number or document ID (e.g. `EY0001234`) |
| `custodian`            | string    | Person whose data this came from               |
| `documentExtension`    | string    | `pdf`, `docx`, `msg`, `pst`…                   |
| `fileSize`             | long      | Bytes                                          |
| `pageCount`            | int       |                                                |
| `editedBy`             | string    | Last reviewer                                  |
| `relativityNativeType` | string    | MIME / native type (Relativity-classified)     |
| `extractedText`        | string    | Full text for search                           |
| `MD5Hash`              | string    | Deduplication key                              |
| `parentArtifactID`     | int?      | Parent document (email → attachment family)    |
| `hasAttachments`       | bool      |                                                |
| `dateCreated`          | datetime  |                                                |
| `dateSent`             | datetime? | For email                                      |
| `dateReceived`         | datetime? |                                                |
| `from`                 | string    | Email sender                                   |
| `to`                   | string    | Email recipients                               |
| `cc`                   | string    |                                                |
| `bcc`                  | string    |                                                |
| `subject`              | string    | Email subject                                  |
| `fileLocation`         | string    | Internal path in file repository               |

**Coding fields** (set by reviewers — highly matter-specific):

| Field             | Type  | Domain Values                                              |
| ----------------- | ----- | ---------------------------------------------------------- |
| `responsiveness`  | enum  | `Responsive` \| `Non-Responsive` \| `Needs Further Review` |
| `privilege`       | enum  | `Privileged` \| `Not Privileged` \| `Redact`               |
| `confidentiality` | enum  | `Confidential` \| `Highly Confidential` \| `Public`        |
| `hot`             | bool  | Key document for the case                                  |
| `issues`          | multi | Issue tags assigned by attorneys                           |

---

### User

A Relativity user account. Used for access control and audit.
Maps to Relativity's **User** object (ArtifactType 2).

| Field        | Type   | Notes                          |
| ------------ | ------ | ------------------------------ |
| `artifactID` | int    |                                |
| `fullName`   | string |                                |
| `email`      | string |                                |
| `type`       | enum   | `Internal` \| `External`       |
| `enabled`    | bool   |                                |
| `clientID`   | int?   | If scoped to a specific client |

**JWT Claims (from `client_credentials` token):**

| Claim        | Description                                     |
| ------------ | ----------------------------------------------- |
| `rel_uai`    | Relativity User Artifact ID                     |
| `rel_ufn`    | User "First Name" (often service account label) |
| `rel_uln`    | User "Last Name" (e.g. "Service Account")       |
| `rel_un`     | Username / email                                |
| `rel_ins`    | Instance GUID                                   |
| `rel_origin` | Instance IP                                     |
| `or_lb`      | On-behalf-of flag                               |
| `sub`        | Client ID (OAuth2 subject)                      |
| `scope`      | Granted scopes (e.g. `SystemUserInfo`)          |
| `aud`        | `Relativity/resources`                          |
| `iss`        | `Relativity` (issuer)                           |

---

### Group

Security group for access control. Groups are assigned to workspaces
with specific permission profiles.
Maps to Relativity's **Group** object (ArtifactType 3).

| Field              | Type   | Notes                                             |
| ------------------ | ------ | ------------------------------------------------- |
| `artifactID`       | int    |                                                   |
| `name`             | string | e.g. "EY Admins", "Review Team A"                 |
| `type`             | enum   | `SystemGroup` \| `PersonalGroup` \| `ClientGroup` |
| `clientArtifactID` | int?   | Scoped to a specific client                       |

---

### Choice / Field

Relativity uses a **Field** metadata model where each Document field
(and most other object fields) is configurable. Selections on choice
fields are **Choice** objects.

| Object      | Notes                                                                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `Field`     | Defines the column: name, type, object type it belongs to                                                                               |
| `Choice`    | A selectable value within a single/multi-choice field                                                                                   |
| `FieldType` | `Fixed-Length Text`, `Long Text`, `Date`, `Decimal`, `Currency`, `Yes/No`, `Single Choice`, `Multiple Choice`, `User`, `File`, `Object` |

---

### Custodian

A person whose data was collected as part of the matter.
Used for data mapping and legal hold.

| Field        | Type   | Notes                         |
| ------------ | ------ | ----------------------------- |
| `artifactID` | int    |                               |
| `fullName`   | string |                               |
| `email`      | string |                               |
| `title`      | string | Job title                     |
| `company`    | string |                               |
| `department` | string |                               |
| `status`     | enum   | `Active` \| `Former Employee` |

---

### Processing Set

A job that ingests, extracts, deduplicates, and indexes raw data.

| Field               | Type   | Notes                                          |
| ------------------- | ------ | ---------------------------------------------- |
| `artifactID`        | int    |                                                |
| `name`              | string |                                                |
| `status`            | enum   | `New` \| `Processing` \| `Complete` \| `Error` |
| `dataSourceCount`   | int    | Number of attached data sources                |
| `deduplicationType` | enum   | `None` \| `Workspace` \| `Case`                |

---

### Review Set (Batch Set)

A set of documents assigned to a reviewer or review team.
Controls review workflow and tracks progress.

| Field           | Type   | Notes                                     |
| --------------- | ------ | ----------------------------------------- |
| `artifactID`    | int    |                                           |
| `name`          | string | e.g. "Review Batch 001 — Custodian Jones" |
| `assignedTo`    | User   |                                           |
| `status`        | enum   | `In Progress` \| `Completed` \| `QC`      |
| `documentCount` | int    |                                           |
| `reviewedCount` | int    |                                           |
| `dueDate`       | date   |                                           |

---

### Production

An export package of documents delivered to opposing counsel or regulators.
Productions define numbering, branding, redactions, and file formats.

| Field              | Type      | Notes                                              |
| ------------------ | --------- | -------------------------------------------------- |
| `artifactID`       | int       |                                                    |
| `name`             | string    | e.g. "EY Production Vol. 1"                        |
| `batesPrefix`      | string    | e.g. `EY` → documents stamped EY0000001…           |
| `batesStartNumber` | int       |                                                    |
| `status`           | enum      | `New` \| `Staging` \| `Produced` \| `Error`        |
| `format`           | enum      | `Native` \| `PDF` \| `Image (TIFF)` \| `Slipsheet` |
| `includeImages`    | bool      |                                                    |
| `includeNatives`   | bool      |                                                    |
| `includeText`      | bool      |                                                    |
| `burnRedactions`   | bool      |                                                    |
| `producedDate`     | datetime? |                                                    |

---

### Legal Hold

A formal notice sent to custodians instructing them to preserve data
relevant to the matter. Tracks acknowledgement and escalation.

| Field               | Type     | Notes                                        |
| ------------------- | -------- | -------------------------------------------- |
| `artifactID`        | int      |                                              |
| `name`              | string   |                                              |
| `type`              | enum     | `Email Hold` \| `File Hold` \| `Device Hold` |
| `status`            | enum     | `Active` \| `Released`                       |
| `custodians`        | User[]   | Recipients                                   |
| `sentDate`          | datetime |                                              |
| `acknowledgedCount` | int      |                                              |
| `pendingCount`      | int      |                                              |

---

## Domain Value Enumerations

### Workspace Status

| Value       | Meaning                                |
| ----------- | -------------------------------------- |
| `Active`    | Fully operational                      |
| `Inactive`  | Disabled, read-only                    |
| `Upgrading` | Relativity version upgrade in progress |

### Document Responsiveness

| Value                  | Meaning                                   |
| ---------------------- | ----------------------------------------- |
| `Responsive`           | Relevant to the matter — must be produced |
| `Non-Responsive`       | Not relevant — withheld from production   |
| `Needs Further Review` | Uncertain — escalate to senior reviewer   |

### Document Privilege

| Value            | Meaning                                          |
| ---------------- | ------------------------------------------------ |
| `Privileged`     | Attorney-client or work product — never produced |
| `Not Privileged` | No privilege claim                               |
| `Redact`         | Produce with privileged portions blacked out     |

### Confidentiality (common designation)

| Value                 | Meaning                                      |
| --------------------- | -------------------------------------------- |
| `Confidential`        | Business-sensitive                           |
| `Highly Confidential` | Trade secrets, PII — restricted distribution |
| `Public`              | No restriction                               |

### Resource Pool

Controls what processing and storage resources a workspace consumes.
Common values in RelativityOne:

| Value           | Notes                           |
| --------------- | ------------------------------- |
| `Default`       | Shared pool                     |
| `RelativityOne` | Standard cloud pool             |
| `Premium`       | Larger allocations, higher cost |

### OAuth2 Grant Types (Relativity Identity)

| Grant Type           | Use case                                   |
| -------------------- | ------------------------------------------ |
| `authorization_code` | Interactive browser SSO login (SAML/OIDC)  |
| `client_credentials` | Machine-to-machine / service account token |
| `implicit`           | Legacy browser flow (deprecated)           |

### OAuth2 Scopes

| Scope                     | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `SystemUserInfo`          | Basic user identity claims (`rel_uai`, `rel_un`) |
| `openid`                  | OIDC base scope                                  |
| `UserInfo`                | Extended user profile                            |
| `RelativityWeb`           | Browser SSO session scope                        |
| `RelativityRequestOrigin` | Instance origin tag                              |
| `SecureTokenServiceAdmin` | STS admin operations                             |

---

## REST API Quick Reference

All endpoints are relative to `{instanceUrl}/Relativity.REST/api`.

| Resource        | Method | Endpoint                                                              |
| --------------- | ------ | --------------------------------------------------------------------- |
| List workspaces | GET    | `/Relativity.Objects/workspace`                                       |
| Get workspace   | GET    | `/Relativity.Objects/workspace/{workspaceId}`                         |
| Query objects   | POST   | `/{workspaceId}/Relativity.Objects/query`                             |
| Read document   | GET    | `/{workspaceId}/Relativity.Objects/{artifactId}`                      |
| Create object   | POST   | `/{workspaceId}/Relativity.Objects`                                   |
| Update object   | PUT    | `/{workspaceId}/Relativity.Objects/{artifactId}`                      |
| Delete object   | DELETE | `/{workspaceId}/Relativity.Objects/{artifactId}`                      |
| Get token       | POST   | `/Identity/connect/token` (form-encoded, `client_credentials`)        |
| List users      | GET    | `/Relativity.Services.Interfaces.UserManager/UserManager/ReadAsync`   |
| List groups     | GET    | `/Relativity.Services.Interfaces.GroupManager/GroupManager/ReadAsync` |

**Auth header for all REST calls:**

```
Authorization: Bearer {access_token}
X-CSRF-Header: 1
```

---

## Object ArtifactType IDs (Key)

| ArtifactTypeID | Object Type     |
| -------------- | --------------- |
| 2              | User            |
| 3              | Group           |
| 8              | Workspace       |
| 10             | Document        |
| 19             | Client          |
| 20             | Matter          |
| 21             | Field           |
| 22             | Choice          |
| 25             | Workspace (alt) |
| 45             | Processing Set  |
| 65             | Batch Set       |
| 66             | Legal Hold      |
| 100            | Production      |
