# 5-Stage Charge Pump

## Source
- **Original repository**: [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS)
- **Author / Organization**: Utkarsh
- **License**: Original repository license

## Circuit Description
A five-stage Dickson-style charge pump implemented in CMOS. The design uses embedded BSIM4 device models, making it fully self-contained without external PDK dependencies.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| WN1 | 0.30 µm | Width of NMOS pass transistor (stage 1) |
| WN8 | 0.50 µm | Width of NMOS pass transistor (stage 8) |
| WP1 | 0.30 µm | Width of PMOS pass transistor (stage 1) |
| WP5 | 0.50 µm | Width of PMOS pass transistor (stage 5) |
| LCHN | 0.10 µm | Channel length of NMOS devices |
| LCHP | 0.10 µm | Channel length of PMOS devices |
| C_CAP | 10 pF | Flying capacitor value |

## Evaluation Metrics
- **vout** — Output voltage (V)

## Model Files
None — BSIM4 models are embedded directly in the netlist.

## Notes
Self-contained netlist; no external `.lib` includes required.
