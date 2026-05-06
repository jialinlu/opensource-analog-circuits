#!/usr/bin/env python3
"""
合并各电路的算法对比结果到 algorithm_results.json
"""
import json
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
RESULTS_DIR = REPO_ROOT / "results"
OUTPUT_PATH = REPO_ROOT / "docs" / "data" / "algorithm_results.json"

def main():
    results = {}
    
    for result_file in RESULTS_DIR.glob("*_bo.json"):
        with open(result_file) as f:
            data = json.load(f)
        circuit = data["circuit"]
        if circuit not in results:
            results[circuit] = {
                "dim": data["dim"],
                "max_evals": data["max_evals"],
                "algorithms": {},
            }
        for algo, res in data["algorithms"].items():
            results[circuit]["algorithms"][algo] = {
                "best_obj": res["best_obj"],
                "best_metrics": res["best_metrics"],
                "total_evals": res["total_evals"],
                "total_time": res["total_time"],
                "wall_time": res["wall_time"],
                "history": res["history"],
            }
    
    for result_file in RESULTS_DIR.glob("*_hebo.json"):
        with open(result_file) as f:
            data = json.load(f)
        circuit = data["circuit"]
        if circuit not in results:
            results[circuit] = {
                "dim": data["dim"],
                "max_evals": data["max_evals"],
                "algorithms": {},
            }
        for algo, res in data["algorithms"].items():
            results[circuit]["algorithms"][algo] = {
                "best_obj": res["best_obj"],
                "best_metrics": res["best_metrics"],
                "total_evals": res["total_evals"],
                "total_time": res["total_time"],
                "wall_time": res["wall_time"],
                "history": res["history"],
            }
    
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"Merged {len(results)} circuits into {OUTPUT_PATH}")
    for c, data in results.items():
        print(f"  {c}: {list(data['algorithms'].keys())}")

if __name__ == "__main__":
    main()
