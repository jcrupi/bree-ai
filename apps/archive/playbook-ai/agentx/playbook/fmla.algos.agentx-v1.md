---
agentx:
  version: 1
  created_at: "2026-03-12T05:29:00Z"
  type: algos
  filename: fmla.algos.agentx-v1.md
  domain: fmla
---

# FMLA Algos
**Domain:** Family and Medical Leave Act
**Version:** 1

---

## RuleCatalog YAML

```yaml
RuleCatalog:
  domain: fmla
  version: "1.0.0"
  flow:
    - id: FML.COV.001
    - id: FML.ELG.002
    - id: FML.QRN.003
    - id: FML.SHC.004
    - id: FML.NOT.005
    - id: FML.CRT.006
    - id: FML.DSG.007
    - id: FML.ENT.008
    - id: FML.BEN.009
    - id: FML.RNS.010
    - id: FML.RET.011
    - id: FML.NRR.012
  rules:
    FML.COV.001:
      name: "Covered Employer Determination"
      category: eligibility
      inputs: [entity_type, employee_count, employee_count_within_75_miles, workweeks_in_year]
      outputs: [employer_covered]
    FML.ELG.002:
      name: "Employee Eligibility"
      category: eligibility
      inputs: [months_employed, hours_worked_in_12_months, employees_within_75_miles]
      outputs: [employee_eligible]
    FML.QRN.003:
      name: "Qualifying Reason Determination"
      category: eligibility
      inputs: [reason_for_leave, relationship_to_employee, military_leave_type]
      outputs: [qualifying_reason]
    FML.SHC.004:
      name: "Serious Health Condition Criteria"
      category: medical
      inputs: [leave_reason, inpatient_care, incapacity_days, provider_visits, visit_frequency, chronic_condition, ongoing_treatment]
      outputs: [shc_established]
    FML.NOT.005:
      name: "Employer Notice Obligations"
      category: notice
      inputs: [leave_request_date, eligibility_notice_date, rights_notice_date, designation_notice_date]
      outputs: [notices_timely]
    FML.CRT.006:
      name: "Medical Certification Requirements"
      category: certification
      inputs: [certification_requested, certification_received_date, certification_request_date, certification_content_complete]
      outputs: [certification_compliant]
    FML.DSG.007:
      name: "Leave Designation Correctness"
      category: designation
      inputs: [leave_qualifies, leave_designated_fmla, employer_designated_retroactively, employee_harmed_by_late_designation]
      outputs: [designation_correct]
    FML.ENT.008:
      name: "Leave Entitlement Calculation"
      category: entitlement
      inputs: [fmla_year_method, leave_taken_weeks, military_caregiver_leave_weeks, available_balance]
      outputs: [entitlement_accurate]
    FML.BEN.009:
      name: "Health Insurance Continuation"
      category: benefits
      inputs: [health_insurance_continued, employee_premium_share_required, employee_paid_premium, employer_recovered_premium_lawfully]
      outputs: [benefits_compliant]
    FML.RNS.010:
      name: "Reinstatement Right"
      category: return
      inputs: [employee_returned, same_position_offered, equivalent_position_offered, position_eliminated_during_leave]
      outputs: [reinstatement_compliant]
    FML.RET.011:
      name: "Fitness-for-Duty Certification"
      category: return
      inputs: [ffd_required, ffd_notified_in_designation_notice, ffd_received, ffd_covers_only_shc]
      outputs: [ffd_compliant]
    FML.NRR.012:
      name: "Non-Retaliation Compliance"
      category: anti_retaliation
      inputs: [adverse_action_taken, adverse_action_date, fmla_request_date, temporal_proximity_days, legitimate_reason_documented]
      outputs: [non_retaliation_compliant]
```

---

## Validation Flow

```
[Leave Request / HR Review]
          │
          ▼
 FML.COV.001: Covered Employer?
 FML.ELG.002: Eligible Employee?
          │ PASS ↓
 FML.QRN.003: Qualifying Reason?
 FML.SHC.004: Serious Health Condition?
          │ PASS ↓
 FML.NOT.005: Notices Sent Within 5 Days?
 FML.CRT.006: Certification Within 15 Days?
 FML.DSG.007: Leave Properly Designated?
          │ PASS ↓
 FML.ENT.008: Entitlement Calculated Correctly?
 FML.BEN.009: Health Benefits Continued?
          │ PASS ↓
 FML.RNS.010: Reinstatement Offered?
 FML.RET.011: Fitness-for-Duty if Required?
 FML.NRR.012: No Retaliation?
```

