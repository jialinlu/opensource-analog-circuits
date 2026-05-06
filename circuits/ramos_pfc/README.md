# Ramos_PFC_Pin_3

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Operational amplifier from the AnalogGym benchmark suite. Topology: Ramos PFC.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| MOSFET_11_1_L_gmf1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_11_1_M_gmf1_PMOS | 400 | [80, 50] |
| MOSFET_11_1_W_gmf1_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_10_1_L_gm2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_10_1_M_gm2_PMOS | 81 | [16, 50] |
| MOSFET_10_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_23_1_L_gm3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_23_1_M_gm3_NMOS | 203 | [40, 50] |
| MOSFET_23_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_8_2_L_gm1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_8_2_M_gm1_PMOS | 148 | [29, 50] |
| MOSFET_8_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_0_8_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_8_M_BIASCM_PMOS | 71 | [14, 50] |
| MOSFET_0_8_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_17_7_L_BIASCM_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_17_7_M_BIASCM_NMOS | 20 | [4, 50] |
| MOSFET_17_7_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_21_2_L_LOAD2_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_21_2_M_LOAD2_NMOS | 1 | [1, 5] |
| MOSFET_21_2_W_LOAD2_NMOS | 1.0 | [0.42, 5.0] |
| CAPACITOR_0 | 63.0 | [12.6, 1e-10] |
| CAPACITOR_1 | 25.0 | [5.0, 1e-10] |
| CURRENT_0_BIAS | 24.0 | [4.8, 0.0001] |
| CLOAD | 100.0 | [20.0, 1e-10] |
| VCM | 400.0 | [133.33333333333334, 1.8] |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
