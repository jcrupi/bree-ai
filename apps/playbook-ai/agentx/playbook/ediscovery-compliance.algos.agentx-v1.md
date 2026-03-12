---
agentx:
  version: 1
  created_at: "2026-03-12T05:19:00Z"
  type: algos
  filename: ediscovery-compliance.algos.agentx-v1.md
  domain: ediscovery-compliance
  specialty: eDiscovery Compliance
---

# eDiscovery Compliance Algos
**Domain:** Electronic Discovery & Litigation Compliance
**Version:** 1
**Owner:** Bree AI — Legal & Compliance

---

## Overview

Executable validation rules for eDiscovery matter compliance. Each rule evaluates one specific obligation from the EDRM lifecycle, FRCP requirements, or Sedona Conference principles. Output is PASS / FAIL / INVESTIGATING per rule.

---

## Validation Rules Summary

| Rule ID | Rule Name | Phase | Risk if FAIL |
|---|---|---|---|
| EDC.HOLD.001 | Legal Hold Timely Issued | Preservation | Spoliation risk; FRCP 37(e) sanctions |
| EDC.HOLD.002 | Custodian Acknowledgment Completeness | Preservation | Unacknowledged custodians = gap in hold |
| EDC.HOLD.003 | Auto-Delete Suspension Verified | Preservation | ESI may be destroyed despite hold |
| EDC.HOLD.004 | Hold Refresh Compliance | Preservation | Stale hold may miss new custodians/sources |
| EDC.CUST.005 | Custodian Universe Complete | Identification | Missed custodian may result in discovery sanction |
| EDC.COLL.006 | Collection Forensic Integrity | Collection | Inadmissible evidence; chain of custody challenge |
| EDC.COLL.007 | Mobile and SaaS Collection | Collection | Missing responsive ESI; sanctions |
| EDC.PROC.008 | Processing Report Completeness | Processing | Undocumented culling = defensibility risk |
| EDC.PROC.009 | Search Terms Disclosure | Processing | Non-compliance with 26(f) conference agreement |
| EDC.REV.010 | Privilege Log Completeness | Review | Privilege waiver; sanction for non-disclosure |
| EDC.REV.011 | QC Sampling Sufficiency | Review | Defensibility of review challenged |
| EDC.PROD.012 | Production Format Compliance | Production | Rejection of production; court sanction |
| EDC.PROD.013 | Bates Numbering Integrity | Production | Production defect; confusion in record |
| EDC.PROP.014 | Proportionality Assessment | Scope | Court may limit or strike discovery |
| EDC.XBDR.015 | Cross-Border Transfer Compliance | All Phases | GDPR / blocking statute violation |

---

## RuleCatalog YAML

