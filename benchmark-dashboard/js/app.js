// ===== 路由引擎 =====
const Router = {
    currentPage: '',
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#!/dashboard';
        const match = hash.match(/#!\/(\w+)(?:\/(.*))?/);
        if (!match) {
            this.navigate('dashboard');
            return;
        }
        const page = match[1];
        const param = match[2];
        this.currentPage = page;
        this.params = param ? { id: param } : {};

        // 更新导航激活状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // 渲染页面
        DataStore.onLoad(data => {
            this.render(page);
        });
    },

    navigate(page, param = '') {
        const hash = param ? `#!/${page}/${param}` : `#!/${page}`;
        window.location.hash = hash;
    },

    render(page) {
        const app = document.getElementById('app');
        app.innerHTML = '';
        window.scrollTo(0, 0);

        switch (page) {
            case 'dashboard':
                renderDashboard(app);
                break;
            case 'leaderboard':
                renderLeaderboard(app);
                break;
            case 'catalog':
                renderCatalog(app);
                break;
            case 'circuit':
                renderCircuitDetail(app, this.params.id);
                break;
            default:
                renderDashboard(app);
        }
    }
};

// ===== 辅助函数 =====
function getPdkBadgeClass(pdk) {
    if (pdk.includes('SkyWater')) return 'badge-sky130';
    if (pdk.includes('PTM')) return 'badge-ptm';
    if (pdk.includes('IITB')) return 'badge-iitb';
    return 'badge-embedded';
}

function getParserBadgeClass(parser) {
    return parser === 'ac_data' ? 'badge-ac' : 'badge-regex';
}

function formatNumber(n) {
    if (n === null || n === undefined) return '-';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'k';
    if (Math.abs(n) < 0.01) return n.toExponential(2);
    return n.toFixed(3);
}

function formatTime(s) {
    if (s < 1) return (s * 1000).toFixed(0) + 'ms';
    return s.toFixed(2) + 's';
}

function meetsSpec(v, op, target) {
    if (v === null || v === undefined) return false;
    if (op === '<') return v < target;
    if (op === '>') return v > target;
    return false;
}

function computeObjective(metrics, specs) {
    let total = 0;
    for (const spec of specs) {
        const v = metrics[spec.name];
        if (v === null || v === undefined) {
            total += 1000;
            continue;
        }
        let violation = 0;
        if (spec.operator === '<') {
            violation = Math.max(0, v - spec.target);
        } else if (spec.operator === '>') {
            violation = Math.max(0, spec.target - v);
        }
        total += spec.target !== 0 ? violation / Math.abs(spec.target) : violation;
    }
    return total;
}

