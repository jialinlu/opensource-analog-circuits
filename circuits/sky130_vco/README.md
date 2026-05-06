# Sky130 GHz-Range Low-Power VCO

## Source
- **Original repository**: [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO)
- **Author / Organization**: SANGESH007
- **License**: Original repository license

## Circuit Description
A ring-oscillator-based voltage-controlled oscillator (VCO) designed in SkyWater 130nm. The design targets GHz-range oscillation frequencies with low power consumption.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| W_N | 1.0 µm | Width of NMOS inverter devices |
| L_N | 0.15 µm | Channel length of NMOS devices |
| W_P | 2.745 µm | Width of PMOS inverter devices |
| W_P2 | 1.0 µm | Width of secondary PMOS devices |
| L_P | 0.35 µm | Channel length of PMOS devices |
| W_TAIL | 1.0 µm | Width of tail current source |
| L_TAIL | 0.15 µm | Channel length of tail current source |

## Evaluation Metrics
- **ymax** — Maximum output swing / frequency metric
- **ymin** — Minimum output swing / frequency metric

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Adapted from the original VCO repository; `.lib` paths fixed to relative.
