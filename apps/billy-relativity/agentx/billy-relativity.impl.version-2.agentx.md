---
agentx:
  version: 2
  created_at: "2026-03-13T00:00:00.000Z"
  type: implementation
  filename: billy-relativity.impl.version-2.agentx.md
  domain: relativity-workspace-command-center
  references:
    - billy-relativity.version-2.design.agentx.md
---

# Billy Relativity — Implementation Instructions v2

> **Purpose**: Stepwise instructions for AI to generate v2 features. Execute one step at a time. Each step is self-contained and can be implemented independently unless dependencies are noted.

**Reference**: See `billy-relativity.version-2.design.agentx.md` for full requirements.

**Stack**: BREE — Bun, React 19, Elysia, Eden Treaty. TypeScript only. No npm/yarn/pnpm.

---

## How to Use This Document

1. **Implement steps in order** unless a step explicitly says it can be done in parallel.
2. **One step per session** — complete, test, and commit before moving on.
3. **Mock first, live later** — when adding new APIs, add mock data/endpoints first, then wire to live Relativity when available.
4. **Preserve existing behavior** — do not break mock mode or existing tabs (API Explorer, Client Domains, Command Center, Observer).

---

## Step 1: Client Display Banner — Matter Count Above Workspace Count

**Requirement**: Put matter count above workspace count in the client display banner.

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx`

**Current state**: Summary bar shows (in order): Total Clients, Total Workspaces, Invalid Matter #s.

**Actions**:
1. Compute `totalMatters = data.reduce((s, c) => s + c.matters.length, 0)`.
2. Reorder the summary cards so that **Total Matters** appears **above** **Total Workspaces**.
3. Suggested order: `Total Clients` → `Total Matters` → `Total Workspaces` → `Invalid Matter #s` (or keep 3 cards: Clients, Matters, Workspaces; Invalid can stay as-is or be a badge).
4. Ensure the grid/cards display matter count before workspace count as specified.

**Acceptance**: User sees matter count displayed above workspace count in the Client Domains summary bar.

---

## Step 2: Workspace Metadata — Creator, Created, Last Modified By/Date

**Requirement**: Fix incorrect modified data; add Workspace Creator, When Created, Last Modified By, Last Modified Date. Add Workspace Admin group if available.

**Files to modify**:
- `backend/src/data/mockData.ts` (or equivalent mock store)
- `backend/src/index.ts` (workspace endpoints, domain-view)
- `frontend/src/components/ClientDomainView.tsx` (Workspace interface, WorkspaceRow display)

**Actions**:
1. **Backend**: Extend workspace mock objects with: `createdBy`, `createdOn`, `lastModifiedBy`, `lastModifiedOn`. Use varied dates (not all today). Add `workspaceAdminGroup` if available.
2. **API**: Ensure `/api/workspace`, `/api/clients/domain-view` return these fields.
3. **Frontend**: Update `Workspace` interface to include the new fields.
4. **Frontend**: In `WorkspaceRow`, display: Created by/date, Last modified by/date. Show Workspace Admin group when present.
5. **Live mode**: When proxying to real Relativity, map API response fields to these properties (Relativity may use different names).

**Acceptance**: Workspace rows show correct creator, created date, last modified by, last modified date. No more "today" for all modified dates.

---

## Step 3: Repository Application Detection & Yellow Banner

**Requirement**: For each workspace, check if Repository Application is installed and when. If installed, workspace banner/row should be yellow.

**Files to modify**:
- `backend/src/data/mockData.ts` — add `repositoryInstalled: boolean`, `repositoryInstalledOn?: string` to workspace mock data
- `backend/src/index.ts` — include in workspace/domain-view responses
- `frontend/src/components/ClientDomainView.tsx` — WorkspaceRow: apply yellow background/border when `repositoryInstalled === true`
- **Live mode**: Add proxy/API call to Relativity Applications API to check Repository installation per workspace

**Actions**:
1. **Mock**: Add `repositoryInstalled` and `repositoryInstalledOn` to workspace objects. Some workspaces true, some false.
2. **Frontend**: In `WorkspaceRow`, when `ws.repositoryInstalled`, use yellow styling (e.g. `bg-yellow-50 border-yellow-200` or similar).
3. **Live**: Document or implement call to Relativity Application Install/Manager API. Endpoint pattern: workspace-scoped application list; filter for "Repository".

**Acceptance**: Workspaces with Repository installed display with yellow banner/row. Others use default styling.