// ===== Dashboard =====
function renderDashboard(container) {
    const circuits = DataStore.getCircuits();
    const stats = DataStore.getStats();
    const categories = DataStore.getCategories();
    const pdks = DataStore.getPdks();

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">电路总数</div>
                <div class="stat-value accent">${stats.total_circuits}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">电路类别</div>
                <div class="stat-value">${Object.keys(categories).length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">PDK 种类</div>
                <div class="stat-value">${Object.keys(pdks).length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">最大变量数</div>
                <div class="stat-value accent">${stats.max_vars}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">平均变量数</div>
                <div class="stat-value">${stats.avg_vars}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">满足规格</div>
                <div class="stat-value ${stats.meets_specs_count > 0 ? 'success' : 'danger'}">${stats.meets_specs_count}/${stats.total_circuits}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">平均仿真时间</div>
                <div class="stat-value">${stats.avg_sim_time.toFixed(1)}s</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">总变量数</div>
                <div class="stat-value">${stats.total_vars}</div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-container">
                <div class="chart-title">电路分类分布</div>
                <div id="chart-category" class="chart-box"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">PDK 分布</div>
                <div id="chart-pdk" class="chart-box"></div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-container">
                <div class="chart-title">各电路变量数</div>
                <div id="chart-vars" class="chart-box"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">仿真时间分布</div>
                <div id="chart-time" class="chart-box"></div>
            </div>
        </div>

        <h2 class="section-title">快速浏览</h2>
        <div class="cards-grid" id="quick-circuits"></div>
    `;

    // 渲染图表
    setTimeout(() => {
        renderPieChart('chart-category', categories, '分类');
        renderPieChart('chart-pdk', pdks, 'PDK');
        renderBarChart(
            'chart-vars',
            circuits.map(c => c.name),
            circuits.map(c => c.var_count),
            '变量数',
            '#3b82f6'
        );
        renderScatterChart(
            'chart-time',
            circuits.map(c => [c.var_count, c.baseline.sim_time, c.name]),
            '变量数',
            '仿真时间 (s)'
        );
    }, 50);

    // 快速浏览卡片
    const quickContainer = document.getElementById('quick-circuits');
    const featured = circuits
        .sort((a, b) => b.var_count - a.var_count)
        .slice(0, 6);
    quickContainer.innerHTML = featured.map(c => renderCircuitCard(c)).join('');
    quickContainer.querySelectorAll('.circuit-card').forEach(card => {
        card.addEventListener('click', () => Router.navigate('circuit', card.dataset.id));
    });
}

// ===== Leaderboard =====
let leaderboardSort = { column: 'var_count', direction: 'desc' };
let leaderboardFilters = { pdk: '', parser: '', search: '' };

function renderLeaderboard(container) {
    container.innerHTML = `
        <h2 class="section-title">排行榜</h2>
        <div class="filter-bar">
            <div class="filter-group">
                <label>搜索电路</label>
                <input type="text" id="lb-search" placeholder="输入电路名..." value="${leaderboardFilters.search}">
            </div>
            <div class="filter-group">
                <label>PDK</label>
                <select id="lb-pdk">
                    <option value="">全部</option>
                    ${Object.keys(DataStore.getPdks()).map(p => `<option value="${p}" ${leaderboardFilters.pdk === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>解析器</label>
                <select id="lb-parser">
                    <option value="">全部</option>
                    <option value="regex" ${leaderboardFilters.parser === 'regex' ? 'selected' : ''}>Regex</option>
                    <option value="ac_data" ${leaderboardFilters.parser === 'ac_data' ? 'selected' : ''}>AC Data</option>
                </select>
            </div>
        </div>
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th data-sort="name">电路名<span class="sort-indicator">⇅</span></th>
                        <th data-sort="category">类别</th>
                        <th data-sort="pdk">PDK</th>
                        <th data-sort="var_count">变量数<span class="sort-indicator">⇅</span></th>
                        <th data-sort="parser_type">解析器</th>
                        <th data-sort="baseline.objective">默认目标值<span class="sort-indicator">⇅</span></th>
                        <th data-sort="baseline.meets_specs">满足规格</th>
                        <th data-sort="baseline.sim_time">仿真时间</th>
                    </tr>
                </thead>
                <tbody id="lb-body"></tbody>
            </table>
        </div>
    `;

    // 筛选事件
    document.getElementById('lb-search').addEventListener('input', e => {
        leaderboardFilters.search = e.target.value;
        updateLeaderboardTable();
    });
    document.getElementById('lb-pdk').addEventListener('change', e => {
        leaderboardFilters.pdk = e.target.value;
        updateLeaderboardTable();
    });
    document.getElementById('lb-parser').addEventListener('change', e => {
        leaderboardFilters.parser = e.target.value;
        updateLeaderboardTable();
    });

    // 排序事件
    document.querySelectorAll('.data-table thead th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (leaderboardSort.column === col) {
                leaderboardSort.direction = leaderboardSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                leaderboardSort.column = col;
                leaderboardSort.direction = 'asc';
            }
            document.querySelectorAll('.data-table th').forEach(t => {
                t.classList.remove('sort-asc', 'sort-desc');
            });
            th.classList.add(leaderboardSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
            updateLeaderboardTable();
        });
    });

    updateLeaderboardTable();
}

function updateLeaderboardTable() {
    let circuits = DataStore.getCircuits();

    // 筛选
    if (leaderboardFilters.search) {
        const s = leaderboardFilters.search.toLowerCase();
        circuits = circuits.filter(c => c.name.toLowerCase().includes(s) || c.display_name.toLowerCase().includes(s));
    }
    if (leaderboardFilters.pdk) {
        circuits = circuits.filter(c => c.pdk === leaderboardFilters.pdk);
    }
    if (leaderboardFilters.parser) {
        circuits = circuits.filter(c => c.parser_type === leaderboardFilters.parser);
    }

    // 排序
    circuits.sort((a, b) => {
        let va, vb;
        if (leaderboardSort.column.includes('.')) {
            const keys = leaderboardSort.column.split('.');
            va = keys.reduce((o, k) => o?.[k], a);
            vb = keys.reduce((o, k) => o?.[k], b);
        } else {
            va = a[leaderboardSort.column];
            vb = b[leaderboardSort.column];
        }
        if (va === null || va === undefined) va = Infinity;
        if (vb === null || vb === undefined) vb = Infinity;
        if (typeof va === 'string') {
            return leaderboardSort.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return leaderboardSort.direction === 'asc' ? va - vb : vb - va;
    });

    const tbody = document.getElementById('lb-body');
    tbody.innerHTML = circuits.map(c => `
        <tr data-id="${c.id}">
            <td><strong>${c.display_name}</strong></td>
            <td>${c.category}</td>
            <td><span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span></td>
            <td>${c.var_count}</td>
            <td><span class="badge ${getParserBadgeClass(c.parser_type)}">${c.parser_type}</span></td>
            <td>${c.baseline.objective !== null ? c.baseline.objective.toFixed(3) : '-'}</td>
            <td>${c.baseline.meets_specs
                ? '<span class="badge badge-success">✓ 满足</span>'
                : '<span class="badge badge-danger">✗ 不满足</span>'}</td>
            <td>${formatTime(c.baseline.sim_time)}</td>
        </tr>
    `).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => Router.navigate('circuit', tr.dataset.id));
    });
}