---

## Algorithm Blocks

### FML.COV.001 — Covered Employer Determination
**Input:** `entity_type`, `employee_count`, `employee_count_within_75_miles`, `workweeks_in_year`
**Output:** `employer_covered`
1. If `entity_type` = "public agency" or "school" → PASS (covered regardless of size)
2. If private sector: `employee_count` ≥ 50 for 20+ workweeks in current or prior calendar year → PASS
3. If `employee_count` < 50 → FAIL ("Employer is not a covered employer under FMLA")
4. Borderline (48–52 employees): verify count for 20+ workweeks → INVESTIGATING if uncertain

### FML.ELG.002 — Employee Eligibility
**Input:** `months_employed`, `hours_worked_in_12_months`, `employees_within_75_miles`
**Output:** `employee_eligible`
1. `months_employed` ≥ 12 → if < 12 → FAIL ("Employee has not worked for employer for 12 months")
   - Note: months need not be consecutive; prior service with same employer counts if break < 7 years
2. `hours_worked_in_12_months` ≥ 1,250 → if < 1,250 → FAIL
   - Count actual hours worked (not paid hours off); use records or reasonable estimates
3. `employees_within_75_miles` ≥ 50 → if < 50 → FAIL ("Employee's worksite does not have 50 employees within 75 miles")
4. All three conditions met → PASS

