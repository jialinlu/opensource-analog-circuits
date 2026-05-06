# Sky130 Low-Power Two-Stage OpAmp

## Source
- **Original repository**: [velugotiashokkumar/LP_OPAMP_130nm](https://github.com/velugotiashokkumar/LP_OPAMP_130nm)
- **Author / Organization**: Velugoti Ashok Kumar
- **License**: Original repository license

## Circuit Description
A low-power two-stage operational amplifier designed in SkyWater 130nm. Optimized for minimal static power consumption while maintaining acceptable gain and bandwidth.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| L_0–L_1 | 0.5, 0.5 | Channel length of core transistors (µm) |
| M_0–M_1 | 1, 1 | Multiplicity (finger count) |
| W_0 | 65 µm | Width of input differential pair |
| W_1 | 10 µm | Width of load / mirror devices |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
Sky130 PDK (`../../sky130_pdk/...`)
- `sky130_fd_pr__nfet_01v8` / `sky130_fd_pr__pfet_01v8`

## Notes
Adapted from the original LP_OPAMP design; `.lib` paths fixed to relative.
