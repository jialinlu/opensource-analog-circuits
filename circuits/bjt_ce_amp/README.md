# BJT Common-Emitter Amplifier（BJT 共射极放大器）

## 来源
- **原始仓库**: [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples)
- **作者 / 组织**: Daniel Rios Linares
- **许可证**: 原始仓库许可证

## 电路描述
一个基本的 BJT 共射极放大器，用作 ngspice 教学示例。设计采用分立电阻、电容和内置 BJT 模型，无需外部 PDK。

## 可调参数
| 参数 | 默认值 | 说明 |
|-----------|---------|-------------|
| R1 | 110 kΩ | 基极偏置电阻（上部分压器） |
| R2 | 10 kΩ | 基极偏置电阻（下部分压器） |
| R3 | 10 kΩ | 集电极负载电阻 |
| R4 | 1 kΩ | 发射极退化电阻 |
| C1 | 0.1 µF | 交流耦合电容 |

## 评估指标
- **vout** — 输出电压 / 增益指标 (V)

## 模型文件
None — BJT 模型直接嵌入在网表中。

## 备注
教学示例；采用内置 BJT 模型，自包含。
