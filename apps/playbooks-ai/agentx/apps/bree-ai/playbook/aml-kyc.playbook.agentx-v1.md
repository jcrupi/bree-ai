---
agentx:
  version: 1
  created_at: "2026-03-12T05:29:00Z"
  type: playbook
  filename: aml-kyc.playbook.agentx-v1.md
  domain: aml-kyc
  specialty: Anti-Money Laundering / Know Your Customer
---

# AML / KYC Compliance Playbook
**Domain:** Anti-Money Laundering (AML) & Know Your Customer (KYC)
**Version:** 1
**Owner:** Bree AI — Financial Compliance

---

## Overview

This playbook governs compliance with U.S. and international Anti-Money Laundering (AML) and Know Your Customer (KYC) obligations for financial institutions, money services businesses (MSBs), broker-dealers, insurance companies, and fintech firms.

**Primary Governing Framework (U.S.):**
- **Bank Secrecy Act (BSA)** — 31 U.S.C. § 5311 et seq.
- **USA PATRIOT Act** (2001) — Title III: International Money Laundering Abatement
- **FinCEN regulations** — 31 CFR Chapter X
- **FFIEC AML/CFT Examination Manual**
- **OFAC sanctions programs**

**International Standards:**
- **FATF 40 Recommendations**
- **EU 6th Anti-Money Laundering Directive (6AMLD)**
- **UK Proceeds of Crime Act 2002 (POCA)**

---

## Domain Entities

### Financial Institution (FI)
Any bank, credit union, broker-dealer, MSB, casino, insurance company, or other entity subject to BSA/AML obligations.

### Customer / Beneficial Owner
The individual or legal entity opening or controlling an account or conducting a transaction.
- **Individual:** Name, DOB, SSN/ITIN, address, government ID
- **Legal Entity:** Legal name, EIN, address, jurisdiction of formation, beneficial owners (≥25% ownership or control)

### Customer Due Diligence (CDD)
The process of identifying and verifying customer identity and understanding the nature/purpose of the relationship.
- **Standard CDD:** All customers
- **Simplified CDD (SDD):** Low-risk customers (government entities, listed companies)
- **Enhanced Due Diligence (EDD):** High-risk customers (PEPs, high-risk countries, complex structures)

### Beneficial Ownership
The natural person(s) who ultimately own or control a legal entity customer.
- **FinCEN CDD Rule (2018):** Identify all natural persons owning ≥25% AND one control person
- **EU 5AMLD/6AMLD:** ≥25% ownership threshold; register in national beneficial ownership registry

### Politically Exposed Person (PEP)
Current or former senior government officials and their close associates/family members.
- **Domestic PEP:** Senior U.S. officials, judges, military
- **Foreign PEP:** Foreign heads of state, senior politicians, central bank governors
- **Requirement:** EDD mandatory; ongoing monitoring

### Suspicious Activity Report (SAR)
FinCEN report filed when a transaction involves $5,000+ and the institution suspects money laundering, fraud, or other illegal activity.
- **Filing Deadline:** 30 calendar days from detection (60 days if no suspect identified)
- **Confidentiality:** SAR filing is strictly confidential (31 U.S.C. § 5318(g))
- **Tipping Off:** Prohibited — never inform the subject of a SAR filing

### Currency Transaction Report (CTR)
FinCEN report filed for cash transactions exceeding $10,000 in a single business day from one person.
- **Filing Deadline:** 15 calendar days after transaction
- **Aggregation:** Multiple transactions by same person in same day must be aggregated
- **Structuring:** Deliberately breaking up transactions to avoid CTR = federal crime (18 U.S.C. § 1956)

### OFAC Sanctions Screening
Screening against Department of Treasury's Office of Foreign Assets Control (OFAC) lists.
- **SDN List:** Specially Designated Nationals and Blocked Persons
- **Consolidated Sanctions List:** SDN + sector-specific programs (Cuba, Iran, Russia, Syria, N. Korea, etc.)
- **Requirement:** Screen at onboarding and on list updates; block/reject prohibited transactions

### Transaction Monitoring
Automated or manual review of customer transactions to detect unusual patterns or activity.
- **System:** Rule-based alerts (velocity, structuring, layering) or AI/ML models
- **Alert Triage:** Level 1 review (close no action) → Level 2 review (SAR consideration)
- **Look-Back:** Available for retrospective investigation of new typologies

---

## AML Program (Five Pillars)

Every BSA-covered entity must maintain a written AML program with these five pillars:

### Pillar 1 — Policies, Procedures, and Internal Controls
- Written AML/CFT policies approved by senior management/board
- Procedures for CDD, EDD, SAR/CTR filing, OFAC screening
- Annual review and update cycle

### Pillar 2 — Designated Compliance Officer
- Named BSA/AML Compliance Officer with sufficient authority
- Direct access to board/senior management
- Responsibility for day-to-day AML program operation