```yaml
RuleCatalog:
  domain: ediscovery-compliance
  version: "1.0.0"
  flow:
    - id: EDC.HOLD.001
    - id: EDC.HOLD.002
    - id: EDC.HOLD.003
    - id: EDC.HOLD.004
    - id: EDC.CUST.005
    - id: EDC.COLL.006
    - id: EDC.COLL.007
    - id: EDC.PROC.008
    - id: EDC.PROC.009
    - id: EDC.REV.010
    - id: EDC.REV.011
    - id: EDC.PROD.012
    - id: EDC.PROD.013
    - id: EDC.PROP.014
    - id: EDC.XBDR.015
  rules:
    EDC.HOLD.001:
      name: "Legal Hold Timely Issued"
      category: preservation
      description: "Legal hold notice must be issued within 72 hours of the litigation trigger date"
      inputs: [trigger_date, hold_issued_date, hold_recipients]
      outputs: [hold_timely_issued]
    EDC.HOLD.002:
      name: "Custodian Acknowledgment Completeness"
      category: preservation
      description: "All notified custodians must acknowledge the hold within SLA (typically 5-10 business days)"
      inputs: [custodians_notified, custodians_acknowledged, notification_date, sla_days]
      outputs: [acknowledgment_complete]
    EDC.HOLD.003:
      name: "Auto-Delete Suspension Verified"
      category: preservation
      description: "Routine auto-delete/purge policies must be suspended for all in-scope custodians' data sources"
      inputs: [custodians_in_scope, auto_delete_suspended_for, email_retention_policy_suspended, chat_retention_suspended]
      outputs: [auto_delete_suspended]
    EDC.HOLD.004:
      name: "Hold Refresh Compliance"
      category: preservation
      description: "Hold notices must be refreshed annually or when the custodian list materially changes"
      inputs: [hold_issued_date, last_refresh_date, custodian_changes_since_last_refresh]
      outputs: [hold_current]
    EDC.CUST.005:
      name: "Custodian Universe Complete"
      category: identification
      description: "All individuals with potentially relevant ESI must be identified and included in the hold"
      inputs: [matter_scope, identified_custodians, key_witnesses, it_data_maps, departed_employees_checked]
      outputs: [custodian_universe_complete]
    EDC.COLL.006:
      name: "Collection Forensic Integrity"
      category: collection
      description: "ESI must be collected using defensible methods that preserve metadata and chain of custody"
      inputs: [collection_tool, chain_of_custody_documented, metadata_preserved, collection_report_exists]
      outputs: [collection_defensible]
    EDC.COLL.007:
      name: "Mobile and SaaS Collection"
      category: collection
      description: "Mobile devices and SaaS platforms (Slack, Teams, cloud storage) must be collected if in scope"
      inputs: [mobile_in_scope, mobile_collected, saas_in_scope, saas_collected, saas_platforms]
      outputs: [mobile_saas_collected]
    EDC.PROC.008:
      name: "Processing Report Completeness"
      category: processing
      description: "A processing report must document total docs in, total after dedup/culling, exceptions, and date range"
      inputs: [processing_report_exists, processing_report_fields]
      outputs: [processing_documented]
    EDC.PROC.009:
      name: "Search Terms Disclosure"
      category: processing
      description: "Keyword search terms and hit counts must be documented and disclosed per 26(f) agreement"
      inputs: [search_terms_agreed, hit_counts_reported, parties_confirmed_terms]
      outputs: [search_terms_compliant]
    EDC.REV.010:
      name: "Privilege Log Completeness"
      category: review
      description: "A privilege log must be produced for all withheld or redacted documents (FRCP 26(b)(5))"
      inputs: [privileged_docs_identified, privilege_log_produced, privilege_log_fields, rule_502d_order]
      outputs: [privilege_log_complete]
    EDC.REV.011:
      name: "QC Sampling Sufficiency"
      category: review
      description: "Quality control sampling must achieve 95% confidence / ±2% margin of error on review accuracy"
      inputs: [total_docs_reviewed, qc_sample_size, qc_error_rate, qc_protocol_documented]
      outputs: [qc_defensible]
    EDC.PROD.012:
      name: "Production Format Compliance"
      category: production
      description: "Production must conform to the agreed ESI protocol format with required metadata fields"
      inputs: [esi_protocol_agreed, production_format, metadata_fields_produced, load_files_included]
      outputs: [production_format_compliant]
    EDC.PROD.013:
      name: "Bates Numbering Integrity"
      category: production
      description: "All produced documents must have sequential, unique, matter-prefixed Bates numbers"
      inputs: [bates_prefix, bates_sequential, bates_duplicate_check, production_log_complete]
      outputs: [bates_compliant]
    EDC.PROP.014:
      name: "Proportionality Assessment"
      category: scope
      description: "Discovery scope must be proportional to the needs of the case per FRCP 26(b)(1)"
      inputs: [amount_in_controversy, case_importance, estimated_ediscovery_cost, parties_resources, data_volume_gb]
      outputs: [proportionality_satisfied]
    EDC.XBDR.015:
      name: "Cross-Border Transfer Compliance"
      category: cross_border
      description: "ESI involving non-US data must comply with applicable data protection laws (GDPR, blocking statutes)"
      inputs: [data_jurisdictions, gdpr_data_present, blocking_statutes_applicable, dpia_completed, local_counsel_engaged]
      outputs: [cross_border_compliant]
```

---

## Validation Flow Diagram

