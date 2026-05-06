#!/usr/bin/env python3
"""
生成 benchmark-dashboard 的统一数据文件 circuits_data.json
"""
import json
import os
import re
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
CIRCUITS_DIR = REPO_ROOT / "circuits"
OUTPUT_PATH = REPO_ROOT / "benchmark-dashboard" / "data" / "circuits_data.json"


def parse_readme(readme_path):
    """从 README.md 提取描述和来源"""
    if not readme_path.exists():
        return {"description": "", "source": "", "source_url": "", "author": "", "license": ""}
    
    content = readme_path.read_text(encoding="utf-8")
    lines = content.split("\n")
    
    desc = ""
    source = ""
    source_url = ""
    author = ""
    license_text = ""
    
    in_desc = False
    for i, line in enumerate(lines):
        if line.startswith("## 电路描述") or line.startswith("## Circuit Description"):
            in_desc = True
            continue
        if in_desc:
            if line.startswith("##"):
                break
            if line.strip():
                desc = line.strip()
                break
    
    for i, line in enumerate(lines):
        if "原始仓库" in line or "Original repository" in line:
            m = re.search(r'\[(.*?)\]\((.*?)\)', line)
            if m:
                source = m.group(1)
                source_url = m.group(2)
        if "作者" in line or "Author" in line:
            author = line.split(":")[-1].strip() if ":" in line else line.strip()
        if "许可证" in line or "License" in line:
            license_text = line.split(":")[-1].strip() if ":" in line else line.strip()
    
    return {
        "description": desc,
        "source": source,
        "source_url": source_url,
        "author": author,
        "license": license_text,
    }


def classify_circuit(name, config):
    """根据电路名和规格分类电路"""
    name_lower = name.lower()
    
    if name.startswith("sky130_"):
        pdk = "SkyWater 130nm"
    elif name.startswith("ptm180nm_"):
        pdk = "PTM 180nm"
    elif name.startswith("gh_"):
        pdk = "PTM 45nm"
    elif name == "ota_iitb":
        pdk = "IITB 180nm"
    elif name in ["chargepump", "bjt_ce_amp"]:
        pdk = "内嵌模型"
    elif any(x in name_lower for x in ["ldo", "amp_nmcf", "alfio", "fan_", "hoilee", "leung", "peng", "qu", "ramos", "sau", "song", "yan"]):
        pdk = "SkyWater 130nm"
    else:
        pdk = "其他"
    
    if "opamp" in name_lower or "ota" in name_lower or any(
        x in name_lower for x in ["raffc", "smc", "affc", "dfcfc", "nmcf", "nmcnr", "acbc", "iac", "tcfc", "azc", "pfc", "cfcc", "dacfc", "az"]
    ):
        category = "运算放大器"
    elif "ldo" in name_lower:
        category = "低压差稳压器"
    elif "bgr" in name_lower:
        category = "带隙基准源"
    elif "por" in name_lower:
        category = "上电复位"
    elif "vco" in name_lower:
        category = "压控振荡器"
    elif "chargepump" in name_lower:
        category = "电荷泵"
    elif "bjt" in name_lower:
        category = "放大器"
    else:
        category = "其他"
    
    return {"pdk": pdk, "category": category}


def main():
    circuits = []
    
    baseline_path = CIRCUITS_DIR / "baseline_results.json"
    baseline_analoggym_path = CIRCUITS_DIR / "baseline_results_analoggym.json"
    
    baseline = {}
    if baseline_path.exists():
        with open(baseline_path) as f:
            baseline = json.load(f)
    
    baseline_analoggym = {}
    if baseline_analoggym_path.exists():
        with open(baseline_analoggym_path) as f:
            baseline_analoggym = json.load(f)
    
    for circuit_dir in sorted(CIRCUITS_DIR.iterdir()):
        if not circuit_dir.is_dir():
            continue
        if circuit_dir.name.endswith(".json"):
            continue
        
        config_path = circuit_dir / "config.json"
        readme_path = circuit_dir / "README.md"
        
        if not config_path.exists():
            continue
        
        with open(config_path) as f:
            config = json.load(f)
        
        name = config["name"]
        readme_info = parse_readme(readme_path)
        classification = classify_circuit(name, config)
        
        design_vars = config.get("design_vars", {})
        vars_list = []
        for var_name, (default, lb, ub) in design_vars.items():
            vars_list.append({
                "name": var_name,
                "default": default,
                "lb": lb,
                "ub": ub,
            })
        
        specs = config.get("specs", {})
        specs_list = []
        for spec_name, (op, target) in specs.items():
            specs_list.append({
                "name": spec_name,
                "operator": op,
                "target": target,
            })
        
        bl = baseline.get(name, baseline_analoggym.get(name, {}))
        baseline_metrics = bl.get("metrics", {})
        baseline_obj = bl.get("obj", None)
        baseline_time = bl.get("time", 17.0 if classification["pdk"] == "SkyWater 130nm" else 0.05)
        baseline_meets = bl.get("meets_specs", False)
        
        circuit_data = {
            "id": name,
            "name": name,
            "display_name": name.replace("_", " ").title(),
            "category": classification["category"],
            "pdk": classification["pdk"],
            "parser_type": config.get("metrics_parser_type", "regex"),
            "var_count": len(design_vars),
            "design_vars": vars_list,
            "specs": specs_list,
            "baseline": {
                "metrics": baseline_metrics,
                "objective": baseline_obj,
                "meets_specs": baseline_meets,
                "sim_time": baseline_time,
            },
            "description": readme_info["description"],
            "source": readme_info["source"],
            "source_url": readme_info["source_url"],
            "author": readme_info["author"],
            "license": readme_info["license"],
        }
        
        circuits.append(circuit_data)
    
    stats = {
        "total_circuits": len(circuits),
        "categories": {},
        "pdks": {},
        "parser_types": {},
        "total_vars": sum(c["var_count"] for c in circuits),
        "max_vars": max(c["var_count"] for c in circuits) if circuits else 0,
        "min_vars": min(c["var_count"] for c in circuits) if circuits else 0,
        "avg_vars": round(sum(c["var_count"] for c in circuits) / len(circuits), 1) if circuits else 0,
        "meets_specs_count": sum(1 for c in circuits if c["baseline"]["meets_specs"]),
        "avg_sim_time": round(sum(c["baseline"]["sim_time"] for c in circuits) / len(circuits), 2) if circuits else 0,
    }
    
    for c in circuits:
        stats["categories"][c["category"]] = stats["categories"].get(c["category"], 0) + 1
        stats["pdks"][c["pdk"]] = stats["pdks"].get(c["pdk"], 0) + 1
        stats["parser_types"][c["parser_type"]] = stats["parser_types"].get(c["parser_type"], 0) + 1
    
    output = {
        "circuits": circuits,
        "stats": stats,
        "generated_at": str(__import__("datetime").datetime.now()),
    }
    
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {OUTPUT_PATH} with {len(circuits)} circuits")
    print(f"Stats: {json.dumps(stats, ensure_ascii=False, indent=2)}")


if __name__ == "__main__":
    main()
