# Sky130 Low-Power Two-Stage OpAmp

## Source
- **Original repository**: [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm)
- **Author / Organization**: Velugoti Ashok Kumar
- **License**: License of the original repository

## Description
A low-power two-stage operational amplifier designed in SkyWater 130nm. Optimized for minimum quiescent power while maintaining acceptable gain and bandwidth.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_1 | 0.5, 0.5 | Core transistor channel length (µm) |
| M_0–M_1 | 1, 1 | Multiplicity (number of fingers) |
| W_0 | 65 µm | Input differential pair width |
| W_1 | 10 µm | Load / mirror device width |

## Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Adapted from the original LP_OPAMP design; `.lib` paths have been corrected to relative paths.
