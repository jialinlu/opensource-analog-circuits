# BJT Common-Emitter Amplifier

## Source
- **Original repository**: [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples)
- **Author / Organization**: Daniel Rios Linares
- **License**: License of the original repository

## Description
A basic BJT common-emitter amplifier used as an ngspice teaching example. The design uses discrete resistors, capacitors, and a built-in BJT model; no external PDK is required.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| R1 | 110 kΩ | Base bias resistor (upper divider) |
| R2 | 10 kΩ | Base bias resistor (lower divider) |
| R3 | 10 kΩ | Collector load resistor |
| R4 | 1 kΩ | Emitter degeneration resistor |
| C1 | 0.1 µF | AC coupling capacitor |

## Metrics
- **vout** — Output voltage / gain metric (V)

## Model files
None — the BJT model is embedded directly in the netlist.

## Notes
Teaching example; uses a built-in BJT model and is self-contained.
