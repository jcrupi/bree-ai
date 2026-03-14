---
agentx:
  version: 1
  created_at: "2025-03-14T00:00:00.000Z"
  type: algos
  filename: pen-testing.algos.agentx-v1.md
  domain: pen-testing
---

# Penetration Testing Algos v1

> Validation rules for penetration testing engagements, findings, and reports. At runtime, content is analyzed against these rules to ensure conformance to PTES and industry standards.

## Overview

These algos define the validation flow for pen-testing content. Scope, ROE, findings (severity, evidence, remediation), and report structure must conform. The Playback Runner loads this playbook and algos to analyze pasted content at runtime.

## Validation Rules

### PT.SCOPE.001 — Scope defined before testing
- **Check:** Engagement has scope with targets (IPs, domains, apps) and exclusions
- **Fail:** Testing without documented scope
- **Remediation:** Document in-scope and out-of-scope assets before starting

### PT.SCOPE.002 — ROE documented
- **Check:** Rules of engagement include allowed techniques, prohibited actions, contact, emergency stop
- **Fail:** Missing ROE
- **Remediation:** Define ROE and get client sign-off

### PT.FIND.010 — Finding has severity
- **Check:** Every finding has severity (Critical, High, Medium, Low, Info)
- **Fail:** Finding without severity
- **Remediation:** Assign severity using CVSS or internal scale

### PT.FIND.011 — Finding has evidence
- **Check:** Finding includes evidence (screenshot, log excerpt, PoC steps)
- **Fail:** Finding without evidence
- **Remediation:** Add reproducible evidence for each finding

### PT.FIND.012 — Remediation required
- **Check:** Every finding has remediation recommendation
- **Fail:** Finding without remediation
- **Remediation:** Provide actionable fix (patch, config change, code fix)

### PT.REP.020 — Report structure
- **Check:** Report has executive_summary, methodology, findings, recommendations
- **Fail:** Incomplete report structure
- **Remediation:** Include all required sections

### PT.CVSS.030 — CVSS format (if provided)
- **Check:** CVSS string is valid (CVSS:3.x format)
- **Fail:** Invalid CVSS format
- **Remediation:** Use NVD calculator or valid CVSS:3.1 string

## RuleCatalog

| Rule ID      | Category | Severity | Description              |
| ------------ | -------- | -------- | ------------------------ |
| PT.SCOPE.001 | Scope    | error    | Scope defined            |
| PT.SCOPE.002 | Scope    | error    | ROE documented           |
| PT.FIND.010  | Finding  | error    | Finding has severity     |
| PT.FIND.011  | Finding  | error    | Finding has evidence     |
| PT.FIND.012  | Finding  | error    | Finding has remediation  |
| PT.REP.020   | Report   | error    | Report structure complete|
| PT.CVSS.030  | Finding  | warning  | Valid CVSS format        |

## Phases (PTES)

1. Reconnaissance — Passive/active recon
2. Scanning & Enumeration — Service and vuln discovery
3. Exploitation — PoC exploitation
4. Post-Exploitation — Privilege escalation, lateral movement
5. Reporting — Executive summary, findings, recommendations

## Flow

1. **Parse** — Extract engagement, scope, ROE, findings, report from content
2. **Validate scope** — PT.SCOPE.001, PT.SCOPE.002
3. **Validate findings** — PT.FIND.010, PT.FIND.011, PT.FIND.012, PT.CVSS.030
4. **Validate report** — PT.REP.020
5. **Report** — Return pass/fail and remediation for each rule

## AgentX Notes

- `pen-testing.playbook.agentx-v1.md` — Domain entities, rules, API surface
