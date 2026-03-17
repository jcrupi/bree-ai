---
agentx:
  version: 3
  created_at: "2026-03-13T00:00:00.000Z"
  type: implementation
  filename: billy-relativity.impl.version-3.agentx.md
  domain: relativity-workspace-command-center
  references:
    - billy-relativity.version-3.design.agentx.md
---

# Billy Relativity — Implementation Instructions v3

> **Purpose**: Stepwise instructions for AI to generate v3 features. Execute one step at a time. Each step is self-contained unless dependencies are noted.

**Reference**: See `billy-relativity.version-3.design.agentx.md` for full requirements.

**Stack**: BREE — Bun, React 19, Elysia, Eden Treaty. TypeScript only. No npm/yarn/pnpm.

---

## How to Use This Document

1. **Implement steps in order** unless a step explicitly says it can be done in parallel.
2. **One step per session** — complete, test, and commit before moving on.
3. **Mock first, live later** — add mock data/endpoints first, then wire to live Relativity when available.
4. **Preserve existing behavior** — do not break mock mode or existing tabs.

---

## Step 1: Client Domain Status Filter & Display Fields

**Requirement**: Only show clients with `Client Domain Status = "Client Domain"`. Display artifact ID and Client Number. Remove client email addresses.

**Files to modify**:
- `backend/src/data/mockData.ts` — add `clientDomainStatus: 'Client Domain' | 'Non-Client Domain'`, `clientNumber: string` to Client
- `backend/src/index.ts` — filter clients in `/api/clients`, `/api/clients/domain-view` to exclude Non-Client Domain; include `clientNumber` in responses
- `frontend/src/components/ClientDomainView.tsx` — update `ClientDomain`/client display: show artifact ID, Client Number; remove `contactEmail` from display

**Actions**:
1. **Backend**: Add `clientDomainStatus` and `clientNumber` to Client interface and mock data. Some clients "Client Domain", some "Non-Client Domain".
2. **Backend**: Filter domain-view and client list to only return clients where `clientDomainStatus === 'Client Domain'`.
3. **Frontend**: In ClientCard header and any client summary, display artifact ID and Client Number. Remove or hide `contactEmail` / `client.contactEmail`.

**Acceptance**: Only Client Domain clients appear. Client rows show artifact ID and Client Number. No email addresses on client display.

---

## Step 2: Client Domain Admins via Button/Dialog

**Requirement**: Client Domain Admins must NOT be listed on screen. Access via a button or dialog (e.g. "View Client Domain Admins").

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx` — ClientCard: remove inline admin list; add "View Client Domain Admins" button that opens a modal/dialog

**Actions**:
1. **Frontend**: Remove the inline admin group block that lists admins directly (or hide it by default).
2. **Frontend**: Add button "View Client Domain Admins" (or similar). On click, open a modal/dialog showing the admin group name and list of admins.
3. Ensure `adminGroup` and `admins` data are still fetched; they are just shown in the dialog instead of on the main card.

**Acceptance**: Admins are not visible on the main client card. User clicks button to open dialog and see Client Domain Admins.

---

## Step 3: Matter Filter — Only Matters with Workspaces

**Requirement**: Only display matters that have associated workspaces. Hide matters with zero workspaces.

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx` — when rendering matters, filter: `domain.matters.filter(mg => mg.workspaces.length > 0)`
- `backend/src/index.ts` — if domain-view builds matters server-side, filter out matters with no workspaces before returning

**Actions**:
1. **Frontend**: Filter `domain.matters` to exclude matter groups where `workspaces.length === 0` before mapping to MatterSection.
2. **Backend**: If domain-view assembles matters, ensure matters with no workspaces are excluded from the response.
3. Update summary counts (e.g. "5 matters") to reflect only matters with workspaces.

**Acceptance**: Matters with zero workspaces do not appear in the list.

---

## Step 4: Matter Display — Artifact ID, Matter Number, Workspace Count; Omit Active Status

