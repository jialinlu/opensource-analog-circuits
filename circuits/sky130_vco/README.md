# Sky130 GHz-Range Low-Power VCO

## Source
- **Original repository**: [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO)
- **Author / Organization**: SANGESH007
- **License**: License of the original repository

## Description
A ring-oscillator-based voltage-controlled oscillator (VCO) designed in SkyWater 130nm. The design targets GHz-range oscillation frequency while maintaining low power consumption.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| W_N | 1.0 µm | NMOS inverter device width |
| L_N | 0.15 µm | NMOS device channel length |
| W_P | 2.745 µm | PMOS inverter device width |
| W_P2 | 1.0 µm | Secondary PMOS device width |
| L_P | 0.35 µm | PMOS device channel length |
| W_TAIL | 1.0 µm | Tail current source width |
| L_TAIL | 0.15 µm | Tail current source channel length |

## Metrics
- **ymax** — Maximum output swing / frequency metric
- **ymin** — Minimum output swing / frequency metric

## Model files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Adapted from the original VCO repository; `.lib` paths have been corrected to relative paths.
