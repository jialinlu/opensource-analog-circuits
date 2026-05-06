# Song_DACFC_Pin_3

## 来源
- **原始仓库**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **作者 / 组织**: CODA-Team
- **许可证**: 原始仓库许可证

## 电路描述
来自 AnalogGym 基准套件的运算放大器。拓扑结构：Song DACFC。

## 可调参数
| 参数 | 默认值 | 范围 |
|-----------|---------|-------|
| MOSFET_58_2_L_gmf1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_58_2_M_gmf1_PMOS | 4 | [1, 20] |
| MOSFET_58_2_W_gmf1_PMOS | 1.0 | [0.42, 5.0] |
| CAPACITOR_1 | 0.7 | [0.13999999999999999, 1e-10] |
| MOSFET_0_8_L_BIASCM_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_0_8_M_BIASCM_PMOS | 4 | [1, 20] |
| MOSFET_0_8_W_BIASCM_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_10_1_L_gm2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_10_1_M_gm2_PMOS | 4 | [1, 20] |
| MOSFET_10_1_W_gm2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_11_1_L_gmf2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_11_1_M_gmf2_PMOS | 4 | [1, 20] |
| MOSFET_11_1_W_gmf2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_17_7_L_BIASCM_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_17_7_M_BIASCM_NMOS | 4 | [1, 20] |
| MOSFET_17_7_W_BIASCM_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_21_2_L_LOAD2_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_21_2_M_LOAD2_NMOS | 4 | [1, 20] |
| MOSFET_21_2_W_LOAD2_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_23_1_L_gm3_NMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_23_1_M_gm3_NMOS | 4 | [1, 20] |
| MOSFET_23_1_W_gm3_NMOS | 1.0 | [0.42, 5.0] |
| MOSFET_5_2_L_gma1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_5_2_M_gma1_PMOS | 4 | [1, 20] |
| MOSFET_5_2_W_gma1_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_7_1_L_gma2_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_7_1_M_gma2_PMOS | 4 | [1, 20] |
| MOSFET_7_1_W_gma2_PMOS | 1.0 | [0.42, 5.0] |
| MOSFET_8_2_L_gm1_PMOS | 1.0 | [0.3333333333333333, 3.0] |
| MOSFET_8_2_M_gm1_PMOS | 4 | [1, 20] |
| MOSFET_8_2_W_gm1_PMOS | 1.0 | [0.42, 5.0] |
| CAPACITOR_0 | 1.5 | [0.3, 1e-10] |
| CURRENT_0_BIAS | 5.0 | [1.0, 0.0001] |
| CLOAD | 500.0 | [100.0, 1e-10] |
| VCM | 300.0 | [100.0, 1.8] |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)

## 备注
改编自 AnalogGym。原始的 `.include` 路径已修改为指向共享的 `sky130_pdk/` 文件夹。
