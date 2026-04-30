#!/usr/bin/env python3
"""
Example: Bayesian Optimization demo using the NgspiceBenchmark framework.

Usage:
    python example_bo.py [config_file]

Examples:
    python example_bo.py circuits/ptm180nm_opamp/config.json
    python example_bo.py circuits/gh_autockt_opamp/config.json
"""
import sys
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ngspice_benchmark import NgspiceBenchmark


def run_bo_demo(config_path: str = "circuits/ptm180nm_opamp/config.json"):
    """Run a quick BO demo on the specified benchmark config."""
    bench = NgspiceBenchmark.from_config(config_path)

    print(f"Circuit: {bench.name}")
    print(f"Design variables ({bench.dim}):")
    for i, name in enumerate(bench.names):
        print(f"  {name}: default={bench.defaults[i]:.3f}, range=[{bench.lb[i]:.3f}, {bench.ub[i]:.3f}]")
    print(f"Specs: {bench.specs}")
    print()

    # Evaluate default design point
    x0 = bench.default_design_point()
    metrics = bench.evaluate(x0)
    obj0 = bench.objective_fn(metrics)

    print("=== Default Design Point ===")
    for k, v in metrics.items():
        if not k.startswith("_"):
            print(f"  {k}: {v}")
    print(f"  Objective: {obj0:.4f}")
    print(f"  Meets specs: {bench.meets_specs(metrics)}")
    print()

    if bench.dim == 0:
        print("No design variables (fixed-size circuit). Skipping random search.")
        return

    # Try a few random designs
    print("=== Random Design Points ===")
    rng = np.random.default_rng(42)
    best_obj = obj0
    best_x = x0.copy()
    for i in range(5):
        x = rng.random(bench.dim)
        obj = bench.objective(x)
        print(f"  Random {i+1}: obj={obj:.4f}")
        if obj < best_obj:
            best_obj = obj
            best_x = x.copy()

    print(f"\nBest found: obj={best_obj:.4f}")
    print(f"Simulations: {bench.sim_count}, Total time: {bench.sim_time:.1f}s")


if __name__ == "__main__":
    config = sys.argv[1] if len(sys.argv) > 1 else "circuits/ptm180nm_opamp/config.json"
    run_bo_demo(config)
