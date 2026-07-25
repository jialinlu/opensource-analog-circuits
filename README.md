# Open-Source Analog Circuit Sizing Benchmark Suite

> 🌐 **[Online Visualization Dashboard](https://jialinlu.github.io/opensource-analog-circuits/)** — Browse interactive leaderboards, design spaces, and baseline performance for 31 circuits
>
> 📊 Features: Statistics overview · Sortable leaderboard · Circuit card catalog · Per-circuit details · Spec satisfaction visualization

A unified benchmark suite for **analog circuit sizing optimization**, built on open-source ngspice netlists. It provides a generic Python framework that wraps any ngspice circuit behind a standard optimization interface, enabling quick benchmarking of genetic algorithms (GA), Bayesian optimization (BO), reinforcement learning (RL), and other sizing methods.

## Features

- **31 parameterized circuits** sourced from PTM, IITB, Sky130, AnalogGym, and educational examples
- Ready-to-use **zero-dependency GA example** (pure numpy implementation)
- **JSON-configurable** design spaces, metric specs, and parsers — add a new circuit in minutes
- **Relative-path model references** — all examples run directly after cloning the repository
- Built-in **AC and DC/Tran metric parsers** (gain/UGF/PM parsed from AC tables, regex extraction from DC/Tran logs)
- **Multi-Testbench** netlist support (AC + PSRR + CMRR + DC evaluated simultaneously)

## Repository Structure

```
.
├── README.md                      # This file
├── benchmark/
│   ├── __init__.py
│   ├── ngspice_benchmark.py       # Core framework: NgspiceBenchmark class
│   ├── example_ga.py              # Real-coded GA example (SBX + polynomial mutation)
│   └── example_bo.py              # Random search / BO baseline example
├── circuits/                       # 31 sizing benchmarks
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
├── sky130_pdk/                     # SkyWater 130nm PDK (used by Sky130 circuits)
│   ├── libs.tech/
│   └── libs.ref/
└── asap7_pdk/                      # ASAP7 7nm FinFET PDK packaged for ngspice
    ├── models/ngspice/             # OSDI BSIM-CMG cards + 12-corner .lib
    ├── docker/                     # ngspice-46 + OpenVAF + OSDI image recipe
    ├── bin/ngspice                 # docker wrapper (drop-in ngspice binary)
    └── README.md                   # detailed ASAP7/ngspice setup guide
```

The five LDO benchmarks (`circuits/ldo_*`) are available in two PDK
flavors each: the original SkyWater sky130 netlists, and ASAP7 (0.7/0.8 V)
migrations with 12-corner testbenches (`tb_asap7.sp`, `run_corners.sh`)
and re-optimized sizing — see `asap7_pdk/README.md` and the per-circuit
READMEs for setup instructions and sky130-vs-ASAP7 result tables.

## Requirements

- Python 3.9+
- `numpy`
- `ngspice` (tested with ngspice-46)

```bash
pip install numpy
# macOS: brew install ngspice
# Ubuntu: sudo apt-get install ngspice
```

## Quick Start

### 1. Evaluate a Single Design Point

```python
from benchmark.ngspice_benchmark import NgspiceBenchmark

bench = NgspiceBenchmark.from_config("circuits/sky130_bgr/config.json")
x0 = bench.default_design_point()  # normalized to [0,1]
metrics = bench.evaluate(x0)
obj = bench.objective_fn(metrics)
print(f"Objective: {obj:.4f}, metrics: {metrics}")
```

### 2. Run GA Sizing Optimization on Any Circuit

```bash
# PTM180nm operational amplifier (19 design variables, very fast simulation ~0s/run)
python benchmark/example_ga.py circuits/ptm180nm_opamp/config.json -g 10 -p 16

# Sky130 BGR (15 design variables, ~17s/run)
python benchmark/example_ga.py circuits/sky130_bgr/config.json -g 3 -p 4 --seed 42
```

### 3. Run the Random Search Baseline

```bash
python benchmark/example_bo.py circuits/chargepump/config.json
```

## Benchmark Framework API

### `NgspiceBenchmark`

```python
bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")

# Design space
names, lb, ub = bench.get_design_space()   # physical values
x0 = bench.default_design_point()           # normalized to [0,1]

# Evaluation
metrics = bench.evaluate(x)       # parsed metrics dictionary
obj = bench.objective(x)          # scalar objective value (lower is better)
meets = bench.meets_specs(metrics) # whether specs are satisfied

# Denormalize back to physical parameters
params = bench._denormalize(x)
```

### Configuration Format (`circuits/<name>/config.json`)

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

| Field | Description |
|------|------|
| `circuit_file` | Path to the main netlist (relative to the repository root) |
| `design_vars` | `{param_name: [default, lower_bound, upper_bound]}` |
| `specs` | `{metric_name: ["<" or ">", target_value]}` |
| `metrics_parser_type` | `"regex"`, `"ac_data"`, or `"multi_tb_meas"` |
| `metrics_patterns` | Regex dictionary used by the `"regex"` / `"multi_tb_meas"` parsers |
| `objective` | `"sum_violations"`, `"weighted_sum"`, or `"multi_tb_max_violation"` |

## Modifying Tunable Parameters (Add / Remove / Adjust Ranges)

The framework defines the design space via `config.json` and injects parameter values into the netlist's `.param` statements via regex substitution at simulation time. Therefore, **adding or removing a tunable parameter requires modifying both the netlist file and the configuration file**.

### 1. Adjust the Range of an Existing Parameter
Simply modify the bounds of the corresponding parameter in `config.json`:
```json
"design_vars": {
  "W1": [10e-6, 5e-6, 15e-6]
}
```
The format is `[default, lower_bound, upper_bound]`. The default value is used for the baseline evaluation; `[lower_bound, upper_bound]` defines the optimization search range.

### 2. Add a New Tunable Parameter
Follow these steps:
1. **Define the parameter in the netlist**: add `.param NEW_VAR=default_value` in `circuit.cir`.
2. **Reference the parameter in the netlist**: make sure some device uses it, e.g. `w='NEW_VAR*1'` or `l='NEW_VAR'`.
3. **Register it in the configuration file**: add the following to `design_vars` in `config.json`:
   ```json
   "NEW_VAR": [default, lower_bound, upper_bound]
   ```
4. **Test and verify**: run the baseline test to confirm the new parameter is injected correctly:
   ```bash
   python benchmark/example_bo.py circuits/<name>/config.json
   ```

### 3. Remove a Tunable Parameter
Follow these steps:
1. **Remove it from the configuration file**: delete the corresponding key in `design_vars` of `config.json`.
2. **Fix the value in the netlist**: replace all references to the parameter in `circuit.cir` with a fixed numeric value.
3. **Remove the definition from the netlist** (optional): delete the `.param OLD_VAR=...` line.
4. **Test and verify**: confirm the simulation still runs normally.

### ⚠️ Important Notes
- The framework injects parameters via **regex substitution**. If the netlist does not contain a corresponding `.param` definition, the parameter value will not be injected.
- Parameter names must match **exactly** (case-sensitive) between `config.json` and `circuit.cir`.
- After modifying parameters, the **metrics parser** (`metrics_parser_type` and `metrics_patterns`) usually does not need changes, unless the new parameters lead to a new output format.
- It is recommended to validate with the default design point after modifications:
  ```python
  from benchmark.ngspice_benchmark import NgspiceBenchmark
  bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")
  x0 = bench.default_design_point()
  metrics = bench.evaluate(x0)
  print(metrics)
  ```

## Adding a New Optimization Algorithm

1. **Import the benchmark**
   ```python
   from benchmark.ngspice_benchmark import NgspiceBenchmark
   bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")
   ```

2. **Initialize the optimizer** using `bench.dim`, `bench.lb`, and `bench.ub`.

3. **Evaluate design points**: call `bench.objective(x)`, where `x` is a normalized vector in `[0,1]^d`. The framework automatically handles parameter injection, ngspice execution, and metrics parsing.

4. **Track convergence**: use `bench.sim_count` and `bench.sim_time`.

5. **Report results**: use `bench._denormalize(x)` to convert back to physical values.

See `benchmark/example_ga.py` for a complete example (~260 lines, pure numpy).

## Circuit Catalog

### Baseline Performance (Default Design Point)

| Circuit | PDK | # Vars | Parser | Specs | Default Objective | Meets Specs | Sim Time |
|---------|-----|-------|--------|-------|-------------|-------------|----------|
| **ptm180nm_opamp** | PTM 180nm | 19 | AC | gain>60dB, UGF>1MHz, PM>60° | 0.146 | ❌ | ~0s |
| **ptm180nm_opamp_multi_tb** | PTM 180nm | 19 | multi_tb_meas | gain>35dB, GBW>30MHz, PM>35°, PSRR>20dB, CMRR>40dB, Power<150µW, Vos<10mV | 0.558 | ❌ | ~1s |
| **gh_autockt_opamp** | PTM 45nm | 10 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.07 | ❌ | ~0s |
| **ota_iitb** | IITB 180nm | 13 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.27 | ❌ | ~0s |
| **chargepump** | Embedded BSIM4 | 7 | regex | vout>3V | 0.000 | ✅ | ~0.1s |
| **bjt_ce_amp** | Embedded BJT | 5 | regex | vout>10V | 0.000 | ✅ | ~0s |
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

> **Note:** Sky130 circuits are slower (~17s/run) because the PDK needs to load all process corners and models. For a quick demo, use a small population (e.g. 4–8) and few generations (e.g. 3–5).

### Design Space Summary

| Circuit | Key Variables | Default → Range (Examples) |
|---------|---------------|---------------------------|
| ptm180nm_opamp | 19 (W/L/M of all transistors + Cc + Rc) | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u, Cc=3p → [1.5,4.5]p |
| gh_autockt_opamp | 10 (W/L of input pair, load, and current mirror) | W1=8u → [4,12]u, L1=0.18u → [0.13,0.23]u |
| ota_iitb | 13 (W/L/M of 5T OTA + cascode) | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u |
| chargepump | 7 (W/L of charge-pump switches and capacitors) | W1=5u → [2.5,7.5]u |
| bjt_ce_amp | 5 (Rb, Rc, Re, Vcc, beta) | Rb=10k → [5,15]k |
| sky130_bgr | 15 (W/L/M of PTAT/CTAT branches and resistors) | W_P=10 → [5,15], L_P=0.5 → [0.25,0.75] |
| sky130_ldo | 4 (W/L of pass transistor and error amplifier) | W_pass=100 → [50,150] |
| sky130_lp_opamp | 6 (W/L of input pair and load) | W1=10 → [5,15] |
| sky130_por | 4 (W/L of the inverter chain) | W1=2 → [1,3] |
| sky130_vco | 7 (W/L of ring-oscillator inverters) | W_N=2 → [1,3], L_N=0.15 → [0.13,0.17] |

See `circuits/<name>/config.json` for the exact design space of each circuit.

## Adding a New Circuit

1. **Create a directory**: create one under `circuits/<name>/`.
2. **Place the netlist**: put the netlist in that directory (e.g. `circuit.cir`).
3. **Ensure model paths are relative**: relative to `circuit.cir` (e.g. `../../sky130_pdk/...` for Sky130).
4. **Add `.param` statements**: add a `.param` for every tunable design variable.
5. **Write `config.json`**: follow the configuration format described above.
6. **Test**:
   ```bash
   python benchmark/example_bo.py circuits/<name>/config.json
   ```

## Sources and Licenses

Each circuit in this suite is sourced from an open-source repository or a public PDK. Original sources are listed below:

| Circuit | Source | License / Attribution |
|---------|--------|----------------------|
| ptm180nm_opamp | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — Two-stage op-amp, **ASU PTM 180nm** | Original repository license |
| gh_autockt_opamp | [ksettaluri6/AutoCkt](https://github.com/ksettaluri6/AutoCkt) (Stanford) — Two-stage op-amp, PTM 45nm | Original repository license |
| ota_iitb | [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon) — 5T OTA + cascode, 180nm | Original repository license |
| chargepump | [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS) — 5-stage charge pump | Original repository license |
| bjt_ce_amp | [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples) — BJT common-emitter amplifier | Original repository license |
| sky130_bgr | [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm) — Bandgap reference | Original repository license |
| sky130_ldo | [github_sky130/lowdropoutregulator](https://github.com/ayeshafareed/LDO_MOSFET) — Low-dropout regulator | Original repository license |
| sky130_lp_opamp | [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm) — Low-power two-stage op-amp | Original repository license |
| sky130_por | [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130) — Power-on reset circuit | Original repository license |
| sky130_vco | [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO) — Ring-oscillator VCO | Original repository license |
| alfio_raffc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AFFC op-amp | Original repository license |
| fan_smc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — SMC op-amp | Original repository license |
| hoilee_affc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AFFC op-amp | Original repository license |
| leung_dfcfc1 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DFCFC op-amp | Original repository license |
| leung_dfcfc2 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DFCFC op-amp | Original repository license |
| leung_nmcf | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCF op-amp | Original repository license |
| leung_nmcnr | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCNR op-amp | Original repository license |
| peng_acbc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — ACBC op-amp | Original repository license |
| peng_iac | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — IAC op-amp | Original repository license |
| peng_tcfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — TCFC op-amp | Original repository license |
| qu2017_azc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AZC op-amp | Original repository license |
| ramos_pfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — PFC op-amp | Original repository license |
| sau_cfcc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — CFCC op-amp | Original repository license |
| song_dacfc | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — DACFC op-amp | Original repository license |
| yan_az | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — AZ op-amp | Original repository license |
| ldo_1 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | Original repository license |
| ldo_2 | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | Original repository license |
| ldo_folded_cascode | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — Folded-cascode LDO | Original repository license |
| ldo_simple | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — Simple LDO | Original repository license |
| amp_nmcf | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — NMCF op-amp | Original repository license |
| ldo_tb | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — LDO | Original repository license |
| **Sky130 PDK** | [SkyWater 130nm PDK](https://github.com/google/skywater-pdk) | Apache-2.0 |

> **Note:** The circuits have been parameterized and adapted for this benchmark suite. The original testbenches and netlists may have been modified (e.g. parameter injection, `.lib` path fixes, convergence options). Please refer to the original repositories for the unmodified designs.

## Citation

If you use this benchmark suite in your research, please cite the original sources of the circuits you use, and consider acknowledging this framework.

## License

The benchmark framework code (`benchmark/*.py`) is provided as-is for research and educational purposes. The circuit netlists and PDK files retain their original licenses (see the table above).
