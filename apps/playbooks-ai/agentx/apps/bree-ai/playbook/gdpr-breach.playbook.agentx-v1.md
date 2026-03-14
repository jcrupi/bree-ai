---
agentx:
  version: 1
  created_at: "2026-03-12T05:29:00Z"
  type: playbook
  filename: gdpr-breach.playbook.agentx-v1.md
  domain: gdpr-breach
  specialty: GDPR Article 30 Records & Data Breach Notification
---

# GDPR Breach & Article 30 Compliance Playbook
**Domain:** EU General Data Protection Regulation (GDPR)
**Version:** 1
**Owner:** Bree AI — Privacy & Compliance

---

## Overview

This playbook governs compliance with two critical GDPR obligations:

1. **Article 30 — Records of Processing Activities (RoPA):** Maintaining a written record of all personal data processing operations.
2. **Articles 33 & 34 — Data Breach Notification:** Identifying, assessing, and notifying supervisory authorities and data subjects following a personal data breach.

**Governing Regulation:** EU Regulation 2016/679 (GDPR), effective May 25, 2018
**UK Equivalent:** UK GDPR + Data Protection Act 2018 (post-Brexit)
**Key Regulator:** Lead Supervisory Authority (LSA) — determined by main establishment
**Maximum Penalties:** Up to €20,000,000 or 4% of global annual turnover (whichever is higher)

---

## Domain Entities

### Data Controller
The natural or legal person that determines the purposes and means of processing personal data.
- **Obligation:** Primary obligation holder for Article 30 RoPA (unless <250 employees exemption applies) and breach notification

### Data Processor
A party that processes personal data on behalf of a controller.
- **Obligation:** Must notify controller of a breach "without undue delay" (Article 33(2))
- Must maintain its own Article 30(2) RoPA for processor activities

### Data Subject
Any identified or identifiable natural person whose personal data is being processed.

### Personal Data
Any information relating to an identified or identifiable natural person.
- **Special Categories (Article 9):** Health data, biometric data, racial/ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, sexual orientation
- **Criminal Convictions (Article 10):** Subject to additional restrictions

### Personal Data Breach
A breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data.
- **Confidentiality Breach:** Unauthorized/accidental disclosure
- **Availability Breach:** Accidental/unauthorized deletion or loss
- **Integrity Breach:** Unauthorized or accidental alteration

### Supervisory Authority (SA)
The national regulatory body responsible for enforcing GDPR in each EU member state.
- **Lead SA:** SA in the country of the controller's main establishment (for cross-border processing)
- **Examples:** ICO (UK), CNIL (France), BfDI (Germany), DPC (Ireland), AEPD (Spain)

### Data Protection Officer (DPO)
A mandated role for processing at large scale or processing of special category data/criminal records.
- **Independence:** Cannot receive instructions regarding DPO duties
- **Notification Role:** Must be notified of breaches and involved in risk assessment

### Risk to Rights and Freedoms
The legal standard triggering breach notification obligations.
- **Low/No Risk:** No notification to SA or data subjects required
- **Risk (≥threshold):** Notify SA within 72 hours (Article 33)
- **High Risk:** Also notify affected data subjects without undue delay (Article 34)

---

## Article 30 — Records of Processing Activities (RoPA)

### Who Must Maintain a RoPA?
All controllers and processors, **except** organizations with:
- Fewer than 250 employees, AND
- Processing is not likely to result in a risk to rights and freedoms, AND
- Processing is occasional, AND
- Processing does not include special categories (Art. 9) or criminal convictions (Art. 10)

**Note:** Most organizations should maintain a RoPA regardless — the exemption is narrow and the consequences of non-compliance are severe.

### Controller RoPA — Required Fields (Article 30(1))
1. **Name and contact details** of controller (and joint controllers/DPO if applicable)
2. **Purposes of processing** — why the data is being processed
3. **Categories of data subjects** — employees, customers, patients, etc.
4. **Categories of personal data** — name, email, health records, financial data, etc.
5. **Categories of recipients** — third parties, processors, foreign recipients
6. **Third-country transfers** — destination country, safeguard mechanism (SCCs, adequacy decision, BCRs)
7. **Retention periods** — how long each category of data is kept
8. **Security measures** — general description of technical/organizational measures (Article 32)

### Processor RoPA — Required Fields (Article 30(2))
1. Name and contact details of processor(s) and controller(s) on whose behalf processing occurs
2. Categories of processing performed on behalf of each controller
3. Third-country transfers (if any)
4. Security measures (general description)

### RoPA Best Practices
- Maintain in electronic form (required to be available to SA on request)
- Review and update at least annually or when new processing is introduced
- Map to Data Processing Agreements (DPAs) for each processor relationship
- Link to DPIA records for high-risk processing activities
- Include processing legal basis for each activity (consent, contract, legal obligation, legitimate interest, vital interests, public task)

---

## Article 33 — Breach Notification to Supervisory Authority

### 72-Hour Clock
The controller must notify the competent SA **within 72 hours** of becoming aware of a personal data breach — UNLESS the breach is unlikely to result in a risk to the rights and freedoms of natural persons.

