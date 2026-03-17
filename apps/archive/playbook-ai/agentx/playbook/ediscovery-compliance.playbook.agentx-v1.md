---
agentx:
  version: 1
  created_at: "2026-03-12T05:19:00Z"
  type: playbook
  filename: ediscovery-compliance.playbook.agentx-v1.md
  domain: ediscovery-compliance
  specialty: eDiscovery Compliance
---

# eDiscovery Compliance Playbook
**Domain:** Electronic Discovery (eDiscovery) & Litigation Compliance
**Version:** 1
**Owner:** Bree AI — Legal & Compliance

---

## Overview

This playbook governs the end-to-end compliance lifecycle for matters subject to eDiscovery obligations — including litigation, regulatory investigations, government inquiries, and internal investigations. It aligns with:

- **Federal Rules of Civil Procedure (FRCP)**, particularly Rules 26, 34, 37, and 45
- **The EDRM (Electronic Discovery Reference Model)**
- **The Sedona Conference Principles** (2nd Ed.)
- **DOJ / SEC / FTC regulatory expectations**
- **GDPR / CCPA** cross-border data considerations

Non-compliance can result in spoliation sanctions, adverse inference instructions, default judgments, monetary sanctions, and attorney disciplinary action.

---

## Domain Entities

### Matter
A legal case, regulatory inquiry, internal investigation, or government subpoena that triggers eDiscovery obligations.
- **Fields:** Matter ID, Caption/Name, Case Number, Jurisdiction, Matter Type, Status, Open Date, Close Date
- **Matter Types:** Civil Litigation, Criminal, Regulatory (SEC/DOJ/FTC), Internal Investigation, Government Subpoena, Pre-Litigation
- **Statuses:** Open, On Hold, Closed, Archived

### Legal Hold
A directive issued to custodians requiring preservation of potentially relevant ESI and paper documents.
- **Fields:** Hold ID, Issuance Date, Custodians, Data Sources, Scope Description, Acknowledgment Status
- **Trigger:** Reasonably anticipated litigation (FRCP Rule 37(e) / Zubulake standard)
- **Custodian Acknowledgment:** Required within defined SLA (typically 5–10 business days)

### Custodian
An individual whose documents, ESI, or communications may be relevant to the matter.
- **Fields:** Name, Title, Department, Email, Data Sources, Hold Status, Interview Date
- **Statuses:** Identified, Notified, Acknowledged, Released

### ESI (Electronically Stored Information)
Any information stored in an electronic medium, including email, files, databases, chat messages, voicemail, social media, and cloud storage.
- **Key Sources:** Email systems (Exchange, Gmail), SharePoint/OneDrive, Slack/Teams, laptops, shared drives, mobile devices, SaaS platforms, backup tapes
- **Format Considerations:** Native format, TIFF+text, PDF, load files (DAT/OPT)

### Collection
The process of gathering ESI and physical documents from identified custodians and data sources.
- **Types:** Targeted (custodian-specific), Broad (full mailbox/drive), Forensic (court-ordered)
- **Chain of Custody:** Must be documented from collection through production

### Processing
Conversion of raw collected data into a reviewable format: deduplication, de-NIST, date filtering, keyword culling, exception tracking.
- **Output:** Processed data set in review platform (Relativity, Nuix, Reveal, etc.)
- **Exception Handling:** Password-protected files, corrupted files, zero-byte files, unsupported file types

### Review
The attorney-led process of evaluating documents for relevance, privilege, and responsiveness before production.
- **Review Categories:** Responsive / Non-Responsive, Privileged, Confidential, Hot Doc, Work Product
- **Privilege Log:** Required for withheld/redacted privileged documents (FRCP Rule 26(b)(5))
- **Quality Control (QC):** Statistically valid sampling of reviewed documents

### Production
The formal delivery of responsive documents to the requesting party per the agreed-upon or court-ordered specifications.
- **Formats:** Native, TIFF, PDF, Load File (Concordance DAT + OPT)
- **Metadata:** Required fields vary by jurisdiction and producing protocol
- **Bates Numbering:** Sequential and unique per production volume
- **Redactions:** Attorney-applied for privilege, PII, trade secrets, confidentiality

### Privilege Log
A document listing all documents withheld or redacted from production on privilege grounds.
- **Required Fields:** Bates range (if redacted), Date, Author, Recipients, Privilege Type, Description of Privilege Basis
- **Privilege Types:** Attorney-Client, Work Product (FRCP 26(b)(3)), Common Interest, Deliberative Process

### Preservation Letter / Litigation Hold Notice
Written notice sent to opposing parties or third parties directing preservation of relevant documents (also known as a "litigation hold letter").