// ===== Catalog =====
let catalogFilters = { pdk: '', category: '', search: '' };
let catalogSort = { column: 'var_count', direction: 'desc' };

function renderCatalog(container) {
    const categories = DataStore.getCategories();
    container.innerHTML = `
        <h2 class="section-title">电路目录</h2>
        <div class="filter-bar">
            <div class="filter-group">
                <label>搜索</label>
                <input type="text" id="cat-search" placeholder="输入电路名..." value="${catalogFilters.search}">
            </div>
            <div class="filter-group">
                <label>类别</label>
                <select id="cat-category">
                    <option value="">全部</option>
                    ${Object.keys(categories).map(c => `<option value="${c}" ${catalogFilters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>PDK</label>
                <select id="cat-pdk">
                    <option value="">全部</option>
                    ${Object.keys(DataStore.getPdks()).map(p => `<option value="${p}" ${catalogFilters.pdk === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>排序</label>
                <select id="cat-sort">
                    <option value="var_count-desc" ${catalogSort.column === 'var_count' && catalogSort.direction === 'desc' ? 'selected' : ''}>变量数 ↓</option>
                    <option value="var_count-asc" ${catalogSort.column === 'var_count' && catalogSort.direction === 'asc' ? 'selected' : ''}>变量数 ↑</option>
                    <option value="name-asc" ${catalogSort.column === 'name' ? 'selected' : ''}>名称</option>
                    <option value="baseline.sim_time-desc" ${catalogSort.column === 'baseline.sim_time' ? 'selected' : ''}>仿真时间</option>
                </select>
            </div>
        </div>
        <div class="cards-grid" id="cat-grid"></div>
    `;

    document.getElementById('cat-search').addEventListener('input', e => {
        catalogFilters.search = e.target.value;
        updateCatalogGrid();
    });
    document.getElementById('cat-category').addEventListener('change', e => {
        catalogFilters.category = e.target.value;
        updateCatalogGrid();
    });
    document.getElementById('cat-pdk').addEventListener('change', e => {
        catalogFilters.pdk = e.target.value;
        updateCatalogGrid();
    });
    document.getElementById('cat-sort').addEventListener('change', e => {
        const [col, dir] = e.target.value.split('-');
        catalogSort.column = col;
        catalogSort.direction = dir || 'asc';
        updateCatalogGrid();
    });

    updateCatalogGrid();
}

function updateCatalogGrid() {
    let circuits = DataStore.getCircuits();

    if (catalogFilters.search) {
        const s = catalogFilters.search.toLowerCase();
        circuits = circuits.filter(c => c.name.toLowerCase().includes(s) || c.display_name.toLowerCase().includes(s));
    }
    if (catalogFilters.category) {
        circuits = circuits.filter(c => c.category === catalogFilters.category);
    }
    if (catalogFilters.pdk) {
        circuits = circuits.filter(c => c.pdk === catalogFilters.pdk);
    }

    circuits.sort((a, b) => {
        let va, vb;
        if (catalogSort.column.includes('.')) {
            const keys = catalogSort.column.split('.');
            va = keys.reduce((o, k) => o?.[k], a);
            vb = keys.reduce((o, k) => o?.[k], b);
        } else {
            va = a[catalogSort.column];
            vb = b[catalogSort.column];
        }
        if (va === null || va === undefined) va = Infinity;
        if (vb === null || vb === undefined) vb = Infinity;
        if (typeof va === 'string') {
            return catalogSort.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return catalogSort.direction === 'asc' ? va - vb : vb - va;
    });

    const grid = document.getElementById('cat-grid');
    grid.innerHTML = circuits.map(c => renderCircuitCard(c)).join('');
    grid.querySelectorAll('.circuit-card').forEach(card => {
        card.addEventListener('click', () => Router.navigate('circuit', card.dataset.id));
    });
}

function renderCircuitCard(c) {
    return `
        <div class="circuit-card" data-id="${c.id}">
            <div class="status-dot ${c.baseline.meets_specs ? 'success' : 'danger'}"></div>
            <div class="card-header">
                <div class="card-title">${c.display_name}</div>
            </div>
            <div class="card-badges">
                <span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span>
                <span class="badge ${getParserBadgeClass(c.parser_type)}">${c.parser_type}</span>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${c.description || '暂无描述'}</p>
            <div class="card-stats">
                <div class="card-stat">
                    <div>变量数</div>
                    <div class="card-stat-value">${c.var_count}</div>
                </div>
                <div class="card-stat">
                    <div>仿真时间</div>
                    <div class="card-stat-value">${formatTime(c.baseline.sim_time)}</div>
                </div>
                <div class="card-stat">
                    <div>目标值</div>
                    <div class="card-stat-value">${c.baseline.objective !== null ? c.baseline.objective.toFixed(3) : '-'}</div>
                </div>
                <div class="card-stat">
                    <div>状态</div>
                    <div class="card-stat-value" style="color: ${c.baseline.meets_specs ? 'var(--success)' : 'var(--danger)'}">
                        ${c.baseline.meets_specs ? '✓ 满足' : '✗ 不满足'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== Circuit Detail =====
function renderCircuitDetail(container, id) {
    const c = DataStore.getCircuitById(id);
    if (!c) {
        container.innerHTML = `<div class="loading"><p>电路未找到</p></div>`;
        return;
    }

    // 计算每个规格的满足情况
    const specData = c.specs.map(spec => {
        const actual = c.baseline.metrics[spec.name];
        const isMet = meetsSpec(actual, spec.operator, spec.target);
        let violation = 0;
        if (!isMet && actual !== null && actual !== undefined) {
            if (spec.operator === '<') violation = actual - spec.target;
            else if (spec.operator === '>') violation = spec.target - actual;
        }
        return { ...spec, actual, isMet, violation };
    });

    // 计算实际目标值（如果 baseline 没有 obj）
    let objective = c.baseline.objective;
    if (objective === null || objective === undefined) {
        objective = computeObjective(c.baseline.metrics, c.specs);
    }

    container.innerHTML = `
        <a href="#!/catalog" class="back-btn" onclick="event.preventDefault(); Router.navigate('catalog');">← 返回目录</a>
        
        <div class="detail-header">
            <h1>${c.display_name}</h1>
            <div class="detail-meta">
                <span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span>
                <span class="badge">${c.category}</span>
                <span class="badge ${getParserBadgeClass(c.parser_type)}">${c.parser_type}</span>
                <span class="badge">${c.var_count} 变量</span>
                <span class="badge ${c.baseline.meets_specs ? 'badge-success' : 'badge-danger'}">
                    ${c.baseline.meets_specs ? '✓ 满足规格' : '✗ 不满足规格'}
                </span>
            </div>
            <p class="detail-desc">${c.description || '暂无描述'}</p>
            ${c.source_url ? `<p style="margin-top: 8px;"><a href="${c.source_url}" target="_blank" style="color: var(--accent);">查看原始仓库 →</a></p>` : ''}
        </div>

        <div class="detail-section">
            <h3>基线结果</h3>
            <div class="metrics-grid">
                ${Object.entries(c.baseline.metrics).map(([k, v]) => `
                    <div class="metric-card">
                        <div class="metric-label">${k.toUpperCase()}</div>
                        <div class="metric-value">${formatNumber(v)}</div>
                    </div>
                `).join('')}
                <div class="metric-card">
                    <div class="metric-label">目标值</div>
                    <div class="metric-value" style="color: ${objective === 0 ? 'var(--success)' : 'var(--danger)'}">${objective.toFixed(4)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">仿真时间</div>
                    <div class="metric-value">${formatTime(c.baseline.sim_time)}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>规格要求</h3>
            <div id="spec-bars">
                ${specData.map(spec => `
                    <div class="spec-bar">
                        <span class="spec-name">${spec.name.toUpperCase()}</span>
                        <span class="spec-target">${spec.operator} ${formatNumber(spec.target)}</span>
                        <span class="spec-value" style="color: ${spec.isMet ? 'var(--success)' : 'var(--danger)'}">
                            ${spec.actual !== null && spec.actual !== undefined ? formatNumber(spec.actual) : 'N/A'}
                        </span>
                        <span class="spec-status ${spec.isMet ? 'success' : 'danger'}"></span>
                    </div>
                `).join('')}
            </div>
            <div id="chart-specs" class="chart-box" style="margin-top: 20px; height: 200px;"></div>
        </div>

        <div class="detail-section">
            <h3>设计空间</h3>
            <table class="vars-table">
                <thead>
                    <tr>
                        <th>参数名</th>
                        <th>默认值</th>
                        <th>范围</th>
                    </tr>
                </thead>
                <tbody>
                    ${c.design_vars.map(v => `
                        <tr>
                            <td>${v.name}</td>
                            <td>${formatNumber(v.default)}</td>
                            <td class="var-range">[${formatNumber(v.lb)}, ${formatNumber(v.ub)}]</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    // 渲染规格偏差图
    setTimeout(() => {
        const chartData = specData
            .filter(s => s.violation > 0 || !s.isMet)
            .map(s => ({
                name: s.name.toUpperCase(),
                fullName: c.display_name,
                actual: s.actual || 0,
                target: s.target,
                violation: s.violation,
            }));
        if (chartData.length > 0) {
            renderSpecBarChart('chart-specs', chartData);
        } else {
            document.getElementById('chart-specs').style.display = 'none';
        }
    }, 50);
}

// ===== 初始化 =====
Router.init();