---

## Step 4: Instance User Count & User List with Last Login

**Requirement**: Instance user count and a display listing all users with date of last login (if available).

**Files to modify**:
- `backend/src/index.ts` — new endpoint `GET /api/users` (mock) returning `{ users: User[], totalCount: number }`
- `backend/src/data/mockData.ts` — add mock users with `lastLogin?: string`, `enabled: boolean`
- `frontend` — new view or section: User list table (name, email, last login, status)

**Actions**:
1. **Backend**: Create `/api/users` returning `{ users, totalCount }`. Mock users with varied `lastLogin` dates (some recent, some 90+ days ago).
2. **Frontend**: Add a "Users" section or tab. Display: user count at top, table with columns: Name, Email, Last Login, Status (Active/Inactive).
3. **Live**: Proxy to Relativity User Manager API for real user list and last login.

**Acceptance**: User sees instance user count and a table of users with last login dates where available.

---

## Step 5: Send Password Reset Invite from User List

**Requirement**: Add ability to send an invite to reset password from the list of users.

**Files to modify**:
- `backend/src/index.ts` — new endpoint `POST /api/users/{id}/send-password-reset` (mock: return success)
- `frontend` — User list: add "Send password reset" action per user (and optionally bulk)

**Actions**:
1. **Backend**: `POST /api/users/:id/send-password-reset` — mock returns `{ success: true }`.
2. **Frontend**: In user list row, add button "Send password reset". On click, call the endpoint. Show toast/success message.
3. **Live**: Proxy to Relativity Identity/User API for actual password reset invite.

**Acceptance**: User can click "Send password reset" for a user and receive confirmation (mock or real).

---

## Step 6: Deactivate Users Inactive 90+ Days

**Requirement**: Function to deactivate all users that haven't logged in to the instance in the last 90 days.

**Files to modify**:
- `backend/src/index.ts` — new endpoint `POST /api/users/deactivate-inactive` with optional `days?: number` (default 90)
- `frontend` — User list: add "Deactivate inactive (90 days)" button with confirmation modal

**Actions**:
1. **Backend**: `POST /api/users/deactivate-inactive` — mock: filter users with `lastLogin` older than 90 days, return `{ deactivated: number, userIds: number[] }`.
2. **Frontend**: Button "Deactivate inactive users (90 days)". Confirmation: "This will deactivate N users who have not logged in for 90+ days. Continue?"
3. **Live**: Proxy to Relativity User Manager to deactivate users. Exclude system/admin accounts per requirements.

**Acceptance**: User can run deactivation; sees count of users to be deactivated and confirms. Mock returns success.

---

## Step 7: Matter Number Compliance Review

**Requirement**: Matter numbers may not be compliant. Review format, validation, and display.

**Files to modify**:
- `frontend/src/components/ClientDomainView.tsx` — `MATTER_NUM_RE`, validation logic
- `backend` — matter creation/validation if applicable
- `agentx/billy-relativity.version-2.design.agentx.md` — document compliance rules once confirmed

**Actions**:
1. **Audit**: Confirm the expected matter number format with stakeholders (e.g. `E-########` or other).
2. **Validation**: Ensure `MATTER_NUM_RE` and any backend validation match the agreed format.
3. **Display**: Invalid matters already show AlertTriangle; ensure consistency.
4. **Document**: Update version-2 agentx with the confirmed compliance rules.

**Acceptance**: Matter number validation aligns with organizational compliance. Invalid matters are clearly marked.

---

## Step 8: List Saved Searches (Workspace-Scoped)

**Requirement**: Get a listing of saved searches for a workspace.

**Files to modify**:
- `backend/src/index.ts` — new endpoint `GET /api/workspace/:workspaceId/saved-searches`
- `backend/src/data/mockData.ts` — saved searches keyed by workspace (already may exist)
- `frontend` — new UI section or integration: list saved searches for a workspace

**Actions**:
1. **Backend**: `GET /api/workspace/:workspaceId/saved-searches` — mock returns array of `{ artifactID, name, searchQuery?, ... }`.
2. **Frontend**: Add way to select a workspace and view its saved searches (e.g. in WorkspaceRow expand, or dedicated "Saved Searches" panel).
3. **Live**: Proxy to `POST /workspace/{id}/query-eligible-saved-searches` or equivalent Relativity API.

**Acceptance**: User can view a list of saved searches for a given workspace.

---

## Step 9: Execute Search → Document Count