```
 [Matter Input / Compliance Review]
           │
           ▼
 ┌─────────────────────────────────────┐
 │ EDC.HOLD.001: Hold Timely Issued?   │
 └─────────────────────────────────────┘
   │ FAIL → Spoliation risk — escalate
   │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.HOLD.002: Acknowledgments Done? │
 └─────────────────────────────────────┘
   │ FAIL → Follow-up required
   │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.HOLD.003: Auto-Delete Paused?   │
 └─────────────────────────────────────┘
   │ FAIL → CRITICAL — ESI at risk
   │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.HOLD.004: Hold Refreshed?       │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.CUST.005: Full Custodian Map?   │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.COLL.006: Forensic Collection?  │
 │ EDC.COLL.007: Mobile + SaaS OK?     │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.PROC.008: Processing Report?    │
 │ EDC.PROC.009: Search Terms OK?      │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.REV.010: Privilege Log OK?      │
 │ EDC.REV.011: QC Sampling OK?        │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.PROD.012: Format Compliant?     │
 │ EDC.PROD.013: Bates OK?             │
 └─────────────────────────────────────┘
           │ PASS ↓
 ┌─────────────────────────────────────┐
 │ EDC.PROP.014: Proportional Scope?   │
 │ EDC.XBDR.015: Cross-Border OK?      │
 └─────────────────────────────────────┘
           │
    [MATTER STATUS: COMPLIANT / AT RISK / NON-COMPLIANT]
```

---

## Algorithm Blocks

---

### EDC.HOLD.001 — Legal Hold Timely Issued

**Input:** `trigger_date`, `hold_issued_date`, `hold_recipients[]`
**Output:** `hold_timely_issued` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Parse `trigger_date` (date litigation became reasonably anticipated)
2. Calculate delta: `hold_issued_date` − `trigger_date` in hours
3. If delta > 72 hours → FAIL ("Hold issued {N} hours after trigger; Zubulake standard requires prompt action — spoliation sanctions risk under FRCP 37(e)")
4. If delta ≤ 72 hours → PASS
5. If `hold_issued_date` is null/missing → FAIL ("No legal hold has been issued for this matter")
6. If `hold_recipients` is empty → FAIL ("Hold issued with no recipients identified")
7. Verify hold covers at least key custodians identified in matter intake → if none, INVESTIGATING

---

### EDC.HOLD.002 — Custodian Acknowledgment Completeness

**Input:** `custodians_notified[]`, `custodians_acknowledged[]`, `notification_date`, `sla_days` (default: 5)
**Output:** `acknowledgment_complete` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Compute `missing = custodians_notified − custodians_acknowledged`
2. Calculate business days since `notification_date`
3. If `missing` is empty → PASS
4. If business days elapsed < `sla_days` → INVESTIGATING (hold issued, SLA window still open)
5. If business days elapsed ≥ `sla_days` AND `missing` non-empty → FAIL
   - Output: "The following custodians have not acknowledged the hold: {list}. Follow-up required immediately."
6. Determine if non-responders include key witnesses or IT personnel → escalate if so

---

### EDC.HOLD.003 — Auto-Delete Suspension Verified

**Input:** `custodians_in_scope[]`, `auto_delete_suspended_for[]`, `email_retention_policy_suspended`, `chat_retention_suspended`
**Output:** `auto_delete_suspended` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. For each custodian in scope, verify their email account is in `auto_delete_suspended_for`
2. Identify any custodian whose auto-delete is NOT suspended → FAIL
   - "Auto-delete ACTIVE for: {list}. ESI for these custodians may be destroyed."
3. Check `email_retention_policy_suspended` → if false → FAIL
4. Check `chat_retention_suspended` (Slack/Teams) → if in-scope chat data and false → FAIL
5. If all suspensions confirmed → PASS
6. If suspension status unknown for any custodian → INVESTIGATING

---

### EDC.HOLD.004 — Hold Refresh Compliance

**Input:** `hold_issued_date`, `last_refresh_date`, `custodian_changes_since_last_refresh`
**Output:** `hold_current` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Calculate months since `last_refresh_date` (or `hold_issued_date` if never refreshed)
2. If months > 12 → FAIL ("Hold not refreshed in over 12 months; annual refresh required")
3. If `custodian_changes_since_last_refresh` > 0 AND refresh not performed since changes → FAIL
   ("Custodian list changed since last refresh — hold must be updated and re-served")
4. If months ≤ 12 AND no unincorporated custodian changes → PASS

---

### EDC.CUST.005 — Custodian Universe Complete

**Input:** `matter_scope`, `identified_custodians[]`, `key_witnesses[]`, `departed_employees_checked`, `it_data_maps[]`
**Output:** `custodian_universe_complete` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Cross-reference `key_witnesses` against `identified_custodians`
   - Any witness NOT in custodian list → FAIL ("Missing custodian: {name}")
