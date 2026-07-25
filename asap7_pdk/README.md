# ASAP7 PDK for ngspice (OSDI / BSIM-CMG)

This directory packages everything needed to simulate the
[ASAP7](https://asap.epfl.ch/) 7 nm FinFET PDK with **ngspice**, plus the
environment used for the LDO migration results in `circuits/ldo_*`.

## Why this is not plug-and-play

The ASAP7 model cards in `models/hspice/` are **BSIM-CMG** (HSPICE
`level=72`) decks. ngspice has no built-in BSIM-CMG device; since
ngspice-39 it is supported only through the **OSDI** interface, which
loads a compiled Verilog-A model at runtime. The Verilog-A source must be
compiled with **OpenVAF**, and no reliable OpenVAF binary exists for
macOS. We therefore run a small **Docker image** that contains
ngspice-46 (built with `--enable-osdi`), OpenVAF, and the compiled
BSIM-CMG module. A thin wrapper script makes it behave like a local
`ngspice` binary.

## Directory layout

```
asap7_pdk/
├── models/
│   ├── hspice/                 # original ASAP7 HSPICE cards (untouched)
│   │   ├── 7nm_TT.pm  7nm_SS.pm  7nm_FF.pm  (+ *_160803.pm variants)
│   └── ngspice/                # converted OSDI cards + compiled model
│       ├── 7nm_TT_osdi.pm      # .model <name> bsimcmg_va, type=+1/-1
│       ├── 7nm_SS_osdi.pm
│       ├── 7nm_FF_osdi.pm
│       ├── asap7_osdi_corners.lib   # 12 PVT corners (.lib sections)
│       └── bsimcmg_va.osdi     # BSIM-CMG 111 compiled by OpenVAF (linux .so)
├── docker/
│   ├── Dockerfile              # ngspice-46 + OpenVAF + OSDI build recipe
│   ├── bsimcmg_va/             # BSIM-CMG 111 Verilog-A sources
│   └── 7nm_TT_osdi.pm          # copy used for the in-build smoke test
├── bin/
│   └── ngspice                 # wrapper: forwards calls to the docker image
└── third_party/
    └── blackbox -> /Users/lujialin/lujialin/blackbox-optimizer
                                # symlink to the local blackbox-optimizer
                                # checkout (used by benchmark/run_asap7_opt.py)
```

## One-time setup

1. Install and start **Docker Desktop** (macOS).

2. Build the image (takes ~10 min, only needed once):

   ```bash
   cd asap7_pdk/docker
   docker build -t ngspice-osdi .
   ```

   The build compiles ngspice-46 with `--enable-osdi`, downloads the
   OpenVAF 23.5.0 binary, compiles `bsimcmg_va.va` into
   `bsimcmg_va.osdi`, and runs a smoke test (single NMOS/PMOS devices at
   VDD=0.7 V). If the smoke test prints a current, the image is good.

3. Put the wrapper on your `PATH`:

   ```bash
   export PATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/bin:$PATH
   ```

   `bin/ngspice` mounts the repository root and the macOS temp
   directories into the container at identical paths, then runs the real
   ngspice inside. Any invocation (`ngspice -b file.sp`, interactive
   mode, the benchmark framework) works transparently, as long as Docker
   Desktop is running. Simulations are capped at 290 s inside the
   container so a diverging netlist cannot accumulate orphaned
   containers.

## Netlist rules for ASAP7 + OSDI

- **Devices are `N`-elements, not `M` or `X`** (ngspice OSDI convention),
  for both NMOS and PMOS; polarity comes from the model card
  (`type = 1` / `type = -1`):

  ```spice
  N1 d g s b nmos_rvt L=21n NFIN=16
  N2 d g s b pmos_slvt L=21n NFIN=16
  ```

- Available models: `nmos_lvt/rvt/slvt/sram`, `pmos_lvt/rvt/slvt/sram`.
  FinFETs are sized with `NFIN` (integer fin count) instead of `W`.

- Load the OSDI module **before parsing**, inside `.control`:

  ```spice
  .control
  pre_osdi <path-to>/asap7_pdk/models/ngspice/bsimcmg_va.osdi
  op
  ...
  .endc
  ```

- Include model cards from `models/ngspice/`, e.g.
  `.include "../../asap7_pdk/models/ngspice/7nm_TT_osdi.pm"`, or use the
  corner library (below).

- Nominal supply is **VDD = 0.7 V**. The cards are valid roughly over
  0.6–0.8 V; analog blocks that need more headroom (e.g. the folded
  cascode LDO) can be run at 0.8 V.

- The converted cards are used with the **BSIM-CMG 111** Verilog-A model
  (the original decks are version 107). Three obsolete parameters
  (`coremod`, `capmod`, `nseg`) are ignored with a warning — they were
  already set to inert values in the original cards.

## PVT corners

`models/ngspice/asap7_osdi_corners.lib` defines 12 corners as `.lib`
sections (3 process × supply ±10 % × temperature −40/27/125 °C):

| section      | process | vdd_scale | temp  | | section      | process | vdd_scale | temp  |
|---|---|---|---|---|---|---|---|
| `tt_nom`     | TT | 1.0 | 27 °C  | | `ss_vlo_tlo` | SS | 0.9 | −40 °C |
| `tt_vlo_tlo` | TT | 0.9 | −40 °C | | `ff_nom`     | FF | 1.0 | 27 °C  |
| `tt_vhi_thi` | TT | 1.1 | 125 °C | | `ff_vhi_thi` | FF | 1.1 | 125 °C |
| `tt_vlo_thi` | TT | 0.9 | 125 °C | | `ff_vlo_tlo` | FF | 0.9 | −40 °C |
| `ss_nom`     | SS | 1.0 | 27 °C  | | `ff_vhi_tlo` | FF | 1.1 | −40 °C |
| `ss_vlo_thi` | SS | 0.9 | 125 °C | | `ss_vhi_tlo` | SS | 1.1 | −40 °C |

Usage in a testbench:

```spice
.lib "../../asap7_pdk/models/ngspice/asap7_osdi_corners.lib" tt_nom
.PARAM VDD_NOM = 0.7
.PARAM supply_voltage = 'VDD_NOM*vdd_scale'
```

Every LDO in `circuits/ldo_*` ships a `run_corners.sh` that sweeps all
12 corners and prints a metric summary per corner.

## Running the LDOs

```bash
export PATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/bin:$PATH
cd circuits/ldo_1
ngspice -b tb_asap7.sp          # TT nominal corner
./run_corners.sh                # all 12 corners -> corner_results/
```

Sizing optimization (blackbox-optimizer BO + the benchmark framework):

```bash
export PYTHONPATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/third_party
cd /Users/lujialin/lujialin/mc_sizing/opensource-circuits
python3 benchmark/run_asap7_opt.py circuits/ldo_1/config_asap7.json \
    --max_evals 100 --write_back
```

## Notes / caveats

- `bin/ngspice` requires Docker Desktop to be running; the first call
  after a Docker restart has ~1 s extra latency.
- The `bsimcmg_va.osdi` file committed under `models/ngspice/` is a
  Linux x86-64 shared object — it is meant to be loaded by the container,
  not by a host ngspice.
- If you prefer a native (non-Docker) flow: build OpenVAF for your host,
  compile `docker/bsimcmg_va/bsimcmg.va` yourself, and load the resulting
  `.osdi` with a host ngspice ≥ 39 built with OSDI support. The wrapper
  is then unnecessary.
