# Sky130 Bandgap Reference (BGR)

## Source
- **Original repository**: [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm)
- **Author / Organization**: silicon-vlsi
- **License**: Original repository license

## Circuit Description
A Brokaw-style bandgap voltage reference designed in the SkyWater 130nm open-source PDK. The core generates a temperature-compensated reference voltage by combining PTAT and CTAT currents.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_4 | 2, 1, 2, 2, 7 | Channel lengths of core transistors (µm) |
| M_0–M_4 | 4, 8, 1, 2, 1 | Multiplicity (finger count) of core transistors |

## Evaluation Metrics
- **vref** — Reference output voltage (V)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Original `.lib` paths were absolute; changed to relative paths pointing to the shared `sky130_pdk/` folder.
