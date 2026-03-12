---
agentx:
  version: 1
  created_at: "2026-03-12T05:29:00Z"
  type: algos
  filename: gdpr-breach.algos.agentx-v1.md
  domain: gdpr-breach
---

# GDPR Breach & Article 30 Algos
**Domain:** GDPR Data Breach Notification & Records of Processing
**Version:** 1

---

## RuleCatalog YAML

```yaml
RuleCatalog:
  domain: gdpr-breach
  version: "1.0.0"
  flow:
    - id: GDP.ROP.001
    - id: GDP.LBS.002
    - id: GDP.BRH.003
    - id: GDP.RSK.004
    - id: GDP.72H.005
    - id: GDP.SUB.006
    - id: GDP.DPO.007
    - id: GDP.XFR.008
    - id: GDP.RET.009
    - id: GDP.DSR.010
  rules:
    GDP.ROP.001:
      name: "Article 30 RoPA Completeness"
      category: ropa
      inputs: [ropa_exists, ropa_fields, last_review_date, processor_rpas_covered]
      outputs: [ropa_compliant]
    GDP.LBS.002:
      name: "Legal Basis Documented for Each Processing Activity"
      category: ropa
      inputs: [processing_activities, legal_basis_per_activity]
      outputs: [legal_basis_compliant]
    GDP.BRH.003:
      name: "Breach Identification and Classification"
      category: breach
      inputs: [incident_type, personal_data_involved, breach_confirmed, breach_classification]
      outputs: [breach_classified]
    GDP.RSK.004:
      name: "Breach Risk Assessment"
      category: breach
      inputs: [data_type, data_volume, subject_categories, data_encrypted, attacker_sophistication, breach_classification]
      outputs: [risk_level]
    GDP.72H.005:
      name: "72-Hour SA Notification"
      category: notification
      inputs: [breach_aware_datetime, sa_notification_datetime, sa_notified, notification_fields_complete]
      outputs: [sa_notification_compliant]
    GDP.SUB.006:
      name: "Data Subject Notification (High Risk)"
      category: notification
      inputs: [risk_level, subjects_notified, notification_content_complete, notification_datetime]
      outputs: [subject_notification_compliant]
    GDP.DPO.007:
      name: "DPO Involvement"
      category: governance
      inputs: [dpo_required, dpo_appointed, dpo_notified_of_breach, dpo_registered_with_sa]
      outputs: [dpo_compliant]
    GDP.XFR.008:
      name: "Cross-Border Transfer Safeguards"
      category: transfers
      inputs: [transfer_countries, adequacy_decision, sccs_in_place, bcrs_in_place, transfer_impact_assessment]
      outputs: [transfer_compliant]
    GDP.RET.009:
      name: "Retention Period Compliance"
      category: ropa
      inputs: [processing_activities, retention_periods_defined, automated_deletion_in_place]
      outputs: [retention_compliant]
    GDP.DSR.010:
      name: "Data Subject Rights Response Timelines"
      category: rights
      inputs: [dsr_received_date, dsr_type, dsr_responded_date, response_content_complete]
      outputs: [dsr_compliant]
```

---

## Validation Flow

```
[Processing Activity / Incident Input]
             │
             ▼
 GDP.ROP.001: Article 30 RoPA Complete?
 GDP.LBS.002: Legal Basis Documented?
             │ PASS ↓
 GDP.BRH.003: Breach Confirmed & Classified?
             │ PASS ↓
 GDP.RSK.004: Risk Level Assessed?
             │ PASS ↓
 GDP.72H.005: SA Notified Within 72 Hours?
             │ PASS ↓
 GDP.SUB.006: Data Subjects Notified (if High Risk)?
 GDP.DPO.007: DPO Involved?
             │ PASS ↓
 GDP.XFR.008: Cross-Border Transfers Covered?
 GDP.RET.009: Retention Periods Defined?
 GDP.DSR.010: DSR Responses On Time?
```

---

## Algorithm Blocks

### GDP.ROP.001 — Article 30 RoPA Completeness
**Input:** `ropa_exists`, `ropa_fields{}`, `last_review_date`
**Output:** `ropa_compliant`
1. `ropa_exists` must be true → if false → FAIL ("Article 30 requires written RoPA for all data controllers")
2. Check all 8 required fields per Article 30(1): name/contact, purposes, categories of subjects, categories of data, recipients, third-country transfers, retention periods, security measures → any missing → FAIL
3. `last_review_date` within 12 months → if older → FAIL ("RoPA must be reviewed at least annually")
4. All conditions met → PASS

### GDP.LBS.002 — Legal Basis Documented
**Input:** `processing_activities[]`, `legal_basis_per_activity{}`
**Output:** `legal_basis_compliant`
1. For each processing activity, verify one of 6 legal bases is documented (Art. 6(1)(a-f))
2. For special category data (Art. 9): additional condition (explicit consent, vital interests, etc.) required → if missing → FAIL
3. For consent-based processing: verify consent records maintained and withdrawal mechanism exists
4. Legal basis must be documented in RoPA → if any activity without basis → FAIL

