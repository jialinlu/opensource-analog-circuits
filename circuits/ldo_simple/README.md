# ldo_simple

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Low-dropout regulator from the AnalogGym benchmark suite.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| W_M1 | 2.0 | [0.42, 10.0] |
| L_M1 | 2.0 | [0.6666666666666666, 4.0] |
| M_M1 | 1 | [1, 5] |
| W_M3 | 80.0 | [16.0, 100.0] |
| L_M3 | 0.5 | [0.16666666666666666, 1.5] |
| M_M3 | 1 | [1, 5] |
| W_M5 | 100.0 | [20.0, 100.0] |
| L_M5 | 0.5 | [0.16666666666666666, 1.5] |
| M_M5 | 1 | [1, 5] |
| W_M6 | 20.0 | [4.0, 100.0] |
| L_M6 | 0.5 | [0.16666666666666666, 1.5] |
| M_M6 | 360 | [72, 50] |
| Vb | 1.2 | [0.39999999999999997, 1.8] |
| M_Rfb | 1 | [1, 5] |
| M_Cfb | 5 | [1, 25] |
| M_CL | 250 | [50, 50] |

## Evaluation Metrics
- **vout** — Output voltage (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
