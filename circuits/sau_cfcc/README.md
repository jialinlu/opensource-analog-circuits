# Sau_CFCC_Pin_3

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Operational amplifier from the AnalogGym benchmark suite. Topology: Sau CFCC.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| MOSFET_0_8_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_8_M_BIASCM_PMOS | 4 | [1, 20] |
| MOSFET_0_8_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_10_1_L_gm2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_10_1_M_gm2_PMOS | 8 | [1, 40] |
| MOSFET_10_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_11_1_L_gmf2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_11_1_M_gmf2_PMOS | 8 | [1, 40] |
| MOSFET_11_1_W_gmf2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_15_2_L_gmc_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_15_2_M_gmc_NMOS | 8 | [1, 40] |
| MOSFET_15_2_W_gmc_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_17_7_L_BIASCM_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_17_7_M_BIASCM_NMOS | 8 | [1, 40] |
| MOSFET_17_7_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_21_2_L_LOAD2_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_21_2_M_LOAD2_NMOS | 8 | [1, 40] |
| MOSFET_21_2_W_LOAD2_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_23_1_L_gm3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_23_1_M_gm3_NMOS | 4 | [1, 20] |
| MOSFET_23_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_7_1_L_gmf1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_7_1_M_gmf1_PMOS | 4 | [1, 20] |
| MOSFET_7_1_W_gmf1_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_8_2_L_gm1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_8_2_M_gm1_PMOS | 4 | [1, 20] |
| MOSFET_8_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| CAPACITOR_0 | 1.15 | [0.22999999999999998, 1e-10] |
| CURRENT_0_BIAS | 20.0 | [4.0, 0.0001] |
| CLOAD | 500.0 | [100.0, 1e-10] |
| VCM | 300.0 | [100.0, 1.8] |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
