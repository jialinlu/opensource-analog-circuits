# Sky130 Low-Power Two-Stage OpAmp（Sky130 低功耗两级运算放大器）

## 来源
- **原始仓库**: [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm)
- **作者 / 组织**: Velugoti Ashok Kumar
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 SkyWater 130nm 设计的低功耗两级运算放大器。针对最小静态功耗进行了优化，同时保持可接受的增益和带宽。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| L_0–L_1 | 0.5, 0.5 | 核心晶体管沟道长度 (µm) |
| M_0–M_1 | 1, 1 | 多重性（指状数） |
| W_0 | 65 µm | 输入差分对宽度 |
| W_1 | 10 µm | 负载 / 镜像器件宽度 |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## 备注
改编自原始的 LP_OPAMP 设计；`.lib` 路径已修正为相对路径。
