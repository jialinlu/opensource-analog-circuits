# Handover: ASAP7 LDO Migration & Monte Carlo Sizing Benchmark

This document describes the full state of the work and how to reproduce the
environment on a **new machine** to continue the task. Read it top to bottom
before running anything.

---

## 1. What this project is, and where we are

Goal: use the five LDOs in `circuits/ldo_*` as test cases to evaluate sizing
(sizing-optimization) algorithms. Two milestone groups are done:

1. **ASAP7 migration (committed)** — each LDO has an ASAP7 (0.7 V, folded
   cascode 0.8 V) cell netlist (`circuit_asap7.cir`), a standalone 12-corner
   PVT testbench (`tb_asap7.sp` + `run_corners.sh`), a sizing config
   (`config_asap7.json`), and sizes re-optimized with Bayesian optimization.
   All nominal-TT specs pass for all five circuits. See each circuit's
   README for sky130-vs-ASAP7 result tables.
2. **Monte Carlo infrastructure (this handover)** — each LDO now has a
   mismatch-MC testbench (`tb_asap7_mc.sp`), and a 200-sample mismatch-MC
   **baseline has been run** for the current (TT-optimized) design points.
   Results in `results/ldo_*_mc_baseline.json`, summarized in §7.

**MC-aware sizing benchmark (implemented, 2026-08-05)**: the MC sizing
driver `benchmark/mc_benchmark.py` implements the agreed design (§8):
soft-min σ-margin FOM, K=30 inner-loop MC samples with CRN, train seed
424242 / validation seed 987654 separation, and 500-sample independent
validation with Wilson CI. The vendor-facing contract (interface, FOM
definition, acceptance criteria) is in `MC_SIZING_BENCHMARK.md`; 500-sample
validations of the current design points are in
`results/ldo_*_mc_validation_default.json`.

---

## 2. Machine requirements

