---
agentx:
  version: 1
  created_at: "2026-03-12T05:29:00Z"
  type: algos
  filename: aml-kyc.algos.agentx-v1.md
  domain: aml-kyc
---

# AML / KYC Algos
**Domain:** Anti-Money Laundering / Know Your Customer
**Version:** 1

---

## RuleCatalog YAML

```yaml
RuleCatalog:
  domain: aml-kyc
  version: "1.0.0"
  flow:
    - id: AML.COV.001
    - id: AML.CDD.002
    - id: AML.BOW.003
    - id: AML.PEP.004
    - id: AML.OFC.005
    - id: AML.CTR.006
    - id: AML.SAR.007
    - id: AML.STR.008
    - id: AML.TRN.009
    - id: AML.AUD.010
  rules:
    AML.COV.001:
      name: "BSA Coverage Determination"
      category: eligibility
      inputs: [entity_type, annual_transactions, services_offered]
      outputs: [bsa_covered]
    AML.CDD.002:
      name: "Customer Due Diligence Completeness"
      category: kyc
      inputs: [customer_name, dob_or_formation_date, address, id_type, id_number, id_verified, business_purpose]
      outputs: [cdd_complete]
    AML.BOW.003:
      name: "Beneficial Ownership Identification"
      category: kyc
      inputs: [customer_type, beneficial_owners, control_person, ownership_percentages]
      outputs: [beneficial_ownership_complete]
    AML.PEP.004:
      name: "PEP Screening and EDD"
      category: edd
      inputs: [customer_name, pep_screening_performed, pep_match, edd_conducted, source_of_wealth_documented]
      outputs: [pep_edd_compliant]
    AML.OFC.005:
      name: "OFAC Sanctions Screening"
      category: screening
      inputs: [customer_screened, beneficial_owners_screened, transaction_screened, match_result, match_disposition]
      outputs: [ofac_clear]
    AML.CTR.006:
      name: "Currency Transaction Report Filing"
      category: reporting
      inputs: [cash_transactions, aggregated_daily_amount, ctr_filed, ctr_filing_date, transaction_date]
      outputs: [ctr_compliant]
    AML.SAR.007:
      name: "Suspicious Activity Report Filing"
      category: reporting
      inputs: [transaction_amount, suspicion_detected_date, sar_filed, sar_filing_date, subject_notified]
      outputs: [sar_compliant]
    AML.STR.008:
      name: "Structuring Detection"
      category: monitoring
      inputs: [transactions, cash_amounts, dates, same_person]
      outputs: [structuring_detected]
    AML.TRN.009:
      name: "Transaction Monitoring Coverage"
      category: monitoring
      inputs: [monitoring_system_active, alert_review_documented, lookback_period_days, escalation_documented]
      outputs: [transaction_monitoring_compliant]
    AML.AUD.010:
      name: "Independent AML Audit"
      category: program
      inputs: [last_audit_date, audit_performed_by, findings_reported_to_board, remediation_tracked]
      outputs: [audit_compliant]
```

---

## Validation Flow

```
[Customer / Transaction Input]
         │
         ▼
 AML.COV.001: BSA Covered?
         │ PASS ↓
 AML.CDD.002: CDD Complete?
         │ PASS ↓
 AML.BOW.003: Beneficial Owners ID'd?
         │ PASS ↓
 AML.PEP.004: PEP Screened + EDD?
         │ PASS ↓
 AML.OFC.005: OFAC Clear?
         │ PASS ↓
 AML.CTR.006: CTR Filed if >$10K cash?
 AML.SAR.007: SAR Filed if suspicious?
 AML.STR.008: Structuring Detected?
         │
 AML.TRN.009: Transaction Monitoring Active?
 AML.AUD.010: Annual Audit Done?
```

---

## Algorithm Blocks

### AML.COV.001 — BSA Coverage Determination
**Input:** `entity_type`, `annual_transactions`, `services_offered`
**Output:** `bsa_covered` (PASS | FAIL | INVESTIGATING)
1. If `entity_type` ∈ [bank, credit union, broker-dealer, MSB, insurance, casino] → PASS (BSA covered)
2. If entity is MSB: verify FinCEN MSB registration current → if not → FAIL
3. If entity type unclear → INVESTIGATING

### AML.CDD.002 — Customer Due Diligence Completeness
**Input:** `customer_name`, `dob_or_formation_date`, `address`, `id_type`, `id_number`, `id_verified`, `business_purpose`
**Output:** `cdd_complete` (PASS | FAIL | INVESTIGATING)
1. All five required CDD fields must be present and verified
2. `id_verified` must be true (documentary or non-documentary verification)
3. `business_purpose` documented for business customers → if missing → FAIL
4. For high-risk customers: source of funds/wealth must also be documented

