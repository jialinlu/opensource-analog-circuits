# Sky130 Low-Dropout Regulator (LDO)

## Source
- **Original repository**: [ayeshafareed/LDO_MOSFET](https://github.com/ayeshafareed/LDO_MOSFET)
- **Author / Organization**: Ayesha Fareed
- **License**: Original repository license

## Circuit Description
A low-dropout voltage regulator implemented in SkyWater 130nm. The design uses an error amplifier and a pass transistor to maintain a stable output voltage with minimal headroom.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_1 | 1, 1 | Channel length of core transistors (µm) |
| M_0–M_1 | 1, 1 | Multiplicity (finger count) |
| W_0–W_1 | 1, 1 | Width of core transistors (µm) |

## Evaluation Metrics
- **vout** — Regulated output voltage (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Netlist adapted from the original repo; `.lib` paths updated to relative.
