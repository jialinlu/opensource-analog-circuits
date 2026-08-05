# MC-Aware Sizing Benchmark — Case Package, FOM and Acceptance Criteria

**Audience:** vendor team developing a mismatch-aware sizing algorithm.
**Scope:** five ASAP7 LDO designs. Your algorithm proposes transistor sizes
(and a few bias/passive values); we score the design's robustness against
device-to-device Vth mismatch via Monte Carlo (MC) simulation. Your
algorithm is **not** expected to run MC inside its sizing loop (see §5) —
but it must contain a mechanism that measurably improves MC yield over
the same algorithm without that mechanism (see §6, ablation gate).

This document is the contract. It defines the cases, the optimization
interface, the training objective (FOM), the validation procedure, and the
acceptance criteria. If a number is not defined here, ask before assuming.

---

## 1. What is in the package

Per circuit `ldo_1, ldo_2, ldo_simple, ldo_folded_cascode, ldo_tb`
(under `circuits/<name>/`):

| File | Role |
|---|---|
| `circuit_asap7.cir` | sized cell netlist (ASAP7 BSIM-CMG, N-elements, `NFIN`+`L`) |
| `tb_asap7_mc.sp` | mismatch-MC testbench (single instance `x1`) |
| `config_asap7.json` | design space: variable names, defaults, lower/upper bounds |

Framework (under `benchmark/`):

| File | Role |
|---|---|
| `mc_benchmark.py` | **the benchmark driver** — optimization interface, FOM, validation |
| `run_mc_baseline.py` | batch MC runner used to produce the reference baselines |
| `gen_mc_tb.py` | generator that produced the MC testbenches (reference only) |

Reference data (under `results/`):

| File | Role |
|---|---|
| `ldo_*_mc_baseline.json` | 200-sample MC stats of the current design points (seed 1234) |
| `ldo_*_mc_validation_default.json` | 500-sample independent validation of the same points |

Environment: ASAP7 models are BSIM-CMG and run only under the provided
ngspice+OSDI Docker image. Build and sanity-check instructions are in
`HANDOFF.md` §2–§4 (the document targets macOS; on Linux the same steps
apply unchanged). All simulations must go through the `asap7_pdk/bin/ngspice`
wrapper.

---

## 2. The mismatch model (what MC varies, and what it does not)

- The ASAP7 model cards have **no statistical parameters**. Process
  variation is covered separately by 12 PVT corners and is **out of scope**
  for this benchmark.
- MC varies **per-device Vth mismatch only**, via the BSIM-CMG instance
  parameter `DELVTRAND` (a per-device Vth shift in volts).
- Per-device sigma follows a Pelgrom-style engineering assumption
  (no PDK mismatch data exists):

  ```
  sigma_i = SIG_VT / sqrt(WEFF_UM * L_um * NFIN_i)
  SIG_VT  = 2e-3 V*um
  WEFF_UM = 0.07 um   (effective width per fin)
  ```

- **The driver recomputes every `sigma_i` from the sizes of the design point
  being evaluated.** You never edit `sg_*` lines yourself; upsizing a device
  automatically tightens its mismatch spread. This is the mechanism your
  algorithm is expected to exploit.
- Random draws use ngspice's `sgauss(0)` with a fixed `set seed=...`, which
  makes every evaluation exactly reproducible (common random numbers, CRN).

Each MC sample measures, at max and min load: `vout`, `iq`, DC gain,
unity-gain frequency and phase margin (10 metrics, printed as `MCRES`
lines). A non-converging sample produces no output and counts as failed.

---

## 3. Optimization interface

Python API (`benchmark/mc_benchmark.py`):

```python
import sys; sys.path.insert(0, "benchmark")
from mc_benchmark import MCBenchmark

b = MCBenchmark("ldo_simple", K=30)          # train protocol, CRN seed fixed
names, lb, ub = b.get_design_space()         # physical units
f   = b.objective(x)      # x: normalized [0,1]^d vector -> float, MINIMIZE
res = b.evaluate(x)       # full statistics dict (margins, yield estimate, FOM)
```

- `x` is normalized component-wise to `[0,1]` against `lb`/`ub`; the driver
  denormalizes, injects `.param` values, refreshes the mismatch sigmas,
  runs the MC chunks in parallel, and reduces the results.
