---
agentx:
  version: 1
  created_at: "2026-03-14T00:00:00.000Z"
  type: meta
  filename: billy-relativity.meta.design.agentx.md
  domain: relativity-workspace-command-center
  purpose: driver-for-generation
---

# Billy Relativity — Meta Design Agentx (Driver)

> **Purpose**: This meta agentx drives how design agentx documents are generated. Use it as the template and rule set when transforming raw requirements into structured design specifications.

---

## 1. Design Agentx Output Structure

Every generated design agentx MUST follow this structure:

```markdown
---
agentx:
  version: {N}
  created_at: "{ISO8601}"
  type: design
  filename: billy-relativity.version-{N}.design.agentx.md
  domain: relativity-workspace-command-center
  supersedes: billy-relativity.version-{N-1}.design.agentx.md  (optional)
---

# Billy Relativity — Version {N} Requirements

> AgentX design specification. {One-line summary of scope}

---

## Requirements (or numbered sections by domain)

### Section 1: {Domain Name}

- **Requirement**: {Clear statement}
- **Display Rule**: {If applicable}
- **Fields**: {If applicable}
- **Exclusions**: {What NOT to show}

### Section 2: ...

---

## Summary Checklist

| # | Category | Requirement | Status |
|---|----------|-------------|--------|
| 1 | ... | ... | ☐ |

---

## Data Sources & APIs

- {Relevant Relativity APIs}
- {Usage reports, etc.}

---

*AgentX v{N} Design — Billy Relativity*
```

---

## 2. Transformation Rules (Requirements → Design)

### 2.1 Parse Requirements Input

- Treat each non-empty line or paragraph as a requirement or requirement group
- Detect domain keywords: Client, Matter, Workspace, User, Search, Repository, etc.
- Group related requirements under the same section

### 2.2 Section Naming

- Use PascalCase for section titles: "Client Requirements", "Matter Requirements", "Workspace Requirements"
- Use numbered subsections (1.1, 1.2) for sub-topics
- Use tables for: display fields, metrics, API mappings

### 2.3 Requirement Format

- **Bold** the key term (e.g. **Display Rule**, **Requirement**, **Exclusions**)
- Use bullet lists for multiple items
- Use tables when listing fields, metrics, or API endpoints

### 2.4 Checklist

- Every requirement in the body MUST have a corresponding row in the Summary Checklist
- Format: `| # | Category | Requirement | Status |`
- Status column: `☐` (unchecked)

---

## 3. Domain-Specific Patterns (Billy Relativity)

### Client

- Filtering rules (e.g. Client Domain Status)
- Display fields (Artifact ID, Client Number)
- Usage metrics (counts, sums)
- Exclusions (e.g. no emails)

### Matter

- Filtering (e.g. only matters with workspaces)
- Display fields (Artifact ID, Matter Number, Workspace Count)
- Usage metrics
- Exclusions (e.g. no Active status)

### Workspace

- Statuses (Active, Cold Storage, etc.) with display colors
- Banner rules (e.g. yellow when Repository installed)
- Metadata (Created By, Created On, Admin Group)
- Usage (Document count, Peak Hosted Data, SQL Size, dtSearch Index)

---

## 4. Generation Algorithm (Pseudocode)

```
function generateDesign(requirements: string, version: number):
  lines = requirements.split('\n').map(trim).filter(nonEmpty)
  sections = groupByDomain(lines)
  output = frontmatter(version, 'design')
  output += title(version)
  for section in sections:
    output += sectionHeader(section.domain)
    output += formatRequirements(section.items)
  output += checklist(sections)
  output += dataSources()
  return output
```

---

## 5. Quality Checks

Before finalizing a generated design:

- [ ] All requirements from input appear in the document
- [ ] Checklist rows match body requirements
- [ ] Frontmatter version and filename are consistent
- [ ] No placeholder text left (e.g. "(Add items from requirements)")
- [ ] Tables are well-formed Markdown

---

*Meta Design Agentx — Driver for design generation*
