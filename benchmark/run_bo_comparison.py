#!/usr/bin/env python3
"""
运行 BO 算法（TuRBO + HEBO）与 GA 在 benchmark 电路上的对比实验。

用法：
    source ../../bo_env/bin/activate
    python run_bo_comparison.py circuits/ptm180nm_opamp/config.json --max_evals 30
"""
import sys
import json
import time
import argparse
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from ngspice_benchmark import NgspiceBenchmark


def run_ga(bench, max_evals=30, seed=42):
    """运行 GA 作为对比基线。"""
    from example_ga import RealCodedGA

    # 设置 pop_size 使得总评估次数接近 max_evals
    # 比如 pop=10, gen=3 => 30 evals (含初始评估)
    pop_size = min(max_evals // 3, 20)
    n_generations = max_evals // pop_size
    if n_generations < 2:
        pop_size = max_evals // 2
        n_generations = 2

    ga = RealCodedGA(
        benchmark=bench,
        pop_size=pop_size,
        n_generations=n_generations,
        seed=seed,
    )
    best_x, best_obj = ga.run(verbose=False)

    # 收集收敛历史
    history = []
    for i, obj in enumerate(ga.best_obj_per_gen):
        history.append({"eval": (i + 1) * pop_size, "best_obj": obj})

    return {
        "best_obj": best_obj,
        "best_metrics": bench.evaluate(best_x),
        "total_evals": bench.sim_count,
        "total_time": bench.sim_time,
        "history": history,
    }


def run_turbo(bench, max_evals=30, seed=42):
    """运行 TuRBO-1。"""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "TuRBO"))
    from turbo import Turbo1

    dim = bench.dim
    lb = np.zeros(dim)
    ub = np.ones(dim)
    n_init = max(4, 2 * dim)
    if n_init >= max_evals:
        n_init = max_evals // 2

    rng = np.random.default_rng(seed)
    np.random.seed(seed)

    # 记录每次评估的历史
    eval_history = []

    def f(x):
        obj = bench.objective(x)
        eval_history.append({"obj": obj, "metrics": {}})
        return obj

    turbo = Turbo1(
        f=f,
        lb=lb,
        ub=ub,
        n_init=n_init,
        max_evals=max_evals,
        batch_size=1,
        verbose=False,
    )
    turbo.optimize()

    # 构建收敛历史
    best_so_far = np.minimum.accumulate(turbo.fX.ravel())
    history = [{"eval": i + 1, "best_obj": float(best_so_far[i])} for i in range(len(best_so_far))]

    best_idx = np.argmin(turbo.fX)
    best_x = turbo.X[best_idx]
    best_obj = float(turbo.fX[best_idx])

    return {
        "best_obj": best_obj,
        "best_metrics": bench.evaluate(best_x),
        "total_evals": bench.sim_count,
        "total_time": bench.sim_time,
        "history": history,
    }


def run_hebo(bench, max_evals=30, seed=42):
    """运行 HEBO。"""
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "hebo_clone" / "HEBO"))
    from hebo.design_space.design_space import DesignSpace
    from hebo.optimizers.hebo import HEBO
    import warnings
    warnings.filterwarnings("ignore")

    dim = bench.dim
    params = [
        {"name": f"x{i}", "type": "num", "lb": 0.0, "ub": 1.0}
        for i in range(dim)
    ]
    space = DesignSpace().parse(params)
    opt = HEBO(space, model_name="gp", rand_sample=max(2, dim))

    np.random.seed(seed)

    history = []
    for i in range(max_evals):
        rec = opt.suggest(n_suggestions=1)
        x = rec[[f"x{i}" for i in range(dim)]].values[0]
        obj = bench.objective(x)
        opt.observe(rec, np.array([[obj]]))
        best_so_far = opt.y.min()
        history.append({"eval": i + 1, "best_obj": float(best_so_far)})

    best_idx = np.argmin(opt.y)
    best_x = opt.X.iloc[best_idx][[f"x{i}" for i in range(dim)]].values.astype(float)
    best_obj = float(opt.y.min())

    return {
        "best_obj": best_obj,
        "best_metrics": bench.evaluate(best_x),
        "total_evals": bench.sim_count,
        "total_time": bench.sim_time,
        "history": history,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("config", help="Path to circuit config.json")
    parser.add_argument("--max_evals", type=int, default=30, help="Max function evaluations")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output", default="bo_results.json", help="Output JSON file")
    parser.add_argument("--algorithms", default="ga,turbo,hebo", help="Comma-separated list of algorithms")
    args = parser.parse_args()

    bench = NgspiceBenchmark.from_config(args.config)
    circuit_name = bench.name
    print(f"Circuit: {circuit_name} ({bench.dim}D)")
    print(f"Max evals: {args.max_evals}")

    results = {
        "circuit": circuit_name,
        "dim": bench.dim,
        "max_evals": args.max_evals,
        "seed": args.seed,
        "algorithms": {},
    }

    algorithms = args.algorithms.split(",")

    for algo in algorithms:
        algo = algo.strip().lower()
        print(f"\n{'='*50}")
        print(f"Running {algo.upper()}...")
        t0 = time.time()

        try:
            if algo == "ga":
                res = run_ga(bench, args.max_evals, args.seed)
            elif algo == "turbo":
                res = run_turbo(bench, args.max_evals, args.seed)
            elif algo == "hebo":
                res = run_hebo(bench, args.max_evals, args.seed)
            else:
                print(f"Unknown algorithm: {algo}")
                continue
        except Exception as e:
            print(f"ERROR running {algo}: {e}")
            import traceback
            traceback.print_exc()
            continue

        elapsed = time.time() - t0
        res["wall_time"] = elapsed

        # 清理 metrics 中的内部字段
        if "_elapsed" in res["best_metrics"]:
            del res["best_metrics"]["_elapsed"]
        if "_sim_success" in res["best_metrics"]:
            del res["best_metrics"]["_sim_success"]

        results["algorithms"][algo] = res
        print(f"Best obj: {res['best_obj']:.6f}")
        print(f"Total evals: {res['total_evals']}")
        print(f"Sim time: {res['total_time']:.1f}s")
        print(f"Wall time: {elapsed:.1f}s")

    # 保存结果
    with open(args.output, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to {args.output}")


if __name__ == "__main__":
    main()