### FRCP Rule 26(f) Conference (Meet and Confer)
Pre-discovery conference between parties to agree on ESI formats, scope, search terms, custodians, and production protocols.

---

## The EDRM Lifecycle

```
Information Management
        ↓
    Identification
        ↓
    Preservation ← Legal Hold Must Issue Here
        ↓
    Collection
        ↓
    Processing
        ↓
      Review
        ↓
    Analysis
        ↓
    Production
        ↓
   Presentation
```

Each phase has distinct compliance obligations, audit requirements, and quality checkpoints.

---

## Phase-by-Phase Compliance Requirements

### Phase 1 — Identification
**Obligation:** Identify all potentially relevant data sources, custodians, and document types at the outset of the matter.

**Key Requirements:**
- Interview key witnesses and IT to map data sources
- Identify legacy systems, archived data, backup tapes
- Document custodian universe with job roles and data access
- Account for mobile devices, personal email, shadow IT, and SaaS platforms
- Complete within 30 days of hold trigger

**Risks:** Failure to identify a key custodian is a leading cause of spoliation sanctions.

---

### Phase 2 — Preservation
**Obligation:** Suspend routine destruction policies and preserve all potentially relevant ESI and documents once litigation is reasonably anticipated (the **"trigger date"**).

**Key Requirements:**
- Issue legal hold notices to all custodians within 48–72 hours of trigger (or sooner per internal policy)
- Suspend auto-delete policies for email, chat, and cloud storage for in-scope custodians
- Issue preservation directives to IT for targeted systems and backup tapes
- Track custodian acknowledgments; follow up on non-responses within 5 business days
- Refresh hold notices annually or when custodian lists change
- Document all preservation steps in a preservation log

**Governing Standard:** *Zubulake v. UBS Warburg* (S.D.N.Y. 2004); FRCP Rule 37(e)

**Sanctions Risk:** Courts may impose adverse inference instructions if ESI is lost due to failure to preserve after trigger date.

---

### Phase 3 — Collection
**Obligation:** Collect ESI and paper documents in a forensically sound manner that preserves metadata and maintains chain of custody.

**Key Requirements:**
- Use defensible collection methods (forensic tools: FTK, Cellebrite, Nuix Collect, etc.)
- Preserve original metadata: Created, Modified, Accessed, Author, Recipients
- Document chain of custody for each collected data source (Form/log per custodian)
- Collect in native format where possible
- De-duplicate at collection or processing stage
- For mobile: collect SMS, iMessage, WhatsApp, Signal if in scope
- Backup tape restoration: document protocol and scope

**FRCP Rule 34:** Parties may request specific ESI forms; default is native or searchable PDF.

---

### Phase 4 — Processing
**Obligation:** Convert collected data into a reviewable format while preserving integrity and documenting exceptions.

**Key Requirements:**
- Apply date range filters as agreed in FRCP 26(f) conference
- De-duplicate globally (across custodians) or per custodian (as requested)
- De-NIST (remove system/application files using NIST hash database)
- Apply keyword search terms agreed upon by parties; log hit counts
- Process all common file types; track and log exceptions
- OCR scanned/image-only documents
- Generate processing report: total documents IN, total after dedup, exceptions, date range culling
- Maintain audit trail of all processing decisions

---

### Phase 5 — Review
**Obligation:** Conduct a reasonable, defensible review for relevance, responsiveness, and privilege.

**Key Requirements:**
- Code each document as: Responsive / Non-Responsive / Needs Further Review / Privileged / Confidential
- Apply issue tags as instructed by lead attorney
- Manage first-level review with clear reviewer guidelines; conduct second-level QC
- Flag "hot documents" / key docs for attorney attention
- Track review metrics: docs per hour, coding consistency, completion rate
- Apply TAR (Technology Assisted Review) with court-approved protocol where applicable
- Prepare privilege log for all withheld documents (FRCP Rule 26(b)(5))
- Clawback agreement: FRCP Rule 502(d) order recommended to protect against inadvertent privilege waiver

---

### Phase 6 — Production
**Obligation:** Produce responsive, non-privileged documents in the agreed format, with proper Bates numbering, by the court-ordered or agreed-upon deadline.

**Key Requirements:**
- Confirm production format with requesting party (native, TIFF + OCR, PDF, load file)
- Apply Bates numbers: sequential, unique prefix per matter (e.g. ACME_0000001)
- Apply attorney redactions for privilege, PII, trade secrets (log all redactions)
- Produce metadata fields per ESI Protocol (at minimum: BegBates, EndBates, BegAttach, EndAttach, Custodian, DocDate, Author, Recipients, FileType, NativeFile)
- Serve production with cover letter identifying volumes, Bates ranges, and any withholdings
- Maintain production log: date produced, volumes, Bates ranges, recipient
- Certify production per FRCP Rule 26(g)

