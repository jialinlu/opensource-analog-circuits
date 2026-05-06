# IITB 5T OTA with Cascode Load (180nm)（IITB 5管 OTA 带 Cascode 负载，180nm）

## 来源
- **原始仓库**: [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon)
- **作者 / 组织**: Neeraj, IIT Bombay (eSim Marathon)
- **许可证**: 原始仓库许可证

## 电路描述
一个采用 180nm 工艺设计的 5 晶体管运算跨导放大器（OTA），带有 cascode 有源负载。来自 IITB eSim 马拉松的教学基准电路。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| W1–W2 | 10 µm | 输入差分对宽度 |
| W3–W4 | 20 µm | Cascode 负载晶体管宽度 |
| W5 | 15 µm | 尾电流源宽度 |
| W6 | 40 µm | 额外镜像支路宽度 |
| L1–L4 | 0.36 µm | 沟道长度 |

## 评估指标
- **gain** — 直流开环增益 (dB)
- **ugf** — 单位增益频率 (Hz)
- **pm** — 相位裕度 (°)

## 模型文件
- `NMOS-180nm.lib` — 180nm NMOS BSIM3 模型
- `PMOS-180nm.lib` — 180nm PMOS BSIM3 模型

## 备注
原始教学网表；改编用于自动化尺寸设计，参数名称已标准化。
