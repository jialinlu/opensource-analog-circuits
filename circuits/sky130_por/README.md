# Sky130 Power-On-Reset (POR)

## Source
- **Original repository**: [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130)
- **Author / Organization**: Sree Vishnu Varthini
- **License**: License of the original repository

## Description
A power-on-reset circuit in SkyWater 130nm that generates a clean reset pulse when the supply voltage crosses a defined threshold during power-up.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0 | 1 µm | Core transistor channel length |
| M_0 | 1 | Multiplicity (number of fingers) |
| W_0 | 1 µm | Core transistor width |

## Metrics
- **trip_point** — Supply voltage at reset release (V)

## Model files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Netlist adapted from the original repository; `.lib` paths have been updated to relative paths.