**Requirement**: Matter rows show artifact ID, Matter Number, Workspace Count. Do NOT show Active status for matters.

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx` — MatterSection / matter row: add artifact ID, Matter Number (e.g. #1024861), workspace count; remove StatusBadge for matters

**Actions**:
1. **Frontend**: In each matter row, display: expansion arrow, document icon, Matter Name, Matter Number (formatted as #XXXXXXX), identifier (E-########), workspace count (e.g. "3 workspaces").
2. **Frontend**: Remove the Active/Inactive status badge from matter rows (per v3 spec).
3. Ensure matter number and artifact ID are clearly visible.

**Acceptance**: Matter rows show artifact ID, Matter Number, workspace count. No status badge on matters.

---

## Step 5: Workspace Statuses — Active (Green), Cold Storage (Icy Blue)

**Requirement**: Workspace statuses are Active (green) or Cold Storage (icy blue).

**Files to modify**:
- `backend/src/data/mockData.ts` — ensure some workspaces have `statusName: 'Cold Storage'`
- `frontend/src/components/ClientDomainView.tsx` — StatusBadge: add Cold Storage styling (icy blue); Active stays green

**Actions**:
1. **Backend**: In mock workspaces, add `statusName: 'Cold Storage'` for some. Keep `Active` for others.
2. **Frontend**: Update `StatusBadge` map: `Active` → green (e.g. `bg-emerald-100 text-emerald-700`), `Cold Storage` → icy blue (e.g. `bg-sky-100 text-sky-700 border-sky-200` or `bg-cyan-50 text-cyan-700`).
3. Handle other statuses (Archived, Inactive) with fallback styling if they still appear.

**Acceptance**: Active workspaces show green badge; Cold Storage workspaces show icy blue badge.

---

## Step 6: Repository Detection & Yellow Workspace Banner

**Requirement**: If Repository Application is installed, workspace banner/row should be yellow.

**Files to modify**:
- `backend/src/data/mockData.ts` — add `repositoryInstalled: boolean`, `repositoryInstalledOn?: string` to workspace objects
- `backend/src/index.ts` — include in workspace/domain-view responses
- `frontend/src/components/ClientDomainView.tsx` — WorkspaceRow: apply `bg-yellow-50 border-yellow-200` (or similar) when `ws.repositoryInstalled === true`

**Actions**:
1. **Mock**: Add `repositoryInstalled` and optionally `repositoryInstalledOn` to workspace mock data. Mix of true/false.
2. **Frontend**: In WorkspaceRow, when `ws.repositoryInstalled`, use yellow background/border. Default styling otherwise.
3. **Live**: When proxying to Relativity, call Application Install/Manager API to determine Repository installation per workspace.

**Acceptance**: Workspaces with Repository installed display with yellow banner/row.

---

## Step 7: Workspace Full Metadata (Created By, Created On, Admin Group, etc.)

**Requirement**: Workspace rows display: artifact ID, Data Grid, Repository installed, Resource Pool, Created By, Created On, Workspace Admin Group.

**Files to modify**:
- `backend/src/data/mockData.ts` — add `createdBy`, `createdOn`, `workspaceAdminGroup` to workspace objects
- `backend/src/index.ts` — include in workspace/domain-view responses
- `frontend/src/components/ClientDomainView.tsx` — Workspace interface and WorkspaceRow: display all new fields

**Actions**:
1. **Backend**: Extend workspace mock with `createdBy`, `createdOn`, `workspaceAdminGroup`. Use varied dates.
2. **Frontend**: Update Workspace interface. In WorkspaceRow, display: ID, DataGrid (✓/✗), Repository installed (✓/✗), Pool, Created By, Created On, Workspace Admin Group (if present).
3. Layout: consider two-line layout or compact grid for readability.

**Acceptance**: Workspace rows show artifact ID, DataGrid, Repository, Pool, Created By, Created On, Workspace Admin Group.

---

## Step 8: Workspace Usage Metrics (Document Count, Peak Hosted Data, SQL Size, dtSearch Index)

**Requirement**: Workspace rows display: Count of Documents, Peak Hosted Data, SQL Size, dtSearch Index size.

**Files to modify**:
- `backend/src/data/mockData.ts` — add `documentCount`, `peakHostedData`, `sqlSize`, `dtSearchIndexSize` to workspace objects
- `backend/src/index.ts` — include in responses
- `frontend/src/components/ClientDomainView.tsx` — WorkspaceRow: display usage metrics (formatted: e.g. "1.2 GB", "450 MB")

**Actions**:
1. **Backend**: Add `documentCount: number`, `peakHostedData: string` (e.g. "1.2 GB"), `sqlSize: string`, `dtSearchIndexSize: string` to workspace mock data.
2. **Frontend**: In WorkspaceRow, add a usage section or additional line: Document count, Peak Hosted Data, SQL Size, dtSearch Index size. Format sizes consistently.
3. **Live**: Map from Relativity usage/analytics APIs or reporting endpoints when available.

**Acceptance**: Workspace rows show document count and size metrics (Peak Hosted Data, SQL Size, dtSearch Index).

---

## Step 9: Client-Level Usage Metrics

**Requirement**: At client level, display: Count of Repository Workspaces, Count of Cold Storage cases, Count of Review cases; Sum of documents, Sum of Repository Data, Sum of Review Data, Sum of Cold Storage Data.

**Files to modify**:
- `backend/src/index.ts` — extend domain-view response: compute or add `repositoryWorkspaceCount`, `coldStorageCount`, `reviewCount`, `sumDocuments`, `sumRepositoryData`, `sumReviewData`, `sumColdStorageData` per client
- `frontend/src/components/ClientDomainView.tsx` — ClientDomain interface; ClientCard: display usage metrics section

**Actions**:
1. **Backend**: For each client in domain-view, compute: repository workspace count, cold storage count, review count (e.g. Active = Review), document sum, data sums. Add to response. Mock with realistic numbers.
2. **Frontend**: Extend ClientDomain type. In ClientCard (header or expanded section), add a "Usage" block: Repository Workspaces, Cold Storage, Review cases; Document sum; Repository/Review/Cold Storage data sums.
3. **Live**: Use Relativity usage reports or analytics APIs when available.

**Acceptance**: Client cards show usage metrics (counts and data sums).

---

## Step 10: Matter-Level Usage Metrics

**Requirement**: At matter level, display: count of workspaces, Sum of documents, Sum of Repository data, Sum of Review data, Sum of Cold Storage data.

**Files to modify**:
- `backend/src/index.ts` — domain-view: include matter-level usage (aggregate from workspaces in matter)
- `frontend/src/components/ClientDomainView.tsx` — MatterGroup interface; MatterSection: display usage metrics

**Actions**:
1. **Backend**: For each matter, aggregate from its workspaces: workspace count, document sum, repository/review/cold storage data sums. Include in MatterGroup or matter payload.
2. **Frontend**: Extend MatterGroup. In MatterSection (expanded or inline), show: Workspace count, Document sum, Repository/Review/Cold Storage data sums.
3. **Live**: Aggregate from workspace usage data when available.

**Acceptance**: Matter rows/sections show usage metrics (workspaces, documents, data sums).

---

## Step 11: Summary Bar — Workspaces Count, Matters Count, Dropdown

**Requirement**: Summary bar shows "X workspaces" and "X matters" with dropdown. Matter count above workspace count per v2.

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx` — summary bar: ensure order Matters → Workspaces; add dropdown if specified (e.g. filter by client)

