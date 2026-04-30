#!/usr/bin/env python3
"""
Unified Ngspice Benchmark Framework for Open-Source Analog Circuits.

Provides a generic interface for circuit sizing optimization algorithms.
Supports arbitrary ngspice circuits with parameterized design variables.
"""
import os
import re
import json
import time
import shutil
import subprocess
import tempfile
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Callable


class NgspiceBenchmark:
    """
    Generic benchmark interface for ngspice-based analog circuits.

    Usage:
        bench = NgspiceBenchmark.from_config("configs/gh_opamp.json")
        x = bench.default_design_point()  # normalized [0,1]
        metrics = bench.evaluate(x)
        obj = bench.objective(metrics)
    """

    def __init__(
        self,
        name: str,
        circuit_file: str,
        design_vars: Dict[str, Tuple[float, float, float]],
        metrics_parser: Callable[[str], Dict],
        objective_fn: Callable[[Dict], float],
        specs: Optional[Dict[str, Tuple[str, float]]] = None,
        working_dir: Optional[str] = None,
        pdk_corner: str = "tt",
    ):
        """
        Args:
            name: circuit identifier
            circuit_file: path to main .cir/.spice/.sp file
            design_vars: {name: (default, lb, ub)}
            metrics_parser: function(log_text) -> metrics dict
            objective_fn: function(metrics) -> scalar (lower=better)
            specs: {metric_name: ("<" or ">", target_value)}
            working_dir: temp dir for simulation
            pdk_corner: sky130 corner (tt, ss, ff, sf, fs)
        """
        self.name = name
        self.circuit_file = Path(circuit_file).resolve()
        self.design_vars = design_vars
        self.metrics_parser = metrics_parser
        self.objective_fn = objective_fn
        self.specs = specs or {}
        self.working_dir = working_dir
        self.pdk_corner = pdk_corner

        self.names = list(design_vars.keys())
        self.defaults = np.array([design_vars[n][0] for n in self.names], dtype=float)
        self.lb = np.array([design_vars[n][1] for n in self.names], dtype=float)
        self.ub = np.array([design_vars[n][2] for n in self.names], dtype=float)
        self.dim = len(self.names)

        self.sim_count = 0
        self.sim_time = 0.0

    @classmethod
    def from_config(cls, config_path: str):
        """Load benchmark from JSON config file."""
        config_path = Path(config_path).resolve()
        with open(config_path) as f:
            cfg = json.load(f)

        # Resolve circuit_file: first relative to config dir, then relative to root
        circuit_file = cfg["circuit_file"]
        if not Path(circuit_file).is_absolute():
            root = config_path.parent.parent.parent  # opensource-circuits root
            candidate = (root / circuit_file).resolve()
            circuit_file = str(candidate)

        # Build metrics parser from config
        parser_type = cfg.get("metrics_parser_type", "regex")
        patterns = cfg.get("metrics_patterns", {})
        
        if parser_type == "regex":
            def parser(log_text: str) -> Dict:
                metrics = {}
                for line in log_text.splitlines():
                    for metric_name, pattern in patterns.items():
                        m = re.match(pattern, line)
                        if m:
                            try:
                                metrics[metric_name] = float(m.group(1))
                            except ValueError:
                                pass
                return metrics
        elif parser_type == "ac_data":
            # Parse AC .print output table for gain/ugf/pm
            def parser(log_text: str) -> Dict:
                return parse_ac_metrics(log_text, patterns)
        else:
            def parser(log_text: str) -> Dict:
                return {}

        # Build objective from config
        obj_cfg = cfg.get("objective", {"type": "sum_violations"})
        def objective_fn(metrics: Dict) -> float:
            return compute_objective(metrics, cfg.get("specs", {}), obj_cfg)

        return cls(
            name=cfg["name"],
            circuit_file=circuit_file,
            design_vars={k: tuple(v) for k, v in cfg["design_vars"].items()},
            metrics_parser=parser,
            objective_fn=objective_fn,
            specs=cfg.get("specs", {}),
            pdk_corner=cfg.get("pdk_corner", "tt"),
        )

    def _prepare_circuit(self, params: Dict[str, float], tmpdir: Path) -> Path:
        """Copy circuit and inject parameters, preserving unit suffixes.
        
        Handles both single-param-per-line and multi-param-per-line .param
        statements.  Modifies existing .param lines in-place so that the
        injected values take effect.
        """
        with open(self.circuit_file, 'r') as f:
            lines = f.readlines()

        # Extract unit suffixes from original .param lines
        unit_map = {}
        for line in lines:
            for pname in self.names:
                m = re.search(rf'\b{re.escape(pname)}\s*=\s*([-\d\.eE]+)(\w*)',
                              line, re.IGNORECASE)
                if m:
                    unit_map[pname] = m.group(2)
                    break

        # Modify .param lines in-place, replacing only the params we control
        new_lines = []
        for line in lines:
            stripped = line.strip()
            if not stripped.lower().startswith(".param"):
                new_lines.append(line)
                continue

            # This line may contain multiple param=value pairs
            modified = stripped
            for pname in self.names:
                val = params.get(pname)
                if val is None:
                    continue
                unit = unit_map.get(pname, "")
                # Replace pname=oldval with pname=newval, preserving spacing
                pattern = rf'\b{re.escape(pname)}\s*=\s*[-\d\.eE]+\w*'
                replacement = f"{pname}={val}{unit}"
                modified = re.sub(pattern, replacement, modified, count=1, flags=re.IGNORECASE)
            new_lines.append(modified + "\n")

        # Ensure .title exists (ngspice needs it as first non-comment line)
        title_idx = -1
        for i, line in enumerate(new_lines):
            if line.strip().lower().startswith(".title"):
                title_idx = i
                break
        if title_idx < 0:
            for i, line in enumerate(new_lines):
                stripped = line.strip()
                if stripped and not stripped.startswith("*"):
                    if stripped.startswith("."):
                        new_lines.insert(i, f".title {self.name}\n")
                        title_idx = i
                    else:
                        new_lines[i] = f".title {stripped}\n"
                        title_idx = i
                    break

        # Insert ngspice convergence options after .title
        options_line = ".options itl1=5000 itl2=5000 itl4=5000\n"
        new_lines.insert(title_idx + 1, options_line)

        out_file = tmpdir / "circuit.cir"
        with open(out_file, 'w') as f:
            f.writelines(new_lines)
        return out_file

    def evaluate(self, x: np.ndarray, corner: Optional[str] = None) -> Dict:
        """
        Evaluate design point x (normalized [0,1]).
        Returns metrics dict.
        """
        params = self._denormalize(x)
        tmpdir = Path(self.working_dir) if self.working_dir else Path(tempfile.mkdtemp(prefix="bench_"))
        tmpdir.mkdir(parents=True, exist_ok=True)

        try:
            circuit_path = self._prepare_circuit(params, tmpdir)
            # Run ngspice from the original circuit's directory so relative .includes work
            cwd = str(self.circuit_file.parent)
            cmd = ["ngspice", "-b", str(circuit_path)]

            t0 = time.time()
            result = subprocess.run(
                cmd, cwd=cwd, capture_output=True, text=True, timeout=300
            )
            elapsed = time.time() - t0
            self.sim_time += elapsed
            self.sim_count += 1

            log_text = result.stdout + "\n" + result.stderr
            metrics = self.metrics_parser(log_text)
            metrics["_elapsed"] = elapsed
            metrics["_sim_success"] = result.returncode == 0 and "fatal error" not in log_text.lower()
            return metrics

        finally:
            if not self.working_dir:
                shutil.rmtree(tmpdir, ignore_errors=True)

    def objective(self, x: np.ndarray, corner: Optional[str] = None) -> float:
        """Evaluate and return scalar objective (lower=better)."""
        metrics = self.evaluate(x, corner)
        return self.objective_fn(metrics)

    def meets_specs(self, metrics: Dict) -> bool:
        """Check if metrics meet target specs."""
        for k, (op, target) in self.specs.items():
            v = metrics.get(k)
            if v is None:
                return False
            if op == "<" and not (v < target):
                return False
            elif op == ">" and not (v > target):
                return False
        return True

    def _denormalize(self, x: np.ndarray) -> Dict[str, float]:
        """Convert normalized [0,1] vector to parameter dict."""
        x = np.asarray(x)
        values = self.lb + x * (self.ub - self.lb)
        return {name: float(values[i]) for i, name in enumerate(self.names)}

    def normalize(self, params: Dict[str, float]) -> np.ndarray:
        """Convert parameter dict to normalized [0,1] vector."""
        values = np.array([params.get(n, self.defaults[i]) for i, n in enumerate(self.names)])
        return (values - self.lb) / (self.ub - self.lb)

    def default_design_point(self) -> np.ndarray:
        """Return normalized default design point."""
        return self.normalize({n: self.design_vars[n][0] for n in self.names})

    def get_design_space(self) -> Tuple[List[str], np.ndarray, np.ndarray]:
        """Return (names, lb, ub)."""
        return self.names, self.lb.copy(), self.ub.copy()


