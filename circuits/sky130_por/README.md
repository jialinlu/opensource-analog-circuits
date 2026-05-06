# Sky130 Power-On-Reset (POR)（Sky130 上电复位电路）

## 来源
- **原始仓库**: [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130)
- **作者 / 组织**: Sree Vishnu Varthini
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 SkyWater 130nm 的上电复位电路，在电源电压上电过程中越过定义阈值时产生干净的复位脉冲。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| L_0 | 1 µm | 核心晶体管沟道长度 |
| M_0 | 1 | 多重性（指状数） |
| W_0 | 1 µm | 核心晶体管宽度 |

## 评估指标
- **trip_point** — 复位释放时的电源电压 (V)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## 备注
网表改编自原始仓库；`.lib` 路径已更新为相对路径。
