#!/usr/bin/env python3
"""
ASAP7 LDO sizing 优化驱动：基于 blackbox-optimizer (BO) + NgspiceBenchmark。

用法：
    PYTHONPATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/third_party \
    PATH=/Users/lujialin/lujialin/mc_sizing/opensource-circuits/asap7_pdk/bin:$PATH \
    python run_asap7_opt.py circuits/ldo_1/config_asap7.json --max_evals 60 --write_back
"""
import sys
import re
import json
import argparse
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ngspice_benchmark import NgspiceBenchmark
from blackbox import BlackBoxOptimizer, DesignSpace, Objective


def write_back_params(bench, params: dict, round_int_prefixes=("N_", "M_")):
    """把最优参数写回 circuit_asap7.cir 的 .param 行。"""
    path = bench.circuit_file
    lines = path.read_text().splitlines()
    out = []
    for line in lines:
        if line.strip().lower().startswith(".param"):
            for name, val in params.items():
                pat = rf'\b{re.escape(name)}\s*=\s*[-\d\.eE]+\w*'
                if re.search(pat, line):
                    if any(name.startswith(p) for p in round_int_prefixes):
                        v = int(round(val))
                        rep = f"{name}={v}"
                    elif abs(val) < 1e-3:
                        rep = f"{name}={val:.3e}"
                    else:
                        rep = f"{name}={val:.4g}"
                    line = re.sub(pat, rep, line, count=1)
        out.append(line)
    path.write_text("\n".join(out) + "\n")
    print(f"Best params written back to {path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("config")
    ap.add_argument("--max_evals", type=int, default=60)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--algorithm", default="bo")
    ap.add_argument("--write_back", action="store_true")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    bench = NgspiceBenchmark.from_config(args.config)
    print(f"Circuit: {bench.name} ({bench.dim}D)")

    space = DesignSpace()
    for name in bench.names:
        d, lb, ub = bench.design_vars[name]
        log = lb > 0 and ub / lb > 50
        space.add_continuous(name, lb, ub, log_scale=log)
    opt = BlackBoxOptimizer(space, Objective("obj", minimize=True),
                            algorithm=args.algorithm,
                            max_evals=args.max_evals + 1, seed=args.seed)

    def eval_params(params):
        x = bench.normalize(params)
        m = bench.evaluate(x)
        return bench.objective_fn(m), m

    # warm start：默认设计点
    p0 = {n: float(bench.defaults[i]) for i, n in enumerate(bench.names)}
    obj0, m0 = eval_params(p0)
    opt.observe(p0, {"obj": obj0})
    print(f"[default] obj={obj0:.4f} metrics={{k: v for k, v in m0.items() if not k.startswith('_')}}")
    print(f"[default] {m0}")

    best_obj = obj0
    best_params = dict(p0)
    best_m = m0
    hist_path = Path(f"results/{bench.name}_hist.jsonl")
    with hist_path.open("w") as hf:
        hf.write(json.dumps({"iter": -1, "obj": obj0, "params": p0,
                             "metrics": {k: v for k, v in m0.items() if not k.startswith('_')}}) + "\n")
        for i in range(args.max_evals):
            params = opt.suggest()
            try:
                o, m = eval_params(params)
            except Exception as e:
                print(f"[{i}] eval failed: {e}")
                o, m = 5000.0, {}
            opt.observe(params, {"obj": o})
            tag = " *" if o < best_obj else ""
            if o < best_obj:
                best_obj = o
                best_params = dict(params)
                best_m = m
            print(f"[{i}] obj={o:.4f}{tag} { {k: round(v, 4) for k, v in m.items() if not k.startswith('_')} }", flush=True)
            hf.write(json.dumps({"iter": i, "obj": o, "params": params,
                                 "metrics": {k: v for k, v in m.items() if not k.startswith('_')}}) + "\n")

    print("\n=== BEST (driver-tracked) ===")
    print(f"obj={best_obj}")
    print(json.dumps(best_params, indent=1))

    out = args.out or f"results/{bench.name}_opt.json"
    Path(out).write_text(json.dumps({
        "circuit": bench.name,
        "best_obj": best_obj,
        "best_params": best_params,
        "best_metrics": {k: v for k, v in best_m.items() if not k.startswith('_')},
        "sim_count": bench.sim_count,
    }, indent=1))

    if args.write_back:
        write_back_params(bench, best_params)


if __name__ == "__main__":
    main()
