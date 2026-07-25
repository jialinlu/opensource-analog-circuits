# ldo_folded_cascode

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / organization**: CODA-Team
- **License**: see the original repository

## Description
LDO from the AnalogGym benchmark suite built around a folded-cascode
error amplifier driving a PMOS pass device.

Two PDK versions are provided:

| File | PDK | Supply | Contents |
|---|---|---|---|
| `circuit.cir` | SkyWater sky130 (2.0 V) | 2.0 V | original netlist + testbench (untouched) |
| `circuit_asap7.cir` | ASAP7 (0.8 V) | 0.8 V | migrated **cell** netlist (subcircuit only) |
| `tb_asap7.sp` | ASAP7 (0.8 V) | 0.8 V | standalone testbench, 12 PVT corners |

Migration notes (ASAP7 version): the folded-cascode stack does not fit in
0.7 V (pass-device gate swing vs. leakage at light load), so this design
runs at **VDD = 0.8 V** — still within the valid range of the ASAP7
models; `nmos_lvt` input pair, `nmos_slvt` current sources, `pmos_slvt`
cascodes, `pmos_rvt` mirror loads and pass device; bias voltages Vb1/Vb2
and all sizes were retuned with Bayesian optimization. At light load
(10 µA) the output rises ~100 mV above target — an inherent limitation
of the topology at this supply.

## Simulation results (TT, 25 °C)

| Metric | sky130 (default sizing) | ASAP7 @0.8 V (optimized) |
|---|---|---|
| Supply / Vref | 2.0 V / 1.8 V | 0.8 V / 0.4 V |
| Vout @ max load (10 mA) | 1.49 V | 0.412 V |
| DC loop gain (max / min load) | 43.3 / 42.5 dB | 42.4 / 30.0 dB |
| GBW (max / min load) | 25.1 / — MHz | 131.1 / 0.07 MHz |
| Phase margin (max / min load) | 8.5° / 90.0° | 61.9° / 91.8° |
| PSRR @ DC | 8.6 dB | 37.3 dB |
| Line regulation (LNR1) | 0.189 | 0.037 |
| Load regulation (LR) | 14.7 | 20.9 |
| Power @ max load | 23.2 mW | 8.4 mW |

The sky130 column is the circuit as shipped in this repo (default sizing);
the ASAP7 column is the migrated design after BO sizing. All ASAP7
benchmark specs are met: dcgain > 40 dB, ugf > 1 MHz, PM > 45°,
vout > 0.35 V.

## Design variables (ASAP7, `config_asap7.json`)

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| N_M1 / N_M2 | 22 | [4, 64] | NMOS input pair fins (lvt) |
| N_M3 / N_M4 | 50 | [8, 128] | PMOS load mirror fins |
| N_M5 / N_M6 | 64 | [4, 64] | PMOS cascode fins (slvt) |
| N_M7 / N_M8 | 3 | [2, 32] | NMOS current-source fins |
| N_M9 | 81 | [8, 128] | tail NMOS fins |
| N_M10 | 5115 | [1000, 16000] | pass PMOS fins |
| Vb1 | 0.416 V | [0.25, 0.5] | NMOS current-source bias |
| Vb2 | 0.05 V | [0.05, 0.3] | PMOS cascode bias |
| R_FB | 8.8 kΩ | [500, 50k] Ω | compensation resistor |
| C_FB | 0.2 pF | [0.2, 20] pF | compensation capacitor |
| C_LOAD | 812 pF | [100, 1000] pF | load capacitor |

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
