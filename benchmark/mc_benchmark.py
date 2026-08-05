#!/usr/bin/env python3
"""MC-aware sizing benchmark driver for the five ASAP7 LDOs.

Given a design point x (normalized [0,1] over the design space defined in
each circuit's config_asap7.json), this driver:

  1. injects the sizing parameters into the circuit's tb_asap7_mc.sp
     (.param lines), preserving unit suffixes;
  2. recomputes the per-device Vth-mismatch sigmas (the `let sg_*` lines)
     from the NEW sizes, using the same Pelgrom-style assumption as
     gen_mc_tb.py:  sigma_i = SIG_VT / sqrt(WEFF_UM * L_um * NFIN);
  3. runs K mismatch-Monte-Carlo samples, split into chunks that are
     simulated in parallel (each chunk is one ngspice process with its own
     derived seed -> common random numbers across design points);
  4. reduces the samples to per-spec sigma-margins (mu - L)/sigma and a
     scalar FOM = soft-min of the margins (log-sum-exp), minus a penalty
     proportional to the fraction of failed (non-converged) samples.

Protocols
---------
* Training objective:  K ~ 25-30 samples, master seed TRAIN_SEED (CRN).
* Validation:          N ~ 500 samples, independent seed VALIDATION_SEED,
                       reports yield with Wilson score interval.

Usage (CLI):
    python3 benchmark/mc_benchmark.py ldo_simple                 # default point, train FOM
    python3 benchmark/mc_benchmark.py ldo_simple --x 0.5,0.4,... # arbitrary point
    python3 benchmark/mc_benchmark.py ldo_simple --validate      # 500-sample validation

Usage (Python API, for optimizer integration):
    import sys; sys.path.insert(0, "benchmark")
    from mc_benchmark import MCBenchmark
    b = MCBenchmark("ldo_simple", K=30)
    names, lb, ub = b.get_design_space()     # search space (physical units)
    f = b.objective(x_normalized)            # scalar, MINIMIZE this
    info = b.evaluate(x_normalized)          # full statistics dict

Requires the docker wrapper on PATH (asap7_pdk/bin); the driver prepends it
to PATH for its own subprocesses automatically.
"""
import argparse
import concurrent.futures as cf
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_mc_tb import parse_params, eval_num, sigma_for, devices_of  # noqa: E402
from run_mc_baseline import SPECS, METRICS, parse_mcres, stats, margin  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent

TRAIN_SEED = 424242        # CRN master seed for the training objective
VALIDATION_SEED = 987654   # independent seed for final validation
FAIL_PENALTY = 10.0        # FOM penalty per unit fraction of failed samples
CIRCUITS = list(SPECS.keys())


def softmin(values, tau):
    """Smooth minimum: -tau * log(mean(exp(-v/tau))). Always <= min(values)."""
    m = min(values)
    return m - tau * math.log(sum(math.exp(-(v - m) / tau) for v in values)
                              / len(values))


