---
type: math-template
id: fft-4point-magnitude
name: 4-Point Signal Spectrum Analysis (Fast Fourier)
---

# Template: 4-Point FFT Magnitude

## Description
Performs a 4-Point Discrete Fourier Transform (DFT) optimization on a raw signal sequence and computes the spectral magnitude for each frequency bin.

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `x0` | Signal Sample 0 | Yes |
| `x1` | Signal Sample 1 | Yes |
| `x2` | Signal Sample 2 | Yes |
| `x3` | Signal Sample 3 | Yes |

## Expected Output (Frequency Bins)
- `Mag0`: Magnitude of DC component.
- `Mag1`: Magnitude of fundamental frequency.
- `Mag2`: Magnitude of 2nd harmonic.
- `Mag3`: Magnitude of 3rd harmonic (Nyquist).

## Math AI Logic Model
```json
{
  "id": "fft-4point-magnitude",
  "name": "4-Point FFT",
  "variables": { "x0": 0, "x1": 0, "x2": 0, "x3": 0 },
  "operations": [
    { "id": "re0", "op": "sum", "args": ["x0", "x1", "x2", "x3"], "result": "RE0" },
    { "id": "im0", "op": "add", "args": [0, 0], "result": "IM0" },

    { "id": "re1", "op": "subtract", "args": ["x0", "x2"], "result": "RE1" },
    { "id": "im1", "op": "subtract", "args": ["x3", "x1"], "result": "IM1" },

    { "id": "re2", "op": "add", "args": [{ "op": "subtract", "args": ["x0", "x1"] }, { "op": "subtract", "args": ["x2", "x3"] }], "result": "RE2" },
    { "id": "im2", "op": "add", "args": [0, 0], "result": "IM2" },

    { "id": "re3", "op": "subtract", "args": ["x0", "x2"], "result": "RE3" },
    { "id": "im3", "op": "subtract", "args": ["x1", "x3"], "result": "IM3" },

    { "id": "mag0", "op": "sqrt", "args": [{ "op": "add", "args": [{ "op": "pow", "args": ["RE0", 2] }, { "op": "pow", "args": ["IM0", 2] }] }], "result": "Mag0" },
    { "id": "mag1", "op": "sqrt", "args": [{ "op": "add", "args": [{ "op": "pow", "args": ["RE1", 2] }, { "op": "pow", "args": ["IM1", 2] }] }], "result": "Mag1" },
    { "id": "mag2", "op": "sqrt", "args": [{ "op": "add", "args": [{ "op": "pow", "args": ["RE2", 2] }, { "op": "pow", "args": ["IM2", 2] }] }], "result": "Mag2" },
    { "id": "mag3", "op": "sqrt", "args": [{ "op": "add", "args": [{ "op": "pow", "args": ["RE3", 2] }, { "op": "pow", "args": ["IM3", 2] }] }], "result": "Mag3" }
  ],
  "final_result": "Mag1"
}
```
