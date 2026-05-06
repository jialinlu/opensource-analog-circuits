# IITB 5T OTA with Cascode Load (180nm)

## Source
- **Original repository**: [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon)
- **Author / Organization**: Neeraj, IIT Bombay (eSim Marathon)
- **License**: Original repository license

## Circuit Description
A 5-transistor operational transconductance amplifier (OTA) with a cascode active load, designed in 180nm technology. Educational benchmark from the IITB eSim marathon.

## Tunable Parameters
| Parameter | Default | Description |
|-----------|---------|-------------|
| W1–W2 | 10 µm | Width of input differential pair |
| W3–W4 | 20 µm | Width of cascode load transistors |
| W5 | 15 µm | Width of tail current source |
| W6 | 40 µm | Width of additional mirror branch |
| L1–L4 | 0.36 µm | Channel length |

## Evaluation Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model Files
- `NMOS-180nm.lib` — 180nm NMOS BSIM3 model
- `PMOS-180nm.lib` — 180nm PMOS BSIM3 model

## Notes
Original educational netlist; adapted for automated sizing with standardized parameter names.
