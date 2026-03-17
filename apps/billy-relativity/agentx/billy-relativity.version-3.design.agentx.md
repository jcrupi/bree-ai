---
agentx:
  version: 3
  created_at: "2026-03-13T00:00:00.000Z"
  type: playbook
  filename: billy-relativity.version-3.design.agentx.md
  domain: relativity-workspace-command-center
  supersedes: billy-relativity.version-2.design.agentx.md
---

# Billy Relativity — Version 3 Requirements

> AgentX specification for billy-relativity v3. Refines Client, Matter, and Workspace display with usage metrics, filtering rules, and expanded workspace metadata. Builds on v2.

---

## 1. Client Requirements

### 1.1 Client Domain Filtering

- **Client Domain Status**: Clients have a field `Client Domain Status` with values:
  - `Client Domain`
  - `Non-Client Domain`
- **Display Rule**: Only **Client Domains** should be shown in this view. Filter out Non-Client Domain clients.

### 1.2 Client-Level Display Fields

| Field | Description |
|-------|-------------|
| **Artifact ID** | Client artifact ID |
| **Client Number** | Client number (e.g. E-1000002 style) |

### 1.3 Client Domain Admins

- Each Client Domain has a **Group** containing **Client Domain Admins**
- **Do NOT** list admins directly on the screen
- **Access**: Admins should be accessible via a **button or dialog** (e.g. "View Client Domain Admins")

### 1.4 Client-Level Usage Metrics (from usage reports)

Display the following counts/sums at the client level:

| Metric | Description |
|--------|-------------|
| **Count of Repository Workspaces** | Number of workspaces with Repository installed |
| **Count of Cold Storage cases** | Number of Cold Storage workspaces |
| **Count of Review cases** | Number of Review workspaces |
| **Sum of documents** | Total documents across client |
| **Sum of Repository Data** | Total Repository data size |
| **Sum of Review Data** | Total Review data size |
| **Sum of Cold Storage Data** | Total Cold Storage data size |

### 1.5 Client Display — Exclusions

- **Email addresses** associated with client domains are **not needed** — do not display.

---

## 2. Matter Requirements

### 2.1 Matter Filtering

- **Display Rule**: Only matters that **have associated workspaces** should be displayed.
- Hide matters with zero workspaces.

### 2.2 Matter-Level Display Fields

| Field | Description |
|-------|-------------|
| **Artifact ID** | Matter artifact ID |
| **Matter Number** | Matter number (e.g. #1024861) |
| **Workspace Count** | Number of workspaces in the matter |

### 2.3 Matter Display — Exclusions

- **Active status** does **not** need to be shown for matters (can be omitted from matter rows).

### 2.4 Matter-Level Usage Metrics

| Metric | Description |
|--------|-------------|
| **Count of workspaces** | Number of workspaces in the matter |
| **Sum of documents** | Total documents in the matter |
| **Sum of Repository data** | Total Repository data for the matter |
| **Sum of Review data** | Total Review data for the matter |
| **Sum of Cold Storage data** | Total Cold Storage data for the matter |

### 2.5 Matter UI Layout

- Summary bar: **Workspaces count** and **Matters count** (e.g. "5 workspaces", "5 matters") with dropdown
- **+ New Matter** button
- List under **MATTERS** heading
- Each matter row: expansion arrow, document icon, Matter Name, Matter Number, identifier (E-########), workspace count
- Expandable to reveal workspaces beneath

---

## 3. Workspace Requirements

### 3.1 Workspace Statuses

| Status | Display |
|--------|---------|
| **Active** | Green badge/tag |
| **Cold Storage** | Icy blue badge/tag |

### 3.2 Workspace Banner

- **If Repository is installed**: Workspace banner/row should be **yellow**
- Otherwise: default styling

### 3.3 Workspace Display Fields

| Field | Description |
|-------|-------------|
| **Artifact ID** | Workspace artifact ID |
| **Is it using Data Grid** | Boolean (e.g. DataGrid: ✓ / ✗) |
| **Is Repository Application installed** | Boolean |
| **Resource Pool** | Resource pool name |
| **Created By** | User who created the workspace |
| **Created On** | Creation date |
| **Workspace Admin Group** | Admin group name (if available) |
| **Count of Documents** | Document count in workspace |
| **Peak Hosted Data** | Peak hosted data size |
| **SQL Size** | SQL database size |
| **dtSearch Index size** | dtSearch index size |

### 3.4 Workspace UI Layout (expanded matter)

- Workspace name as heading
- Status badge (Active = green, Cold Storage = icy blue)
- ID, Pool, DataGrid
- Modified date
- **+ Add Workspace** button
- All fields from §3.3 as appropriate

---

## 4. Summary Checklist

| # | Category | Requirement | Status |
|---|----------|-------------|--------|
| 1 | Client | Filter to Client Domains only (exclude Non-Client Domain) | ☐ |
| 2 | Client | Display artifact ID and Client Number | ☐ |
| 3 | Client | Client Domain Admins via button/dialog (not on screen) | ☐ |
| 4 | Client | Usage metrics: Repository/Cold/Review counts, document sum, data sums | ☐ |
| 5 | Client | Do not display client email addresses | ☐ |
| 6 | Matter | Show only matters with workspaces | ☐ |
| 7 | Matter | Display artifact ID, Matter Number, Workspace Count | ☐ |
| 8 | Matter | Omit Active status for matters | ☐ |
| 9 | Matter | Matter usage metrics (workspaces, documents, data sums) | ☐ |
| 10 | Workspace | Statuses: Active (green), Cold Storage (icy blue) | ☐ |
| 11 | Workspace | Yellow banner when Repository installed | ☐ |
| 12 | Workspace | Full metadata: DataGrid, Repository, Pool, Created By/On, Admin Group | ☐ |
| 13 | Workspace | Usage: Document count, Peak Hosted Data, SQL Size, dtSearch Index size | ☐ |

---

## 5. Data Sources & APIs

- **Usage reports**: Repository/Cold Storage/Review counts and data sums may come from Relativity usage/analytics APIs or reporting endpoints
- **Workspace Manager (REST)**: Workspace metadata, resource pool
- **Object Manager (REST)**: Document counts
- **Application Install / Application Manager**: Repository installation check
- **Group Manager / Security**: Workspace Admin Group, Client Domain Admins

---

## 6. Relationship to v2

Version 3 extends and refines v2:

- **Retained**: Repository yellow banner, Workspace Creator/Created On, Workspace Admin Group, matter count above workspace count
- **New**: Client Domain Status filter, Client/Matter/Workspace usage metrics, Cold Storage status, expanded workspace fields (Peak Hosted Data, SQL Size, dtSearch Index), Client Domain Admins via dialog
- **Changed**: Matter display (no Active status, only matters with workspaces), client display (no emails, artifact ID + Client Number)

---

*AgentX v3 — Billy Relativity Command Center*