**"Aware"** = When the controller has a reasonable degree of certainty that a security incident has occurred that has led to personal data being compromised.

### Phased Notification
If all information is not available within 72 hours, notify with available information and indicate that further details will follow. Provide remaining information **without undue delay**.

### Article 33 Notification Must Include:
1. **Nature of breach:** Categories and approximate number of data subjects affected; categories and approximate number of records affected
2. **DPO contact:** Name and contact details of DPO or other point of contact
3. **Likely consequences:** Description of the likely consequences of the breach
4. **Measures taken or proposed:** Steps to address the breach; measures to mitigate possible adverse effects

### When Notification Is NOT Required (Article 33(1))
A breach is unlikely to result in a risk if:
- Encrypted data was breached and the encryption key was not compromised
- The data was immediately and effectively recovered before unauthorized access
- The subjects are not identifiable from the breached data

---

## Article 34 — Communication to Data Subjects (High Risk)

### Trigger
When a breach is **likely to result in a HIGH risk** to data subjects' rights and freedoms, the controller must communicate the breach **directly to affected data subjects without undue delay** (no fixed deadline — but should be as prompt as possible, typically 72 hours as best practice).

### Content of Subject Notification
1. Clear and plain language description of the breach
2. DPO contact details
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach and mitigate harm

### Exceptions (Article 34(3)) — Subject Notification NOT Required if:
- Controller implemented appropriate technical/organizational protection measures (e.g., encryption) that render data unintelligible to unauthorized persons
- Controller took subsequent measures ensuring high risk is no longer likely to materialise
- Notification would involve disproportionate effort → **use public communication instead**

---

## Breach Risk Assessment Framework

### Step 1 — Identify the Breach Type
- **Confidentiality:** Unauthorized access or disclosure
- **Integrity:** Unauthorized modification
- **Availability:** Accidental deletion, ransomware, system failure

### Step 2 — Assess Risk Factors
| Factor | Low Risk | High Risk |
|---|---|---|
| Data type | Non-sensitive (name only) | Special category, financial, credentials |
| Volume | <100 records | Thousands+ |
| Nature of subjects | General public | Vulnerable groups (children, patients) |
| Ease of identification | Cannot identify subjects | Directly identifies subjects |
| Severity of consequence | Inconvenience | Identity theft, medical harm, discrimination |
| Attacker sophistication | Accidental internal exposure | Targeted external attack |

### Step 3 — Risk Determination
- **No/negligible risk:** No notification required; document rationale
- **Likely to result in a risk:** Notify SA within 72 hours (Art. 33)
- **Likely to result in HIGH risk:** Notify SA (Art. 33) + notify data subjects (Art. 34)

### Step 4 — Containment and Remediation
- Isolate affected systems
- Revoke compromised credentials
- Preserve forensic evidence
- Engage DPO and legal counsel
- Assess ongoing risk and implement additional controls

---

## Breach Response Timeline

| Hour | Action |
|---|---|
| 0 | Incident detected / reported |
| 0–1 | Initial triage: confirm breach, assign incident lead |
| 1–4 | Contain breach; begin forensic assessment |
| 4–24 | Notify DPO; begin breach risk assessment |
| 24–48 | Determine notification obligation; prepare SA notification |
| 48–72 | File SA notification (Article 33) |
| 72+ | Follow-up information to SA if initial notification was partial |
| Ongoing | Data subject notifications (Article 34) if high risk; remediation; post-incident review |

---

## Key Legal Bases for Processing (Article 6)

| Legal Basis | Description | Common Use Cases |
|---|---|---|
| Consent (6(1)(a)) | Freely given, specific, informed, unambiguous opt-in | Marketing emails, cookies |
| Contract (6(1)(b)) | Necessary for performance of a contract with the data subject | Order processing, payroll |
| Legal Obligation (6(1)(c)) | Required by EU/member state law | Tax records, AML reporting |
| Vital Interests (6(1)(d)) | Life-or-death situations | Emergency medical care |
| Public Task (6(1)(e)) | Exercise of official authority | Government functions |
| Legitimate Interests (6(1)(f)) | Balancing test; subject to data subject's override right | Fraud prevention, IT security |

---

## Data Subject Rights (Impact on Breach Response)

| Right | Timeframe | Relevance to Breach |
|---|---|---|
| Right to Information (Arts. 13-14) | At collection | Breach notifications must align with privacy notice |
| Right of Access (Art. 15) | 1 month | Data subjects may demand breach details |
| Right to Erasure (Art. 17) | 1 month | Prior erasure may reduce breach scope |
| Right to Restriction (Art. 18) | Without undue delay | Restrict processing during investigation |
| Right to Object (Art. 21) | Without undue delay | May affect whether data should have existed |

---

## Sanctions & Enforcement Reference

| Violation | Maximum Fine |
|---|---|
| Article 30 RoPA failure | €10M or 2% global turnover |
| Article 32 security failure (leading to breach) | €10M or 2% global turnover |
| Article 33/34 breach notification failure | €10M or 2% global turnover |
| Unlawful processing, breach of consent, data transfer without safeguards | €20M or 4% global turnover |