def compute_objective(metrics: Dict, specs: Dict, obj_cfg: Dict) -> float:
    """Compute scalar objective from metrics and specs."""
    obj_type = obj_cfg.get("type", "sum_violations")
    if obj_type == "sum_violations":
        total = 0.0
        for k, (op, target) in specs.items():
            v = metrics.get(k)
            if v is None:
                total += 1000.0
                continue
            if op == "<":
                violation = max(0, v - target)
            elif op == ">":
                violation = max(0, target - v)
            else:
                violation = 0.0
            total += violation / abs(target) if target != 0 else violation
        return total
    elif obj_type == "weighted_sum":
        total = 0.0
        weights = obj_cfg.get("weights", {})
        for k, (op, target) in specs.items():
            v = metrics.get(k)
            if v is None:
                total += 1000.0 * weights.get(k, 1.0)
                continue
            w = weights.get(k, 1.0)
            if op == "<":
                total += w * max(0, v - target) / abs(target) if target != 0 else w * max(0, v - target)
            elif op == ">":
                total += w * max(0, target - v) / abs(target) if target != 0 else w * max(0, target - v)
        return total
    else:
        return 0.0


def parse_ac_metrics(log_text: str, patterns: Dict) -> Dict:
    """
    Parse AC analysis .print output table to extract gain, ugf, pm.
    ngspice output format:
      index  freq  vdb(out)  vp(out)
      0  1.000e+00  6.012e+01  -1.234e+02
    """
    metrics = {}
    
    # Extract data table (skip header lines, look for numeric data)
    data = []
    for line in log_text.splitlines():
        parts = line.strip().split()
        if len(parts) >= 4:
            try:
                # First col may be index (int) or freq; try both
                idx_or_freq = float(parts[0])
                freq = float(parts[1])
                vdb = float(parts[2])
                vp = float(parts[3])
                data.append((freq, vdb, vp))
            except ValueError:
                continue
    
    if not data:
        return metrics
    
    freqs = np.array([d[0] for d in data])
    vdbs = np.array([d[1] for d in data])
    vps = np.array([d[2] for d in data])
    
    # Gain = max vdb (at lowest freq, typically)
    metrics["gain"] = float(np.max(vdbs))
    
    # UGF = freq where vdb = 0 (interpolate)
    above_0db = vdbs >= 0
    if np.any(above_0db) and np.any(~above_0db):
        idx = np.where(above_0db)[0][-1]  # last point above 0dB
        if idx + 1 < len(freqs):
            f1, f2 = freqs[idx], freqs[idx+1]
            v1, v2 = vdbs[idx], vdbs[idx+1]
            if v1 != v2:
                ugf = f1 + (0 - v1) * (f2 - f1) / (v2 - v1)
                metrics["ugf"] = float(ugf)
                # PM at UGF
                p1, p2 = vps[idx], vps[idx+1]
                pm = p1 + (ugf - f1) * (p2 - p1) / (f2 - f1)
                metrics["pm"] = float(pm) + 180.0  # Convert to phase margin
    
    return metrics



