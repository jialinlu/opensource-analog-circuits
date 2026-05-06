# 5-Stage Charge Pump（5 级电荷泵）

## 来源
- **原始仓库**: [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS)
- **作者 / 组织**: Utkarsh
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 CMOS 实现的五级 Dickson 风格电荷泵。设计使用内置的 BSIM4 器件模型，完全自包含，无需外部 PDK 依赖。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| WN1 | 0.30 µm | NMOS 传输晶体管宽度（第 1 级） |
| WN8 | 0.50 µm | NMOS 传输晶体管宽度（第 8 级） |
| WP1 | 0.30 µm | PMOS 传输晶体管宽度（第 1 级） |
| WP5 | 0.50 µm | PMOS 传输晶体管宽度（第 5 级） |
| LCHN | 0.10 µm | NMOS 器件沟道长度 |
| LCHP | 0.10 µm | PMOS 器件沟道长度 |
| C_CAP | 10 pF | 飞跨电容值 |

## 评估指标
- **vout** — 输出电压 (V)

## 模型文件
None — BSIM4 模型直接嵌入在网表中。

## 备注
自包含网表；无需外部 `.lib` 包含。