- `objective(x)` is deterministic for fixed `(circuit, K, seed)`: same `x`
  in, same number out. This is a CRN guarantee — do not change the seed.
- Design variables are treated as continuous (the reference flow optimizes
  `NFIN` continuously; rounding to integer fins is a post-processing step
  and is not required for acceptance).
- CLI equivalent: `python3 benchmark/mc_benchmark.py <circuit> --x v0,v1,...`
  (omit `--x` for the current design point). Add `--validate` for the
  acceptance run (§6).

Design spaces (all `N_*` are fin counts, `L` fixed at 21 nm):

| Circuit | #dev | Design variables (bounds) |
|---|---|---|
| ldo_simple | 6 | N_M1[4,64] N_M3[8,128] N_M5[8,128] N_M6[100,3000] Vb[0.3,0.65] R_FB[500,5e4] C_FB[0.2,20] C_LOAD[20,500] |
| ldo_folded_cascode | 10 | N_M1[4,64] N_M3[8,128] N_M5[4,64] N_M7[2,32] N_M9[8,128] N_M10[1000,16000] Vb1[0.25,0.5] Vb2[0.05,0.3] R_FB[500,5e4] C_FB[0.2,20] C_LOAD[100,1000] |
| ldo_1 | 9 | N_M0[4,64] N_M2[8,128] N_M4[4,64] N_M6[16,256] N_M7[4,64] N_M8[2000,30000] I_bias[2u,50u] C_LOAD[50,1000] |
| ldo_2 | 20 | N_NM0..N_NM10, N_PM0..N_PM8 (17 fin counts), I_bias[2u,100u] R_R0[100,20000] C_C0/C_C1[2,100] C_C4[0.05,2] C_LOAD[50,1000] |
| ldo_tb | 24 | N_BIASCM_PMOS[4,64] N_GM1_PMOS[4,64] N_GM2_PMOS[16,256] N_POWER_PMOS[4000,30000] N_BIASCM_NMOS[2,32] N_LOAD2_NMOS[4,64] I_bias[2u,50u] C_C0[0.5,40] C_LOAD[20,500] |

There is deliberately **no area term** in the FOM; the bounds above are the
area constraint. Treat the upper bounds as hard limits.

---

## 4. Specification set (all must hold simultaneously)

Per MC sample, at TT corner, 25 °C:

| Metric | Condition | Meaning |
|---|---|---|
| `vout_max` | `> V_tgt` | output voltage at max load, i.e. the LDO still regulates (`V_tgt` = 0.40 / 0.38 / 0.35 / 0.35 / 0.42 V for ldo_1 / ldo_2 / ldo_simple / ldo_folded_cascode / ldo_tb) |
| `dcgain1` | `> 40 dB` | loop gain at max load |
| `ugf1` | `> 1 MHz` | unity-gain frequency at max load |
| `pm1` | `> 45°` | phase margin at max load |
| `pm2` | `> 45°` | phase margin at min load |

A sample passes iff all five conditions hold and the sample converged.
This set is `SPECS` in `benchmark/run_mc_baseline.py` — the single source
of truth.

---

## 5. What your algorithm must (and must not) do

**You are NOT required to run MC inside your sizing loop — and running a
full MC evaluation per candidate is explicitly not acceptable: at 30–60 s
per K=30 evaluation it makes the search prohibitively slow.** What IS
required: your algorithm must contain an explicit mechanism or strategy
that improves mismatch robustness / yield, and that mechanism must
demonstrably work — the MC-aware variant of your algorithm must beat the
same algorithm with the mechanism switched off, under identical budget
(the ablation gate, §6).

How you achieve this is your design freedom. Acceptable strategy examples
(not exhaustive, combinations welcome):

- an analytical mismatch penalty derived from the Pelgrom sigma model of
  §2 — per-device `SIG_VT / sqrt(WEFF_UM * L * NFIN)` terms are free to
  compute (no simulation) and differentiable;
- nominal-TT simulation plus per-spec safety margins;
- sensitivity-based robustness proxies (e.g. d spec / d Vth);
- a surrogate model of the MC FOM, trained on a small number of driver
  calls;
- few-sample MC used only sparingly (e.g. to re-rank finalists).

The driver FOM defined in §5.1 is the ground truth we grade against. It
is available for calibration, sanity checks and finalist ranking — whether
and how often you call it inside the loop is up to you. There is no
requirement to use it, and no credit for using it more.

