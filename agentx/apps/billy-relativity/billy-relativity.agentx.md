---
title: Billy Relativity — Client Domain View & Compliance Alerts
type: app-feature
app: billy-relativity
scope: business-process
stack: Bun, Elysia, React, Eden, Fly.io
url: https://billy-relativity.fly.dev
last_updated: 2026-03-08
ai_context: true
audience: business-expert
---

# Billy Relativity — Client Domain View & Compliance Alerts

Billy Relativity is an **eDiscovery workspace management tool** built on the BREE stack (Bun + React + Elysia + Eden). It surfaces Relativity workspace data organized by **client domain** and automates **matter number compliance enforcement** by routing alerts directly to the right administrators.

---

## The Business Problem

Relativity instances host workspaces for many different law firm clients simultaneously. Each workspace is linked to a **matter** (a legal case or engagement), and each matter must carry a **matter number** — a unique identifier used for billing, case management, and regulatory traceability.

The required matter number format is:

```
E-########
```

That is: the letter **E**, a dash, and exactly **8 digits** (e.g., `E-20260115`).

When matter numbers are missing, wrong, or free-form (like `MAT-9921` or `BARE`), downstream systems break:

- **Billing** cannot correlate workspace usage to a client invoice
- **Compliance reports** (particularly for SEC/regulatory matters) fail validation
- **Matter management software** rejects imports or produces corrupted data
- **Audits** flag the workspace as ungoverned

---

## Story 1 — Client Domain View

### What it shows

The **Client Domains** tab answers the question:

> _"For every client we serve, what workspaces do they have, under which matters, and who is responsible for them?"_

| Concept           | Relativity Term                    | Meaning                                                 |
| ----------------- | ---------------------------------- | ------------------------------------------------------- |
| **Client Domain** | `Client`                           | A law firm or corporate legal department                |
| **Matter**        | `Matter`                           | A legal case, investigation, or project                 |
| **Matter Number** | `matterNumber`                     | The required `E-########` identifier                    |
| **Workspace**     | `Workspace`                        | A Relativity review environment holding documents       |
| **Domain Admin**  | `Client Domain Admin for [Client]` | The Relativity group responsible for that client's data |

### How it works (step by step)

1. The backend calls `GET /api/clients/domain-view`
2. For every client, it finds all their workspaces and groups them by matter
3. Each matter's matter number is validated against the pattern `E-\d{8}`
4. The client's **Client Domain Admin** group is resolved, and its members (email addresses) are listed
5. The UI renders one expandable card per client:
   - **Green** = all matter numbers are compliant
   - **Red border + warning badge** = one or more matters have an invalid number
   - Expanding the card shows the admin group members and each matter grouped with its workspaces

### Reading the matter number badge

| Badge                  | Meaning                                  |
| ---------------------- | ---------------------------------------- |
| `✓ E-20260115` (green) | Valid — conforms to `E-########`         |
| `⚠ MAT-9921` (red)     | Invalid — non-standard format            |
| `⚠ MISSING` (red)      | Empty — no matter number assigned at all |

### Summary bar (top of the tab)

| Stat              | Meaning                                           |
| ----------------- | ------------------------------------------------- |
| Total Clients     | Number of client domains in the system            |
| Total Workspaces  | Sum of all workspaces across all clients          |
| Invalid Matter #s | Count of matters that fail the `E-########` check |

---

## Story 2 — Compliance Alerts

### What it does

The **Compliance Alerts** tab automates the notification step:

> _"Find every client domain that has a workspace with an invalid matter number, identify who their admins are, and send them an email."_

The emails go to the **Client Domain Admin group** for the affected client — not to a generic inbox, but to the specific people responsible for that client domain in Relativity.

### Why this matters

In Relativity, each client has a corresponding group named:

```
Client Domain Admin for [Client Name]
```

This group is managed by Relativity administrators and contains the users who can take action on that client's workspace configuration. By targeting this group specifically, the alert reaches decision-makers who have both the authority and the access to fix the matter number.

### Sending alerts

| Button                          | What happens                                                             |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Send Alert** (per client row) | Sends a compliance email to that client's domain admin group             |
| **Alert All** (top right)       | Sends alerts to all clients that have at least one invalid matter number |

The email contains:

- The names of each non-compliant workspace
- The current (invalid) matter number next to each workspace name
- Clear instructions on the required `E-########` format

### Email log

Every sent alert is recorded in the **Email Logs** section at the bottom:

- **TO**: the list of admin email addresses
- **Subject**: `⚠️ Matter Number Compliance Alert — [Client Name]`
- **Flagged Workspaces**: each problematic workspace with its bad matter number shown
- **Full email body**: expandable preview of the exact text sent

