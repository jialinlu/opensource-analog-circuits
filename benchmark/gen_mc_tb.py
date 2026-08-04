#!/usr/bin/env python3
"""Generate tb_asap7_mc.sp (mismatch Monte Carlo testbench) for the 5 LDOs.

Reads each circuit's tb_asap7.sp, keeps the single-instance loop/DC
testbench (x1), and replaces the analysis block with an MC loop that
applies per-device DELVTRAND ~ N(0, sigma_i), sigma_i following the
Pelgrom-style engineering assumption:
    sigma_i = SIG_VT / sqrt(WEFF_UM * L_um * NFIN)
(SIG_VT and WEFF_UM are .param knobs in the TB; the per-device sigma
numbers in the control block are refreshed by the MC driver whenever
the sizing changes.)
"""
import re
import math
from pathlib import Path

ROOT = Path("/Users/lujialin/lujialin/mc_sizing/opensource-circuits")

# per-circuit settings: (vout_node, maxload, minload)
CFG = {
    "ldo_1":               ("vout1", "100m", "1m"),
    "ldo_2":               ("vout1", "100m", "1m"),
    "ldo_simple":          ("Vreg1", "10m",  "10u"),
    "ldo_folded_cascode":  ("Vreg1", "10m",  "10u"),
    "ldo_tb":              ("vout1", "55m",  "5m"),
}

# lines to drop from the original TB (PSRR / DC-sweep instances & sources)
DROP = re.compile(r"^(x2|x3|Ib2|Ib3|CL2|CL3|Iload2|Iload3|VVDDApsrr|VVDDdc|"
                  r"Vb3|Vb4|Vb5|Vb6)\b", re.I)

def clean_nodeset(line):
    m = re.match(r"^(\s*\.nodeset)(.+)$", line, re.I)
    if not m:
        return line
    keep = [tok for tok in m.group(2).split()
            if not re.search(r"vreg2|vreg3|ppsr1|vout6", tok, re.I)]
    return m.group(1) + " " + " ".join(keep) if len(keep) > 0 else ""

SIG_VT = 2e-3     # V*um (Pelgrom AVT-scale assumption, per-device sigma base)
WEFF_UM = 0.07    # effective width per fin in um (~2*HFIN+TFIN)


def parse_params(tb_text):
    """Parse numeric .param defaults from the tb file."""
    params = {}
    for m in re.finditer(r"^\s*\.param\s+(.+)$", tb_text, re.M | re.I):
        for kv in re.finditer(r"(\w+)\s*=\s*'?([^'\s]+)'?", m.group(1)):
            name, val = kv.group(1), kv.group(2)
            try:
                params[name] = float(re.sub(r"([a-zA-Z]+)$", lambda mm: {
                    "n": "e-9", "u": "e-6", "m": "e-3", "k": "e3",
                    "p": "e-12", "f": "e-15"}.get(mm.group(1), ""), val))
            except ValueError:
                # expression like '2*N_X' or 'VDD_NOM*vdd_scale' -> keep expr
                params[name] = val
    return params


def eval_num(v, params, depth=0):
    if isinstance(v, float):
        return v
    if depth > 3:
        return None
    # simple expr: number | name | a*b
    v = v.strip("'")
    try:
        return float(v)
    except ValueError:
        pass
    m = re.match(r"^([\d\.eE+-]+)\*(\w+)$", v)
    if m:
        base = eval_num(params.get(m.group(2), None), params, depth + 1)
        return None if base is None else float(m.group(1)) * base
    v2 = eval_num(params.get(v, None), params, depth + 1)
    return v2


def devices_of(cell_text):
    """Extract (name, L_expr, NFIN_expr) for each N-element in the cell."""
    devs = []
    for m in re.finditer(r"^(N\w+)\s+\S+\s+\S+\s+\S+\s+\S+\s+(\w+)\s+"
                         r"L=(\S+)\s+NFIN=(\S+)", cell_text, re.M):
        devs.append((m.group(1), m.group(3), m.group(4)))
    return devs


def sigma_for(l_um, nfin):
    return SIG_VT / math.sqrt(WEFF_UM * l_um * nfin)


def gen(circuit):
    tb = (ROOT / "circuits" / circuit / "tb_asap7.sp").read_text()
    cell = (ROOT / "circuits" / circuit / "circuit_asap7.cir").read_text()
    params = parse_params(tb)

    vout_node, maxload, minload = CFG[circuit]

    # keep everything before .control, dropping extra instances/sources
    head = []
    for line in tb.splitlines():
        if line.strip().lower().startswith(".control"):
            break
        if DROP.match(line.strip()):
            continue
        ls = line.strip().lower()
        if ls.startswith("* psrr") or ls.startswith("* dc all"):
            continue
        line = clean_nodeset(line)
        if line.strip():
            head.append(line)

    # per-device sigma
    sig_lines, alt_lines = [], []
    for name, lexpr, nexpr in devices_of(cell):
        l_um = eval_num(params.get(lexpr.strip("{}"), lexpr), params) * 1e6
        nfin = eval_num(params.get(nexpr.strip("{}'"), nexpr), params)
        sg = sigma_for(l_um, nfin)
        sig_lines.append(f"* {name}: L={l_um:.4g}um NFIN={nfin:.4g}\n"
                         f"let sg_{name.lower()} = {sg:.4e}")
        alt_lines.append(f"  alter @n.x1.{name.lower()}[delvtrand] = "
                         f"sg_{name.lower()}*sgauss(0)")

    ctrl = f"""
.control
pre_osdi ../../asap7_pdk/models/ngspice/bsimcmg_va.osdi
set seed=1234
set units=degrees
let NRUN = 200

* per-device Vth-mismatch sigma (Pelgrom-style assumption, see header;
* refreshed by benchmark/run_mc_baseline.py when sizes change)
""" + "\n".join(sig_lines) + """

let run = 0
while run < NRUN
  * draw per-device mismatch for this sample
""" + "\n".join(alt_lines) + f"""

  alter Iload1 dc={maxload}
  op
  let vout_max = v({vout_node})
  let iq_max = abs(i(v1))
  echo "MCRES $&run vout_max $&vout_max iq_max $&iq_max"
  ac dec 10 0.1 1G
  meas ac dcgain1 find vdb({vout_node}) at = 0.1
  meas ac ugf1 when vdb({vout_node})=0
  meas ac pm1 find vp({vout_node}) when vdb({vout_node})=0
  echo "MCRES $&run dcgain1 $&dcgain1 ugf1 $&ugf1 pm1 $&pm1"

  alter Iload1 dc={minload}
  op
  let vout_min = v({vout_node})
  let iq_min = abs(i(v1))
  echo "MCRES $&run vout_min $&vout_min iq_min $&iq_min"
  ac dec 10 0.1 1G
  meas ac dcgain2 find vdb({vout_node}) at = 0.1
  meas ac ugf2 when vdb({vout_node})=0
  meas ac pm2 find vp({vout_node}) when vdb({vout_node})=0
  echo "MCRES $&run dcgain2 $&dcgain2 ugf2 $&ugf2 pm2 $&pm2"
  let run = run + 1
end
.endc

.end
"""
    out = ROOT / "circuits" / circuit / "tb_asap7_mc.sp"
    header = head
    out.write_text("\n".join(header) + ctrl)
    print(f"{circuit}: {len(sig_lines)} devices -> {out}")


for c in CFG:
    gen(c)
