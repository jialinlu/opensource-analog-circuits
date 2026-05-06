# AutoCkt Two-Stage OpAmp (PTM 45nm)

## Source
- **Original repository**: [ksettaluri6/AutoCkt](https://github.com/ksettaluri6/AutoCkt)
- **Author / Organization**: K. Settaluri et al., Stanford University
- **License**: Original repository license

## Circuit Description
Two-stage operational amplifier used as the primary benchmark in the AutoCkt paper ("AutoCkt: Deep Reinforcement Learning of Analog Circuit Designs"). Fabricated with PTM 45nm models.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| wp1, lp1, mp1 | 0.5 µm, 90 nm, 10 | Input PMOS diff-pair (M1/M2) |
| wn1, ln1, mn1 | 0.5 µm, 90 nm, 38 | NMOS current-mirror load (M3/M4) |
| wn3, ln3, mn3 | 0.5 µm, 90 nm, 9 | Tail current source (M5) |
| wp3, lp3, mp3 | 0.5 µm, 90 nm, 4 | Second-stage PMOS driver (M6) |
| wn4, ln4, mn4 | 0.5 µm, 90 nm, 20 | Second-stage NMOS load (M7) |
| wn5, ln5, mn5 | 0.5 µm, 90 nm, 60 | Bias transistor (M8) |
| cc | 3 pF | Miller compensation capacitor |
| ibias | 30 µA | Bias current |
| cload | 10 pF | Output load capacitor |
| vcm | 0.6 V | Common-mode input voltage |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
- `45nm_bulk.txt` — PTM 45nm BSIM4 bulk model

## Notes
Netlist copied from AutoCkt repo and adapted (`.include` path fixed to relative).
