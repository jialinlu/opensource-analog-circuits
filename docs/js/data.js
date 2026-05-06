// 数据加载模块
const DataStore = {
    data: null,
    loaded: false,
    listeners: [],

    async load() {
        try {
            const response = await fetch('data/circuits_data.json');
            if (!response.ok) throw new Error('Failed to load data');
            this.data = await response.json();
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
};

// 页面加载时自动加载数据
DataStore.load();
