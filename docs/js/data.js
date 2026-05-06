// 数据加载模块
const DataStore = {
    data: null,
    algoData: null,
    loaded: false,
    listeners: [],

    async load() {
        try {
            const [circuitsRes, algoRes] = await Promise.all([
                fetch('data/circuits_data.json'),
                fetch('data/algorithm_results.json').catch(() => null),
            ]);
            if (!circuitsRes.ok) throw new Error('Failed to load circuits data');
            this.data = await circuitsRes.json();
            if (algoRes && algoRes.ok) {
                this.algoData = await algoRes.json();
            }
            this.loaded = true;
            this.listeners.forEach(cb => cb(this.data));
        } catch (err) {
            console.error('Data load error:', err);
            document.getElementById('app').innerHTML = `
                <div class="loading">
                    <p style="color: var(--danger)">数据加载失败: ${err.message}</p>
                </div>
            `;
        }
    },

    onLoad(callback) {
        if (this.loaded) callback(this.data);
        else this.listeners.push(callback);
    },

    getCircuits() {
        return this.data?.circuits || [];
    },

    getStats() {
        return this.data?.stats || {};
    },

    getCircuitById(id) {
        return this.getCircuits().find(c => c.id === id);
    },

    getCategories() {
        return this.getStats().categories || {};
    },

    getPdks() {
        return this.getStats().pdks || {};
    },

    getAlgoResults(circuitId) {
        return this.algoData?.[circuitId] || null;
    },

    hasAlgoResults() {
        return this.algoData !== null && Object.keys(this.algoData).length > 0;
    },

    // 获取算法列表（去重）
    getAlgoNames() {
        const names = new Set();
        for (const data of Object.values(this.algoData || {})) {
            for (const algo of Object.keys(data.algorithms || {})) {
                names.add(algo);
            }
        }
        return Array.from(names);
    },

    // 计算电路的难度级别
    getDifficulty(circuit) {
        const v = circuit.var_count;
        if (v < 10) return { level: 'beginner', label: '入门', stars: 1 };
        if (v < 30) return { level: 'intermediate', label: '中等', stars: 3 };
        return { level: 'advanced', label: '高级', stars: 5 };
    },

    // 计算规格满足度
    getCompliance(circuit) {
        const specs = circuit.specs || [];
        if (specs.length === 0) return { rate: 0, passed: 0, total: 0, items: [] };

        const metrics = circuit.baseline?.metrics || {};
        const items = specs.map(spec => {
            const actual = metrics[spec.name];
            let isMet = false;
            let near = false;
            let gap = 0;

            if (actual !== null && actual !== undefined) {
                if (spec.operator === '<') {
                    isMet = actual < spec.target;
                    gap = actual - spec.target;
                    near = !isMet && gap < Math.abs(spec.target) * 0.1;
                } else if (spec.operator === '>') {
                    isMet = actual > spec.target;
                    gap = spec.target - actual;
                    near = !isMet && gap < Math.abs(spec.target) * 0.1;
                }
            }

            let status = isMet ? 'pass' : (near ? 'near' : 'fail');
            return { ...spec, actual, isMet, near, status, gap };
        });

        const passed = items.filter(i => i.status === 'pass').length;
        const total = items.length;
        return {
            rate: total > 0 ? Math.round((passed / total) * 100) : 0,
            passed,
            total,
            items
        };
    },

    // 获取类别满足率
    getCategoryComplianceRate(categoryName) {
        const circuits = this.getCircuits().filter(c => c.category === categoryName);
        if (circuits.length === 0) return 0;
        const totalRate = circuits.reduce((sum, c) => sum + this.getCompliance(c).rate, 0);
        return Math.round(totalRate / circuits.length);
    },

    // 全局满足率
    getGlobalComplianceRate() {
        const circuits = this.getCircuits();
        if (circuits.length === 0) return 0;
        const totalRate = circuits.reduce((sum, c) => sum + this.getCompliance(c).rate, 0);
        return Math.round(totalRate / circuits.length);
    },

    // 算法综合统计
    getAlgoStats() {
        if (!this.algoData) return [];
        const stats = {};
        const algoDisplayNames = {
            ga: '遗传算法 (GA)',
            turbo: 'TuRBO',
            hebo: 'HEBO',
        };

        for (const [circuitId, data] of Object.entries(this.algoData)) {
            for (const [algoKey, res] of Object.entries(data.algorithms || {})) {
                if (!stats[algoKey]) {
                    stats[algoKey] = {
                        key: algoKey,
                        name: algoDisplayNames[algoKey] || algoKey.toUpperCase(),
                        circuits: 0,
                        successCount: 0,
                        totalFOM: 0,
                        totalEvals: 0,
                        totalTime: 0,
                        foms: [],
                    };
                }
                const s = stats[algoKey];
                s.circuits++;
                if (res.best_obj === 0) s.successCount++;
                s.totalFOM += res.best_obj;
                s.foms.push(res.best_obj);
                s.totalEvals += res.total_evals;
                s.totalTime += res.total_time;
            }
        }

        return Object.values(stats).map(s => ({
            ...s,
            avgFOM: s.circuits > 0 ? s.totalFOM / s.circuits : 0,
            successRate: s.circuits > 0 ? Math.round((s.successCount / s.circuits) * 100) : 0,
            avgEvals: s.circuits > 0 ? Math.round(s.totalEvals / s.circuits) : 0,
            avgTime: s.circuits > 0 ? s.totalTime / s.circuits : 0,
        })).sort((a, b) => a.avgFOM - b.avgFOM);
    },
};

// 页面加载时自动加载数据
DataStore.load();