### AML.BOW.003 — Beneficial Ownership Identification (Legal Entities)
**Input:** `customer_type`, `beneficial_owners[]`, `control_person`, `ownership_percentages[]`
**Output:** `beneficial_ownership_complete` (PASS | FAIL | INVESTIGATING)
1. If `customer_type` = individual → PASS (not applicable)
2. Identify all persons owning ≥25% → if any missing → FAIL
3. Identify at least one control person (managing member, CEO, president, etc.) → if missing → FAIL
4. For each beneficial owner: name, DOB, address, SSN verified → if any not verified → FAIL

### AML.PEP.004 — PEP Screening and EDD
**Input:** `pep_screening_performed`, `pep_match`, `edd_conducted`, `source_of_wealth_documented`
**Output:** `pep_edd_compliant` (PASS | FAIL | INVESTIGATING)
1. `pep_screening_performed` must be true → if false → FAIL
2. If `pep_match` = true:
   - `edd_conducted` must be true → if false → FAIL
   - `source_of_wealth_documented` must be true → if false → FAIL
   - Ongoing monitoring must be confirmed (annual review at minimum)
3. If no PEP match and screening performed → PASS

### AML.OFC.005 — OFAC Sanctions Screening
**Input:** `customer_screened`, `beneficial_owners_screened`, `transaction_screened`, `match_result`, `match_disposition`
**Output:** `ofac_clear` (PASS | FAIL | INVESTIGATING)
1. `customer_screened` must be true → if false → FAIL
2. `beneficial_owners_screened` must be true for legal entities → if false → FAIL
3. For wires/international: `transaction_screened` must be true → if false → FAIL
4. If `match_result` = "true_match" → FAIL ("Transaction must be blocked; report to OFAC")
5. If `match_result` = "false_positive" → verify `match_disposition` is documented → PASS
6. If `match_result` = "no_match" → PASS

### AML.CTR.006 — CTR Filing Compliance
**Input:** `cash_transactions[]`, `aggregated_daily_amount`, `ctr_filed`, `ctr_filing_date`, `transaction_date`
**Output:** `ctr_compliant` (PASS | FAIL | INVESTIGATING)
1. Aggregate all cash transactions by same person on same business day
2. If `aggregated_daily_amount` > $10,000:
   - `ctr_filed` must be true → if false → FAIL ("CTR required for cash transactions exceeding $10,000")
   - `ctr_filing_date` must be within 15 calendar days of `transaction_date` → if late → FAIL
3. Check for structuring patterns (amounts consistently just under $10,000) → flag for AML.STR.008
4. If `aggregated_daily_amount` ≤ $10,000 → PASS (not required)

### AML.SAR.007 — SAR Filing Compliance
**Input:** `transaction_amount`, `suspicion_detected_date`, `sar_filed`, `sar_filing_date`, `subject_notified`
**Output:** `sar_compliant` (PASS | FAIL | INVESTIGATING)
1. If `transaction_amount` ≥ $5,000 and suspicious:
   - `sar_filed` must be true → if false → FAIL
   - Filing deadline: `sar_filing_date` ≤ `suspicion_detected_date` + 30 days → if late → FAIL (60 days if no suspect)
   - `subject_notified` must be false → if true → FAIL ("Tipping off is a federal crime")
2. SAR must be retained with supporting documentation for 5 years
3. If `transaction_amount` < $5,000 → INVESTIGATING (voluntary SAR may still be warranted)

### AML.STR.008 — Structuring Detection
**Input:** `transactions[]` (amount, date, person), `cash_amounts[]`, `same_person`
**Output:** `structuring_detected` (PASS = no structuring | FAIL = structuring pattern found)
1. For each person, aggregate cash transactions within a 1–5 business day window
2. Detect pattern: multiple transactions each <$10,000 that together exceed $10,000
3. If pattern detected AND no legitimate business explanation → FAIL
   ("Potential structuring detected: {transaction list}. SAR filing required. 18 U.S.C. § 1956.")
4. No suspicious pattern → PASS

### AML.TRN.009 — Transaction Monitoring Compliance
**Input:** `monitoring_system_active`, `alert_review_documented`, `lookback_period_days`, `escalation_documented`
**Output:** `transaction_monitoring_compliant` (PASS | FAIL | INVESTIGATING)
1. `monitoring_system_active` must be true → if false → FAIL
2. `alert_review_documented` must be true (Level 1 and Level 2 reviews logged) → if false → FAIL
3. `escalation_documented` must be true for SAR-considered cases → if false → FAIL
4. All conditions met → PASS

### AML.AUD.010 — Independent AML Audit
**Input:** `last_audit_date`, `audit_performed_by`, `findings_reported_to_board`, `remediation_tracked`
**Output:** `audit_compliant` (PASS | FAIL | INVESTIGATING)
1. `last_audit_date` must be within 12 months → if > 12 months → FAIL
2. `audit_performed_by` must be independent (not supervised by BSA officer) → if not → FAIL
3. `findings_reported_to_board` must be true → if false → FAIL
4. `remediation_tracked` must be true for any findings → if false → FAIL
5. All conditions met → PASS
