---
agentx:
  version: 1
  created_at: "2025-03-06T00:00:00Z"
  type: playbook
  filename: dme-ai.playbook.agentx-v1.md
---

# DME AI — Durable Medical Equipment Rules & Codes Playbook

> **Purpose:** Clinical rules and HCPCS coding for Durable Medical Equipment, Prosthetics, Orthotics, and Supplies (DMEPOS). Use when validating, coding, or documenting DME orders and medical necessity.

**Sources:** CMS DMEPOS Fee Schedule, HCPCS Level II, LCD/NCD, Medicare Benefit Policy Manual Ch. 15

**Related:** `dme-ai.algos.agentx-v1.md` — validation algorithms, CMN checks, implementation details

---

## 1. DMEPOS Benefit Categories

Medicare Part B covers medically necessary items in these categories:

| Category | Examples |
|----------|----------|
| **DME** | Hospital beds, wheelchairs, CPAP/BiPAP, oxygen, nebulizers, walkers |
| **Prosthetics** | Artificial limbs, breast prostheses |
| **Prosthetic Devices** | Ostomy supplies, urological supplies |
| **Orthotics** | Braces, orthotic inserts, spinal orthotics |
| **Surgical Dressings** | Wound dressings, compression garments |
| **Therapeutic Shoes** | Diabetic shoes, inserts |
| **Lymphedema** | Compression pumps, garments |

---

## 2. HCPCS Code Ranges (DMEPOS)

| Prefix | Category | Examples |
|--------|----------|----------|
| **E** | DME, equipment | E0601 (CPAP), E0277 (hospital bed), E1390 (oxygen concentrator) |
| **K** | Orthotics, prosthetics | K0001–K0899 (wheelchairs), K0823 (power wheelchair) |
| **L** | Orthotics, prosthetics | L0100–L4999 (orthotics), L5000+ (prosthetics) |
| **A** | Supplies | A4636 (replacement battery), A7030 (CPAP mask) |
| **B** | Enteral, parenteral | B4034 (enteral formula) |

---

## 3. Medical Necessity Requirements

### 3.1 General Rule

All DMEPOS items require **medical necessity** documented in the medical record:

- Diagnosis supporting the need
- Functional limitation or clinical indication
- Why the specific item is required (vs. alternatives)
- Expected benefit or outcome

### 3.2 Certificate of Medical Necessity (CMN)

Some items require a **CMN** (Form 484.03, 484.04, etc.) or **DME Information Form (DIF)**:

| Item Type | CMN/DIF Required | Validity |
|-----------|-------------------|----------|
| Oxygen (E0270, E1390) | Yes | 12 months |
| CPAP/BiPAP (E0601) | Yes | 12 months |
| Hospital bed (E0250–E0304) | Yes | 12 months |
| Power wheelchair (K0823) | Yes | 12 months |
| Nebulizer (E0570) | No | — |
| Walker (E0143) | No | — |

### 3.3 Prior Authorization

Certain items require **Prior Authorization (PA)** before delivery:

- Power mobility devices (PMD)
- Continuous positive airway pressure (CPAP)
- Some orthotics and prosthetics

Check LCD/NCD and MAC-specific requirements.

---

## 4. Common DME Items — HCPCS & Documentation

### 4.1 Oxygen Equipment

| Code | Description | Documentation Required |
|------|-------------|------------------------|
| E1390 | Oxygen concentrator, stationary | CMN; qualifying diagnosis (COPD, hypoxemia); SpO2 ≤88% or PaO2 ≤55 mmHg |
| E1391 | Oxygen concentrator, portable | Same as E1390; document need for portability |
| E0424 | Stationary oxygen concentrator | Same as E1390 |
| E0431 | Portable oxygen | Same; document need for portability |

**Qualifying diagnoses:** COPD (J44.x), chronic respiratory failure (J96.1x), hypoxemia (R09.02). SpO2 ≤88% at rest or PaO2 ≤55 mmHg (or 56–59 mmHg with specific conditions per LCD).

### 4.2 CPAP/BiPAP

| Code | Description | Documentation Required |
|------|-------------|------------------------|
| E0601 | CPAP device | CMN; sleep study (AHI ≥5 or AHI 5–14 with symptoms); face-to-face within 6 months |
| E0470 | BiPAP (non-invasive) | CMN; chronic respiratory failure; documented failure of CPAP if applicable |
| A7030 | CPAP full face mask | Prescription; medical necessity |