### FML.QRN.003 — Qualifying Reason Determination
**Input:** `reason_for_leave`, `relationship_to_employee`, `military_leave_type`
**Output:** `qualifying_reason`
1. Check `reason_for_leave`:
   - "birth_bonding" or "adoption_foster" → PASS (12 weeks; must complete within 12 months of birth/placement)
   - "employee_shc" → proceed to FML.SHC.004
   - "family_shc" → check `relationship` ∈ [spouse, child, parent] → PASS; domestic partner or in-laws → FAIL (federal FMLA doesn't cover)
   - "military_exigency" → PASS (12 weeks; covered family member: spouse, child, parent of active duty servicemember)
   - "military_caregiver" → PASS (26 weeks; servicemember or veteran within 5 years of discharge)
2. Sibling, grandparent, adult child w/out disability → FAIL (not qualifying under federal FMLA)

### FML.SHC.004 — Serious Health Condition Criteria
**Input:** `inpatient_care`, `incapacity_days`, `provider_visits`, `visit_frequency_per_year`, `chronic_condition`, `ongoing_treatment`
**Output:** `shc_established`
1. If `inpatient_care` = true → PASS (inpatient care test met)
2. If `incapacity_days` ≥ 3 AND `provider_visits` ≥ 2 within 30 days (first within 7 days) → PASS (continuing treatment)
3. If `incapacity_days` ≥ 3 AND `ongoing_treatment` = true (regimen of continuing treatment) → PASS
4. If `chronic_condition` = true AND `visit_frequency_per_year` ≥ 2 → PASS (chronic SHC)
5. Pregnancy/prenatal care: always qualifies → PASS
6. None of the above → FAIL ("Condition does not appear to meet FMLA Serious Health Condition criteria")

### FML.NOT.005 — Employer Notice Obligations
**Input:** `leave_request_date`, `eligibility_notice_date`, `rights_notice_date`, `designation_notice_date`
**Output:** `notices_timely`
1. Eligibility Notice: `eligibility_notice_date` − `leave_request_date` ≤ 5 business days → if exceeded → FAIL
2. Rights & Responsibilities Notice: must be concurrent with Eligibility Notice → verify same date or within 5 business days
3. Designation Notice: `designation_notice_date` − date_of_sufficient_information ≤ 5 business days → if exceeded → FAIL
4. All three notices timely → PASS

### FML.CRT.006 — Medical Certification Requirements
**Input:** `certification_requested`, `certification_received_date`, `certification_request_date`, `certification_content_complete`
**Output:** `certification_compliant`
1. If `certification_requested` = false → PASS (employer chose not to require it)
2. Employee must return certification within 15 calendar days of request
3. If `certification_received_date` − `certification_request_date` > 15 days AND no extension granted → FAIL
4. `certification_content_complete` must be true: HCP identity, condition dates, SHC criteria met, duration/frequency → if false → FAIL
5. Employer clarification: may contact HCP through HR only (not supervisor directly) → flag if improper contact occurred
6. All conditions met → PASS

### FML.DSG.007 — Leave Designation Correctness
**Input:** `leave_qualifies`, `leave_designated_fmla`, `employer_designated_retroactively`, `employee_harmed_by_late_designation`
**Output:** `designation_correct`
1. If `leave_qualifies` = true AND `leave_designated_fmla` = false → FAIL ("Employer must designate qualifying leave as FMLA even if employee hasn't requested it")
2. Retroactive designation: permissible only if `employee_harmed_by_late_designation` = false → if harm exists → FAIL
3. Designation Notice must state hours/weeks counted against entitlement
4. All conditions met → PASS

### FML.ENT.008 — Leave Entitlement Calculation
**Input:** `fmla_year_method`, `leave_taken_weeks`, `military_caregiver_leave_weeks`, `available_balance`
**Output:** `entitlement_accurate`
1. Standard entitlement: 12 weeks; military caregiver: 26 weeks (once per servicemember per injury)
2. Verify `fmla_year_method` is one of: calendar_year, fixed_leave_year, rolling_forward, rolling_backward → if not defined → FAIL (must be chosen and applied consistently)
3. `available_balance` = 12 (or 26) − `leave_taken_weeks` − `military_caregiver_leave_weeks`
4. If calculated balance differs from employer's records → FAIL (discrepancy)
5. Intermittent leave: verify smallest increment used is consistent with employer's other leave policies
6. All conditions met → PASS

### FML.BEN.009 — Health Insurance Continuation
**Input:** `health_insurance_continued`, `employee_premium_share_required`, `employee_paid_premium`, `employer_recovered_premium_lawfully`
**Output:** `benefits_compliant`
1. `health_insurance_continued` must be true → if false → FAIL ("FMLA requires employer to maintain group health insurance on same terms during leave")
2. Employer may require employee to continue paying normal premium share
3. If employee did not pay premium: employer must provide 15-day notice before terminating coverage
4. If employee fails to return after FMLA: employer may recover premiums paid during leave UNLESS non-return is due to continuation of SHC or circumstances beyond employee's control
5. `employer_recovered_premium_lawfully` must be true if recovery occurred → if recovery without proper basis → FAIL
6. All conditions met → PASS

### FML.RNS.010 — Reinstatement Right
**Input:** `employee_returned`, `same_position_offered`, `equivalent_position_offered`, `position_eliminated_during_leave`
**Output:** `reinstatement_compliant`
1. If `employee_returned` = true:
   - `same_position_offered` OR `equivalent_position_offered` must be true → if neither → FAIL
   - Equivalent: same pay, benefits, schedule, working conditions, substantially similar duties
2. If `position_eliminated_during_leave` = true:
   - Must demonstrate position would have been eliminated regardless of leave → document with evidence
   - If no legitimate reason → FAIL (interference with FMLA rights)
3. Key employee (top 10% earner within 75 miles): employer may deny reinstatement ONLY with proper notice procedure
4. All conditions met → PASS

### FML.RET.011 — Fitness-for-Duty Certification
**Input:** `ffd_required`, `ffd_notified_in_designation_notice`, `ffd_received`, `ffd_covers_only_shc`
**Output:** `ffd_compliant`
1. If `ffd_required` = false → PASS (employer chose not to require)
2. `ffd_notified_in_designation_notice` must be true → if not → FAIL ("Employer must notify employee of FFD requirement in Designation Notice")
3. `ffd_received` must be true before reinstatement → if false → INVESTIGATING
4. `ffd_covers_only_shc` must be true → if FFD is a general exam → FAIL ("FFD may only address the specific SHC that caused the leave")
5. All conditions met → PASS

### FML.NRR.012 — Non-Retaliation Compliance
**Input:** `adverse_action_taken`, `adverse_action_date`, `fmla_request_date`, `temporal_proximity_days`, `legitimate_reason_documented`
**Output:** `non_retaliation_compliant`
1. If `adverse_action_taken` = false → PASS
2. If `adverse_action_taken` = true:
   - Calculate `temporal_proximity_days` = `adverse_action_date` − `fmla_request_date`
   - If `temporal_proximity_days` < 30 → FAIL unless `legitimate_reason_documented` = true
   - If `temporal_proximity_days` 30–90 → INVESTIGATING
   - `legitimate_reason_documented` must be true (performance, layoff, misconduct) AND predate FMLA request
3. Policy of counting FMLA absences as negative factor in attendance programs → FAIL per se
4. All conditions met with legitimate reason → PASS
