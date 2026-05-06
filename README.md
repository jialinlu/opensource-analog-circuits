# Open-Source Analog Circuit Sizing Benchmark

A unified benchmark suite for **analog circuit sizing optimization** using open-source ngspice netlists. It provides a generic Python framework that wraps arbitrary ngspice circuits into a standard optimization interface, enabling rapid benchmarking of Genetic Algorithms (GA), Bayesian Optimization (BO), Reinforcement Learning (RL), and other sizing methods.

## Features

- **10 parameterized circuits** from PTM, IITB, Sky130, and educational sources
- **Zero-dependency GA demo** (pure numpy) included out-of-the-box
- **JSON-configurable** design space, specs, and parsers — add a new circuit in minutes
- **Relative model paths** — every case runs out-of-the-box after cloning
- **AC & DC/Tran metric parsers** built-in (gain/UGF/PM from AC tables, regex from DC/Tran logs)

## Repository Structure

```
.
├── README.md                      # This file
├── benchmark/
│   ├── __init__.py
│   ├── ngspice_benchmark.py       # Core framework: NgspiceBenchmark class
│   ├── example_ga.py              # Real-coded GA demo (SBX + polynomial mutation)
│   └── example_bo.py              # Random-search / BO baseline demo
├── circuits/                       # 10 sizing benchmarks
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
└── sky130_pdk/                     # SkyWater 130nm PDK (for Sky130 circuits)
    ├── libs.tech/
    └── libs.ref/
```

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

### 1. Evaluate a single design point

```python
from benchmark.ngspice_benchmark import NgspiceBenchmark

bench = NgspiceBenchmark.from_config("circuits/sky130_bgr/config.json")
x0 = bench.default_design_point()  # normalized [0,1]
metrics = bench.evaluate(x0)
obj = bench.objective_fn(metrics)
print(f"Objective: {obj:.4f}, Metrics: {metrics}")
```

### 2. Run GA sizing on any circuit

```bash
# PTM180nm OpAmp (19 vars, fast ~0s/sim)
python benchmark/example_ga.py circuits/ptm180nm_opamp/config.json -g 10 -p 16

# Sky130 BGR (15 vars, ~17s/sim)
python benchmark/example_ga.py circuits/sky130_bgr/config.json -g 3 -p 4 --seed 42
```

### 3. Run random-search baseline

```bash
python benchmark/example_bo.py circuits/chargepump/config.json
```

## Benchmark Framework API

### `NgspiceBenchmark`

```python
bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")

# Design space
names, lb, ub = bench.get_design_space()   # physical values
x0 = bench.default_design_point()           # normalized [0,1]

# Evaluate
metrics = bench.evaluate(x)       # dict of parsed metrics
obj = bench.objective(x)          # scalar objective (lower = better)
meets = bench.meets_specs(metrics) # bool

# Denormalize to physical parameters
params = bench._denormalize(x)
```

### Config Schema (`circuits/<name>/config.json`)

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
|-------|-------------|
| `circuit_file` | Path to main netlist (relative to repo root) |
| `design_vars` | `{name: [default, lower_bound, upper_bound]}` |
| `specs` | `{metric: ["<" or ">", target]}` |
| `metrics_parser_type` | `"regex"` or `"ac_data"` |
| `metrics_patterns` | Regex dict for `"regex"` parser |
| `objective` | `"sum_violations"` or `"weighted_sum"` |

## Adding a New Optimization Algorithm

1. **Import the benchmark**
   ```python
   from benchmark.ngspice_benchmark import NgspiceBenchmark
   bench = NgspiceBenchmark.from_config("circuits/<name>/config.json")
   ```

2. **Initialize your optimizer** with `bench.dim`, `bench.lb`, `bench.ub`.

3. **Evaluate design points** by calling `bench.objective(x)` where `x` is a normalized vector in `[0,1]^d`. The framework handles parameter injection, ngspice execution, and metric parsing automatically.

4. **Track convergence** with `bench.sim_count` and `bench.sim_time`.

5. **Report results** using `bench._denormalize(x)` to convert back to physical values.

See `benchmark/example_ga.py` for a complete working example (~260 lines, pure numpy).

## Circuit Catalog

### Baseline Performance (Default Design Point)

| Circuit | PDK | #Vars | Parser | Specs | Default Obj | Meets Specs | Sim Time |
|---------|-----|-------|--------|-------|-------------|-------------|----------|
| **ptm180nm_opamp** | PTM 180nm | 19 | AC | gain>60dB, UGF>1MHz, PM>60° | 0.146 | ❌ | ~0s |
| **gh_autockt_opamp** | PTM 45nm | 10 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.07 | ❌ | ~0s |
| **ota_iitb** | IITB 180nm | 13 | AC | gain>60dB, UGF>1MHz, PM>60° | 2001.27 | ❌ | ~0s |
| **chargepump** | Embedded BSIM4 | 7 | regex | vout>3V | 0.000 | ✅ | ~0.1s |
| **bjt_ce_amp** | Embedded BJT | 5 | regex | vout>10V | 0.000 | ✅ | ~0s |
| **sky130_bgr** | Sky130 | 15 | regex | vref>0.9V | 0.000 | ✅ | ~17s |
| **sky130_ldo** | Sky130 | 4 | regex | vout>2.5V | 0.333 | ❌ | ~17s |
| **sky130_lp_opamp** | Sky130 | 6 | AC | gain>40dB, UGF>1MHz, PM>45° | 0.000 | ✅ | ~17s |
| **sky130_por** | Sky130 | 4 | regex | trip_point<1.5V | 0.000 | ✅ | ~17s |
| **sky130_vco** | Sky130 | 7 | regex | ymax>1.5V, ymin<0.1V | 0.000 | ✅ | ~17s |

