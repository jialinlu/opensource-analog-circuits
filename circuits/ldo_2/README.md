# ldo_2

## Source
- **Original repository**: [CODA-Team/AnalogGym](https://github.com/CODA-Team/AnalogGym)
- **Author / organization**: CODA-Team
- **License**: see the original repository

## Description
LDO from the AnalogGym benchmark suite with an NMOS input-pair error
amplifier and a self-biased control network: the pass device gate is
driven through a bias chain (NP5 → net030 → NM2 → net17 → NP2 → net20 →
NM4 → net049) that closes the output-voltage feedback loop.

Two PDK versions are provided:

| File | PDK | Supply | Contents |
|---|---|---|---|
| `circuit.cir` | SkyWater sky130 (1.8 V) | 1.8 V | original netlist + testbench (untouched) |
| `circuit_asap7.cir` | ASAP7 (0.7 V) | 0.7 V | migrated **cell** netlist (subcircuit only) |
| `tb_asap7.sp` | ASAP7 (0.7 V) | 0.7 V | standalone testbench, 12 PVT corners |

Migration notes (ASAP7 version): ASAP7 `nmos/pmos_rvt/slvt/lvt` FinFET
models sized by `NFIN`; the bias-chain device ratios had to be
re-balanced for 0.7 V (NP0 strong/NP1 weak, NM2/NM3/NM4 enlarged) so the
output regulation loop closes; the pass device uses `pmos_slvt` for
sufficient drive at 100 mA load; Vref = 0.45 V (unity feedback);
compensation caps retuned by Bayesian optimization.

## Simulation results (TT, 25 °C)

| Metric | sky130 (default sizing) | ASAP7 (optimized) |
|---|---|---|
| Supply / Vref | 1.8 V / 1.6 V | 0.7 V / 0.45 V |
| Vout @ max load (100 mA) | 1.57 V | 0.412 V |
| DC loop gain (max / min load) | 38.1 / 38.1 dB | 48.6 / 48.6 dB |
| GBW (max / min load) | 0.10 / — MHz | 84.1 / 81.7 MHz |
| Phase margin (max / min load) | 111.7° / 105.9° | 67.5° / 131.3° |
| PSRR @ DC | 2.0 dB | 37.7 dB |
| Line regulation (LNR1) | 0.420 | 0.051 |
| Load regulation (LR) | 0.00027 | 0.0051 |
| Power @ max load | 180 mW | 70 mW |

The sky130 column is the circuit as shipped in this repo (default sizing);
the ASAP7 column is the migrated design after BO sizing. All ASAP7
benchmark specs are met: dcgain > 40 dB, ugf > 1 MHz, PM > 45°,
vout > 0.38 V.

## Design variables (ASAP7, `config_asap7.json`)

| Parameter | Default | Range | Meaning |
|---|---|---|---|
| N_NM0, N_NM1, N_NM6, N_NM7 | 30 / 21 / 25 / 31 | [2, 32] | NMOS bias mirrors fins |
| N_NM2 | 50 | [8, 128] | bias-chain NMOS fins |
| N_NM3 / N_NM4 | 252 | [16, 256] | bias-chain mirror fins |
| N_NM8 / N_NM9 | 57 | [4, 64] | NMOS input pair fins |
| N_NM10 | 104 | [8, 128] | input-pair tail fins |
| N_PM0 | 36 | [8, 128] | bias diode PMOS fins |
| N_PM1 | 10 | [1, 32] | bias-chain PMOS fins |
| N_PM2, N_PM3 | 29, 26 | [4, 64] | bias-chain PMOS fins |
| N_PM4 | 13846 | [1000, 20000] | pass PMOS fins (slvt) |
| N_PM5, N_PM6, N_PM7 | 126 / 54 / 30 | [4, 128] | vfb-rail PMOS fins |
| N_PM8 / N_PM9 | 21 | [4, 64] | mirror load fins |
| current_0_bias | 17 µA | [2 µA, 100 µA] | bias current |
| R_R0 | 345 Ω | [100, 20k] Ω | bias resistor |
| C_C0 / C_C1 / C_C4 | 44 / 2.4 / 1.9 pF | — | compensation caps |
| C_LOAD | 872 pF | [50, 1000] pF | load capacitor |

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
