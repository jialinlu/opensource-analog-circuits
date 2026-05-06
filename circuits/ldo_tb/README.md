# LDO_TB

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / Organization**: CODA-Team
- **License**: Original repository license

## Circuit Description
Circuit from the AnalogGym RGNN_RL benchmark suite.

## Tunable Parameters
| Parameter | Default | Range |
|-----------|---------|-------|
| mosfet_0_8_w_biascm_pmos | 1.1511714458465576 | [0.42, 5.755857229232788] |
| mosfet_0_8_l_biascm_pmos | 2.908731134608388 | [0.9695770448694626, 4.0] |
| mosfet_0_8_m_biascm_pmos | 27 | [5, 50] |
| mosfet_8_2_w_gm1_pmos | 1.485758513212204 | [0.42, 7.42879256606102] |
| mosfet_8_2_l_gm1_pmos | 1.1558892875909805 | [0.38529642919699353, 3.4676678627729416] |
| mosfet_8_2_m_gm1_pmos | 14 | [2, 50] |
| mosfet_10_1_w_gm2_pmos | 6.022575721144676 | [1.2045151442289352, 30.11287860572338] |
| mosfet_10_1_l_gm2_pmos | 2.1927622258663177 | [0.7309207419554392, 4.0] |
| mosfet_10_1_m_gm2_pmos | 27 | [5, 50] |
| mosfet_11_1_w_power_pmos | 7.487297892570496 | [1.4974595785140992, 37.43648946285248] |
| mosfet_11_1_l_power_pmos | 1.1738390671089292 | [0.3912796890363097, 3.5215172013267875] |
| mosfet_11_1_m_power_pmos | 949 | [189, 50] |
| mosfet_17_7_w_biascm_nmos | 1.812826544046402 | [0.42, 9.06413272023201] |
| mosfet_17_7_l_biascm_nmos | 1.0926024317741394 | [0.3642008105913798, 3.277807295322418] |
| mosfet_17_7_m_biascm_nmos | 5 | [1, 25] |
| mosfet_21_2_w_load2_nmos | 2.9079740941524506 | [0.5815948188304901, 14.539870470762253] |
| mosfet_21_2_l_load2_nmos | 4.691825315356255 | [1.5639417717854183, 4.0] |
| mosfet_21_2_m_load2_nmos | 24 | [4, 50] |
| current_0_bias | 3.211307168006898e-06 | [1e-06, 1.605653584003449e-05] |
| M_C0 | 19 | [3, 50] |
| M_CL | 287 | [57, 50] |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)

## Notes
Adapted from AnalogGym. The original `.include` paths were modified to point to the shared `sky130_pdk/` folder.
