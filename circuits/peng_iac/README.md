# Peng_IAC_Pin_3

## 来源
- **原始仓库**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **作者 / 组织**: CODA-Team
- **许可证**: 原始仓库许可证

## 电路描述
来自 AnalogGym 基准套件的运算放大器。拓扑结构：Peng IAC。

## 可调参数
| 参数 | 默认值 | 范围 |
|-----------|---------|-------|
| CAPACITOR_0 | 0.5 | [0.1, 1e-10] |
| CAPACITOR_1 | 1.1 | [0.22000000000000003, 1e-10] |
| CLOAD | 150.0 | [30.0, 1e-10] |
| CURRENT_0_BIAS | 1.25 | [0.25, 0.0001] |
| MOSFET_0_8_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_8_M_BIASCM_PMOS | 4 | [1, 20] |
| MOSFET_0_8_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_10_1_L_gm2_PMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_10_1_M_gm2_PMOS | 24 | [4, 50] |
| MOSFET_10_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_11_1_L_gmf_PMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_11_1_M_gmf_PMOS | 9 | [1, 45] |
| MOSFET_11_1_W_gmf_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_17_7_L_BIASCM_NMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_17_7_M_BIASCM_NMOS | 2 | [1, 10] |
| MOSFET_17_7_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_23_1_L_gm3_NMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_23_1_M_gm3_NMOS | 3 | [1, 15] |
| MOSFET_23_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_66_1_L_gmt_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_66_1_M_gmt_PMOS | 16 | [3, 50] |
| MOSFET_66_1_W_gmt_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_68_1_L_BIASCM_NMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_68_1_M_BIASCM_NMOS | 3 | [1, 15] |
| MOSFET_68_1_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_70_3_L_BIASCM_NMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_70_3_M_BIASCM_NMOS | 3 | [1, 15] |
| MOSFET_70_3_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_8_2_L_gm1_PMOS | 0.35 | [0.15, 1.0499999999999998] |
| MOSFET_8_2_M_gm1_PMOS | 3 | [1, 15] |
| MOSFET_8_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| RESISTOR_0 | 750.0 | [150.0, 100.0] |
| VCM | 240.0 | [80.0, 1.8] |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)

## 备注
改编自 AnalogGym。原始的 `.include` 路径已修改为指向共享的 `sky130_pdk/` 文件夹。
