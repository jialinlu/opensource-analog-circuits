# PTM 180nm Two-Stage OpAmp

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: License of the original repository

## Description
A classic Miller-compensated two-stage operational amplifier designed with ASU Predictive Technology Model (PTM) 180nm devices. This is one of the benchmark circuits in the AnalogGym framework.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| W1–W2 | 10 µm | Input differential pair width (M1/M2) |
| W3–W4 | 20 µm | Current-mirror active load width (M3/M4) |
| W5 | 15 µm | Tail current source width (M5) |
| W6 | 40 µm | Second-stage driver width (M6) |
| W7 | 20 µm | Second-stage load width (M7) |
| W8 | 5 µm | Bias transistor width (M8) |
| L1–L2 | 0.36 µm | Channel length |
| Cc | 3 pF | Miller compensation capacitor |
| Ibias | 30 µA | Bias current |
| Cload | 10 pF | Output load capacitance |
| Vcm | 0.6 V | Common-mode input voltage |

## Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model files
- `ptm180nm.lib` — ASU PTM 180nm BSIM3v3 models

## Notes
The netlist was extracted from the AnalogGym suite and adapted for this benchmark (parameter names have been standardized and the `.lib` path has been corrected).
