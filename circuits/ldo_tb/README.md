# ldo_tb

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / organization**: CODA-Team
- **License**: see the original repository

## Description
LDO (subcircuit `Basic_LDO`) from the AnalogGym benchmark suite: PMOS
input pair (friendly to low input common-mode), super-source-follower
second stage, PMOS pass device, resistor feedback divider.

Two PDK versions are provided:

| File | PDK | Supply | Contents |
|---|---|---|---|
| `circuit.cir` | SkyWater sky130 (1.8 V) | 1.8 V | original netlist + testbench (untouched) |
| `circuit_asap7.cir` | ASAP7 (0.7 V) | 0.7 V | migrated **cell** netlist (subcircuit only) |
| `tb_asap7.sp` | ASAP7 (0.7 V) | 0.7 V | standalone testbench, 12 PVT corners |

Migration notes (ASAP7 version): ASAP7 FinFET models sized by `NFIN`; the
feedback divider was changed from 300k/100k to 100k/100k so that
Vout = 2·Vref = 0.5 V; the pass device uses `pmos_slvt` because the
super-source-follower limits the gate drive to ~0.39 V at 0.7 V supply;
the second stage uses `pmos_slvt` (it was the LVT flavor in sky130 as
well). The manual first-pass sizing already met all specs, so no BO run
was needed for this circuit.

## Simulation results (TT, 25 °C)

| Metric | sky130 (default sizing) | ASAP7 (manual sizing) |
|---|---|---|
| Supply / Vref | 1.8 V / 0.4 V | 0.7 V / 0.25 V |
| Vout @ max load (55 mA) | non-functional* | 0.482 V |
| DC loop gain (max / min load) | −86.3 dB* / — | 42.6 / 52.4 dB |
| GBW (max / min load) | —* | 9.8 / 9.3 MHz |
| Phase margin (max / min load) | —* | 102.1° / 101.3° |
| PSRR @ DC | —* | 27.9 dB |
| Load regulation (LR) | —* | 0.78 |
| Power @ max load | —* | 38.6 mW |

\* The sky130 default sizing shipped in this repo is a non-functional
starting point for optimization (output does not regulate); it is kept
unchanged for reference. The ASAP7 column meets all benchmark specs:
dcgain > 40 dB, ugf > 1 MHz, PM > 45°, vout > 0.42 V.

## Design variables (ASAP7, `config_asap7.json`)

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| N_BIASCM_PMOS | 16 | [4, 64] | PMOS bias mirrors fins |
| N_GM1_PMOS | 16 | [4, 64] | PMOS input pair fins (lvt) |
| N_GM2_PMOS | 64 | [16, 256] | super-source-follower fins (slvt) |
| N_POWER_PMOS | 12000 | [4000, 30000] | pass PMOS fins (slvt) |
| N_BIASCM_NMOS | 8 | [2, 32] | NMOS bias mirrors fins |
| N_LOAD2_NMOS | 16 | [4, 64] | NMOS load fins |
| current_0_bias | 10 µA | [2 µA, 50 µA] | bias current |
| C_C0 | 4 pF | [0.5, 40] pF | compensation capacitor |
| C_LOAD | 100 pF | [20, 500] pF | load capacitor |

## How to run (ASAP7)

Requires the ngspice+OSDI environment described in
[`asap7_pdk/README.md`](../../asap7_pdk/README.md).

```bash
export PATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/bin:$PATH
ngspice -b tb_asap7.sp     # TT nominal corner
./run_corners.sh           # all 12 PVT corners -> corner_results/
```

## Metrics
- **vout** — regulated output voltage (V), plus dcgain / ugf / pm loop metrics

## Model files
- sky130: `../../sky130_pdk/libs.tech/ngspice/sky130.lib.spice` (tt)
- ASAP7: `../../asap7_pdk/models/ngspice/` (OSDI BSIM-CMG, see `asap7_pdk/README.md`)

## Notes
Adapted from AnalogGym. The original sky130 netlist is unchanged.
