#!/usr/bin/env python3
"""Run mismatch Monte Carlo baseline for the ASAP7 LDOs.

For each circuit: run tb_asap7_mc.sp (NRUN samples, fixed seed -> CRN
reproducible), parse MCRES lines, and report per-metric mean / sigma /
min / max, sigma-margin against the spec set, and the all-specs yield.

Usage:
    PATH=<repo>/asap7_pdk/bin:$PATH python3 benchmark/run_mc_baseline.py \
        [--circuits ldo_1,ldo_2] [--nrun 200] [--seed 1234]
"""
import sys
import re
import json
import math
import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# spec set per circuit: (metric, ">", lower_bound)
SPECS = {
    "ldo_1":              [("vout_max", ">", 0.40), ("dcgain1", ">", 40),
                           ("ugf1", ">", 1e6), ("pm1", ">", 45), ("pm2", ">", 45)],
    "ldo_2":              [("vout_max", ">", 0.38), ("dcgain1", ">", 40),
                           ("ugf1", ">", 1e6), ("pm1", ">", 45), ("pm2", ">", 45)],
    "ldo_simple":         [("vout_max", ">", 0.35), ("dcgain1", ">", 40),
                           ("ugf1", ">", 1e6), ("pm1", ">", 45), ("pm2", ">", 45)],
    "ldo_folded_cascode": [("vout_max", ">", 0.35), ("dcgain1", ">", 40),
                           ("ugf1", ">", 1e6), ("pm1", ">", 45), ("pm2", ">", 45)],
    "ldo_tb":             [("vout_max", ">", 0.42), ("dcgain1", ">", 40),
                           ("ugf1", ">", 1e6), ("pm1", ">", 45), ("pm2", ">", 45)],
}

METRICS = ["vout_max", "vout_min", "iq_max", "iq_min",
           "dcgain1", "ugf1", "pm1", "dcgain2", "ugf2", "pm2"]


def parse_mcres(log_text):
    """Parse 'MCRES <run> name val name val ...' lines into samples."""
    samples = {}
    for line in log_text.splitlines():
        if not line.startswith("MCRES"):
            continue
        parts = line.split()
        try:
            run = int(parts[1])
        except (IndexError, ValueError):
            continue
        s = samples.setdefault(run, {})
        for i in range(2, len(parts) - 1, 2):
            try:
                s[parts[i]] = float(parts[i + 1])
            except ValueError:
                s[parts[i]] = float("nan")
    return [samples[k] for k in sorted(samples)]


def stats(values):
    v = [x for x in values if x == x]  # drop NaN
    if not v:
        return None
    mu = sum(v) / len(v)
    sd = math.sqrt(sum((x - mu) ** 2 for x in v) / len(v)) if len(v) > 1 else 0.0
    return {"mean": mu, "sigma": sd, "min": min(v), "max": max(v), "n": len(v)}


def margin(op, bound, mu, sd):
    if sd <= 0:
        sd = 1e-12
    return (mu - bound) / sd if op == ">" else (bound - mu) / sd


def run_circuit(circuit, nrun, seed):
    tb = ROOT / "circuits" / circuit / "tb_asap7_mc.sp"
    txt = tb.read_text()
    txt = re.sub(r"let NRUN = \d+", f"let NRUN = {nrun}", txt)
    txt = re.sub(r"set seed=\d+", f"set seed={seed}", txt)
    tmp = ROOT / "circuits" / circuit / f".mc_run_{seed}.sp"
    tmp.write_text(txt)
    try:
        r = subprocess.run(["ngspice", "-b", tmp.name], cwd=tb.parent,
                           capture_output=True, text=True, timeout=3600)
    finally:
        tmp.unlink(missing_ok=True)
    return r.stdout + r.stderr


def report(circuit, samples, nrun):
    specs = SPECS[circuit]
    print(f"\n=== {circuit} ({len(samples)} samples) ===")
    print(f"{'metric':10s} {'mean':>12s} {'sigma':>12s} {'min':>12s} "
          f"{'max':>12s} {'margin':>8s}")
    res = {"n_samples": len(samples), "metrics": {}, "specs": {}, "yield": None}
    for m in METRICS:
        st = stats([s.get(m, float("nan")) for s in samples])
        if st is None:
            continue
        res["metrics"][m] = st
        line = (f"{m:10s} {st['mean']:12.4g} {st['sigma']:12.4g} "
                f"{st['min']:12.4g} {st['max']:12.4g}")
        for name, op, b in specs:
            if name == m:
                mg = margin(op, b, st["mean"], st["sigma"])
                res["specs"][m] = {"op": op, "bound": b, "sigma_margin": mg}
                line += f" {mg:8.2f}"
        print(line)
    npass = 0
    for s in samples:
        ok = True
        for name, op, b in specs:
            v = s.get(name, float("nan"))
            if v != v or (op == ">" and v <= b) or (op == "<" and v >= b):
                ok = False
                break
        npass += ok
    n_missing = nrun - len(samples)
    y = npass / nrun if nrun else 0.0
    res["yield"] = y
    res["n_pass"] = npass
    worst = min((v["sigma_margin"] for v in res["specs"].values()), default=None)
    res["min_sigma_margin"] = worst
    if n_missing > 0:
        print(f"(missing/failed samples counted as fail: {n_missing})")
    print(f"min sigma-margin: {worst:.2f}   yield: {npass}/{nrun} = {y:.3f}")
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--circuits", default="ldo_1,ldo_2,ldo_simple,ldo_folded_cascode,ldo_tb")
    ap.add_argument("--nrun", type=int, default=200)
    ap.add_argument("--seed", type=int, default=1234)
    args = ap.parse_args()

    out = {}
    for c in args.circuits.split(","):
        c = c.strip()
        log = run_circuit(c, args.nrun, args.seed)
        samples = parse_mcres(log)
        res = report(c, samples, args.nrun)
        res["seed"] = args.seed
        out[c] = res
        (ROOT / "results" / f"{c}_mc_baseline.json").write_text(
            json.dumps(res, indent=1))
    print("\n=== SUMMARY ===")
    for c, r in out.items():
        print(f"{c:22s} min_margin={r['min_sigma_margin']:6.2f}  yield={r['yield']:.3f}")


if __name__ == "__main__":
    main()
