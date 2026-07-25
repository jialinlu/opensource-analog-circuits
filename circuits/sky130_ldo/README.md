# Sky130 Low-Dropout Regulator (LDO)

## Source
- **Original repository**: [ayeshafareed/LDO_MOSFET](https://github.com/ayeshafareed/LDO_MOSFET)
- **Author / Organization**: Ayesha Fareed
- **License**: License of the original repository

## Description
A low-dropout regulator implemented in SkyWater 130nm. The design uses an error amplifier and a pass transistor to maintain a stable output voltage at minimum dropout.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_1 | 1, 1 | Core transistor channel length (µm) |
| M_0–M_1 | 1, 1 | Multiplicity (number of fingers) |
| W_0–W_1 | 1, 1 | Core transistor width (µm) |

## Metrics
- **vout** — Regulated output voltage (V)

## Model files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Netlist adapted from the original repository; `.lib` paths have been updated to relative paths.