> **Note:** Sky130 circuits are slower (~17s/sim) because the PDK loads all corners and models. Use small population sizes (e.g., 4–8) and few generations (3–5) for quick demos.

### Design Space Summary

| Circuit | Key Variables | Default → Range (example) |
|---------|---------------|---------------------------|
| ptm180nm_opamp | 19 (W/L/M for all transistors + Cc + Rc) | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u, Cc=3p → [1.5,4.5]p |
| gh_autockt_opamp | 10 (W/L for input pair, load, current mirror) | W1=8u → [4,12]u, L1=0.18u → [0.13,0.23]u |
| ota_iitb | 13 (W/L/M for 5T OTA + cascode) | W1=10u → [5,15]u, L1=0.18u → [0.13,0.23]u |
| chargepump | 7 (W/L for charge pump switches + caps) | W1=5u → [2.5,7.5]u |
| bjt_ce_amp | 5 (Rb, Rc, Re, Vcc, beta) | Rb=10k → [5,15]k |
| sky130_bgr | 15 (W/L/M for PTAT/CTAT branches, resistors) | W_P=10 → [5,15], L_P=0.5 → [0.25,0.75] |
| sky130_ldo | 4 (W/L for pass transistor + error amp) | W_pass=100 → [50,150] |
| sky130_lp_opamp | 6 (W/L for input pair + load) | W1=10 → [5,15] |
| sky130_por | 4 (W/L for inverter chain) | W1=2 → [1,3] |
| sky130_vco | 7 (W/L for ring oscillator inverters) | W_N=2 → [1,3], L_N=0.15 → [0.13,0.17] |

See each `circuits/<name>/config.json` for the exact design space.

## Adding a New Circuit

1. **Create a directory** under `circuits/<name>/`.
2. **Place your netlist** there (e.g., `circuit.cir`).
3. **Ensure model paths are relative** to `circuit.cir` (e.g., `../../sky130_pdk/...` for Sky130).
4. **Add `.param` statements** for all tunable design variables.
5. **Write `config.json`** following the schema above.
6. **Test:**
   ```bash
   python benchmark/example_bo.py circuits/<name>/config.json
   ```

## Provenance & License

Each circuit in this suite is derived from open-source repositories or public PDKs. The original sources are attributed below:

| Circuit | Source | License / Attribution |
|---------|--------|----------------------|
| ptm180nm_opamp | [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym) — two-stage opamp, **ASU PTM 180nm** | Original repo license |
| gh_autockt_opamp | [ksettaluri6/AutoCkt](https://github.com/ksettaluri6/AutoCkt) (Stanford) — two-stage opamp, PTM 45nm | Original repo license |
| ota_iitb | [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon) — 5T OTA + cascode, 180nm | Original repo license |
| chargepump | [utkarsh-10-17/Charge-Pump-Circuit-using-CMOS](https://github.com/utkarsh-10-17/Charge-Pump-Circuit-using-CMOS) — 5-stage Charge Pump | Original repo license |
| bjt_ce_amp | [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples) — BJT common-emitter amplifier | Original repo license |
| sky130_bgr | [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm) — Bandgap reference | Original repo license |
| sky130_ldo | [github_sky130/lowdropoutregulator](https://github.com/ayeshafareed/LDO_MOSFET) — Low-dropout regulator | Original repo license |
| sky130_lp_opamp | [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm) — Low-power two-stage opamp | Original repo license |
| sky130_por | [Sree-Vishnu-Varthini/POR_SKY130](https://github.com/Sree-Vishnu-Varthini/POR_SKY130) — Power-on-Reset circuit | Original repo license |
| sky130_vco | [SANGESH007/GHz-Range-Low-Power-VCO](https://github.com/SANGESH007/GHz-Range-Low-Power-VCO) — Ring oscillator VCO | Original repo license |
| **Sky130 PDK** | [SkyWater 130nm PDK](https://github.com/google/skywater-pdk) | Apache-2.0 |

> **Note:** Circuits were parameterized and adapted for this benchmark. Original testbenches and netlists may have been modified (e.g., parameter injection, `.lib` path fixes, convergence options). Please refer to the original repositories for the unmodified designs.

## Citation

If you use this benchmark suite in your research, please cite the original sources of the circuits you use, and consider acknowledging this framework.

## License

The benchmark framework code (`benchmark/*.py`) is provided as-is for research and educational purposes. Circuit netlists and PDK files retain their original licenses (see Provenance table above).