### 4.3 Mobility Equipment

| Code | Description | Documentation Required |
|------|-------------|------------------------|
| E0143 | Walker, rigid | Diagnosis; functional limitation; home use |
| E0148 | Walker, wheeled | Same |
| K0001 | Standard wheelchair | Face-to-face; written order; home use; mobility need |
| K0823 | Power wheelchair | CMN; face-to-face; written order; in-home need; failure of manual |

### 4.4 Hospital Beds

| Code | Description | Documentation Required |
|------|-------------|------------------------|
| E0250 | Hospital bed, semi-electric | CMN; diagnosis; need for positioning, safety, or treatment |
| E0251 | Hospital bed, total electric | Same; document why semi-electric insufficient |
| E0270 | Hospital bed, semi-electric (alternate) | Same as E0250 |
| E0277 | Hospital bed, total electric | Same as E0251 |
| E0301 | Hospital bed, semi-electric, with side rails | Same |

### 4.5 Diabetic Supplies

| Code | Description | Documentation Required |
|------|-------------|------------------------|
| A4253 | Blood glucose test strips | Diabetes diagnosis; testing frequency |
| A4259 | Lancets | Same |
| K0552 | Insulin pump supply | Insulin pump user |

---

## 5. Place of Service (POS)

| POS | Description |
|-----|-------------|
| 12 | Home |
| 11 | Office |
| 31 | Skilled nursing facility |
| 32 | Nursing facility |

Most DME is delivered to **home (12)**. Document place of use when relevant.

---

## 6. ICD-10 Diagnoses — Common DME

| DME Item | Typical ICD-10 |
|----------|----------------|
| Oxygen | J44.0, J96.10, J96.11, R09.02 |
| CPAP | G47.33 (obstructive sleep apnea) |
| Hospital bed | G82.20, M62.81, R26.0 |
| Wheelchair | G82.20, R26.0, Z99.1 |
| Walker | R26.0, S72.001A, M25.561 |
| Diabetic supplies | E11.65, E10.65 |

---

## 7. Documentation Checklist (General)

For each DME order, ensure:

1. **Diagnosis** — ICD-10 supporting medical necessity
2. **Clinical indication** — Why the patient needs the item
3. **Face-to-face** — When required (e.g., power mobility, CPAP)
4. **CMN/DIF** — When required; signed, dated, within validity period
5. **Written order** — Before delivery (WOPD)
6. **Place of use** — Typically home

---

## 8. LCD/NCD Reference

- Check **Local Coverage Determinations (LCD)** for MAC-specific rules
- Check **National Coverage Determinations (NCD)** for Medicare-wide policy
- LCDs define covered diagnoses, documentation, and frequency limits

---

## 9. Modifiers

| Modifier | Use |
|----------|-----|
| RR | Rental |
| NU | Purchase (new) |
| UE | Used durable medical equipment |
| KX | Requirements specified in LCD met |
| GA | Waiver of liability on file |
| GZ | Item expected to be denied (no waiver) |

---

## 10. Competitive Bidding

- Certain DME items are subject to **Competitive Bidding Program (CBP)**
- Use **contract supplier** in CBA (Competitive Bidding Area) when applicable
- Fee schedule amounts may be adjusted based on CBP

---

## 11. Chart Validity — DME Order Signals

A document is a **valid DME order** when it contains ≥2 of:

- HCPCS code(s) for requested item(s)
- ICD-10 diagnosis supporting medical necessity
- Clinical indication or functional limitation
- Patient identifier, date, prescribing provider
- CMN/DIF when required (oxygen, CPAP, hospital bed, power wheelchair)

**Reject** if: no HCPCS, no diagnosis, or non-DME content.

---

## 12. Contradiction Detection

**Flag** when:

- CMN required but not attached or expired
- Face-to-face required but not documented within 6 months
- Written order date after delivery (WOPD violation)
- Diagnosis does not support medical necessity for item
- Quantity exceeds LCD frequency limits

---

**END OF PLAYBOOK**

*Aligned with CMS DMEPOS policy. Verify LCD/NCD for MAC-specific rules.*
