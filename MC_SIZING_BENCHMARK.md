# MC-Aware Sizing Benchmark — Case Package, FOM and Acceptance Criteria

**Audience:** vendor team developing a mismatch-aware sizing algorithm.
**Scope:** five ASAP7 LDO designs. Your algorithm proposes transistor sizes
(and a few bias/passive values); we score the design's robustness against
device-to-device Vth mismatch via Monte Carlo (MC) simulation.

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

## 5. Training FOM (what you optimize)

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
  (suggested: 200 objective evaluations per run).
- 5–10 independent optimizer runs per circuit (different optimizer seeds);
  report final FOM as mean ± std. The MC seed stays `424242` for all of
  them — that is the CRN protocol, not a bug.

---

## 6. Acceptance criteria (how we grade the result)

Submit the final design point per circuit (normalized `x` or physical
values). We re-run validation ourselves; you are encouraged to run it
before submitting:

```bash
python3 benchmark/mc_benchmark.py <circuit> --validate --x v0,v1,... \
        --out results/<circuit>_mc_validation_submission.json
```

Validation protocol: **500 MC samples, seed 987654** — independent of the
training seed. Reported: yield with 95% Wilson score interval, per-metric
mean/sigma, per-spec sigma-margins, bottleneck spec.

A submission is accepted per circuit iff **all three** gates pass:

1. **Yield gate:** 500-sample yield ≥ 95 % (point estimate) **and** Wilson
   95 % lower bound ≥ 92 %.
2. **Robustness gate:** minimum per-spec sigma-margin ≥ 3.0.
3. **Improvement gate:** Wilson lower bound of the submitted yield exceeds
   the baseline yield of the current design point (table below). For
   `ldo_folded_cascode` (baseline already ≈ 99 %): no regression — Wilson
   lower bound ≥ 97 %.

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