### 5.1 Reference training FOM

For design point `x`, run `K = 30` MC samples with master seed
`TRAIN_SEED = 424242` (the driver's defaults). For each spec `i` compute
the sigma-margin

```
m_i = (mean_i - L_i) / std_i        (all specs here are lower bounds L_i)
```

over the converged samples. The scalar FOM (higher is better) is

```
FOM(x) = softmin_tau(m_1..m_5) - 10 * fail_fraction
softmin_tau(m) = -tau * ln( mean_j exp(-m_j / tau) ),   tau = 0.5
fail_fraction  = 1 - (#converged samples)/K
```

`objective(x)` returns `-FOM(x)` for minimizers. Rationale:

- Sigma-margins carry gradient information (unlike a 30-sample yield
  estimate, which is almost pure noise) and directly encode "how many
  sigmas of mismatch" the design absorbs per spec.
- Soft-min focuses the optimizer on the bottleneck spec without being
  non-smooth; `tau = 0.5` keeps it close to the true min.
- The fail penalty prevents "survivorship" designs that look good only
  because half the samples did not converge.

Budget and repetition rules for reported results:

- Same evaluation budget for every algorithm variant you compare
  (suggested: equivalent to 200 nominal evaluations per run — if you use
  driver FOM calls, account them honestly against the budget).
- 5–10 independent optimizer runs per circuit (different optimizer seeds);
  report final scores as mean ± std. The MC seed stays `424242` for all of
  them — that is the CRN protocol, not a bug.

---

## 6. Acceptance criteria (how we grade the result)

Submit, per circuit, **two** final design points (normalized `x` or
physical values):

- **(P) plain** — produced by your sizing algorithm with the
  mismatch-aware mechanism **disabled** (your good-faith nominal-TT
  configuration);
- **(M) MC-aware** — produced by the same algorithm with the mechanism
  **enabled**.

Both variants must run with the **same evaluation budget** and the **same
number of independent optimizer runs** (5–10, different optimizer seeds);
pick each variant's final point by the same rule (e.g. best final score)
and report the run-to-run spread for both. We re-run validation ourselves;
you are encouraged to run it before submitting:

```bash
python3 benchmark/mc_benchmark.py <circuit> --validate --x v0,v1,... \
        --out results/<circuit>_mc_validation_submission.json
```

Validation protocol: **500 MC samples, seed 987654** — independent of the
training seed. Reported: yield with 95% Wilson score interval, per-metric
mean/sigma, per-spec sigma-margins, bottleneck spec.

A submission is accepted per circuit iff **all four** gates pass (gates
1–3 on point (M); gate 4 compares (M) against (P)):

1. **Yield gate:** 500-sample yield ≥ 95 % (point estimate) **and** Wilson
   95 % lower bound ≥ 92 %.
2. **Robustness gate:** minimum per-spec sigma-margin ≥ 3.0.
3. **Improvement-over-baseline gate:** Wilson lower bound of (M)'s yield
   exceeds the baseline yield of the current design point (table below).
   For `ldo_folded_cascode` (baseline already ≈ 99 %): no regression —
   Wilson lower bound ≥ 97 %.
4. **Ablation gate (the point of this exercise):** (M) must beat (P) —
   the Wilson lower bound of (M)'s yield must exceed the point-estimate
   yield of (P), both validated on the same 500 samples / seed 987654.
   Beating only the pre-sizing baseline is **not** sufficient: you must
   show the gain comes from your mismatch-aware mechanism, not from
   sizing alone. For `ldo_folded_cascode`, where little headroom remains,
   the gate relaxes to: no regression versus (P) **and** a higher
   validation min sigma-margin than (P).

Reference: current design points (a.k.a. what you must beat)

| Circuit | 200-sample baseline yield (seed 1234) | 500-sample validation yield, Wilson 95 % CI (seed 987654) | Validation min sigma-margin (bottleneck) |
|---|---|---|---|
| ldo_folded_cascode | 99.0 % | 98.0 % [96.4, 98.9] | 2.73 (vout_max) |
| ldo_2 | 86.0 % | 92.0 % [89.3, 94.1] | 1.27 (vout_max) |
| ldo_simple | 83.5 % | 86.0 % [82.7, 88.8] | 1.33 (dcgain1) |
| ldo_1 | 62.0 % | 66.0 % [61.7, 70.0] | 0.65 (ugf1) |
| ldo_tb | 15.5 % | 26.0 % [22.3, 30.0] | −0.86 (dcgain1) |

(The two seeds disagree by a few points on the weak circuits — that is
exactly why acceptance is graded on the independent validation seed, and
why gate 3 compares Wilson bounds rather than point estimates.)

Anti-gaming provisions:

- Never optimize against the validation seed. Submissions whose training
  used seed 987654 (or any seed searched against the 500-sample run) are
  rejected. We will additionally re-validate on a third seed of our choice.
- **The plain variant (P) must be a good-faith configuration**: your best
  nominal-TT sizing setup, run with the same budget, the same number of
  independent runs and the same finalist-selection rule as (M).
  Deliberately weakening (P) to manufacture an ablation win — or
  silently giving (M) a larger budget — is grounds for rejection.
- The objective is deterministic; identical `x` must reproduce the
  submitted FOM exactly. If it does not, the submission is rejected.
- Design points outside the bounds of §3 are rejected (the driver clips
  internally, but we grade the unclipped specification).

---

## 7. Practical notes

- One objective evaluation (K=30, 6 parallel chunks) takes roughly
  30–60 s per circuit on a modern 8-core machine. A 200-evaluation run is
  therefore ~2–3 h; the 500-sample validation ~5–10 min.
- The driver prepends `asap7_pdk/bin` to `PATH` for its own subprocesses;
  for manual ngspice runs you must do it yourself.
- If you bypass the Python driver and call ngspice directly, you take over
  its two critical duties: injecting `.param` values **and** recomputing
  the `let sg_*` sigma lines from the new sizes (formula in §2, reference
  implementation `gen_mc_tb.py: sigma_for`). Skipping the second one
  silently evaluates mismatch at the wrong sizes.
- Non-converging designs are a legitimate region of the search space; the
  fail penalty handles them. Do not add convergence hacks (relaxed
  tolerances, forced nodesets) to the testbench.
- Questions on the protocol: check `HANDOFF.md` §5 (MC testbench anatomy)
  first, then ask.

---

# 中文版：考虑 MC 失配的 Sizing 基准 — 案例包、FOM 与验收标准

> 本中文版为参考译文，与上方英文版内容一致；如有歧义，以英文版为准。

**读者：** 开发考虑失配（mismatch-aware）sizing 算法的供应商团队。
**范围：** 五个 ASAP7 LDO 设计。你的算法给出晶体管尺寸（以及少量偏置/无源器件值）；我们用蒙特卡洛（MC）仿真评估设计对器件间 Vth 失配的鲁棒性。**不要求**你的算法在 sizing 循环内运行 MC（见 §5）——但算法中必须包含一种机制，能够可测量地提升 MC 良率，优于同一算法关闭该机制的版本（见 §6 消融门）。

本文档即合同。它定义了案例、优化接口、训练目标（FOM）、验证流程和验收标准。任何此处未定义的数字，请先提问，不要自行假设。

---

## 1. 交付包内容

每个电路 `ldo_1, ldo_2, ldo_simple, ldo_folded_cascode, ldo_tb`（位于 `circuits/<名称>/`）：

| 文件 | 作用 |
|---|---|
| `circuit_asap7.cir` | 已定尺寸的单元网表（ASAP7 BSIM-CMG，N 元素，参数为 `NFIN`+`L`） |
| `tb_asap7_mc.sp` | 失配 MC 测试台（单实例 `x1`） |
| `config_asap7.json` | 设计空间：变量名、默认值、上下界 |

框架（位于 `benchmark/`）：

| 文件 | 作用 |
|---|---|
| `mc_benchmark.py` | **基准驱动** —— 优化接口、FOM、验证 |
| `run_mc_baseline.py` | 批量 MC 运行器，用于生成参考基准 |
| `gen_mc_tb.py` | 生成 MC 测试台的生成器（仅供参考） |

参考数据（位于 `results/`）：

| 文件 | 作用 |
|---|---|
| `ldo_*_mc_baseline.json` | 当前设计点的 200 样本 MC 统计（种子 1234） |
| `ldo_*_mc_validation_default.json` | 同一批设计点的 500 样本独立验证 |

环境：ASAP7 模型为 BSIM-CMG，只能在提供的 ngspice+OSDI Docker 镜像中运行。构建与自检步骤见 `HANDOFF.md` §2–§4（该文档面向 macOS；Linux 下步骤相同）。所有仿真必须经过 `asap7_pdk/bin/ngspice` 包装器。

---

## 2. 失配模型（MC 变化什么，不变化什么）

- ASAP7 模型卡**没有统计参数**。工艺波动由 12 个 PVT 角单独覆盖，**不在本基准范围内**。
- MC 只变化**逐器件的 Vth 失配**，通过 BSIM-CMG 实例参数 `DELVTRAND`（每器件的 Vth 偏移，单位伏特）实现。
- 每器件的 σ 遵循 Pelgrom 风格的工程假设（PDK 无失配数据）：

  ```
  sigma_i = SIG_VT / sqrt(WEFF_UM * L_um * NFIN_i)
  SIG_VT  = 2e-3 V*um
  WEFF_UM = 0.07 um   （每个 fin 的有效宽度）
  ```

- **驱动会根据被评估设计点的尺寸重新计算每个 `sigma_i`。** 你无需手动编辑 `sg_*` 行；增大器件尺寸会自动收紧其失配分布。这正是你的算法应当利用的机制。
- 随机抽样使用 ngspice 的 `sgauss(0)`，配合固定的 `set seed=...`，使每次评估完全可复现（公共随机数，CRN）。

每个 MC 样本在最大和最小负载下测量：`vout`、`iq`、直流增益、单位增益频率和相位裕度（共 10 项指标，以 `MCRES` 行打印）。不收敛的样本无输出，计为失败。

---

## 3. 优化接口

Python API（`benchmark/mc_benchmark.py`）：

```python
import sys; sys.path.insert(0, "benchmark")
from mc_benchmark import MCBenchmark

b = MCBenchmark("ldo_simple", K=30)          # 训练协议，CRN 种子固定
names, lb, ub = b.get_design_space()         # 物理单位
f   = b.objective(x)      # x：归一化 [0,1]^d 向量 -> 浮点数，最小化它
res = b.evaluate(x)       # 完整统计字典（裕度、良率估计、FOM）
```

- `x` 按 `lb`/`ub` 逐分量归一化到 `[0,1]`；驱动负责反归一化、注入 `.param` 值、刷新失配 σ、并行运行 MC 分块并汇总结果。
- `objective(x)` 在固定 `(circuit, K, seed)` 下是确定性的：同样的 `x` 输入，同样的数值输出。这是 CRN 保证——不要改动种子。
- 设计变量按连续量处理（参考流程连续优化 `NFIN`；取整到整数 fin 是后处理步骤，验收不要求）。
- 等效命令行：`python3 benchmark/mc_benchmark.py <电路> --x v0,v1,...`（省略 `--x` 表示当前设计点）。加 `--validate` 执行验收运行（§6）。

设计空间（所有 `N_*` 为 fin 数，`L` 固定 21 nm）：

| 电路 | 器件数 | 设计变量（边界） |
|---|---|---|
| ldo_simple | 6 | N_M1[4,64] N_M3[8,128] N_M5[8,128] N_M6[100,3000] Vb[0.3,0.65] R_FB[500,5e4] C_FB[0.2,20] C_LOAD[20,500] |
| ldo_folded_cascode | 10 | N_M1[4,64] N_M3[8,128] N_M5[4,64] N_M7[2,32] N_M9[8,128] N_M10[1000,16000] Vb1[0.25,0.5] Vb2[0.05,0.3] R_FB[500,5e4] C_FB[0.2,20] C_LOAD[100,1000] |
| ldo_1 | 9 | N_M0[4,64] N_M2[8,128] N_M4[4,64] N_M6[16,256] N_M7[4,64] N_M8[2000,30000] I_bias[2u,50u] C_LOAD[50,1000] |
| ldo_2 | 20 | N_NM0..N_NM10、N_PM0..N_PM8（共 17 个 fin 数）、I_bias[2u,100u] R_R0[100,20000] C_C0/C_C1[2,100] C_C4[0.05,2] C_LOAD[50,1000] |
| ldo_tb | 24 | N_BIASCM_PMOS[4,64] N_GM1_PMOS[4,64] N_GM2_PMOS[16,256] N_POWER_PMOS[4000,30000] N_BIASCM_NMOS[2,32] N_LOAD2_NMOS[4,64] I_bias[2u,50u] C_C0[0.5,40] C_LOAD[20,500] |

FOM 中刻意**不含面积项**；上表边界就是面积约束。上界视为硬限制。

---

## 4. 规格集（必须同时全部满足）

每个 MC 样本，TT 角，25 °C：

| 指标 | 条件 | 含义 |
|---|---|---|
| `vout_max` | `> V_tgt` | 最大负载下的输出电压，即 LDO 仍在稳压（`V_tgt` = 0.40 / 0.38 / 0.35 / 0.35 / 0.42 V，分别对应 ldo_1 / ldo_2 / ldo_simple / ldo_folded_cascode / ldo_tb） |
| `dcgain1` | `> 40 dB` | 最大负载下的环路增益 |
| `ugf1` | `> 1 MHz` | 最大负载下的单位增益频率 |
| `pm1` | `> 45°` | 最大负载下的相位裕度 |
| `pm2` | `> 45°` | 最小负载下的相位裕度 |

一个样本通过，当且仅当五项条件全部满足且该样本收敛。该规格集即 `benchmark/run_mc_baseline.py` 中的 `SPECS`——唯一权威来源。

---

## 5. 你的算法必须（和不必须）做什么

**不要求你在 sizing 循环内运行 MC——并且明确不接受对每个候选点做完整 MC 评估：K=30 的评估每次需要 30–60 秒，这会让搜索慢到不可行。** 必须做到的是：你的算法中必须包含一个显式的、能够提升失配鲁棒性/良率的机制或策略，且该机制必须可被证明有效——在相同预算下，开启该机制的算法版本必须优于关闭它的版本（即 §6 的消融门）。

如何实现是你的设计自由。可接受的策略示例（不完整列举，欢迎组合）：

- 由 §2 Pelgrom σ 模型推导的解析失配惩罚项——每器件 `SIG_VT / sqrt(WEFF_UM * L * NFIN)` 项零仿真成本且可微；
- 名义 TT 仿真加各项规格的安全裕度；
- 基于敏感度的鲁棒性代理（如 d 规格 / d Vth）；
- 用少量驱动调用训练出的 MC FOM 代理模型；
- 仅在关键处使用少样本 MC（例如对入围候选点重排序）。

§5.1 定义的驱动 FOM 是我们评分的 ground truth。它可用于校准、自检和决赛圈排序——在循环内是否调用、调用多少次由你决定。不强制使用，也不会因为用得更多而加分。

### 5.1 参考训练 FOM

对设计点 `x`，以主种子 `TRAIN_SEED = 424242`（驱动默认值）运行 `K = 30` 个 MC 样本。对每项规格 `i` 计算 σ 裕度

```
m_i = (mean_i - L_i) / std_i        （本基准中所有规格均为下界 L_i）
```

（在收敛样本上统计）。标量 FOM（越大越好）为

```
FOM(x) = softmin_tau(m_1..m_5) - 10 * fail_fraction
softmin_tau(m) = -tau * ln( mean_j exp(-m_j / tau) ),   tau = 0.5
fail_fraction  = 1 - （收敛样本数）/K
```

`objective(x)` 返回 `-FOM(x)`，供最小化类优化器使用。设计理由：

- σ 裕度携带梯度信息（30 样本的良率估计几乎纯是噪声），且直接编码了"该设计在每项规格上能吸收几个 σ 的失配"。
- soft-min 让优化器聚焦瓶颈规格，同时保持光滑；`tau = 0.5` 使其接近真实最小值。
- 失败惩罚防止"幸存者偏差"设计——一半样本不收敛、剩下的一半看起来很好。

上报结果的预算与重复规则：

- 你对比的所有算法变体必须使用相同评估预算（建议：相当于每次运行 200 次名义评估——如果用了驱动 FOM 调用，请诚实地计入预算）。
- 每个电路做 5–10 次独立优化运行（不同优化器种子）；最终分数报 mean ± std。MC 种子始终保持 `424242`——这是 CRN 协议，不是 bug。

---

## 6. 验收标准（我们如何评分）

每个电路提交**两个**最终设计点（归一化 `x` 或物理值）：

- **(P) 普通版** —— 你的 sizing 算法在**关闭**失配感知机制下产生（你的善意名义 TT 配置）；
- **(M) MC 感知版** —— 同一算法在**开启**该机制下产生。

两个变体必须使用**相同的评估预算**和**相同次数的独立优化运行**（5–10 次，不同优化器种子）；按相同规则选取各自最终点（例如最终分数最优者），并分别上报运行间离散度。我们会自行重跑验证；建议你在提交前先自行运行：

```bash
python3 benchmark/mc_benchmark.py <电路> --validate --x v0,v1,... \
        --out results/<电路>_mc_validation_submission.json
```

验证协议：**500 个 MC 样本，种子 987654**——与训练种子独立。上报：带 95% Wilson 置信区间的良率、各指标 mean/σ、各规格 σ 裕度、瓶颈规格。

一个提交在某电路上被接受，当且仅当**四道门全部通过**（第 1–3 道作用于设计点 (M)；第 4 道比较 (M) 与 (P)）：

1. **良率门：** 500 样本良率 ≥ 95%（点估计）**且** Wilson 95% 下限 ≥ 92%。
2. **鲁棒性门：** 最小单规格 σ 裕度 ≥ 3.0。
3. **相对基准提升门：** (M) 良率的 Wilson 下限超过当前设计点的基准良率（下表）。对于 `ldo_folded_cascode`（基准已 ≈ 99%）：不许回退——Wilson 下限 ≥ 97%。
4. **消融门（本任务的核心）：** (M) 必须优于 (P)——(M) 良率的 Wilson 下限必须超过 (P) 的点估计良率，两者在相同 500 样本 / 种子 987654 下验证。仅优于 sizing 前的基准是**不够**的：你必须证明增益来自你的失配感知机制，而非单纯来自 sizing。对于余量很小的 `ldo_folded_cascode`，此门放宽为：相对 (P) 不回退，**且**验证最小 σ 裕度高于 (P)。

参考：当前设计点（即你必须超越的对象）

| 电路 | 200 样本基准良率（种子 1234） | 500 样本验证良率，Wilson 95% CI（种子 987654） | 验证最小 σ 裕度（瓶颈） |
|---|---|---|---|
| ldo_folded_cascode | 99.0 % | 98.0 % [96.4, 98.9] | 2.73 (vout_max) |
| ldo_2 | 86.0 % | 92.0 % [89.3, 94.1] | 1.27 (vout_max) |
| ldo_simple | 83.5 % | 86.0 % [82.7, 88.8] | 1.33 (dcgain1) |
| ldo_1 | 62.0 % | 66.0 % [61.7, 70.0] | 0.65 (ugf1) |
| ldo_tb | 15.5 % | 26.0 % [22.3, 30.0] | −0.86 (dcgain1) |

（两个种子在较弱电路上相差数个百分点——这正是验收必须在独立验证种子上评分、且第 3 道门比较 Wilson 区间而非点估计的原因。）

防作弊条款：

- 绝不允许针对验证种子做优化。凡训练中使用种子 987654（或任何针对 500 样本运行搜索过的种子）的提交一律拒收。我们还会用自选的第三个种子复验。
- **普通版 (P) 必须是善意配置**：你最好的名义 TT sizing 设置，与 (M) 使用相同预算、相同独立运行次数、相同的决赛点选取规则。故意做差 (P) 来制造消融优势——或暗中给 (M) 更大预算——均构成拒收理由。
- 目标是确定性的；相同的 `x` 必须精确复现所提交的 FOM。复现不了即拒收。
- 超出 §3 边界的设计点拒收（驱动内部会裁剪，但我们按未裁剪的规格评分）。

---

## 7. 实用说明

- 一次目标评估（K=30，6 个并行分块）在现代 8 核机器上约需 30–60 秒/电路。200 次评估的一轮优化约 2–3 小时；500 样本验证约 5–10 分钟。
- 驱动会为它自己的子进程把 `asap7_pdk/bin` 加到 `PATH` 前面；手动运行 ngspice 时你需要自己设置。
- 如果你绕过 Python 驱动直接调用 ngspice，就要自己承担它的两项关键职责：注入 `.param` 值，**以及**按新尺寸重算 `let sg_*` σ 行（公式见 §2，参考实现 `gen_mc_tb.py: sigma_for`）。漏掉第二项，就会在错误的尺寸下静默评估失配。
- 不收敛的设计是搜索空间的合法区域；失败惩罚会处理它们。不要给测试台加收敛性取巧手段（放宽容差、强制 nodeset 等）。
- 协议问题：先查 `HANDOFF.md` §5（MC 测试台结构），再问我们。