2. Verify `departed_employees_checked` = true → if false → FAIL
   ("Departed employees with relevant tenure must be evaluated as custodians")
3. Verify IT data maps exist and cover all major data repositories → if missing → INVESTIGATING
4. Check if matter scope requires non-employee custodians (vendors, contractors, board members)  
   → If not addressed → INVESTIGATING
5. If all key witnesses covered, departed employees checked, and IT maps present → PASS

---

### EDC.COLL.006 — Collection Forensic Integrity

**Input:** `collection_tool`, `chain_of_custody_documented`, `metadata_preserved`, `collection_report_exists`
**Output:** `collection_defensible` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Verify `collection_tool` is a recognized forensic tool (FTK, Nuix, Cellebrite, Relativity Collect, etc.)
   - If collection performed manually (copy/paste, drag and drop) → FAIL
     ("Non-forensic collection method — metadata integrity cannot be guaranteed")
2. Verify `chain_of_custody_documented` = true → if false → FAIL
3. Verify `metadata_preserved` = true (Modified/Created/Accessed/Author/Recipients intact)
   - If metadata stripped or not preserved → FAIL
4. Verify `collection_report_exists` = true → if false → INVESTIGATING
5. All conditions met → PASS

---

### EDC.COLL.007 — Mobile and SaaS Collection

**Input:** `mobile_in_scope`, `mobile_collected`, `saas_in_scope`, `saas_platforms[]`, `saas_collected`
**Output:** `mobile_saas_collected` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. If `mobile_in_scope` = true AND `mobile_collected` = false → FAIL
   ("Mobile devices (SMS, iMessage, WhatsApp) are in scope but have not been collected")
2. If `saas_in_scope` = true AND `saas_collected` = false:
   - For each platform in `saas_platforms` (Slack, Teams, Salesforce, Google Drive, etc.) → FAIL
     ("SaaS platform {name} is in scope but not collected")
3. If `saas_in_scope` = false AND `mobile_in_scope` = false → PASS (not applicable)
4. All in-scope sources collected → PASS
5. Scope unclear → INVESTIGATING

---

### EDC.PROC.008 — Processing Report Completeness

**Input:** `processing_report_exists`, `processing_report_fields{}`
**Output:** `processing_documented` (PASS | FAIL | INVESTIGATING)

**Required Report Fields:**
- `total_docs_collected`, `total_after_dedup`, `total_after_date_filter`, `total_after_keyword_culling`
- `exception_count`, `exception_log_exists`
- `date_range_applied`, `dedup_method` (global vs. custodian-level)
- `processing_vendor`, `processing_date`

**Steps:**
1. If `processing_report_exists` = false → FAIL ("No processing report found")
2. Check each required field is populated → any missing → FAIL (list missing fields)
3. Verify `exception_log_exists` = true → if false and `exception_count` > 0 → FAIL
4. All required fields present → PASS

---

### EDC.PROC.009 — Search Terms Disclosure

**Input:** `search_terms_agreed[]`, `hit_counts_reported`, `parties_confirmed_terms`
**Output:** `search_terms_compliant` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. If `search_terms_agreed` is empty → FAIL ("No search terms have been agreed upon with opposing party")
2. If `hit_counts_reported` = false → FAIL
   ("Hit count disclosure required by FRCP 26(f) agreement / ESI protocol")
3. If `parties_confirmed_terms` = false → INVESTIGATING (negotiation may be ongoing)
4. If all conditions met → PASS

---

### EDC.REV.010 — Privilege Log Completeness

**Input:** `privileged_docs_identified`, `privilege_log_produced`, `privilege_log_fields{}`, `rule_502d_order`
**Output:** `privilege_log_complete` (PASS | FAIL | INVESTIGATING)

**Required Log Fields per Document:**
- `bates_or_doc_id`, `date`, `author`, `recipients`, `privilege_type`, `privilege_description`

**Steps:**
1. If `privileged_docs_identified` > 0 AND `privilege_log_produced` = false → FAIL
   ("FRCP 26(b)(5) requires a privilege log for all withheld documents")
2. Check each required field is populated for all privilege log entries → any missing → FAIL
3. Recommend FRCP 502(d) order if not already in place (`rule_502d_order` = false) → flag as advisory
4. All conditions met → PASS

---

### EDC.REV.011 — QC Sampling Sufficiency

