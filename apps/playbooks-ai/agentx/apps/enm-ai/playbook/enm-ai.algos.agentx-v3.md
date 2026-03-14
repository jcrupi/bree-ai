---
agentx:
  version: 3
  created_at: "2026-03-13T10:58:00Z"
  type: algo
  filename: enm-ai.algos.agentx-v3.md
---

# E/M AI — Validation Algorithms AgentX (SNF/Optimization)

> **Purpose:** Deterministic algorithms for E/M level validation with specific support for Subsequent Nursing Facility Care (99309) and proactive billing optimization.

---

## 3. CPT Code Tables (Refined for SNF)

### 3.5 Nursing Facility (POS 31, 32)
| Code | MDM | Time Min | Time Max |
|------|-----|----------|----------|
| 99304 | Straightforward/Low | 25 | 34 |
| 99305 | Moderate | 35 | 44 |
| 99306 | High | 45 | 59 |
| 99307 | Straightforward | 10 | 14 |
| 99308 | Low | 15 | 29 |
| **99309** | **Moderate** | **30** | **44** |
| 99310 | High | 45 | 59 |

---

## 20. Algorithm: Optimization & Upsell Analysis (EM.OPT.090)

**Input:** current_finding, target_mdm_level, extracted_elements

**Output:** optimization_suggestion (string)

**Logic:**
If `current_finding.status == PASS` and code is below the maximum possible for the specialty:
1. **Data Optimization:** If `data_items.count == 2`, suggest: "Reviewing or ordering 1 additional unique test would meet the Moderate Data complexity required for 99309."
2. **Risk Optimization:** If `risk_level == Low` and drugs are mentioned but 'management' is unclear, suggest: "Explicitly documenting 'Prescription drug management' (e.g., dosage change or risk assessment) would satisfy Moderate Risk for 99309."
3. **Time Optimization:** If `documented_time == 28`, suggest: "Documenting 2 additional minutes of care coordination or documentation time would reach the 30-minute threshold for 99309."

---

## 21. Real Rules (Optimization Additions)

### EM.OPT.090 — Proactive Remediation (Real)

| Field | Value |
|-------|-------|
| rule_id | EM.OPT.090 |
| severity | INFO |
| condition | `target_code == '99308' and mdm_problems == 'Moderate' and mdm_data == 'Low' and risk == 'Moderate'` |
| action | SUGGEST, "You are 1 Data element away from 99309. Add review of a prior note or test result." |
| condition | `target_code == '99308' and mdm_problems == 'Moderate' and mdm_data == 'Moderate' and risk == 'Low'` |
| action | SUGGEST, "You are 1 Risk element away from 99309. Document prescription drug management risk." |

---

**END OF ALGOS v3**
