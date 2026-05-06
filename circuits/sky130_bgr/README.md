# Sky130 Bandgap Reference (BGR)（Sky130 带隙基准源）

## 来源
- **原始仓库**: [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm)
- **作者 / 组织**: silicon-vlsi
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 SkyWater 130nm 开源 PDK 设计的 Brokaw 风格带隙电压基准源。核心通过结合 PTAT 和 CTAT 电流产生温度补偿的基准电压。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| L_0–L_4 | 2, 1, 2, 2, 7 | 核心晶体管沟道长度 (µm) |
| M_0–M_4 | 4, 8, 1, 2, 1 | 核心晶体管的多重性（指状数） |

## 评估指标
- **vref** — 基准输出电压 (V)

## 模型文件
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## 备注
原始的 `.lib` 路径为绝对路径；已修改为指向共享的 `sky130_pdk/` 文件夹的相对路径。