**Requirement**: Execute each saved search and return document count.

**Files to modify**:
- `backend/src/index.ts` — new endpoint `POST /api/workspace/:workspaceId/search/:searchId/execute` or `POST /api/workspace/:workspaceId/execute-search` with body `{ searchId }`
- `frontend` — saved search list: show document count per search; or add "Execute" button that fetches count

**Actions**:
1. **Backend**: Endpoint that accepts workspace ID + search ID, returns `{ documentCount: number }`. Mock: return realistic counts (e.g. 150, 2300).
2. **Frontend**: For each saved search, display document count. Option: "Refresh count" button to re-execute.
3. **Live**: Proxy to Relativity Object Manager or Search API to run the search and return result count.

**Acceptance**: User sees document count for each saved search (mock or live).

---

## Step 10: Extract Text for Documents

**Requirement**: Execute extraction of text files for documents (to prepare for LLM submission).

**Files to modify**:
- `backend/src/index.ts` — new endpoint `POST /api/workspace/:workspaceId/extract-text` with body `{ searchId?, documentIds? }`
- `frontend` — UI to trigger extraction (select search or documents, "Extract text")

**Actions**:
1. **Backend**: `POST /api/workspace/:workspaceId/extract-text` — mock: return `{ extractedCount: number, files: [{ documentId, textPreview }] }` or similar. Real: integrate Relativity extraction/processing APIs.
2. **Frontend**: Button or flow to trigger extraction. Show progress/result.
3. **Note**: Full extraction may be async; consider job/polling pattern for production.

**Acceptance**: User can trigger text extraction for a search or document set. Mock returns sample extracted data.

---

## Step 11: Submit Extracted Text to Azure LLM

**Requirement**: Pipeline to submit extracted text to Azure LLM.

**Files to modify**:
- `backend/src/index.ts` — new endpoint `POST /api/workspace/:workspaceId/submit-to-llm` with body `{ documentIds?, extractedTexts?, azureConfig? }`
- Environment/config for Azure OpenAI endpoint and key (do not hardcode secrets)

**Actions**:
1. **Backend**: Endpoint that accepts extracted text (or refs to extracted docs), calls Azure OpenAI/Document Intelligence. Use env vars for endpoint and API key.
2. **Mock**: Return `{ submitted: number, status: 'success' }` without calling Azure.
3. **Frontend**: "Submit to LLM" action in extraction flow. Show success/failure.
4. **Security**: Never expose Azure keys in frontend. All calls server-side.

**Acceptance**: User can submit extracted documents to Azure LLM. Mock succeeds; live uses Azure when configured.

---

## Step 12: Integration & Polish

**Requirement**: Wire the full flow: List searches → Execute → Document count → Extract → Submit to LLM.

**Actions**:
1. Create a unified "LLM Pipeline" or "Document Extraction" workflow in the UI.
2. Steps: Select workspace → List saved searches → (Optional) Execute to get counts → Select search/documents → Extract text → Submit to Azure.
3. Add loading states, error handling, and clear user feedback.
4. Update `billy-relativity.version-2.design.agentx.md` checklist as features are completed.

**Acceptance**: End-to-end flow works in mock mode. Live mode works when Relativity and Azure are configured.

---

## Implementation Order Summary

| Step | Feature | Dependencies |
|------|---------|--------------|
| 1 | Matter count above workspace count | None |
| 2 | Workspace metadata (creator, dates, admin group) | None |
| 3 | Repository detection + yellow banner | None |
| 4 | User count + user list with last login | None |
| 5 | Send password reset invite | Step 4 |
| 6 | Deactivate inactive 90 days | Step 4 |
| 7 | Matter number compliance review | None |
| 8 | List saved searches | None |
| 9 | Execute search → document count | Step 8 |
| 10 | Extract text for documents | Step 8, 9 |
| 11 | Submit to Azure LLM | Step 10 |
| 12 | Integration & polish | Steps 8–11 |

---

## Conventions for AI Implementation

- **One step per response** unless the user asks for multiple.
- **Preserve BREE stack**: Bun, React, Elysia, Eden. TypeScript only.
- **Mock before live**: Implement mock behavior first; add live Relativity proxy as separate sub-step.
- **No breaking changes**: Existing tabs and mock mode must continue to work.
- **Commit after each step**: Encourage `git add` + `git commit` with a descriptive message.

---

*AgentX Implementation v2 — Billy Relativity*
