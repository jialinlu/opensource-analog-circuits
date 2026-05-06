# Sky130 GHz-Range Low-Power VCO（Sky130 GHz 范围低功耗压控振荡器）

## 来源
- **原始仓库**: [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO)
- **作者 / 组织**: SANGESH007
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 SkyWater 130nm 设计的基于环形振荡器的压控振荡器（VCO）。设计目标为 GHz 范围振荡频率，同时保持低功耗。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| W_N | 1.0 µm | NMOS 反相器器件宽度 |
| L_N | 0.15 µm | NMOS 器件沟道长度 |
| W_P | 2.745 µm | PMOS 反相器器件宽度 |
| W_P2 | 1.0 µm | 次级 PMOS 器件宽度 |
| L_P | 0.35 µm | PMOS 器件沟道长度 |
| W_TAIL | 1.0 µm | 尾电流源宽度 |
| L_TAIL | 0.15 µm | 尾电流源沟道长度 |

## 评估指标
- **ymax** — 最大输出摆幅 / 频率指标
- **ymin** — 最小输出摆幅 / 频率指标

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## 备注
改编自原始 VCO 仓库；`.lib` 路径已修正为相对路径。