def wilson_ci(k, n, z=1.96):
    """Wilson score interval for a binomial proportion (default ~95%)."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    center = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (max(0.0, center - half), min(1.0, center + half))


class MCBenchmark:
    """MC-aware sizing benchmark for one circuit."""

    def __init__(self, circuit, K=30, seed=TRAIN_SEED, chunks=6,
                 workers=None, tau=0.5, fail_penalty=FAIL_PENALTY):
        if circuit not in SPECS:
            raise ValueError(f"unknown circuit {circuit!r}; choose from {CIRCUITS}")
        self.circuit = circuit
        self.K = K
        self.seed = seed
        self.chunks = max(1, min(chunks, K))
        self.workers = workers or self.chunks
        self.tau = tau
        self.fail_penalty = fail_penalty
        self.specs = SPECS[circuit]

        self.circ_dir = ROOT / "circuits" / circuit
        self.tb_text = (self.circ_dir / "tb_asap7_mc.sp").read_text()
        cell_text = (self.circ_dir / "circuit_asap7.cir").read_text()
        self.devices = devices_of(cell_text)
        self.base_params = parse_params(self.tb_text)

        cfg = json.loads((self.circ_dir / "config_asap7.json").read_text())
        self.names = list(cfg["design_vars"].keys())
        vals = np.array([cfg["design_vars"][n] for n in self.names], dtype=float)
        self.defaults, self.lb, self.ub = vals[:, 0], vals[:, 1], vals[:, 2]

        # unit suffix of each design var as written in the TB .param lines
        self.unit_map = {}
        for line in self.tb_text.splitlines():
            if not line.strip().lower().startswith(".param"):
                continue
            for name in self.names:
                m = re.search(rf'\b{re.escape(name)}\s*=\s*([-\d\.eE]+)(\w*)',
                              line, re.IGNORECASE)
                if m:
                    self.unit_map[name] = m.group(2)

    # ---- design space helpers -------------------------------------------

    def get_design_space(self):
        """Return (names, lb, ub) in physical units."""
        return self.names, self.lb.copy(), self.ub.copy()

    def _denormalize(self, x):
        x = np.clip(np.asarray(x, dtype=float), 0.0, 1.0)
        vals = self.lb + x * (self.ub - self.lb)
        return {n: float(v) for n, v in zip(self.names, vals)}

    def normalize(self, params):
        return np.array([(params[n] - l) / (u - l)
                         for n, l, u in zip(self.names, self.lb, self.ub)])

    def default_design_point(self):
        """Normalized default (TT-optimized) design point."""
        return (self.defaults - self.lb) / (self.ub - self.lb)

    # ---- testbench construction ------------------------------------------

    def build_tb(self, params, nrun, seed):
        """Render the MC testbench for one design point.

        Injects .param values and refreshes the per-device sigma lines so
        the mismatch spread tracks the NEW sizes.
        """
        out = []
        for line in self.tb_text.splitlines():
            if line.strip().lower().startswith(".param"):
                for name in self.names:
                    if name not in params:
                        continue
                    unit = self.unit_map.get(name, "")
                    line = re.sub(
                        rf'\b{re.escape(name)}\s*=\s*[-\d\.eE]+\w*',
                        f"{name}={params[name]:.6g}{unit}",
                        line, count=1, flags=re.IGNORECASE)
            out.append(line)
        text = "\n".join(out)

        # per-device mismatch sigma from the NEW sizes
        merged = dict(self.base_params)
        merged.update(params)
        for name, lexpr, nexpr in self.devices:
            l_um = eval_num(merged.get(lexpr.strip("{}"), lexpr.strip("{}")),
                            merged) * 1e6
            nfin = eval_num(merged.get(nexpr.strip("{}'"), nexpr.strip("{}'")),
                            merged)
            sg = sigma_for(l_um, nfin)
            text, nsub = re.subn(rf"let sg_{name.lower()} = [\d\.eE+-]+",
                                 f"let sg_{name.lower()} = {sg:.4e}", text)
            if nsub != 1:
                raise RuntimeError(f"sg line for device {name} not found in TB")

        text = re.sub(r"let NRUN = \d+", f"let NRUN = {nrun}", text)
        text = re.sub(r"set seed=\d+", f"set seed={seed}", text)
        return text

    # ---- simulation --------------------------------------------------------

    def _run_chunk(self, tb_text, chunk_idx, nsamples, seed):
        text = re.sub(r"let NRUN = \d+", f"let NRUN = {nsamples}", tb_text)
        text = re.sub(r"set seed=\d+", f"set seed={seed}", text)
        tmp = self.circ_dir / f".mcbench_{os.getpid()}_{chunk_idx}.sp"
        tmp.write_text(text)
        env = dict(os.environ)
        env["PATH"] = str(ROOT / "asap7_pdk" / "bin") + os.pathsep + env["PATH"]
        try:
            r = subprocess.run(["ngspice", "-b", tmp.name], cwd=self.circ_dir,
                               capture_output=True, text=True, timeout=2400,
                               env=env)
        finally:
            tmp.unlink(missing_ok=True)
        return parse_mcres(r.stdout + "\n" + r.stderr)

    def run_mc(self, x, nrun=None, seed=None):
        """Run the MC loop for design point x; return the raw sample list."""
        nrun = nrun or self.K
        seed = self.seed if seed is None else seed
        tb_text = self.build_tb(self._denormalize(x), nrun, seed)

        # split into chunks; chunk c uses seed+c -> CRN across design points
        base, rem = divmod(nrun, self.chunks)
        sizes = [base + (1 if c < rem else 0) for c in range(self.chunks)]
        sizes = [s for s in sizes if s > 0]
        samples = []
        with cf.ThreadPoolExecutor(max_workers=min(self.workers, len(sizes))) as ex:
            futs = [ex.submit(self._run_chunk, tb_text, c, s, seed + c)
                    for c, s in enumerate(sizes)]
            for f in futs:
                samples.extend(f.result())
        return samples

    # ---- statistics / FOM ---------------------------------------------------

    def compute_stats(self, samples, nrun):
        """Reduce raw samples to margins, yield estimate and the scalar FOM."""
        res = {"circuit": self.circuit, "n_requested": nrun,
               "n_samples": len(samples), "metrics": {}, "specs": {}}
        for m in METRICS:
            st = stats([s.get(m, float("nan")) for s in samples])
            if st is None:
                continue
            res["metrics"][m] = st
        margins = []
        for name, op, bound in self.specs:
            st = res["metrics"].get(name)
            if st is None:  # metric never measured -> treat as total failure
                continue
            mg = margin(op, bound, st["mean"], st["sigma"])
            res["specs"][name] = {"op": op, "bound": bound, "sigma_margin": mg}
            margins.append(mg)
        npass = 0
        for s in samples:
            ok = True
            for name, op, b in self.specs:
                v = s.get(name, float("nan"))
                if v != v or (op == ">" and v <= b) or (op == "<" and v >= b):
                    ok = False
                    break
            npass += ok
        fail_frac = 1.0 - len(samples) / nrun if nrun else 1.0
        res["n_pass"] = npass
        res["yield_estimate"] = npass / nrun if nrun else 0.0
        res["fail_fraction"] = fail_frac
        res["min_sigma_margin"] = min(margins) if margins else float("-inf")
        sm = softmin(margins, self.tau) if margins else -10.0
        res["fom"] = sm - self.fail_penalty * fail_frac
        return res

    def evaluate(self, x):
        """Full train-protocol evaluation of design point x (dict)."""
        samples = self.run_mc(x)
        res = self.compute_stats(samples, self.K)
        res["seed"] = self.seed
        return res

    def objective(self, x):
        """Scalar objective for optimizers: MINIMIZE this (= -FOM)."""
        return -self.evaluate(x)["fom"]

    # ---- validation ----------------------------------------------------------

    def validate(self, x, nrun=500, seed=VALIDATION_SEED):
        """Independent validation: fresh seed, large sample count, Wilson CI."""
        samples = self.run_mc(x, nrun=nrun, seed=seed)
        res = self.compute_stats(samples, nrun)
        lo, hi = wilson_ci(res["n_pass"], nrun)
        res.update({"seed": seed, "nrun": nrun,
                    "yield_wilson95": [lo, hi]})
        return res


def parse_x(arg, n):
    vals = [float(v) for v in arg.split(",")]
    if len(vals) != n:
        raise SystemExit(f"--x expects {n} comma-separated values, got {len(vals)}")
    return np.array(vals)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("circuit", choices=CIRCUITS)
    ap.add_argument("--x", default=None,
                    help="comma-separated normalized design point (default: "
                         "the TT-optimized default point)")
    ap.add_argument("--K", type=int, default=30, help="MC samples (train)")
    ap.add_argument("--seed", type=int, default=TRAIN_SEED)
    ap.add_argument("--chunks", type=int, default=6)
    ap.add_argument("--workers", type=int, default=None)
    ap.add_argument("--tau", type=float, default=0.5,
                    help="soft-min temperature")
    ap.add_argument("--validate", action="store_true",
                    help="independent validation instead of train FOM")
    ap.add_argument("--nrun", type=int, default=500,
                    help="validation sample count")
    ap.add_argument("--val-seed", type=int, default=VALIDATION_SEED)
    ap.add_argument("--out", default=None, help="write result JSON here")
    args = ap.parse_args()

    b = MCBenchmark(args.circuit, K=args.K, seed=args.seed,
                    chunks=args.chunks, workers=args.workers, tau=args.tau)
    x = parse_x(args.x, len(b.names)) if args.x else b.default_design_point()

    if args.validate:
        res = b.validate(x, nrun=args.nrun, seed=args.val_seed)
    else:
        res = b.evaluate(x)
    res["x_normalized"] = [round(float(v), 6) for v in x]
    res["params"] = b._denormalize(x)

    txt = json.dumps(res, indent=1)
    if args.out:
        Path(args.out).write_text(txt)
    print(txt)


if __name__ == "__main__":
    main()
