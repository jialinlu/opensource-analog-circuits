# PTM 180nm Two-Stage OpAmp

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
A classic Miller-compensated two-stage operational amplifier designed with ASU Predictive Technology Model (PTM) 180nm devices. This is one of the baseline circuits from the AnalogGym framework.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| W1–W2 | 10 µm | Width of input differential pair (M1/M2) |
| W3–W4 | 20 µm | Width of current-mirror active load (M3/M4) |
| W5 | 15 µm | Width of tail current source (M5) |
| W6 | 40 µm | Width of second-stage driver (M6) |
| W7 | 20 µm | Width of second-stage load (M7) |
| W8 | 5 µm | Width of bias transistor (M8) |
| L1–L2 | 0.36 µm | Channel length |
| Cc | 3 pF | Miller compensation capacitor |
| Ibias | 30 µA | Bias current |
| Cload | 10 pF | Output load capacitor |
| Vcm | 0.6 V | Common-mode input voltage |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
- `ptm180nm.lib` — ASU PTM 180nm BSIM3v3 model

## Notes
This netlist was extracted from the AnalogGym suite and adapted for this benchmark (parameter names standardized, `.lib` paths fixed).
