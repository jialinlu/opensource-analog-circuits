# Sky130 Low-Dropout Regulator (LDO)（Sky130 低压差稳压器）

## 来源
- **原始仓库**: [ayeshafareed/LDO_MOSFET](https://github.com/ayeshafareed/LDO_MOSFET)
- **作者 / 组织**: Ayesha Fareed
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 SkyWater 130nm 实现的低压差稳压器。设计使用误差放大器和传输晶体管，在最小压差下维持稳定的输出电压。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| L_0–L_1 | 1, 1 | 核心晶体管沟道长度 (µm) |
| M_0–M_1 | 1, 1 | 多重性（指状数） |
| W_0–W_1 | 1, 1 | 核心晶体管宽度 (µm) |

## 评估指标
- **vout** — 稳压输出电压 (V)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## 备注
网表改编自原始仓库；`.lib` 路径已更新为相对路径。