**Input:** `total_docs_reviewed`, `qc_sample_size`, `qc_error_rate`, `qc_protocol_documented`
**Output:** `qc_defensible` (PASS | FAIL | INVESTIGATING)

**Minimum QC Standard:** 95% confidence level / ±2% margin of error

**Required Sample Size Formula (95% CL, ±2%):**
`n = (Z² × p × (1-p)) / e²`  
Where: Z=1.96, p=0.5, e=0.02 → **n ≈ 2,401 documents**

**Steps:**
1. If `qc_sample_size` < 2,401 AND `total_docs_reviewed` > 10,000 → FAIL
   ("QC sample insufficient for defensible confidence level at 95% CL / ±2%")
2. If `qc_sample_size` ≥ `total_docs_reviewed` × 0.1 for small review sets → PASS (proportional)
3. If `qc_error_rate` > 5% → FAIL ("Error rate exceeds threshold — remedial review required")
4. If `qc_protocol_documented` = false → FAIL ("QC protocol must be documented for defensibility")
5. All conditions met → PASS

---

### EDC.PROD.012 — Production Format Compliance

**Input:** `esi_protocol_agreed`, `production_format`, `metadata_fields_produced[]`, `load_files_included`
**Output:** `production_format_compliant` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. If `esi_protocol_agreed` = false → INVESTIGATING ("No agreed ESI protocol on file")
2. Verify `production_format` matches agreed protocol (native, TIFF+OCR, PDF, etc.) → mismatch → FAIL
3. Check all protocol-required metadata fields are in `metadata_fields_produced`
   - Minimum required: BegBates, EndBates, BegAttach, EndAttach, Custodian, DocDate, Author, FileType
   - Missing any required field → FAIL (list missing fields)
4. If native files required and `load_files_included` = false → FAIL
5. All conditions met → PASS

---

### EDC.PROD.013 — Bates Numbering Integrity

**Input:** `bates_prefix`, `bates_sequential`, `bates_duplicate_check`, `production_log_complete`
**Output:** `bates_compliant` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Verify `bates_prefix` is defined and consistent with matter naming convention → if null → FAIL
2. Verify `bates_sequential` = true (no gaps or out-of-order numbers) → if false → FAIL
3. Run `bates_duplicate_check`: any duplicate Bates number across all productions → FAIL
   ("Duplicate Bates numbers found: {list}. Production integrity compromised.")
4. Verify `production_log_complete` = true (all volumes logged with date, recipient, Bates range)
5. All conditions met → PASS

---

### EDC.PROP.014 — Proportionality Assessment

**Input:** `amount_in_controversy`, `case_importance`, `estimated_ediscovery_cost`, `parties_resources`, `data_volume_gb`
**Output:** `proportionality_satisfied` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. Calculate cost-to-controversy ratio: `estimated_ediscovery_cost / amount_in_controversy`
   - If ratio > 0.25 (25% of amount in controversy) → FAIL / flag for court
2. If `data_volume_gb` > 500 GB AND no tiered/phased approach documented → INVESTIGATING
3. Evaluate `case_importance` (regulatory penalty, injunctive relief, precedent) — high importance reduces proportionality concerns
4. Document proportionality analysis in writing for court or meet-and-confer use
5. If cost-to-controversy ratio is reasonable AND phased approach documented → PASS

---

### EDC.XBDR.015 — Cross-Border Transfer Compliance

**Input:** `data_jurisdictions[]`, `gdpr_data_present`, `blocking_statutes_applicable[]`, `dpia_completed`, `local_counsel_engaged[]`
**Output:** `cross_border_compliant` (PASS | FAIL | INVESTIGATING)

**Steps:**
1. If `data_jurisdictions` is empty or only "US" → PASS (no cross-border concern)
2. If `gdpr_data_present` = true:
   - Verify `dpia_completed` = true → if false → FAIL ("GDPR Data Protection Impact Assessment required before cross-border transfer")
   - Verify lawful transfer mechanism (Standard Contractual Clauses, adequacy decision) → if none → FAIL
3. For each jurisdiction in `blocking_statutes_applicable`:
   - France, Germany, Switzerland, etc.: verify local counsel engaged and local court approval obtained if required
   - If `local_counsel_engaged` missing for blocking statute country → FAIL
4. Verify data is not transferred to/from China without PIPL compliance review → if missing → FAIL
5. All cross-border requirements met → PASS
