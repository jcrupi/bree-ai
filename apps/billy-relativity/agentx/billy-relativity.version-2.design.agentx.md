---
agentx:
  version: 2
  created_at: "2026-03-13T00:00:00.000Z"
  type: playbook
  filename: billy-relativity.version-2.design.agentx.md
  domain: relativity-workspace-command-center
---

# Billy Relativity — Version 2 Requirements

> AgentX specification for billy-relativity v2 features. Captures workspace operations, user management, display updates, and LLM/Azure document extraction pipeline.

---

## 1. Workspace Search & Document Extraction (LLM/Azure Pipeline)

Functions to run against a workspace for document discovery and LLM submission:

### 1.1 Saved Search Operations

| Function | Description | API / Notes |
|----------|-------------|-------------|
| **List Saved Searches** | Get a listing of all saved searches for a workspace | Workspace Manager: `POST /workspace/{workspaceID}/query-eligible-saved-searches` |
| **Execute Search → Document Count** | Execute each saved search and return document count | Object Manager or Search API |
| **Extract Text for Documents** | Extract text files from documents in search results | Extraction API / Document text retrieval |
| **Submit to Azure LLM** | Pipeline to send extracted text to Azure LLM | Azure OpenAI / Document Intelligence |

### 1.2 Implementation Flow

```
1. List saved searches (workspace-scoped)
2. For each saved search:
   a. Execute search
   b. Get document count
   c. (Optional) Extract text for documents
3. Extract text files for selected documents
4. Submit extracted text to Azure LLM
```

### 1.3 Technical Notes

- Relativity has separate APIs: Workspace Manager, Object Manager, Application Install
- Text extraction may require Relativity Processing or native extraction APIs
- Azure integration: consider batch size, token limits, and async processing

---

## 2. User Management

### 2.1 Password Reset Invite

- **Requirement**: Add ability to send an invite to reset password from the list of users
- **Context**: User list view should support bulk or single "Send password reset invite" action
- **API**: Relativity User Manager / Identity APIs for password reset flow

### 2.2 Instance User Count & Last Login Display

- **Requirement**: Instance user count and a display that lists all users with date of last login (if available)
- **Display**: Table or list showing:
  - User name / email
  - Last login date (when available)
  - Status (active / inactive)
- **API**: User Manager REST API for user list and last login metadata

### 2.3 Deactivate Inactive Users (90-Day Rule)

- **Requirement**: Add a function to "deactivate" all users that haven't logged in to the instance in the last 90 days
- **Behavior**:
  - Query users with `lastLogin < (today - 90 days)`
  - Provide bulk deactivation action (with confirmation)
  - Consider: exclude system/service accounts, admins
- **API**: User Manager for deactivation and last-login queries

---

## 3. Matter Numbers

- **Issue**: Matter numbers may not be correct; none may be compliant
- **Action**: Review matter number format, validation rules, and compliance requirements
- **Scope**: Matter/Number display and storage — ensure alignment with Relativity matter conventions

---

## 4. Repository Application Detection

### 4.1 Check Repository Installation

- **Requirement**: For a workspace, check if the Repository Application is installed and when it was installed
- **API**: Separate Relativity Applications API (not Workspace Manager)
- **Reference**: Relativity Application Install / Application Manager REST APIs

### 4.2 Workspace Banner Color

- **Requirement**: If Repository is installed, the workspace banner should be **yellow**
- **Logic**: `repositoryInstalled === true` → banner color = yellow; otherwise default

---

## 5. Client Display Banner

### 5.1 Layout Change

- **Requirement**: Put **matter count** above **workspace count** in the client display banner
- **Current**: (assumed) Workspace count above matter count
- **Target**: Matter count first, then workspace count

---

## 6. Workspace Metadata (Creator, Modified, Admin)

### 6.1 Incorrect Modified Data

- **Issue**: Modified data for all workspaces shows today's date — not correct
- **Fix**: Use actual `lastModified` / `modifiedOn` from Relativity API

### 6.2 Required Workspace Fields

| Field | Description | Source |
|-------|-------------|--------|
| **Workspace Creator** | User who created the workspace | Relativity Workspace / Object Manager |
| **When Created** | Creation timestamp | `created` or equivalent |
| **Last Modified By** | User who last modified the workspace | Workspace metadata |
| **Last Modified Date** | Actual last modified timestamp | `lastModified` or equivalent |
| **Workspace Admin Group** | Admin group for the workspace (if available) | Relativity Groups / Security APIs |

### 6.3 API Notes

- Workspace Manager may return limited fields; Object Manager or extended workspace queries may be needed for creator/modifier
- Workspace Admin group: Relativity Group Manager or Security Manager APIs

---

## 7. Summary Checklist

| # | Category | Requirement | Status |
|---|----------|-------------|--------|
| 1 | Search/Extraction | List saved searches | ☐ |
| 2 | Search/Extraction | Execute searches → document count | ☐ |
| 3 | Search/Extraction | Extract text for documents | ☐ |
| 4 | Search/Extraction | Submit to Azure LLM | ☐ |
| 5 | Users | Send password reset invite from user list | ☐ |
| 6 | Users | Instance user count + last login display | ☐ |
| 7 | Users | Deactivate users inactive 90+ days | ☐ |
| 8 | Matters | Review matter number compliance | ☐ |
| 9 | Repository | Check if Repository app installed + when | ☐ |
| 10 | Repository | Yellow banner when Repository installed | ☐ |
| 11 | Banner | Matter count above workspace count | ☐ |
| 12 | Workspace | Creator, created date, last modified by/date | ☐ |
| 13 | Workspace | Workspace Admin group (if available) | ☐ |

---

## 8. Relativity API References

- **Workspace Manager (REST)**: Workspace CRUD, saved searches, resource pools
- **Object Manager (REST)**: Documents, objects, queries
- **User Manager (REST)**: Users, last login, deactivation
- **Application Install / Application Manager**: Installed applications (e.g., Repository)
- **Group Manager / Security**: Workspace Admin group

---

*AgentX v2 — Billy Relativity Command Center*