**Actions**:
1. **Frontend**: Summary cards: first "Total Matters" (or "Matters"), then "Total Workspaces". Include counts from filtered data (only matters with workspaces).
2. **Frontend**: Add dropdown next to "X matters" if design calls for it (e.g. filter matters by client or status). Implement minimal dropdown (e.g. "All" / "By Client") if needed.
3. Ensure "+ New Matter" button is visible in the matters section header.

**Acceptance**: Summary shows matter count and workspace count in correct order. Dropdown present if required.

---

## Step 12: Integration & Polish

**Requirement**: Ensure full v3 flow works; fix any layout/UX issues; update checklist.

**Actions**:
1. Run through all v3 requirements: Client filter, Client display, Admins dialog, Client usage; Matter filter, Matter display, Matter usage; Workspace statuses, yellow banner, full metadata, usage metrics.
2. Verify mock mode and live mode (if wired) both behave correctly.
3. Fix any overflow, truncation, or responsive layout issues.
4. Update `billy-relativity.version-3.design.agentx.md` checklist as items are completed.

**Acceptance**: All v3 checklist items pass. No regressions in existing tabs.

---

## Implementation Order Summary

| Step | Feature | Dependencies |
|------|---------|--------------|
| 1 | Client Domain filter + artifact ID, Client Number, no emails | None |
| 2 | Client Domain Admins via button/dialog | None |
| 3 | Matter filter (only with workspaces) | None |
| 4 | Matter display (artifact ID, Matter #, workspace count; no status) | None |
| 5 | Workspace statuses (Active green, Cold Storage icy blue) | None |
| 6 | Repository + yellow workspace banner | None |
| 7 | Workspace full metadata (Created By, On, Admin Group) | None |
| 8 | Workspace usage (doc count, Peak Hosted, SQL, dtSearch) | None |
| 9 | Client-level usage metrics | Steps 5, 6 (for Repository/Cold/Review counts) |
| 10 | Matter-level usage metrics | Steps 7, 8 |
| 11 | Summary bar (Matters, Workspaces, dropdown) | Steps 3, 4 |
| 12 | Integration & polish | All above |

---

## Conventions for AI Implementation

- **One step per response** unless the user asks for multiple.
- **Preserve BREE stack**: Bun, React, Elysia, Eden. TypeScript only.
- **Mock before live**: Implement mock behavior first; add live Relativity proxy as separate sub-step.
- **No breaking changes**: Existing tabs and mock mode must continue to work.
- **Commit after each step**: Encourage `git add` + `git commit` with a descriptive message.

---

*AgentX Implementation v3 — Billy Relativity*