- macOS (tested on x86-64; Apple Silicon works but needs Rosetta, see §3.4)
- Docker Desktop installed and **running** whenever simulating
- Python 3.9+ with `numpy` (framework), plus `scipy` + `scikit-learn`
  (required by blackbox-optimizer's BO backend)
- The two repositories side by side:
  - `opensource-circuits` (this repo)
  - `blackbox-optimizer` (the user's optimizer package, used by
    `benchmark/run_asap7_opt.py`; not on PyPI — copy/clone it from the old
    machine and adjust the symlink, see §3.3)

Host ngspice (brew/apt) is *optional*: it can only simulate the sky130
circuits, **not** ASAP7 (see §4).

---

## 3. Environment setup on the new machine

### 3.1 Clone and locate

```bash
git clone git@github.com:jialinlu/opensource-analog-circuits.git
cd opensource-circuits
```

Everything ASAP7-related lives in `asap7_pdk/`:

```
asap7_pdk/
├── models/hspice/            # original ASAP7 HSPICE cards (TT/SS/FF), untouched
├── models/ngspice/           # OSDI-converted cards + bsimcmg_va.osdi + 12-corner .lib
├── docker/                   # Dockerfile + BSIM-CMG 111 Verilog-A sources
├── bin/ngspice               # docker wrapper: drop-in ngspice binary
└── third_party/blackbox      # symlink to local blackbox-optimizer checkout
```

### 3.2 Build the ngspice+OSDI docker image (once, ~10 min)

```bash
cd asap7_pdk/docker
docker build -t ngspice-osdi .
# on Apple Silicon (arm64) build the amd64 image instead:
docker build --platform linux/amd64 -t ngspice-osdi .
```

The build compiles ngspice-46 with `--enable-osdi`, fetches the OpenVAF
23.5.0 binary, compiles `bsimcmg_va.va` into `bsimcmg_va.osdi`, and runs a
smoke test at the end (you should see `i(vd) = ...` printed, no `ERROR`).

### 3.3 Wire up the wrapper and the optimizer package

```bash
export PATH=<repo>/asap7_pdk/bin:$PATH        # add to your shell rc
ln -sfn <path-to-blackbox-optimizer> <repo>/asap7_pdk/third_party/blackbox
export PYTHONPATH=<repo>/asap7_pdk/third_party
```

`asap7_pdk/bin/ngspice` auto-detects the repo root from its own location and
mounts it (plus macOS temp dirs) into the container at identical paths, so
relative `.include`/`.lib` and absolute netlist paths both work. It also
caps each run at 1800 s inside the container (`timeout 1800`) so a
non-converging netlist cannot accumulate orphaned containers.

### 3.4 Sanity checks (run these first)

```bash
# 1) ASAP7 + OSDI works:
cd circuits/ldo_simple && ngspice -b tb_asap7.sp | grep -E "vout_max|dcgain1|phase_margin1"
#    expect vout_max ≈ 0.392, dcgain1 ≈ 43.4, phase_margin1 ≈ 86.3

# 2) MC testbench works (5 samples):
cd circuits/ldo_simple
sed 's/let NRUN = 200/let NRUN = 5/' tb_asap7_mc.sp > /tmp/mc.sp && cp /tmp/mc.sp . 
ngspice -b mc.sp | grep MCRES ; rm mc.sp
#    expect 4 MCRES lines per sample with varying vout_max

# 3) framework works:
cd <repo> && python3 - <<'EOF'
import sys; sys.path.insert(0, "benchmark")
from ngspice_benchmark import NgspiceBenchmark
b = NgspiceBenchmark.from_config("circuits/ldo_simple/config_asap7.json")
m = b.evaluate(b.default_design_point())
print(b.objective_fn(m), b.meets_specs(m))   # expect 0.0 True
EOF
```

### 3.5 Notes for Apple Silicon

The prebuilt OpenVAF binary is linux/amd64; the whole image must be built
and run as amd64 (`--platform linux/amd64`, Docker Desktop with Rosetta
enabled). Everything else is platform-independent.

---

## 4. Why ASAP7 needs this docker setup (read before debugging)

- ASAP7 model cards are **BSIM-CMG** (HSPICE `level=72`). No ngspice binary
  (homebrew included) has BSIM-CMG compiled in — ngspice ≥ 39 supports it
  **only via the OSDI interface** with a Verilog-A model compiled by
  **OpenVAF**. OpenVAF has no reliable macOS binary → hence the Linux
  docker image that does everything.
- The committed `models/ngspice/bsimcmg_va.osdi` is a **Linux x86-64**
  shared object for use *inside the container only*.
- Netlist rules for OSDI (already applied in all `*_asap7*` files):
  - devices are **`N`-elements** (both NMOS and PMOS; polarity comes from
    `type=1/-1` in the card), sized by `NFIN` + `L`, e.g.
    `N1 d g s b nmos_rvt L=21n NFIN=16`
  - load the module **before netlist parsing**: `pre_osdi <path>.osdi`
    must be the first line inside `.control`
  - the converted cards run on the BSIM-CMG **111** VA model (original
    decks are v107); the `coremod/capmod/nseg` "unrecognized parameter"
    warnings are expected and harmless.

---

## 5. Monte Carlo: what the model supports and how the TB works

- The ASAP7 cards have **no statistical/mismatch parameters** (corner-only
  models; none exist officially). Process variation = the 12 PVT corners.
- Mismatch MC is done via the BSIM-CMG instance parameter **`DELVTRAND`**
  ("Variability in Vth", volts, per-device Vth shift). Verified working:
  Vth tracks DELVTRAND 1:1.
- Random draws use **`sgauss(0)`** (control-language N(0,1) generator).
  `gauss()/agauss()/unif()` exist only in front-end `.param` context — do
  **not** use them inside `.control` loops. `set seed=<n>` makes runs
  reproducible (CRN).
- `tb_asap7_mc.sp` structure (single subckt instance `x1`): per sample it
  alters every transistor's DELVTRAND, then measures OP(max load) →
  AC(max) → OP(min load) → AC(min), printing four `MCRES` lines with
  `vout_max, vout_min, iq_max, iq_min, dcgain1, ugf1, pm1, dcgain2, ugf2, pm2`.
- Per-device sigma follows a Pelgrom-style engineering assumption
  (no PDK data): `σ_i = SIG_VT / sqrt(WEFF_UM · L_um · NFIN)`, with
  `SIG_VT=2e-3 V·µm` and `WEFF_UM=0.07` as `.param` knobs in the TB.

**Critical implementation detail**: circuit `.param` values are *not
visible* inside `.control`. The per-device sigma numbers therefore live in
`let sg_<dev> = <number>` lines inside the TB's control block, computed
from the *default* sizes. **Whenever a sizing algorithm changes NFIN/L,
the driver must rewrite these `let sg_` lines** (same values, recomputed
with the new sizes) — `benchmark/gen_mc_tb.py` shows the formula; the
upcoming MC benchmark driver must do this injection per evaluation.

Other hard-won ngspice quirks (all already handled in the TBs):
- `set units=degrees` is required or `vp()` returns radians.
- `let`-created vectors die when a new analysis starts (new plot) →
  `echo` each measurement immediately after its analysis.
- `alterparam` does not reliably re-evaluate inside loops → use
  `alter @n.x1.<dev>[delvtrand] = sg_<dev>*sgauss(0)`.
- A non-converging sample simply produces no MCRES lines; count it as a
  failed sample (the baseline driver does).

---

## 6. File map (what's new since the migration commit)

| File | Purpose |
|---|---|
| `circuits/ldo_*/tb_asap7_mc.sp` | mismatch-MC testbench (NRUN=200, seed=1234 defaults) |
| `benchmark/gen_mc_tb.py` | generator that produced the 5 MC TBs (device table + sigma formula) |
| `benchmark/run_mc_baseline.py` | runs MC, reports mean/σ/min/max, σ-margin, yield → `results/ldo_*_mc_baseline.json` |
| `benchmark/run_asap7_opt.py` | nominal-TT BO sizing driver (blackbox-optimizer) |
| `asap7_pdk/bin/ngspice` | docker wrapper (1800 s internal cap) |

---

## 7. MC baseline results (200 samples, TT, seed 1234)

Spec set: `dcgain1>40 dB, ugf1>1 MHz, pm1>45°, pm2>45°, vout_max>threshold`
(threshold per circuit config). Yield counts missing/failed samples as fail.

| Circuit | Yield | Min σ-margin (bottleneck) | Notes |
|---|---|---|---|
| ldo_folded_cascode | 99.0 % | 2.33 (vout_max) | tight distributions, most robust |
| ldo_2 | 86.0 % | −0.08 (vout_max) | some samples lose regulation (bias chain) |
| ldo_simple | 83.5 % | 1.20 (dcgain1) | vout σ=30 mV (11-fin input pair) |
| ldo_1 | 62.0 % | 0.58 (ugf1) | large GBW spread; light-load PM min −4.5° |
| ldo_tb | 15.5 % | −0.98 (dcgain1) | many samples don't regulate; very mismatch-sensitive |

To re-run: `PATH=<repo>/asap7_pdk/bin:$PATH python3 benchmark/run_mc_baseline.py --nrun 200 --seed 1234`

---

## 8. Next steps (the agreed plan for the MC-aware sizing benchmark)

1. **MC benchmark driver** (new, e.g. `benchmark/mc_benchmark.py`):
   per design point x → inject params + refreshed `let sg_` lines → run
   K=25–30 MC samples (chunked/parallel docker calls, seed offsets for
   CRN) → compute per-spec σ-margins `(μ−L)/σ` → scalar objective =
   **soft-min of margins** (log-sum-exp). Sim failure = large penalty.
2. **Protocol for proving algorithm improvement**:
   - CRN: same MC master seed per circuit for all algorithms/design points.
   - Same evaluation budget per algorithm; 5–10 independent optimizer runs
     (different seeds); report final scores as mean±std.
   - Train/validation split: optimize with seed-A 30-sample objective,
     validate finalists with seed-B **500-sample** MC → report yield
     (with Wilson CI), per-metric mean/σ/σ-margin, bottleneck metric.
   - Comparisons: (a) current baseline points (§7), (b) nominal-TT-optimized
     points re-validated under MC, (c) MC-aware optimized points.
3. Consider also: σ-margin breakdown tells you *which* metric and *which*
   device group limits robustness (e.g. ldo_simple's 11-fin input pair).

---

## 9. Operational gotchas on the new machine

- Docker Desktop **must be running**; first call after a Docker restart has
  ~1–2 s extra latency.
- Absolute paths like `/Users/lujialin/...` appear only in docs and in the
  `third_party/blackbox` symlink — the wrapper computes paths itself.
- If `docker run` complains about missing mounts, enable file sharing for
  the repo path in Docker Desktop settings.
- Host ngspice ≠ container ngspice: always call the wrapper (via PATH) for
  ASAP7; calling `/usr/local/bin/ngspice` on an ASAP7 netlist fails with
  "could not find a valid modelname" / "level 72 not supported".
