# ldo_1

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / organization**: CODA-Team
- **License**: see the original repository

## Description
Two-stage low-dropout regulator (LDO) from the AnalogGym benchmark suite:
NMOS differential pair + PMOS current-mirror load, second PMOS
common-source stage, PMOS pass device, resistor feedback divider.

Two PDK versions are provided:

| File | PDK | Supply | Contents |
|---|---|---|---|
| `circuit.cir` | SkyWater sky130 (1.8 V) | 1.8 V | original netlist + testbench (untouched) |
| `circuit_asap7.cir` | ASAP7 (0.7 V) | 0.7 V | migrated **cell** netlist (subcircuit only) |
| `tb_asap7.sp` | ASAP7 (0.7 V) | 0.7 V | standalone testbench, 12 PVT corners |

Migration notes (ASAP7 version): devices use ASAP7 `nmos/pmos_rvt/slvt/lvt`
FinFET models sized by `NFIN`; the feedback divider was changed from
300k/100k to 40k/100k so that Vout = 1.4·Vref = 0.49 V; a 5 pF Miller
capacitor (`Cc`, pass-gate to output) was added — it is required for
closed-loop stability at 0.7 V; MIM caps / poly resistors were replaced
by ideal C/R; sizes were then re-optimized with Bayesian optimization
(`benchmark/run_asap7_opt.py`).

## Simulation results (TT, 25 °C)

| Metric | sky130 (default sizing) | ASAP7 (optimized) |
|---|---|---|
| Supply / Vref | 1.8 V / 0.4 V | 0.7 V / 0.35 V |
| Vout @ max load (100 mA) | 1.605 V | 0.485 V |
| DC loop gain (max / min load) | 40.2 / 124.8 dB | 70.4 / 82.3 dB |
| GBW (max / min load) | 0.33 / — MHz | 3.06 / 4.00 MHz |
| Phase margin (max / min load) | 15.8° / unstable | 86.2° / 73.3° |
| PSRR @ DC | 25.9 dB | 49.6 dB |
| Line regulation (LNR1) | 0.421 | 0.0071 |
| Load regulation (LR) | 0.0056 | 0.0139 |
| Power @ max load | 180 mW | 70 mW |

The sky130 column is the circuit as shipped in this repo (default sizing,
which is only a starting point for optimization); the ASAP7 column is the
migrated design after BO sizing. All ASAP7 benchmark specs are met:
dcgain > 40 dB, ugf > 1 MHz, PM > 45°, vout > 0.4 V.

## Design variables (ASAP7, `config_asap7.json`)

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| N_M0 / N_M1 | 64 | [4, 64] | PMOS mirror fins |
| N_M2 / N_M3 | 41 | [8, 128] | NMOS input pair fins (L=35n) |
| N_M4 / N_M5 | 63 | [4, 64] | NMOS tail / bias fins |
| N_M6 | 157 | [16, 256] | 2nd-stage PMOS fins |
| N_M7 | 4 | [4, 64] | 2nd-stage NMOS load fins |
| N_M8 | 28265 | [2000, 30000] | pass PMOS fins |
| current_0_bias | 2 µA | [2 µA, 50 µA] | bias current |
| C_LOAD | 286.4 pF | [50, 1000] pF | load capacitor |
| C_CC | 5 pF (fixed) | — | Miller compensation cap |

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
