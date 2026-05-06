# ldo_folded_cascode

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Low-dropout regulator from the AnalogGym benchmark suite.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| W_M1 | 20.0 | [4.0, 100.0] |
| L_M1 | 1.0 | [0.3333333333333333, 3.0] |
| M_M1 | 1 | [1, 5] |
| W_M3 | 30.0 | [6.0, 100.0] |
| L_M3 | 0.5 | [0.16666666666666666, 1.5] |
| M_M3 | 1 | [1, 5] |
| W_M5 | 10.0 | [2.0, 50.0] |
| L_M5 | 0.5 | [0.16666666666666666, 1.5] |
| M_M5 | 1 | [1, 5] |
| W_M7 | 20.0 | [4.0, 100.0] |
| L_M7 | 2.0 | [0.6666666666666666, 4.0] |
| M_M7 | 1 | [1, 5] |
| W_M9 | 30.0 | [6.0, 100.0] |
| L_M9 | 0.5 | [0.16666666666666666, 1.5] |
| M_M9 | 1 | [1, 5] |
| W_M10 | 10.0 | [2.0, 50.0] |
| L_M10 | 0.5 | [0.16666666666666666, 1.5] |
| M_M10 | 250 | [50, 50] |
| Vb1 | 1.0 | [0.3333333333333333, 1.8] |
| Vb2 | 0.025 | [0.1, 0.07500000000000001] |
| M_Rfb | 1 | [1, 5] |
| M_Cfb | 10 | [2, 50] |
| M_CL | 240 | [48, 50] |

## Evaluation Metrics
- **vout** — Output voltage (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