### Pillar 3 — Ongoing Training
- Annual AML training for all staff with customer contact
- Role-specific training for compliance, operations, frontline
- Training records maintained ≥5 years

### Pillar 4 — Independent Audit / Testing
- Annual independent audit of AML program effectiveness
- Audit covers CDD, SAR/CTR, OFAC, transaction monitoring
- Findings reported to board/senior management; remediation tracked

### Pillar 5 — Customer Due Diligence (CDD)
- Identify and verify all customers at account opening
- Identify and verify beneficial owners of legal entity customers
- Understand the purpose and expected nature of the relationship
- Ongoing monitoring for suspicious activity and profile changes

---

## Customer Risk Assessment

### Risk Factors (Customer)
| High Risk | Medium Risk | Low Risk |
|---|---|---|
| PEP / senior official | Business customer | Retail consumer |
| High-risk country (FATF list) | Non-resident alien | Government entity |
| Cash-intensive business | Complex ownership | Listed public company |
| MSB / dealer in precious metals | Third-party payments | Low-volume transactor |
| Prior SAR filings | New customer | Long-standing customer |

### Risk Rating System
- **Low:** Standard CDD; periodic review every 3–5 years
- **Medium:** Enhanced monitoring; review every 2–3 years
- **High:** EDD required; ongoing monitoring; review every 6–12 months

---

## KYC Requirements by Customer Type

### Individual Customer
1. Full legal name
2. Date of birth
3. Residential address (not P.O. Box for primary)
4. Government-issued photo ID (passport, driver's license, state ID)
5. SSN / ITIN (for U.S. persons) or TIN equivalent
6. Source of funds/wealth (for high-risk)

### Legal Entity Customer (LLC, Corp, Partnership, Trust)
1. Legal name and trade name (DBA)
2. EIN / Tax ID
3. Principal place of business address
4. Jurisdiction of formation / registration
5. Beneficial ownership (≥25% owners + control person)
6. Nature of business / NAICS code
7. Certified Articles of Formation or equivalent

### Correspondent Banking
- Full AML program review of correspondent bank
- Nested correspondent accounts prohibited (respondent cannot offer services to anonymous third-party FIs)
- Foreign shell bank accounts prohibited (31 CFR § 103.177)

---

## SAR Filing Decision Tree

```
Transaction / Activity Detected
          │
          ▼
Is the transaction $5,000 or more?
    │ NO → SAR not required (but may file voluntarily)
    │ YES ↓
Does the institution suspect:
  - Funds from illegal activity?
  - Transaction designed to evade reporting?
  - No lawful purpose?
  - Unusual for customer profile?
    │ NO → No SAR; document rationale
    │ YES ↓
Gather evidence; conduct enhanced review
          │
          ▼
Decision to file SAR
          │
     File within 30 days of detection
     (60 days if no suspect identified)
          │
     NEVER DISCLOSE to subject
          │
     Maintain SAR + supporting docs 5 years
```

---

## OFAC Screening Process

1. **Onboarding:** Screen all customers, beneficial owners, and related parties against SDN list before account opening
2. **Ongoing:** Re-screen existing customers when OFAC updates lists
3. **Transaction Level:** Screen all wires, ACH, and international payments in real-time
4. **Match Response:**
   - **True Match → Block/Reject:** Do NOT process; report to OFAC; document action
   - **False Positive → Document:** Record rationale for clearing the match
5. **OFAC Reporting:** Report blocked or rejected transactions per OFAC regulations

---

## Red Flags / Typologies

| Category | Red Flag |
|---|---|
| Structuring | Multiple cash deposits just under $10,000 threshold |
| Layering | Rapid movement of funds through multiple accounts/entities |
| Trade-Based ML | Over/under-invoicing; multiple payments for same invoice |
| Shell Companies | Complex ownership with no apparent business purpose |
| Real Estate | All-cash purchase; no financing; frequent flips |
| Crypto | Multiple small crypto purchases; immediate conversion to cash |
| PEP Abuse | Large unexplained wealth inconsistent with public salary |
| Correspondent | Transactions from high-risk jurisdictions via nested accounts |

---

## Key Filing Thresholds

| Report | Threshold | Deadline |
|---|---|---|
| CTR | Cash > $10,000/day | 15 days |
| SAR | ≥ $5,000 suspected ML | 30 days (60 if no suspect) |
| FBAR (FinCEN 114) | Foreign accounts > $10,000 aggregate | April 15 (Oct 15 extension) |
| Form 8300 | Cash > $10,000 in trade/business | 15 days |
| OFAC Blocked Property Report | Any blocked transaction | 10 business days |

---

## Record Retention (BSA Requirements)
| Record | Retention Period |
|---|---|
| CTR | 5 years |
| SAR + supporting documents | 5 years |
| CDD records | 5 years after account closed |
| OFAC screening records | 5 years |
| Training records | 5 years |
| Wire transfer records ($3,000+) | 5 years |
