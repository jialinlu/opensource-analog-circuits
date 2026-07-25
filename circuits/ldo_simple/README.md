# ldo_simple

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / organization**: CODA-Team
- **License**: see the original repository

## Description
Simple LDO from the AnalogGym benchmark suite: 5-transistor OTA (NMOS
input pair + PMOS mirror) driving a PMOS pass device, with a series R-C
compensation branch.

Two PDK versions are provided:

| File | PDK | Supply | Contents |
|---|---|---|---|
| `circuit.cir` | SkyWater sky130 (2.0 V) | 2.0 V | original netlist + testbench (untouched) |
| `circuit_asap7.cir` | ASAP7 (0.7 V) | 0.7 V | migrated **cell** netlist (subcircuit only) |
| `tb_asap7.sp` | ASAP7 (0.7 V) | 0.7 V | standalone testbench, 12 PVT corners |

Migration notes (ASAP7 version): ASAP7 `nmos_lvt` input pair (low Vth for
the 0.4 V input common-mode), `nmos_slvt` tail, `pmos_rvt` mirror and
pass device; Vref = 0.4 V (unity feedback); ideal C/R passives; sizes
optimized with Bayesian optimization.

## Simulation results (TT, 25 °C)

| Metric | sky130 (default sizing) | ASAP7 (optimized) |
|---|---|---|
| Supply / Vref | 2.0 V / 1.8 V | 0.7 V / 0.4 V |
| Vout @ max load (10 mA) | 1.80 V | 0.392 V |
| DC loop gain (max / min load) | 36.0 / 49.5 dB | 43.4 / 45.5 dB |
| GBW (max / min load) | 5.6 / — MHz | 34.6 / 0.81 MHz |
| Phase margin (max / min load) | 52.5° / 42.3° | 86.3° / 80.9° |
| PSRR @ DC | 40.9 dB | 30.4 dB |
| Line regulation (LNR1) | 0.091 | 0.097 |
| Load regulation (LR) | 4.28 | 7.43 |
| Power @ max load | 20.5 mW | 7.1 mW |

The sky130 column is the circuit as shipped in this repo (default sizing);
the ASAP7 column is the migrated design after BO sizing. All ASAP7
benchmark specs are met: dcgain > 40 dB, ugf > 1 MHz, PM > 45°,
vout > 0.35 V.

## Design variables (ASAP7, `config_asap7.json`)

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| N_M1 / N_M2 | 11 | [4, 64] | NMOS input pair fins (lvt) |
| N_M3 / N_M4 | 51 | [8, 128] | PMOS mirror fins |
| N_M5 | 69 | [8, 128] | tail NMOS fins (slvt) |
| N_M6 | 1896 | [100, 3000] | pass PMOS fins |
| Vb | 0.396 V | [0.3, 0.65] | tail gate bias |
| R_FB | 961 Ω | [500, 50k] Ω | compensation resistor |
| C_FB | 3.37 pF | [0.2, 20] pF | compensation capacitor |
| C_LOAD | 408 pF | [20, 500] pF | load capacitor |

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