### GDP.BRH.003 — Breach Identification and Classification
**Input:** `incident_type`, `personal_data_involved`, `breach_confirmed`, `breach_classification`
**Output:** `breach_classified`
1. If `personal_data_involved` = false → FAIL (not a GDPR breach — but document rationale)
2. `breach_confirmed` must be true → if still uncertain → INVESTIGATING
3. `breach_classification` must be one of: "confidentiality", "integrity", "availability", or "combined" → if missing → FAIL
4. Classify as confirmed personal data breach → PASS

### GDP.RSK.004 — Breach Risk Assessment
**Input:** `data_type`, `data_volume`, `subject_categories`, `data_encrypted`, `attacker_sophistication`, `breach_classification`
**Output:** `risk_level` ("none", "risk", "high_risk")
1. If `data_encrypted` = true AND encryption key not compromised → risk_level = "none" (no notification required)
2. Score risk factors:
   - Special category data (health, biometric, financial credentials) → +3
   - >1,000 subjects → +2; >100,000 subjects → +3
   - Vulnerable subjects (children, patients) → +2
   - Targeted attack → +2; accidental internal → +0
   - Subjects directly identifiable → +2
3. Score < 3 → "none"; Score 3–5 → "risk" (Art. 33 notification); Score > 5 → "high_risk" (Art. 33 + 34)

### GDP.72H.005 — 72-Hour SA Notification
**Input:** `breach_aware_datetime`, `sa_notification_datetime`, `sa_notified`, `notification_fields_complete`
**Output:** `sa_notification_compliant`
1. If risk_level = "none" → PASS (notification not required; document rationale)
2. If risk_level = "risk" or "high_risk":
   - `sa_notified` must be true → if false → FAIL
   - Calculate hours: `sa_notification_datetime` − `breach_aware_datetime`
   - If hours > 72: FAIL ("Notification filed {N} hours after awareness — exceeds 72-hour GDPR requirement")
   - If hours ≤ 72 but < all information available → INVESTIGATING (phased notification; document what was sent)
3. `notification_fields_complete` (4 required fields per Art. 33(3)) must be true → if false → FAIL
4. On time with complete fields → PASS

### GDP.SUB.006 — Data Subject Notification (High Risk)
**Input:** `risk_level`, `subjects_notified`, `notification_content_complete`, `notification_datetime`
**Output:** `subject_notification_compliant`
1. If risk_level ≠ "high_risk" → PASS (not required)
2. If risk_level = "high_risk":
   - `subjects_notified` must be true → if false → FAIL ("Data subjects must be notified for high-risk breaches per Art. 34")
   - `notification_content_complete` must be true (4 required fields: nature, DPO contact, likely consequences, measures taken)
   - Notification must be in clear, plain language → verify
3. Check if exception applies (Art. 34(3)): encryption, subsequent measures, disproportionate effort → if exception documented → PASS
4. All conditions met → PASS

### GDP.DPO.007 — DPO Involvement
**Input:** `dpo_required`, `dpo_appointed`, `dpo_notified_of_breach`, `dpo_registered_with_sa`
**Output:** `dpo_compliant`
1. Determine if DPO required: public authority, large-scale processing of special categories, or large-scale monitoring → if required and `dpo_appointed` = false → FAIL
2. If DPO appointed: `dpo_notified_of_breach` must be true → if false → FAIL
3. `dpo_registered_with_sa` must be true → if false → FAIL
4. All conditions met → PASS

### GDP.XFR.008 — Cross-Border Transfer Safeguards
**Input:** `transfer_countries[]`, `adequacy_decision`, `sccs_in_place`, `bcrs_in_place`, `transfer_impact_assessment`
**Output:** `transfer_compliant`
1. If no third-country transfers → PASS
2. For each transfer country: verify one safeguard is in place:
   - Adequacy decision (UK, Switzerland, Japan, Canada, etc.) → PASS for that country
   - Standard Contractual Clauses (SCCs) signed → PASS if current (post-Schrems II 2021 version)
   - Binding Corporate Rules (BCRs) approved by SA → PASS
   - None of the above → FAIL ("No lawful transfer mechanism for country: {name}")
3. EU-US Data Privacy Framework: verify certification if applicable
4. `transfer_impact_assessment` required for SCCs → if missing → FAIL

### GDP.RET.009 — Retention Period Compliance
**Input:** `processing_activities[]`, `retention_periods_defined`, `automated_deletion_in_place`
**Output:** `retention_compliant`
1. Every processing activity in RoPA must have a defined retention period → if any missing → FAIL
2. `automated_deletion_in_place` or documented manual deletion process → if neither → FAIL
3. Special categories: shorter retention periods typically required → verify
4. All conditions met → PASS

### GDP.DSR.010 — Data Subject Rights Response Timelines
**Input:** `dsr_received_date`, `dsr_type`, `dsr_responded_date`, `response_content_complete`
**Output:** `dsr_compliant`
1. Calculate response time: `dsr_responded_date` − `dsr_received_date` in calendar days
2. Standard deadline: 1 calendar month (31 days) → if exceeded → FAIL
3. Complex requests: may extend by further 2 months if notified within 1 month → if no extension notice → FAIL
4. `response_content_complete` must be true → if false → FAIL
5. For access requests (Art. 15): must provide copy of data; cannot charge (unless manifestly unfounded/excessive)
6. First instance of DSR was refused: verify legitimate refusal ground documented
7. All conditions met → PASS
