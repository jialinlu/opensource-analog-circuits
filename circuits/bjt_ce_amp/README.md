# BJT Common-Emitter Amplifier

## Source
- **Original repository**: [danielrioslinares/ngspice-examples](https://github.com/danielrioslinares/ngspice-examples)
- **Author / Organization**: Daniel Rios Linares
- **License**: Original repository license

## Circuit Description
A basic BJT common-emitter amplifier used as an educational ngspice example. The design uses discrete resistors and capacitors with a built-in BJT model, requiring no external PDK.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| R1 | 110 kΩ | Base bias resistor (upper divider) |
| R2 | 10 kΩ | Base bias resistor (lower divider) |
| R3 | 10 kΩ | Collector load resistor |
| R4 | 1 kΩ | Emitter degeneration resistor |
| C1 | 0.1 µF | AC coupling capacitor |

## Evaluation Metrics
- **vout** — Output voltage / gain metric (V)

## Model Files
None — BJT model is embedded directly in the netlist.

## Notes
Educational example; self-contained with embedded BJT model.
