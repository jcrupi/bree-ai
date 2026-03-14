---
agentx:
  version: 1
  created_at: "2025-03-14T00:00:00.000Z"
  type: playbook
  filename: pen-testing.playbook.agentx-v1.md
  domain: pen-testing
---

# Penetration Testing Playbook v1

> Structure and validate penetration testing engagements, findings, and reports. At runtime, content (scope docs, findings, reports, methodology checklists) is analyzed to ensure conformance to PTES, OWASP Testing Guide, and industry standards.

## Overview

Penetration Testing is a domain for planning, executing, and reporting security assessments. The playbook defines phases, scope rules, finding severity, and report structure. At runtime, pasted content (scope, findings, executive summaries) is analyzed for conformance.

## Domain

**Penetration Testing** — Authorized simulated attacks to identify exploitable vulnerabilities. Phases: Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting. Aligned with PTES (Penetration Testing Execution Standard) and OWASP Testing Guide.

## Entities

- **Engagement** — A pen-test project. Has: scope, rules_of_engagement, start_date, end_date, client. Relates to: Phase, Finding, Report.
- **Scope** — In-scope and out-of-scope assets. Has: targets[], excluded[], constraints. Relates to: Engagement.
- **Phase** — Reconnaissance, Scanning, Exploitation, Post-Exploitation, Reporting. Has: id, name, status, artifacts[]. Relates to: Engagement, Finding.
- **Finding** — A vulnerability or issue. Has: title, severity, cvss, cwe, cve, evidence, remediation. Relates to: Phase, Report.
- **Report** — Deliverable. Has: executive_summary, methodology, findings[], recommendations. Relates to: Engagement, Finding.
- **RulesOfEngagement** — ROE. Has: allowed_techniques, prohibited_actions, contact, emergency_stop. Relates to: Engagement.

## Phases (PTES-Aligned)

### 1. Reconnaissance
- Passive: OSINT, DNS, WHOIS, certificate transparency
- Active: Port scanning (with scope approval)

### 2. Scanning & Enumeration
- Service identification, version detection
- Vulnerability scanning (Nessus, OpenVAS, etc.)
- Web app scanning (Burp, OWASP ZAP)

### 3. Exploitation
- Attempt to exploit identified vulnerabilities
- Document proof-of-concept
- Avoid destructive actions per ROE

### 4. Post-Exploitation
- Privilege escalation assessment
- Lateral movement (if in scope)
- Persistence (if authorized)

### 5. Reporting
- Executive summary
- Technical findings with CVSS/CWE
- Remediation recommendations
- Evidence and screenshots

## Severity Levels

- **Critical** — CVSS 9.0–10.0; immediate unauthenticated RCE, data breach
- **High** — CVSS 7.0–8.9; authenticated RCE, significant data exposure
- **Medium** — CVSS 4.0–6.9; limited impact, privilege escalation
- **Low** — CVSS 0.1–3.9; informational, weak config
- **Info** — CVSS 0.0; best practices, hardening suggestions

## Rules

### PT.SCOPE.001 — Scope defined before testing
- **Check:** Engagement has scope with targets and exclusions
- **Fail:** Testing without documented scope

### PT.SCOPE.002 — ROE documented
- **Check:** Rules of engagement (allowed techniques, prohibited actions) are defined
- **Fail:** Missing ROE

### PT.FIND.010 — Finding has severity
- **Check:** Every finding has severity (Critical, High, Medium, Low, Info)
- **Fail:** Finding without severity

### PT.FIND.011 — Finding has evidence
- **Check:** Finding includes evidence (screenshot, log, PoC)
- **Fail:** Finding without evidence

### PT.FIND.012 — Remediation required
- **Check:** Every finding has remediation recommendation
- **Fail:** Finding without remediation

### PT.REP.020 — Report structure
- **Check:** Report has executive_summary, methodology, findings, recommendations
- **Fail:** Incomplete report structure

### PT.CVSS.030 — CVSS format (if provided)
- **Check:** CVSS string is valid (e.g., CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
- **Fail:** Invalid CVSS format

## API Surface

- `POST /api/pen-testing/validate` — Validate scope, findings, or report
- `GET /api/pen-testing/phases` — List PTES phases
- `POST /api/playback` — Run content through playbook (Playback Runner)

## AgentX Notes

- `pen-testing.algos.agentx-v1.md` — Validation rules, RuleCatalog, flow
