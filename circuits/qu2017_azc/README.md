# Qu2017_AZC_Pin_3

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Operational amplifier from the AnalogGym benchmark suite. Topology: Qu2017 AZC.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| CAPACITOR_0 | 810.0 | [162.0, 1e-10] |
| CAPACITOR_1 | 404.0 | [80.8, 1e-10] |
| CAPACITOR_2 | 310.0 | [62.0, 1e-10] |
| MOSFET_0_14_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_14_M_BIASCM_PMOS | 4 | [1, 20] |
| MOSFET_0_14_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_11_1_L_gm2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_11_1_M_gm2_PMOS | 4 | [1, 20] |
| MOSFET_11_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_12_1_L_AZC1_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_12_1_M_AZC1_NMOS | 4 | [1, 20] |
| MOSFET_12_1_W_AZC1_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_13_1_L_gmf2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_13_1_M_gmf2_PMOS | 4 | [1, 20] |
| MOSFET_13_1_W_gmf2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_14_4_L_LOAD1_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_14_4_M_LOAD1_NMOS | 4 | [1, 20] |
| MOSFET_14_4_W_LOAD1_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_18_1_L_gm3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_18_1_M_gm3_NMOS | 4 | [1, 20] |
| MOSFET_18_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_19_16_L_BIASCM_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_19_16_M_BIASCM_NMOS | 4 | [1, 20] |
| MOSFET_19_16_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_24_8_L_AZC3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_24_8_M_AZC3_NMOS | 4 | [1, 20] |
| MOSFET_24_8_W_AZC3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_6_3_L_AZC2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_6_3_M_AZC2_PMOS | 4 | [1, 20] |
| MOSFET_6_3_W_AZC2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_9_2_L_gm1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_9_2_M_gm1_PMOS | 4 | [1, 20] |
| MOSFET_9_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| RESISTOR_0 | 35.0 | [7.0, 100.0] |
| RESISTOR_1 | 35.0 | [7.0, 100.0] |
| RESISTOR_2 | 350.0 | [70.0, 100.0] |
| RESISTOR_3 | 40.0 | [8.0, 100.0] |
| CURRENT_0_BIAS | 1.0 | [0.2, 0.0001] |
| CLOAD | 1500.0 | [300.0, 1e-10] |
| VCM | 300.0 | [100.0, 1.8] |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
