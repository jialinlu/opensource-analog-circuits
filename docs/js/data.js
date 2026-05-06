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
};

// 页面加载时自动加载数据
DataStore.load();
