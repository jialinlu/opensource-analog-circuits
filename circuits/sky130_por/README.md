# Sky130 Power-On-Reset (POR)

## Source
- **Original repository**: [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130)
- **Author / Organization**: Sree Vishnu Varthini
- **License**: Original repository license

## Circuit Description
A power-on-reset circuit in SkyWater 130nm that generates a clean reset pulse when the supply voltage crosses a defined threshold during power-up.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0 | 1 µm | Channel length of core transistor |
| M_0 | 1 | Multiplicity (finger count) |
| W_0 | 1 µm | Width of core transistor |

## Evaluation Metrics
- **trip_point** — Supply voltage at which reset is released (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Netlist adapted from the original repository; `.lib` paths updated to relative.
