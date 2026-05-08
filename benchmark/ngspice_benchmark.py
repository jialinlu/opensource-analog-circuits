#!/usr/bin/env python3
"""
开源模拟电路统一 Ngspice 基准测试框架。

为电路尺寸优化算法提供通用接口。
支持任意带参数化设计变量的 ngspice 电路。
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
    基于 ngspice 的模拟电路通用基准接口。

    用法：
        bench = NgspiceBenchmark.from_config("configs/gh_opamp.json")
        x = bench.default_design_point()  # 归一化 [0,1]
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
        参数：
            name: 电路标识符
            circuit_file: 主网表 .cir/.spice/.sp 文件路径
            design_vars: {名称: (默认值, 下限, 上限)}
            metrics_parser: 函数(log_text) -> 指标字典
            objective_fn: 函数(metrics) -> 标量（越小越好）
            specs: {指标名: ("<" 或 ">", 目标值)}
            working_dir: 仿真临时目录
            pdk_corner: sky130 工艺角 (tt, ss, ff, sf, fs)
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
        """从 JSON 配置文件加载基准测试。"""
        config_path = Path(config_path).resolve()
        with open(config_path) as f:
            cfg = json.load(f)

        # 解析 circuit_file：先相对于配置文件目录，再相对于仓库根目录
        circuit_file = cfg["circuit_file"]
        if not Path(circuit_file).is_absolute():
            root = config_path.parent.parent.parent  # opensource-circuits root
            candidate = (root / circuit_file).resolve()
            circuit_file = str(candidate)

        # 根据配置构建指标解析器
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
            # 从 AC .print 输出表格解析 gain/ugf/pm
            def parser(log_text: str) -> Dict:
                return parse_ac_metrics(log_text, patterns)
        elif parser_type == "multi_tb_meas":
            # 从多 testbench .meas 输出解析（AC + PSRR + CMRR + DC）
            def parser(log_text: str) -> Dict:
                return parse_multi_tb_meas(log_text, patterns)
        else:
            def parser(log_text: str) -> Dict:
                return {}

        # 根据配置构建目标函数
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
        """复制电路并注入参数，保留单位后缀。
        
        处理每行单参数和每行多参数的 .param 语句。
        就地修改现有 .param 行，使注入的值生效。
        """
        with open(self.circuit_file, 'r') as f:
            lines = f.readlines()

        # 从原始 .param 行提取单位后缀
        unit_map = {}
        for line in lines:
            for pname in self.names:
                m = re.search(rf'\b{re.escape(pname)}\s*=\s*([-\d\.eE]+)(\w*)',
                              line, re.IGNORECASE)
                if m:
                    unit_map[pname] = m.group(2)
                    break

        # 就地修改 .param 行，仅替换我们控制的参数
        new_lines = []
        for line in lines:
            stripped = line.strip()
            if not stripped.lower().startswith(".param"):
                new_lines.append(line)
                continue

            # 该行可能包含多个 param=value 对
            modified = stripped
            for pname in self.names:
                val = params.get(pname)
                if val is None:
                    continue
                unit = unit_map.get(pname, "")
                # 将 pname=旧值 替换为 pname=新值，保留空格
                pattern = rf'\b{re.escape(pname)}\s*=\s*[-\d\.eE]+\w*'
                replacement = f"{pname}={val}{unit}"
                modified = re.sub(pattern, replacement, modified, count=1, flags=re.IGNORECASE)
            new_lines.append(modified + "\n")

        # 确保 .title 存在（ngspice 需要它作为第一个非注释行）
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

        # 在 .title 后插入 ngspice 收敛选项
        options_line = ".options itl1=5000 itl2=5000 itl4=5000\n"
        new_lines.insert(title_idx + 1, options_line)

        out_file = tmpdir / "circuit.cir"
        with open(out_file, 'w') as f:
            f.writelines(new_lines)
        return out_file

    def evaluate(self, x: np.ndarray, corner: Optional[str] = None) -> Dict:
        """
        评估设计点 x（归一化 [0,1]）。
        返回指标字典。
        """
        params = self._denormalize(x)
        tmpdir = Path(self.working_dir) if self.working_dir else Path(tempfile.mkdtemp(prefix="bench_"))
        tmpdir.mkdir(parents=True, exist_ok=True)

        try:
            circuit_path = self._prepare_circuit(params, tmpdir)
            # 从原始电路所在目录运行 ngspice，使相对路径 .include 生效
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
        """评估并返回标量目标值（越小越好）。"""
        metrics = self.evaluate(x, corner)
        return self.objective_fn(metrics)

    def meets_specs(self, metrics: Dict) -> bool:
        """检查指标是否满足目标规格。"""
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
        """将归一化 [0,1] 向量转换为参数字典。"""
        x = np.asarray(x)
        values = self.lb + x * (self.ub - self.lb)
        return {name: float(values[i]) for i, name in enumerate(self.names)}

    def normalize(self, params: Dict[str, float]) -> np.ndarray:
        """将参数字典转换为归一化 [0,1] 向量。"""
        values = np.array([params.get(n, self.defaults[i]) for i, n in enumerate(self.names)])
        return (values - self.lb) / (self.ub - self.lb)

    def default_design_point(self) -> np.ndarray:
        """返回归一化默认设计点。"""
        return self.normalize({n: self.design_vars[n][0] for n in self.names})

    def get_design_space(self) -> Tuple[List[str], np.ndarray, np.ndarray]:
        """返回 (名称列表, 下限, 上限)。"""
        return self.names, self.lb.copy(), self.ub.copy()


def compute_objective(metrics: Dict, specs: Dict, obj_cfg: Dict) -> float:
    """根据指标和规格计算标量目标值。"""
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
    elif obj_type == "multi_tb_max_violation":
        max_violation = 0.0
        for k, (op, target) in specs.items():
            v = metrics.get(k)
            if v is None:
                max_violation = max(max_violation, 1000.0)
                continue
            if op == "<":
                violation = max(0, v - target)
            elif op == ">":
                violation = max(0, target - v)
            else:
                violation = 0.0
            normalized = violation / abs(target) if target != 0 else violation
            max_violation = max(max_violation, normalized)
        return max_violation
    else:
        return 0.0


def parse_multi_tb_meas(log_text: str, patterns: Dict) -> Dict:
    """
    解析多 testbench .meas 输出，提取 AC/PSRR/CMRR/DC 指标。
    支持从 raw 测量值计算派生指标（PSRR、CMRR、Power、Vos）。
    """
    metrics = {}
    for key, pattern in patterns.items():
        for line in log_text.splitlines():
            m = re.search(pattern, line)
            if m:
                try:
                    metrics[key] = float(m.group(1))
                except ValueError:
                    pass
                break

    # Post-processing: raw -> derived metrics
    # PSRR: raw vdb(out_psrr) -> PSRR = -vdb(out_psrr)
    if 'psrr_raw' in metrics:
        metrics['psrr_db'] = -metrics.pop('psrr_raw')

    # CMRR: CMRR = gain_db - cm_gain_db
    if 'cm_gain_raw' in metrics and 'gain_db' in metrics:
        metrics['cmrr_db'] = metrics['gain_db'] - metrics.pop('cm_gain_raw')

    # Power: |i(VDD)| * VDD (1.8V for PTM180nm)
    if 'i_vdd' in metrics:
        metrics['power_w'] = 1.8 * abs(metrics.pop('i_vdd'))

    # Vos: approximate from open-loop DC output
    # Vos ≈ |Vout - Vcm| / Av * 1000 [mV], Vcm = 0.9V
    if 'vout_vos' in metrics and 'gain_db' in metrics:
        gain_db = metrics['gain_db']
        if gain_db > 0:
            av_linear = 10 ** (gain_db / 20.0)
            metrics['vos_mv'] = abs(metrics.pop('vout_vos') - 0.9) / av_linear * 1000.0
        else:
            metrics['vos_mv'] = 0.0
            metrics.pop('vout_vos', None)

    return metrics


def parse_ac_metrics(log_text: str, patterns: Dict) -> Dict:
    """
    解析 AC 分析 .print 输出表格以提取 gain、ugf、pm。
    ngspice 输出格式：
      index  freq  vdb(out)  vp(out)
      0  1.000e+00  6.012e+01  -1.234e+02
    """
    metrics = {}
    
    # 提取数据表格（跳过表头行，查找数值数据）
    data = []
    for line in log_text.splitlines():
        parts = line.strip().split()
        if len(parts) >= 4:
            try:
                # 第一列可能是索引（整数）或频率；两者都尝试
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
    
    # 增益 = 最大 vdb（通常在最低频率处）
    metrics["gain"] = float(np.max(vdbs))
    
    # 单位增益频率 = vdb = 0 时的频率（插值）
    above_0db = vdbs >= 0
    if np.any(above_0db) and np.any(~above_0db):
        idx = np.where(above_0db)[0][-1]  # last point above 0dB
        if idx + 1 < len(freqs):
            f1, f2 = freqs[idx], freqs[idx+1]
            v1, v2 = vdbs[idx], vdbs[idx+1]
            if v1 != v2:
                ugf = f1 + (0 - v1) * (f2 - f1) / (v2 - v1)
                metrics["ugf"] = float(ugf)
                # UGF 处的相位裕度
                p1, p2 = vps[idx], vps[idx+1]
                pm = p1 + (ugf - f1) * (p2 - p1) / (f2 - f1)
                metrics["pm"] = float(pm) + 180.0  # Convert to phase margin
    
    return metrics