> In production, the email log records would trigger a real SMTP/SendGrid/SES delivery. In the current version (mock), the log is stored in memory and the email body is composed and previewable — delivery is simulated.

---

## Data Model

```
Client
  └─ has many: Workspace(s)
  └─ has one:  Client Domain Admin Group
               └─ has many: User(s) (the admins' email addresses)

Workspace
  └─ belongs to: Matter
  └─ belongs to: Client

Matter
  └─ has: matterNumber  (must match E-########)
  └─ belongs to: Client

Group
  └─ type: "ClientDomainAdmin"
  └─ clientArtifactID: links to Client
  └─ members: User[]
```

---

## Compliance Rule

```
VALID:   /^E-\d{8}$/
  • E-20260115  ✓
  • E-00000001  ✓

INVALID: anything else
  • MAT-9921    ✗  (wrong prefix and format)
  • BARE        ✗  (not a number at all)
  • E-123       ✗  (too few digits)
  • ""          ✗  (empty / missing)
```

---

## API Endpoints (for integrators)

| Method | Endpoint                                | Description                                                    |
| ------ | --------------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/api/clients/domain-view`              | Full client domain view with matters, workspaces, admin groups |
| `GET`  | `/api/users`                            | All Relativity users in the system                             |
| `GET`  | `/api/groups`                           | All groups including `ClientDomainAdmin` groups                |
| `GET`  | `/api/groups/:id/members`               | Members of a specific group                                    |
| `POST` | `/api/email/compliance-alert/:clientId` | Send compliance alert for one client                           |
| `POST` | `/api/email/compliance-alert-all`       | Send compliance alerts to all non-compliant clients            |
| `GET`  | `/api/email/logs`                       | View all sent alert logs                                       |

### Example: `/api/clients/domain-view` response shape

```json
{
  "success": true,
  "totalClients": 3,
  "totalWorkspaces": 8,
  "totalInvalidMatters": 3,
  "data": [
    {
      "client": { "artifactID": 1003663, "name": "Acme Corporation", ... },
      "adminGroup": { "name": "Client Domain Admin for Acme Corporation", ... },
      "admins": [
        { "fullName": "Diana Park", "email": "dpark@acme.com" },
        { "fullName": "Carlos Mendez", "email": "cmendez@acme.com" }
      ],
      "matters": [
        {
          "matter": { "name": "Patent Litigation 2026", "matterNumber": "E-20260115" },
          "matterNumberValid": true,
          "workspaces": [ ... ]
        },
        {
          "matter": { "name": "IP Assignment Review", "matterNumber": "BARE" },
          "matterNumberValid": false,
          "workspaces": [ ... ]
        }
      ],
      "totalWorkspaces": 4,
      "invalidMatterCount": 1
    }
  ]
}
```

---

## Mock Data (Seeded Scenarios)

Three clients are pre-loaded with a realistic mix of valid and invalid matter numbers:

| Client                | Matter                    | Matter Number | Valid? |
| --------------------- | ------------------------- | ------------- | ------ |
| Acme Corporation      | Patent Litigation 2026    | `E-20260115`  | ✅     |
| Acme Corporation      | IP Assignment Review      | `BARE`        | ❌     |
| Global Industries Inc | Contract Dispute Phase II | `MAT-9921`    | ❌     |
| Global Industries Inc | Employment Settlement     | `E-20251201`  | ✅     |
| TechStart Ventures    | Regulatory Investigation  | `E-20260120`  | ✅     |
| TechStart Ventures    | SEC Subpoena Response     | _(empty)_     | ❌     |

This means two clients (Acme, Global, TechStart) will each receive a compliance alert when **Alert All** is triggered.

---

## Relativity Connection (OAuth2)

The top bar of the application lets Bill connect to a **real Relativity instance** using OAuth2 Client Credentials:

1. Enter **Instance URL**, **Client ID**, and **Client Secret**
2. The backend proxies `POST /Relativity/Identity/connect/token` to avoid browser CORS restrictions
3. On success, a Bearer access token is returned (copyable for further API calls)
4. Client ID and Secret are found in **Relativity → Home → OAuth2 Clients**

> Credentials are **never stored** — they are used once per authentication attempt and discarded.

---

## Local Dev

```bash
cd apps/billy-relativity

# Backend (Elysia API, port 3001)
cd backend && bun run dev

# Frontend (Vite + React, port 3000 → proxies /api to 3001)
cd frontend && bun run dev
```

## Deploy to Fly

```bash
cd apps/billy-relativity

# Build frontend first (bun's vite works fine locally)
cd frontend && bunx vite build && cd ..

# Deploy (Dockerfile ships pre-built dist/)
fly deploy
```

Live URL: **https://billy-relativity.fly.dev**