---

## Key Legal Standards and Rules

| Rule / Standard | Requirement |
|---|---|
| FRCP Rule 26(b)(1) | Proportionality: discovery must be proportional to the needs of the case |
| FRCP Rule 26(b)(5) | Privilege log: must describe withheld documents sufficiently |
| FRCP Rule 26(f) | Meet-and-confer before discovery; agree on ESI format, scope, custodians |
| FRCP Rule 26(g) | Certify discovery requests/responses are complete, correct, not for improper purpose |
| FRCP Rule 34 | Production of documents and ESI; 30-day default response deadline |
| FRCP Rule 37(e) | Sanctions for failure to preserve ESI (must have intent for adverse inference) |
| FRCP Rule 37(f) | Safe harbor for routine operation of computer systems (limited) |
| FRCP Rule 45 | Subpoenas for third-party production |
| FRCP Rule 502(d) | Court order protecting against inadvertent privilege waiver |
| Zubulake Standard | 5-part test for hold obligations; litigation hold trigger date analysis |
| GDPR Art. 5(1)(e) | Data minimization / storage limitation conflicts with broad preservation |
| CCPA § 1798.100 | Consumer rights may conflict with litigation hold duties |

---

## Proportionality Factors (FRCP 26(b)(1))

Courts evaluate eDiscovery scope against:
1. Importance of the issues at stake in the action
2. Amount in controversy
3. Parties' relative access to relevant information
4. Parties' resources
5. Importance of the discovery in resolving the issues
6. Whether the burden or expense is proportional to the likely benefit

---

## Privilege Types Reference

| Privilege | Description | Key Rule |
|---|---|---|
| Attorney-Client | Confidential communications between attorney and client for legal advice | Common law |
| Work Product | Documents prepared in anticipation of litigation by/for attorney | FRCP 26(b)(3) |
| Opinion Work Product | Attorney's mental impressions, conclusions, opinions (highest protection) | FRCP 26(b)(3)(B) |
| Common Interest | Shared privilege among co-parties or joint defense group | Common law |
| Deliberative Process | Government agency pre-decisional, deliberative communications | 5 U.S.C. § 552(b)(5) |

---

## Cross-Border eDiscovery Considerations

| Jurisdiction | Key Consideration |
|---|---|
| EU / GDPR | Art. 48 blocks broad US-style discovery involving EU personal data; Data Transfer Impact Assessment required |
| France | French Blocking Statute (Law No. 68-678) prohibits certain foreign discovery production |
| Germany | BDSG / GDPR restrict collection of employee data without works council notice |
| UK | Data Protection Act 2018; UK GDPR post-Brexit |
| Canada | PIPEDA / provincial privacy laws restrict broad collection |
| China | Data Security Law and Personal Information Protection Law restrict cross-border data transfer |

---

## Matter Compliance Status Levels

| Status | Description |
|---|---|
| 🟢 COMPLIANT | All holds issued, acknowledged, collections complete, production on track |
| 🟡 AT RISK | Missing custodian acknowledgments, approaching deadlines, gaps identified |
| 🔴 NON-COMPLIANT | Missed hold, data loss, production overdue, sanctions risk |
| ⚪ UNDER REVIEW | Matter under compliance assessment — status pending |

---

## Rules and Logic Summary

| Rule ID | Description |
|---|---|
| EDC.HOLD.001 | Legal hold must be issued within 72 hours of litigation trigger date |
| EDC.HOLD.002 | All custodians must acknowledge hold within required SLA |
| EDC.HOLD.003 | Auto-delete policies must be suspended for all in-scope custodians |
| EDC.HOLD.004 | Hold must be refreshed annually or upon material change |
| EDC.COLL.005 | Collection must be forensically sound with documented chain of custody |
| EDC.COLL.006 | Mobile and SaaS sources must be included if in scope |
| EDC.PROC.007 | Processing must include deduplication, date filtering, and exception reporting |
| EDC.PROC.008 | Keyword hit counts must be disclosed to requesting party upon request |
| EDC.REV.009 | Privilege log must be produced for all withheld/redacted documents |
| EDC.REV.010 | QC sampling must achieve defensible confidence level (95% / ±2% margin) |
| EDC.PROD.011 | Production must match agreed ESI protocol format with correct metadata |
| EDC.PROD.012 | Bates numbers must be sequential, unique, and prefixed per matter |
| EDC.PROP.013 | Scope must satisfy FRCP 26(b)(1) proportionality standard |
| EDC.XBDR.014 | Cross-border data transfers must comply with applicable data protection laws |
