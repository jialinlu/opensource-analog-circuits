# IITB 5T OTA with Cascode Load (180nm)

## Source
- **Original repository**: [neeraj17-p/OTA_IITB_esim_Marathon](https://github.com/neeraj17-p/OTA_IITB_esim_Marathon)
- **Author / Organization**: Neeraj, IIT Bombay (eSim Marathon)
- **License**: License of the original repository

## Description
A 5-transistor operational transconductance amplifier (OTA) designed in a 180nm process, with a cascode active load. An educational benchmark circuit from the IITB eSim Marathon.

## Design variables
| Parameter | Default | Description |
|-----------|---------|-------------|
| W1–W2 | 10 µm | Input differential pair width |
| W3–W4 | 20 µm | Cascode load transistor width |
| W5 | 15 µm | Tail current source width |
| W6 | 40 µm | Extra mirror branch width |
| L1–L4 | 0.36 µm | Channel length |

## Metrics
- **gain** — DC open-loop gain (dB)
- **ugf** — Unity-gain frequency (Hz)
- **pm** — Phase margin (°)

## Model files
- `NMOS-180nm.lib` — 180nm NMOS BSIM3 model
- `PMOS-180nm.lib` — 180nm PMOS BSIM3 model

## Notes
Original educational netlist; adapted for automated sizing with standardized parameter names.
