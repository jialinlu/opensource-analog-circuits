# 开源模拟电路尺寸优化基准测试套件

> 🌐 **[在线可视化 Dashboard](https://jialinlu.github.io/opensource-analog-circuits/)** — 浏览 31 个电路的交互式排行榜、设计空间与基线性能
>
> 📊 支持：统计总览 · 可排序排行榜 · 电路卡片目录 · 单电路详情 · 规格满足可视化

一套面向**模拟电路尺寸优化**的统一基准测试套件，使用开源 ngspice 网表。它提供了一个通用的 Python 框架，可将任意 ngspice 电路封装成标准优化接口，从而快速对遗传算法（GA）、贝叶斯优化（BO）、强化学习（RL）及其他尺寸优化方法进行基准测试。

## 功能特点

- **31 个参数化电路**，来源于 PTM、IITB、Sky130、AnalogGym 及教学案例
- 开箱即用的**零依赖 GA 示例**（纯 numpy 实现）
- **JSON 可配置**的设计空间、指标规格与解析器 —— 几分钟即可添加新电路
- **相对路径模型引用** —— 克隆仓库后所有用例可直接运行
- 内置 **AC 与 DC/Tran 指标解析器**（从 AC 表格解析增益/UGF/PM，从 DC/Tran 日志正则提取）

## 仓库结构

```
.
├── README.md                      # 本文件
├── benchmark/
│   ├── __init__.py
│   ├── ngspice_benchmark.py       # 核心框架：NgspiceBenchmark 类
│   ├── example_ga.py              # 实数编码 GA 示例（SBX + 多项式变异）
│   └── example_bo.py              # 随机搜索 / BO 基线示例
├── circuits/                       # 31 个尺寸优化基准
│   ├── ptm180nm_opamp/
│   │   ├── circuit.cir
│   │   ├── ptm180nm.lib
│   │   └── config.json
│   ├── gh_autockt_opamp/
│   ├── ota_iitb/
│   ├── chargepump/
│   ├── bjt_ce_amp/
│   ├── sky130_bgr/
│   ├── sky130_ldo/
│   ├── sky130_lp_opamp/
│   ├── sky130_por/
│   └── sky130_vco/
└── sky130_pdk/                     # SkyWater 130nm PDK（供 Sky130 电路使用）
    ├── libs.tech/
    └── libs.ref/
```

## 环境需求

- Python 3.9+
- `numpy`
- `ngspice`（已测试 ngspice-46）

```bash
pip install numpy
# macOS: brew install ngspice
# Ubuntu: sudo apt-get install ngspice
```

## 快速开始

### 1. 评估单个设计点

```python
from benchmark.ngspice_benchmark import NgspiceBenchmark

bench = NgspiceBenchmark.from_config("circuits/sky130_bgr/config.json")
x0 = bench.default_design_point()  # 归一化 [0,1]
metrics = bench.evaluate(x0)
obj = bench.objective_fn(metrics)
print(f"目标值: {obj:.4f}, 指标: {metrics}")
```

### 2. 对任意电路运行 GA 尺寸优化

```bash
# PTM180nm 运算放大器（19 维变量，仿真极快 ~0s/次）
python benchmark/example_ga.py circuits/ptm180nm_opamp/config.json -g 10 -p 16

# Sky130 BGR（15 维变量，~17s/次）
python benchmark/example_ga.py circuits/sky130_bgr/config.json -g 3 -p 4 --seed 42
```

### 3. 运行随机搜索基线

```bash
python benchmark/example_bo.py circuits/chargepump/config.json
```

## 基准框架 API

### `NgspiceBenchmark`

```python
bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")

# 设计空间
names, lb, ub = bench.get_design_space()   # 物理值
x0 = bench.default_design_point()           # 归一化 [0,1]

# 评估
metrics = bench.evaluate(x)       # 解析后的指标字典
obj = bench.objective(x)          # 标量目标值（越小越好）
meets = bench.meets_specs(metrics) # 是否满足规格

# 反归一化为物理参数
params = bench._denormalize(x)
```

### 配置格式（`circuits/<name>/config.json`）

```json
{
  "name": "circuit_name",
  "circuit_file": "circuits/name/circuit.cir",
  "design_vars": {
    "W1": [default, lb, ub],
    "L1": [default, lb, ub]
  },
  "specs": {
    "gain": [">", 60],
    "ugf": [">", 1000000]
  },
  "metrics_parser_type": "ac_data",
  "metrics_patterns": {},
  "objective": {"type": "sum_violations"}
}
```

| 字段 | 说明 |
|------|------|
| `circuit_file` | 主网表路径（相对于仓库根目录） |
| `design_vars` | `{参数名: [默认值, 下限, 上限]}` |
| `specs` | `{指标名: ["<" 或 ">", 目标值]}` |
| `metrics_parser_type` | `"regex"` 或 `"ac_data"` |
| `metrics_patterns` | `"regex"` 解析器使用的正则字典 |
| `objective` | `"sum_violations"` 或 `"weighted_sum"` |

## 修改调优参数（新增 / 删除 / 调整范围）

本框架通过 `config.json` 定义设计空间，并在仿真时通过正则替换将参数值注入到网表的 `.param` 语句中。因此，**新增或删除调优参数需要同时修改网表文件和配置文件**。

### 1. 调整现有参数范围
直接修改 `config.json` 中对应参数的上下界即可：
```json
"design_vars": {
  "W1": [10e-6, 5e-6, 15e-6]
}
```
格式为 `[默认值, 下限, 上限]`。默认值用于基线评估，`[下限, 上限]` 定义优化搜索范围。

### 2. 新增调优参数
按以下步骤操作：
1. **网表中定义参数**：在 `circuit.cir` 中添加 `.param NEW_VAR=默认值`。
2. **网表中引用参数**：确保某个器件使用了该参数，例如 `w='NEW_VAR*1'` 或 `l='NEW_VAR'`。
3. **配置文件中注册**：在 `config.json` 的 `design_vars` 中添加：
   ```json
   "NEW_VAR": [默认值, 下限, 上限]
   ```
4. **测试验证**：运行基线测试确认新参数被正确注入：
   ```bash
   python benchmark/example_bo.py circuits/<name>/config.json
   ```

### 3. 删除调优参数
按以下步骤操作：
1. **从配置文件中移除**：删除 `config.json` 中 `design_vars` 对应的键。
2. **网表中固定值**：将 `circuit.cir` 中引用该参数的地方替换为固定数值。
3. **从网表中移除定义**（可选）：删除 `.param OLD_VAR=...` 行。
4. **测试验证**：确认仿真仍正常运行。

### ⚠️ 重要注意事项
- 框架通过**正则替换**注入参数。如果网表中没有对应的 `.param` 定义，参数值不会被注入。
- 参数名在 `config.json` 和 `circuit.cir` 中必须**完全一致**（区分大小写）。
- 修改参数后，**指标解析器**（`metrics_parser_type` 和 `metrics_patterns`）通常不需要改动，除非新增参数导致了新的输出格式。
- 建议修改后先运行默认设计点验证：
  ```python
  from benchmark.ngspice_benchmark import NgspiceBenchmark
  bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")
  x0 = bench.default_design_point()
  metrics = bench.evaluate(x0)
  print(metrics)
  ```

## 添加新的优化算法

1. **导入基准**
   ```python
   from benchmark.ngspice_benchmark import NgspiceBenchmark
   bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")
   ```

2. **初始化优化器**，使用 `bench.dim`、`bench.lb`、`bench.ub`。

3. **评估设计点**：调用 `bench.objective(x)`，其中 `x` 为 `[0,1]^d` 中的归一化向量。框架自动处理参数注入、ngspice 执行和指标解析。

4. **追踪收敛**：使用 `bench.sim_count` 和 `bench.sim_time`。

5. **报告结果**：使用 `bench._denormalize(x)` 转换回物理值。

完整示例见 `benchmark/example_ga.py`（约 260 行，纯 numpy）。

## 电路目录

### 基线性能（默认设计点）

| 电路 | PDK | 变量数 | 解析器 | 规格 | 默认目标值 | 满足规格 | 仿真时间 |
|---------|-----|-------|--------|-------|-------------|-------------|----------|
| **ptm180nm_opamp** | PTM 180nm | 19 | AC | gain>60dB, UGF>1MHz, PM>60° | 0.146 | ❌ | ~0s |
| **gh_autockt_opamp** | PTM 45nm | 10 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.07 | ❌ | ~0s |
| **ota_iitb** | IITB 180nm | 13 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.27 | ❌ | ~0s |
| **chargepump** | 内嵌 BSIM4 | 7 | regex | vout>3V | 0.000 | ✅ | ~0.1s |
| **bjt_ce_amp** | 内嵌 BJT | 5 | regex | vout>10V | 0.000 | ✅ | ~0s |
| **sky130_bgr** | Sky130 | 15 | regex | vref>0.9V | 0.000 | ✅ | ~17s |
| **sky130_ldo** | Sky130 | 4 | regex | vout>2.5V | 0.333 | ❌ | ~17s |
| **sky130_lp_opamp** | Sky130 | 6 | AC | gain>40dB, UGF>1MHz, PM>45° | 0.000 | ✅ | ~17s |
| **sky130_por** | Sky130 | 4 | regex | trip_point<1.5V | 0.000 | ✅ | ~17s |
| **sky130_vco** | Sky130 | 7 | regex | ymax>1.5V, ymin<0.1V | 0.000 | ✅ | ~17s |
| **alfio_raffc** | Sky130 | 29 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **fan_smc** | Sky130 | 25 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ✅ | ~17s |
| **hoilee_affc** | Sky130 | 35 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **leung_dfcfc1** | Sky130 | 32 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **leung_dfcfc2** | Sky130 | 29 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **leung_nmcf** | Sky130 | 26 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **leung_nmcnr** | Sky130 | 24 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **peng_acbc** | Sky130 | 35 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **peng_iac** | Sky130 | 33 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **peng_tcfc** | Sky130 | 26 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **qu2017_azc** | Sky130 | 40 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ✅ | ~17s |
| **ramos_pfc** | Sky130 | 26 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **sau_cfcc** | Sky130 | 31 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **song_dacfc** | Sky130 | 35 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ✅ | ~17s |
| **yan_az** | Sky130 | 38 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **ldo_1** | Sky130 | 20 | regex | gain>40dB, UGF>100kHz, PM>45° | - | ❌ | ~17s |
| **ldo_2** | Sky130 | 57 | regex | gain>40dB, UGF>100kHz, PM>45° | - | ❌ | ~17s |
| **ldo_folded_cascode** | Sky130 | 23 | regex | gain>40dB, UGF>100kHz, PM>45° | - | ❌ | ~17s |
| **ldo_simple** | Sky130 | 16 | regex | gain>40dB, UGF>100kHz, PM>45° | - | ❌ | ~17s |
| **amp_nmcf** | Sky130 | 24 | regex | gain>60dB, UGF>1MHz, PM>60° | - | ❌ | ~17s |
| **ldo_tb** | Sky130 | 21 | regex | gain>40dB, UGF>100kHz, PM>45° | - | ✅ | ~17s |

> **注意：** Sky130 电路较慢（~17s/次），因为 PDK 需要加载所有工艺角和模型。快速演示时建议使用小种群（如 4–8）和少代数（如 3–5）。

### 设计空间摘要

| 电路 | 关键变量 | 默认值 → 范围（示例） |
|---------|---------------|---------------------------|
| ptm180nm_opamp | 19（所有晶体管的 W/L/M + Cc + Rc） | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u, Cc=3p → [1.5,4.5]p |
| gh_autockt_opamp | 10（输入对、负载、电流镜的 W/L） | W1=8u → [4,12]u, L1=0.18u → [0.13,0.23]u |
| ota_iitb | 13（5T OTA + 共源共栅的 W/L/M） | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u |
| chargepump | 7（电荷泵开关与电容的 W/L） | W1=5u → [2.5,7.5]u |
| bjt_ce_amp | 5（Rb, Rc, Re, Vcc, beta） | Rb=10k → [5,15]k |
| sky130_bgr | 15（PTAT/CTAT 支路、电阻的 W/L/M） | W_P=10 → [5,15], L_P=0.5 → [0.25,0.75] |
| sky130_ldo | 4（pass 管与误差放大器的 W/L） | W_pass=100 → [50,150] |
| sky130_lp_opamp | 6（输入对与负载的 W/L） | W1=10 → [5,15] |
| sky130_por | 4（反相器链的 W/L） | W1=2 → [1,3] |
| sky130_vco | 7（环形振荡器反相器的 W/L） | W_N=2 → [1,3], L_N=0.15 → [0.13,0.17] |

每个电路的精确设计空间见 `circuits/<name>/config.json`。

## 添加新电路

1. **创建目录**：在 `circuits/<name>/` 下创建目录。
2. **放置网表**：将网表放入该目录（如 `circuit.cir`）。
3. **确保模型路径相对**：相对于 `circuit.cir`（如 Sky130 使用 `../../sky130_pdk/...`）。
4. **添加 `.param` 语句**：为所有可调设计变量添加 `.param`。
5. **编写 `config.json`**：遵循上述配置格式。
6. **测试**：
   ```bash
   python benchmark/example_bo.py circuits/<name>/config.json
   ```

## 来源与许可证

本套件中的每个电路均来源于开源仓库或公共 PDK。原始来源如下：

| 电路 | 来源 | 许可证 / 归属 |
|---------|--------|----------------------|
| ptm180nm_opamp | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — 两级运放，**ASU PTM 180nm** | 原仓库许可证 |
| gh_autockt_opamp | [ksettaluri6/AutoCkt](https://github.com/ksettaluri6/AutoCkt) (Stanford) — 两级运放，PTM 45nm | 原仓库许可证 |
| ota_iitb | [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon) — 5T OTA + 共源共栅，180nm | 原仓库许可证 |
| chargepump | [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS) — 5 级电荷泵 | 原仓库许可证 |
| bjt_ce_amp | [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples) — BJT 共射放大器 | 原仓库许可证 |
| sky130_bgr | [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm) — 带隙基准 | 原仓库许可证 |
| sky130_ldo | [github_sky130/lowdropoutregulator](https://github.com/ayeshafareed/LDO_MOSFET) — 低压差稳压器 | 原仓库许可证 |
| sky130_lp_opamp | [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm) — 低功耗两级运放 | 原仓库许可证 |
| sky130_por | [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130) — 上电复位电路 | 原仓库许可证 |
| sky130_vco | [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO) — 环形振荡器 VCO | 原仓库许可证 |
| alfio_raffc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AFFC 运放 | 原仓库许可证 |
| fan_smc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — SMC 运放 | 原仓库许可证 |
| hoilee_affc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AFFC 运放 | 原仓库许可证 |
| leung_dfcfc1 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DFCFC 运放 | 原仓库许可证 |
| leung_dfcfc2 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DFCFC 运放 | 原仓库许可证 |
| leung_nmcf | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCF 运放 | 原仓库许可证 |
| leung_nmcnr | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCNR 运放 | 原仓库许可证 |
| peng_acbc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — ACBC 运放 | 原仓库许可证 |
| peng_iac | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — IAC 运放 | 原仓库许可证 |
| peng_tcfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — TCFC 运放 | 原仓库许可证 |
| qu2017_azc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AZC 运放 | 原仓库许可证 |
| ramos_pfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — PFC 运放 | 原仓库许可证 |
| sau_cfcc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — CFCC 运放 | 原仓库许可证 |
| song_dacfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DACFC 运放 | 原仓库许可证 |
| yan_az | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AZ 运放 | 原仓库许可证 |
| ldo_1 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | 原仓库许可证 |
| ldo_2 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | 原仓库许可证 |
| ldo_folded_cascode | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — 折叠共源共栅 LDO | 原仓库许可证 |
| ldo_simple | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — 简易 LDO | 原仓库许可证 |
| amp_nmcf | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCF 运放 | 原仓库许可证 |
| ldo_tb | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | 原仓库许可证 |
| **Sky130 PDK** | [SkyWater 130nm PDK](https://github.com/google/skywater-pdk) | Apache-2.0 |

> **注意：** 电路已针对本基准套件进行参数化和适配。原始测试平台和网表可能已被修改（例如参数注入、`.lib` 路径修复、收敛选项）。未修改的设计请参阅原始仓库。

## 引用

如果您在研究中使用了本基准套件，请引用您所用电路的原始来源，并考虑对本框架进行致谢。

## 许可证

基准框架代码（`benchmark/*.py`）按原样提供，用于研究和教育目的。电路网表和 PDK 文件保留其原始许可证（见上表）。
