# 5-Stage Charge Pump

## Source
- **Original repository**: [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS)
- **Author / Organization**: Utkarsh
- **License**: License of the original repository

## Description
A five-stage Dickson-style charge pump implemented in CMOS. The design uses built-in BSIM4 device models and is fully self-contained, with no external PDK dependencies.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| WN1 | 0.30 µm | NMOS pass transistor width (stage 1) |
| WN8 | 0.50 µm | NMOS pass transistor width (stage 8) |
| WP1 | 0.30 µm | PMOS pass transistor width (stage 1) |
| WP5 | 0.50 µm | PMOS pass transistor width (stage 5) |
| LCHN | 0.10 µm | NMOS device channel length |
| LCHP | 0.10 µm | PMOS device channel length |
| C_CAP | 10 pF | Flying capacitor value |

## Metrics
- **vout** — Output voltage (V)

## Model files
None — the BSIM4 models are embedded directly in the netlist.

## Notes
Self-contained netlist; no external `.lib` includes required.
