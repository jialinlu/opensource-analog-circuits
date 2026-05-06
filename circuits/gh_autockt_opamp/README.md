# AutoCkt Two-Stage OpAmp (PTM 45nm)（AutoCkt 两级运算放大器，PTM 45nm）

## 来源
- **原始仓库**: [ksettaluri6/AutoCkt](https://github.com/ksettaluri6/AutoCkt)
- **作者 / 组织**: K. Settaluri et al., Stanford University
- **许可证**: 原始仓库许可证

## 电路描述
AutoCkt 论文（"AutoCkt: Deep Reinforcement Learning of Analog Circuit Designs"）中使用的主要基准两级运算放大器。采用 PTM 45nm 模型制造。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| wp1, lp1, mp1 | 0.5 µm, 90 nm, 10 | 输入 PMOS 差分对 (M1/M2) |
| wn1, ln1, mn1 | 0.5 µm, 90 nm, 38 | NMOS 电流镜负载 (M3/M4) |
| wn3, ln3, mn3 | 0.5 µm, 90 nm, 9 | 尾电流源 (M5) |
| wp3, lp3, mp3 | 0.5 µm, 90 nm, 4 | 第二级 PMOS 驱动管 (M6) |
| wn4, ln4, mn4 | 0.5 µm, 90 nm, 20 | 第二级 NMOS 负载 (M7) |
| wn5, ln5, mn5 | 0.5 µm, 90 nm, 60 | 偏置晶体管 (M8) |
| cc | 3 pF | Miller 补偿电容 |
| ibias | 30 µA | 偏置电流 |
| cload | 10 pF | 输出负载电容 |
| vcm | 0.6 V | 共模输入电压 |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
- `45nm_bulk.txt` — PTM 45nm BSIM4 体硅模型

## 备注
网表从 AutoCkt 仓库复制并改编（`.include` 路径修正为相对路径）。
