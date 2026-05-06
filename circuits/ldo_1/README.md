# ldo_1

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Low-dropout regulator from the AnalogGym benchmark suite.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| W_M0 | 3.0 | [0.6, 15.0] |
| L_M0 | 1.0 | [0.3333333333333333, 3.0] |
| M_M0 | 1 | [1, 5] |
| W_M2 | 20.0 | [4.0, 100.0] |
| L_M2 | 4.0 | [1.3333333333333333, 4.0] |
| M_M2 | 1 | [1, 5] |
| W_M4 | 1.0 | [0.42, 5.0] |
| L_M4 | 0.5 | [0.16666666666666666, 1.5] |
| M_M4 | 1 | [1, 5] |
| W_M6 | 25.0 | [5.0, 100.0] |
| L_M6 | 1.0 | [0.3333333333333333, 3.0] |
| M_M6 | 1 | [1, 5] |
| W_M7 | 3.0 | [0.6, 15.0] |
| L_M7 | 0.5 | [0.16666666666666666, 1.5] |
| M_M7 | 1 | [1, 5] |
| W_M8 | 100.0 | [20.0, 100.0] |
| L_M8 | 1.0 | [0.3333333333333333, 3.0] |
| M_M8 | 120 | [24, 50] |
| current_0_bias | 5e-06 | [1.0000000000000002e-06, 2.5e-05] |
| M_CL | 200 | [40, 50] |

## Evaluation Metrics
- **vout** — Output voltage (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
