# Yan_AZ_Pin_3

## 来源
- **原始仓库**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **作者 / 组织**: CODA-Team
- **许可证**: 原始仓库许可证

## 电路描述
来自 AnalogGym 基准套件的运算放大器。拓扑结构：Yan AZ。

## 可调参数
| 参数 | 默认值 | 范围 |
|-----------|---------|-------|
| MOSFET_0_14_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_14_M_BIASCM_PMOS | 4 | [1, 20] |
| MOSFET_0_14_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_11_1_L_gm2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_11_1_M_gm2_PMOS | 4 | [1, 20] |
| MOSFET_11_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_13_1_L_gmf2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_13_1_M_gmf2_PMOS | 4 | [1, 20] |
| MOSFET_13_1_W_gmf2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_14_4_L_gm8_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_14_4_M_gm8_NMOS | 4 | [1, 20] |
| MOSFET_14_4_W_gm8_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_16_4_L_gm5_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_16_4_M_gm5_NMOS | 4 | [1, 20] |
| MOSFET_16_4_W_gm5_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_18_1_L_gm3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_18_1_M_gm3_NMOS | 4 | [1, 20] |
| MOSFET_18_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_19_16_L_BIASCM_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_19_16_M_BIASCM_NMOS | 4 | [1, 20] |
| MOSFET_19_16_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_22_1_L_gmb1_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_22_1_M_gmb1_NMOS | 4 | [1, 20] |
| MOSFET_22_1_W_gmb1_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_23_1_L_gmb2_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_23_1_M_gmb2_NMOS | 4 | [1, 20] |
| MOSFET_23_1_W_gmb2_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_9_2_L_gm1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_9_2_M_gm1_PMOS | 4 | [1, 20] |
| MOSFET_9_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| CURRENT_1_BIAS | 5.0 | [1.0, 0.0001] |
| RESISTOR_0 | 240.0 | [48.0, 100.0] |
| RESISTOR_1 | 85.7 | [17.14, 100.0] |
| RESISTOR_2 | 85.7 | [17.14, 100.0] |
| CAPACITOR_0 | 1.4 | [0.27999999999999997, 1e-10] |
| CAPACITOR_1 | 1.3 | [0.26, 1e-10] |
| CLOAD | 15.0 | [3.0, 1e-10] |
| VCM | 300.0 | [100.0, 1.8] |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)

## 备注
改编自 AnalogGym。原始的 `.include` 路径已修改为指向共享的 `sky130_pdk/` 文件夹。
