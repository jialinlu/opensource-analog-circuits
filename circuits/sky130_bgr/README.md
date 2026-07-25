# Sky130 Bandgap Reference (BGR)

## Source
- **Original repository**: [silicon-vlsi/BGR_DESIGN_SKY130nm](https://github.com/silicon-vlsi/BGR_DESIGN_SKY130nm)
- **Author / Organization**: silicon-vlsi
- **License**: License of the original repository

## Description
A Brokaw-style bandgap voltage reference designed with the SkyWater 130nm open-source PDK. The core generates a temperature-compensated reference voltage by combining PTAT and CTAT currents.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_4 | 2, 1, 2, 2, 7 | Core transistor channel lengths (µm) |
| M_0–M_4 | 4, 8, 1, 2, 1 | Core transistor multiplicities (number of fingers) |

## Metrics
- **vref** — Reference output voltage (V)

## Model files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
The original `.lib` path was absolute; it has been changed to a relative path pointing to the shared `sky130_pdk/` folder.
