// ===== 路由引擎 =====
const Router = {
    currentPage: '',
    params: {},

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#!/overview';
        const match = hash.match(/#!\/(\w+)(?:\/(.*))?/);
        if (!match) {
            this.navigate('overview');
            return;
        }
        const page = match[1];
        const param = match[2];
        this.currentPage = page;
        this.params = param ? { id: param } : {};

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

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
            case 'overview':
                renderOverview(app);
                break;
            case 'circuits':
                renderCircuits(app);
                break;
            case 'circuit':
                renderCircuitDetail(app, this.params.id);
                break;
            case 'algorithms':
                renderAlgorithms(app);
                break;
            case 'matrix':
                renderMatrix(app);
                break;
            default:
                renderOverview(app);
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
        if (spec.operator === '<') violation = Math.max(0, v - spec.target);
        else if (spec.operator === '>') violation = Math.max(0, spec.target - v);
        total += spec.target !== 0 ? violation / Math.abs(spec.target) : violation;
    }
    return total;
}

function getComplianceDots(circuit) {
    const compliance = DataStore.getCompliance(circuit);
    return compliance.items.map(item =>
        `<span class="compliance-dot ${item.status}"></span>`
    ).join('');
}

function getComplianceBar(circuit) {
    const compliance = DataStore.getCompliance(circuit);
    const rate = compliance.rate;
    let fillClass = 'pass';
    if (rate < 50) fillClass = 'fail';
    else if (rate < 100) fillClass = 'near';
    return `
        <div class="compliance-bar">
            <div class="compliance-bar-track">
                <div class="compliance-bar-fill ${fillClass}" style="width: ${rate}%"></div>
            </div>
            <span style="font-size:0.75rem;color:var(--text-muted);font-family:monospace;min-width:32px;text-align:right">${rate}%</span>
            <div class="compliance-dots">${getComplianceDots(circuit)}</div>
        </div>
    `;
}

// ===== 概览页 / Overview =====
function renderOverview(container) {
    const circuits = DataStore.getCircuits();
    const stats = DataStore.getStats();
    const categories = DataStore.getCategories();
    const pdks = DataStore.getPdks();
    const algoStats = DataStore.getAlgoStats();
    const globalRate = DataStore.getGlobalComplianceRate();
    const hasAlgo = DataStore.hasAlgoResults();

    container.innerHTML = `
        <div class="page-header">
            <h1>AnalogBench 概览</h1>
            <p>开源模拟电路尺寸优化基准测试平台 — ${stats.total_circuits} 个电路，${Object.keys(categories).length} 个类别</p>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">电路总数</div>
                <div class="kpi-value accent">${stats.total_circuits}</div>
                <div class="kpi-sub">${Object.keys(categories).length} 个类别</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">算法对比</div>
                <div class="kpi-value accent">${hasAlgo ? algoStats.length : 0}</div>
                <div class="kpi-sub">种优化算法</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">全局满足率</div>
                <div class="kpi-value ${globalRate >= 80 ? 'success' : globalRate >= 50 ? 'accent' : 'danger'}">${globalRate}%</div>
                <div class="kpi-sub">规格平均满足</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">最佳算法</div>
                <div class="kpi-value success">${hasAlgo && algoStats.length > 0 ? algoStats[0].name.split(' ')[0] : '-'}</div>
                <div class="kpi-sub">最低平均 FOM</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">平均仿真时间</div>
                <div class="kpi-value">${stats.avg_sim_time?.toFixed(1) || 0}s</div>
                <div class="kpi-sub">单次仿真</div>
            </div>
        </div>

        ${hasAlgo ? renderAlgoLeaderboardSection(algoStats) : ''}

        <h2 class="section-title">类别浏览器</h2>
        <div class="category-grid" id="category-grid"></div>

        <div class="charts-row">
            <div class="chart-container">
                <div class="chart-title">全局满足度</div>
                <div id="chart-gauge" class="chart-box" style="height:260px"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">PDK 分布</div>
                <div id="chart-pdk" class="chart-box"></div>
            </div>
        </div>
    `;

    const catContainer = document.getElementById('category-grid');
    const catEntries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...catEntries.map(e => e[1]));
    catContainer.innerHTML = catEntries.map(([name, count]) => {
        const rate = DataStore.getCategoryComplianceRate(name);
        return `
            <div class="category-card" data-category="${name}">
                <div class="category-card-name">${name}</div>
                <div class="category-card-count">${count} 个电路</div>
                <div class="category-card-bar">
                    <div class="category-card-bar-fill" style="width: ${(count / maxCount) * 100}%"></div>
                </div>
                <div class="category-card-rate">满足率 ${rate}%</div>
            </div>
        `;
    }).join('');

    catContainer.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            circuitBrowserFilters.category = card.dataset.category;
            Router.navigate('circuits');
        });
    });

    setTimeout(() => {
        renderGaugeChart('chart-gauge', globalRate, '总体满足率', globalRate >= 80 ? '#22c55e' : globalRate >= 50 ? '#38bdf8' : '#ef4444');
        renderPieChart('chart-pdk', pdks, 'PDK');
    }, 50);
}

function renderAlgoLeaderboardSection(algoStats) {
    const medals = ['🥇', '🥈', '🥉'];
    return `
        <div class="algo-leaderboard">
            <div class="leaderboard-header">
                <div>
                    <div class="leaderboard-title">算法 Leaderboard</div>
                    <div class="leaderboard-subtitle">综合成功率与平均 FOM 排名</div>
                </div>
            </div>
            <div class="table-container" style="margin-bottom:0">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>算法</th>
                            <th>成功率</th>
                            <th>平均 FOM</th>
                            <th>平均迭代</th>
                            <th>电路覆盖</th>
                            <th>趋势</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${algoStats.map((s, i) => `
                            <tr data-algo="${s.key}">
                                <td><span style="font-size:1.1rem">${medals[i] || (i + 1)}</span></td>
                                <td><strong>${s.name}</strong></td>
                                <td><span class="badge ${s.successRate >= 60 ? 'badge-success' : s.successRate >= 30 ? 'badge-warning' : 'badge-danger'}">${s.successRate}%</span></td>
                                <td style="font-family:monospace">${s.avgFOM.toFixed(4)}</td>
                                <td>${s.avgEvals}</td>
                                <td>${s.circuits}/3</td>
                                <td style="color:${s.avgFOM === 0 ? 'var(--success)' : 'var(--text-muted)'}">${s.avgFOM === 0 ? '↑ 最优' : '→ 改进中'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ===== 电路浏览器 / Circuits =====
let circuitBrowserFilters = { category: '', pdk: '', difficulty: '', compliance: '', search: '' };
let circuitBrowserView = 'table';
let circuitsPage = 1;
const circuitsPerPage = 15;

function renderCircuits(container) {
    const categories = DataStore.getCategories();
    container.innerHTML = `
        <div class="page-header">
            <h1>电路浏览器</h1>
            <p>浏览全部 ${DataStore.getStats().total_circuits} 个电路，查看规格满足度与算法结果</p>
        </div>

        <div class="browser-layout">
            <aside class="browser-sidebar">
                <div class="sidebar-section">
                    <div class="sidebar-section-title">类别</div>
                    ${Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
                        <label class="sidebar-option">
                            <input type="checkbox" name="category" value="${name}" ${circuitBrowserFilters.category === name ? 'checked' : ''}>
                            <span>${name}</span>
                            <span class="count">${count}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="sidebar-section">
                    <div class="sidebar-section-title">PDK</div>
                    ${Object.keys(DataStore.getPdks()).map(p => `
                        <label class="sidebar-option">
                            <input type="checkbox" name="pdk" value="${p}" ${circuitBrowserFilters.pdk === p ? 'checked' : ''}>
                            <span>${p}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="sidebar-section">
                    <div class="sidebar-section-title">难度</div>
                    <label class="sidebar-option">
                        <input type="checkbox" name="difficulty" value="beginner" ${circuitBrowserFilters.difficulty === 'beginner' ? 'checked' : ''}>
                        <span>入门 (&lt;10 变量)</span>
                    </label>
                    <label class="sidebar-option">
                        <input type="checkbox" name="difficulty" value="intermediate" ${circuitBrowserFilters.difficulty === 'intermediate' ? 'checked' : ''}>
                        <span>中等 (10-30)</span>
                    </label>
                    <label class="sidebar-option">
                        <input type="checkbox" name="difficulty" value="advanced" ${circuitBrowserFilters.difficulty === 'advanced' ? 'checked' : ''}>
                        <span>高级 (&gt;30)</span>
                    </label>
                </div>
                <div class="sidebar-section">
                    <div class="sidebar-section-title">规格满足度</div>
                    <label class="sidebar-option">
                        <input type="checkbox" name="compliance" value="pass" ${circuitBrowserFilters.compliance === 'pass' ? 'checked' : ''}>
                        <span>已满足</span>
                    </label>
                    <label class="sidebar-option">
                        <input type="checkbox" name="compliance" value="fail" ${circuitBrowserFilters.compliance === 'fail' ? 'checked' : ''}>
                        <span>未满足</span>
                    </label>
                </div>
                <button class="sidebar-clear" onclick="clearCircuitFilters()">清除筛选</button>
            </aside>

            <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <div class="filter-bar" style="margin-bottom:0;padding:12px;flex:1">
                        <div class="filter-group" style="flex:1;max-width:400px">
                            <input type="text" id="cb-search" placeholder="搜索电路名..." value="${circuitBrowserFilters.search}" style="width:100%">
                        </div>
                    </div>
                    <div class="view-toggle">
                        <button class="view-toggle-btn ${circuitBrowserView === 'table' ? 'active' : ''}" data-view="table">表格</button>
                        <button class="view-toggle-btn ${circuitBrowserView === 'card' ? 'active' : ''}" data-view="card">卡片</button>
                    </div>
                </div>
                <div id="cb-content"></div>
                <div id="cb-pagination"></div>
            </div>
        </div>
    `;

    document.querySelectorAll('.browser-sidebar input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            const name = cb.name;
            const value = cb.value;
            const checked = cb.checked;
            if (name === 'compliance') {
                circuitBrowserFilters.compliance = checked ? value : '';
            } else {
                circuitBrowserFilters[name] = checked ? value : '';
            }
            document.querySelectorAll(`.browser-sidebar input[name="${name}"]`).forEach(other => {
                if (other !== cb) other.checked = false;
            });
            circuitsPage = 1;
            updateCircuitBrowser();
        });
    });

    document.getElementById('cb-search').addEventListener('input', e => {
        circuitBrowserFilters.search = e.target.value;
        circuitsPage = 1;
        updateCircuitBrowser();
    });

    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            circuitBrowserView = btn.dataset.view;
            document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateCircuitBrowser();
        });
    });

    updateCircuitBrowser();
}

function clearCircuitFilters() {
    circuitBrowserFilters = { category: '', pdk: '', difficulty: '', compliance: '', search: '' };
    circuitsPage = 1;
    renderCircuits(document.getElementById('app'));
}

function updateCircuitBrowser() {
    let circuits = DataStore.getCircuits();

    if (circuitBrowserFilters.search) {
        const s = circuitBrowserFilters.search.toLowerCase();
        circuits = circuits.filter(c => c.name.toLowerCase().includes(s) || c.display_name.toLowerCase().includes(s));
    }
    if (circuitBrowserFilters.category) {
        circuits = circuits.filter(c => c.category === circuitBrowserFilters.category);
    }
    if (circuitBrowserFilters.pdk) {
        circuits = circuits.filter(c => c.pdk === circuitBrowserFilters.pdk);
    }
    if (circuitBrowserFilters.difficulty) {
        circuits = circuits.filter(c => DataStore.getDifficulty(c).level === circuitBrowserFilters.difficulty);
    }
    if (circuitBrowserFilters.compliance) {
        circuits = circuits.filter(c => {
            const comp = DataStore.getCompliance(c);
            if (circuitBrowserFilters.compliance === 'pass') return comp.rate === 100;
            if (circuitBrowserFilters.compliance === 'fail') return comp.rate < 100;
            return true;
        });
    }

    const totalPages = Math.ceil(circuits.length / circuitsPerPage) || 1;
    if (circuitsPage > totalPages) circuitsPage = totalPages;
    const start = (circuitsPage - 1) * circuitsPerPage;
    const pageCircuits = circuits.slice(start, start + circuitsPerPage);

    const content = document.getElementById('cb-content');
    if (circuitBrowserView === 'table') {
        content.innerHTML = renderCircuitTable(pageCircuits);
    } else {
        content.innerHTML = `<div class="cards-grid">${pageCircuits.map(c => renderCircuitCard(c)).join('')}</div>`;
        content.querySelectorAll('.circuit-card').forEach(card => {
            card.addEventListener('click', () => Router.navigate('circuit', card.dataset.id));
        });
    }

    renderPagination('cb-pagination', circuitsPage, totalPages, p => {
        circuitsPage = p;
        updateCircuitBrowser();
        window.scrollTo(0, 0);
    });
}

function renderCircuitTable(circuits) {
    return `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>电路名</th>
                        <th>类别</th>
                        <th>PDK</th>
                        <th>变量数</th>
                        <th>难度</th>
                        <th>满足度</th>
                        <th>仿真时间</th>
                    </tr>
                </thead>
                <tbody>
                    ${circuits.map(c => {
                        const diff = DataStore.getDifficulty(c);
                        return `
                        <tr data-id="${c.id}">
                            <td><strong>${c.display_name}</strong></td>
                            <td>${c.category}</td>
                            <td><span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span></td>
                            <td style="font-family:monospace">${c.var_count}</td>
                            <td><span class="badge ${diff.level === 'advanced' ? 'badge-danger' : diff.level === 'intermediate' ? 'badge-warning' : 'badge-success'}">${diff.label}</span></td>
                            <td>${getComplianceBar(c)}</td>
                            <td>${formatTime(c.baseline.sim_time)}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderCircuitCard(c) {
    const diff = DataStore.getDifficulty(c);
    const compliance = DataStore.getCompliance(c);
    return `
        <div class="circuit-card" data-id="${c.id}">
            <div class="status-dot ${c.baseline.meets_specs ? 'success' : 'danger'}"></div>
            <div class="card-header">
                <div class="card-title">${c.display_name}</div>
            </div>
            <div class="card-badges">
                <span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span>
                <span class="badge ${diff.level === 'advanced' ? 'badge-danger' : diff.level === 'intermediate' ? 'badge-warning' : 'badge-success'}">${diff.label}</span>
            </div>
            <p class="card-desc">${c.description || '暂无描述'}</p>
            <div class="card-stats">
                <div class="card-stat">
                    <div>变量数</div>
                    <div class="card-stat-value">${c.var_count}</div>
                </div>
                <div class="card-stat">
                    <div>满足度</div>
                    <div class="card-stat-value" style="color: ${compliance.rate === 100 ? 'var(--success)' : compliance.rate >= 50 ? 'var(--warning)' : 'var(--danger)'}">${compliance.rate}%</div>
                </div>
                <div class="card-stat">
                    <div>仿真时间</div>
                    <div class="card-stat-value">${formatTime(c.baseline.sim_time)}</div>
                </div>
                <div class="card-stat">
                    <div>目标值</div>
                    <div class="card-stat-value">${c.baseline.objective !== null ? c.baseline.objective.toFixed(3) : '-'}</div>
                </div>
            </div>
            ${getComplianceBar(c)}
        </div>
    `;
}

function renderPagination(containerId, current, total, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (total <= 1) { container.innerHTML = ''; return; }

    let html = '<div class="pagination">';
    html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} data-page="${current - 1}">←</button>`;
    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === current - 3 || i === current + 3) {
            html += `<span style="color:var(--text-muted);padding:6px">...</span>`;
        }
    }
    html += `<button class="page-btn" ${current === total ? 'disabled' : ''} data-page="${current + 1}">→</button>`;
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.page);
            if (p >= 1 && p <= total) onChange(p);
        });
    });
}

// ===== 电路详情 / Circuit Detail =====
function renderCircuitDetail(container, id) {
    const c = DataStore.getCircuitById(id);
    if (!c) {
        container.innerHTML = `<div class="loading"><p>电路未找到</p></div>`;
        return;
    }

    const diff = DataStore.getDifficulty(c);
    const compliance = DataStore.getCompliance(c);
    const hasAlgo = DataStore.getAlgoResults(id);
    let objective = c.baseline.objective;
    if (objective === null || objective === undefined) {
        objective = computeObjective(c.baseline.metrics, c.specs);
    }

    container.innerHTML = `
        <a href="#!/circuits" class="back-btn" onclick="event.preventDefault(); Router.navigate('circuits');">← 返回电路浏览器</a>

        <div class="detail-header">
            <h1>${c.display_name}</h1>
            <div class="detail-meta">
                <span class="badge ${getPdkBadgeClass(c.pdk)}">${c.pdk}</span>
                <span class="badge">${c.category}</span>
                <span class="badge ${getParserBadgeClass(c.parser_type)}">${c.parser_type}</span>
                <span class="badge">${c.var_count} 变量</span>
                <span class="badge ${diff.level === 'advanced' ? 'badge-danger' : diff.level === 'intermediate' ? 'badge-warning' : 'badge-success'}">${diff.label}</span>
                <span class="badge ${compliance.rate === 100 ? 'badge-success' : 'badge-danger'}">
                    ${compliance.rate === 100 ? '满足规格' : '不满足规格'}
                </span>
            </div>
            <p class="detail-desc">${c.description || '暂无描述'}</p>
            ${c.source_url ? `<p style="margin-top:8px"><a href="${c.source_url}" target="_blank" style="color:var(--accent);font-size:0.9rem">查看原始仓库 →</a></p>` : ''}
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">变量数</div>
                <div class="metric-value">${c.var_count}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">仿真时间</div>
                <div class="metric-value">${formatTime(c.baseline.sim_time)}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">目标值</div>
                <div class="metric-value" style="color: ${objective === 0 ? 'var(--success)' : 'var(--danger)'}">${objective.toFixed(4)}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">满足率</div>
                <div class="metric-value" style="color: ${compliance.rate === 100 ? 'var(--success)' : compliance.rate >= 50 ? 'var(--warning)' : 'var(--danger)'}">${compliance.rate}%</div>
            </div>
            ${hasAlgo ? `
            <div class="metric-card">
                <div class="metric-label">算法对比</div>
                <div class="metric-value" style="font-size:1rem;color:var(--accent)">已测试</div>
            </div>
            ` : ''}
        </div>

        <div class="tabs-nav">
            <button class="tab-btn active" data-tab="datasheet">规格满足度</button>
            <button class="tab-btn" data-tab="params">设计参数</button>
            ${hasAlgo ? '<button class="tab-btn" data-tab="algo">算法对比</button>' : ''}
            <button class="tab-btn" data-tab="netlist">网表信息</button>
        </div>

        <div class="tab-panel active" id="tab-datasheet">
            ${renderDatasheetTab(c, compliance)}
        </div>
        <div class="tab-panel" id="tab-params">
            ${renderParamsTab(c)}
        </div>
        ${hasAlgo ? `<div class="tab-panel" id="tab-algo">${renderAlgoTab(id)}</div>` : ''}
        <div class="tab-panel" id="tab-netlist">
            ${renderNetlistTab(c)}
        </div>
    `;

    container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const panel = document.getElementById(`tab-${btn.dataset.tab}`);
            if (panel) panel.classList.add('active');
        });
    });

    if (hasAlgo) {
        setTimeout(() => renderAlgoChart(id), 100);
    }
}

function renderDatasheetTab(c, compliance) {
    const algoResults = DataStore.getAlgoResults(c.id);
    const algos = algoResults?.algorithms || {};
    const algoNames = { ga: 'GA', turbo: 'TuRBO', hebo: 'HEBO' };

    let html = `
        <div class="table-container">
            <table class="datasheet-table">
                <thead>
                    <tr>
                        <th>规格项</th>
                        <th>类型</th>
                        <th>目标值</th>
                        <th>实际值 (基线)</th>
                        <th>状态</th>
    `;

    for (const key of Object.keys(algos)) {
        html += `<th>实际值 (${algoNames[key] || key.toUpperCase()})</th><th>状态</th>`;
    }

    html += `</tr></thead><tbody>`;

    for (const item of compliance.items) {
        html += `
            <tr>
                <td class="spec-name">${item.name.toUpperCase()}</td>
                <td class="spec-type">${item.operator}</td>
                <td class="spec-target">${formatNumber(item.target)}</td>
                <td class="spec-actual ${item.status}">${item.actual !== null ? formatNumber(item.actual) : 'N/A'}</td>
                <td><span class="spec-status ${item.status}">${item.status === 'pass' ? 'Pass' : item.status === 'near' ? 'Near' : 'Fail'}</span></td>
        `;

        for (const [algoKey, res] of Object.entries(algos)) {
            const metrics = res.best_metrics || {};
            const actual = metrics[item.name];
            let status = 'fail';
            if (actual !== null && actual !== undefined) {
                if (item.operator === '<' && actual < item.target) status = 'pass';
                else if (item.operator === '>' && actual > item.target) status = 'pass';
                else {
                    const gap = item.operator === '<' ? actual - item.target : item.target - actual;
                    if (gap < Math.abs(item.target) * 0.1) status = 'near';
                }
            }
            html += `
                <td class="spec-actual ${status}">${actual !== null && actual !== undefined ? formatNumber(actual) : 'N/A'}</td>
                <td><span class="spec-status ${status}">${status === 'pass' ? 'Pass' : status === 'near' ? 'Near' : 'Fail'}</span></td>
            `;
        }
        html += `</tr>`;
    }

    html += `</tbody></table></div>`;
    return html;
}

function renderParamsTab(c) {
    return `
        <div class="table-container">
            <table class="vars-table">
                <thead>
                    <tr>
                        <th>参数名</th>
                        <th>默认值</th>
                        <th>下限 (LB)</th>
                        <th>上限 (UB)</th>
                    </tr>
                </thead>
                <tbody>
                    ${c.design_vars.map(v => `
                        <tr>
                            <td style="font-weight:500">${v.name}</td>
                            <td style="font-family:monospace">${formatNumber(v.default)}</td>
                            <td style="font-family:monospace;color:var(--text-muted)">${formatNumber(v.lb)}</td>
                            <td style="font-family:monospace;color:var(--text-muted)">${formatNumber(v.ub)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:20px;color:var(--text-muted);font-size:0.85rem">
            共 ${c.design_vars.length} 个设计参数
        </div>
    `;
}

function renderAlgoTab(circuitId) {
    const algoResults = DataStore.getAlgoResults(circuitId);
    if (!algoResults) return '';

    const algos = algoResults.algorithms;
    const algoNames = { ga: '遗传算法 (GA)', turbo: 'TuRBO', hebo: 'HEBO' };
    const algoColors = { ga: '#22c55e', turbo: '#38bdf8', hebo: '#f59e0b' };

    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
    `;

    for (const [algoKey, res] of Object.entries(algos)) {
        html += `
            <div class="metric-card" style="text-align:left;padding:16px;border-color:${algoColors[algoKey] || 'var(--border-color)'};">
                <div style="font-weight:600;color:${algoColors[algoKey] || 'var(--text-primary)'};margin-bottom:8px;font-size:1rem">${algoNames[algoKey] || algoKey.toUpperCase()}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.8">
                    <div>最优目标值: <strong style="color:var(--text-primary);font-family:monospace">${res.best_obj.toFixed(4)}</strong></div>
                    <div>评估次数: ${res.total_evals}</div>
                    <div>仿真时间: ${formatTime(res.total_time)}</div>
                    <div>Wall-clock: ${formatTime(res.wall_time || res.total_time)}</div>
                </div>
            </div>
        `;
    }

    html += `</div><div id="chart-convergence" class="chart-box" style="height: 320px;"></div>`;
    return html;
}

function renderNetlistTab(c) {
    return `
        <div style="background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--card-radius);padding:20px">
            <h3 style="font-size:1rem;font-weight:600;margin-bottom:16px">网表与来源信息</h3>
            <div style="display:grid;gap:12px;color:var(--text-secondary);font-size:0.9rem">
                <div><strong style="color:var(--text-primary)">电路 ID:</strong> ${c.id}</div>
                <div><strong style="color:var(--text-primary)">名称:</strong> ${c.name}</div>
                <div><strong style="color:var(--text-primary)">类别:</strong> ${c.category}</div>
                <div><strong style="color:var(--text-primary)">PDK:</strong> ${c.pdk}</div>
                <div><strong style="color:var(--text-primary)">解析器:</strong> ${c.parser_type}</div>
                <div><strong style="color:var(--text-primary)">来源:</strong> ${c.source || '-'}</div>
                <div><strong style="color:var(--text-primary)">作者:</strong> ${c.author || '-'}</div>
                <div><strong style="color:var(--text-primary)">许可证:</strong> ${c.license || '-'}</div>
                ${c.source_url ? `<div><strong style="color:var(--text-primary)">仓库链接:</strong> <a href="${c.source_url}" target="_blank" style="color:var(--accent)">${c.source_url}</a></div>` : ''}
            </div>
        </div>
    `;
}

function renderAlgoChart(circuitId) {
    const algoResults = DataStore.getAlgoResults(circuitId);
    if (!algoResults) return;

    const algos = algoResults.algorithms;
    const algoNames = { ga: 'GA', turbo: 'TuRBO', hebo: 'HEBO' };
    const algoColors = { ga: '#22c55e', turbo: '#38bdf8', hebo: '#f59e0b' };

    const allEvals = new Set();
    Object.values(algos).forEach(a => {
        a.history.forEach(h => allEvals.add(h.eval));
    });
    const sortedEvals = Array.from(allEvals).sort((a, b) => a - b);

    const seriesData = Object.entries(algos).map(([key, res]) => {
        const data = sortedEvals.map(e => {
            let best = Infinity;
            for (const h of res.history) {
                if (h.eval <= e && h.best_obj < best) best = h.best_obj;
            }
            return best === Infinity ? null : best;
        });
        return {
            name: algoNames[key] || key.toUpperCase(),
            data: data,
            color: algoColors[key] || ChartColors.primary[0],
        };
    });

    renderConvergenceChart('chart-convergence', seriesData, seriesData.map(s => s.name));
}

// ===== 算法对比页 / Algorithms =====
function renderAlgorithms(container) {
    const algoStats = DataStore.getAlgoStats();
    const hasAlgo = DataStore.hasAlgoResults();

    if (!hasAlgo) {
        container.innerHTML = `
            <div class="page-header"><h1>算法对比</h1></div>
            <div class="loading"><p>暂无算法对比数据</p></div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="page-header">
            <h1>算法对比</h1>
            <p>GA · TuRBO · HEBO 在多电路上的综合表现对比</p>
        </div>

        ${renderAlgoLeaderboardSection(algoStats)}

        <div class="charts-row">
            <div class="chart-container">
                <div class="chart-title">雷达图对比</div>
                <div id="chart-radar" class="chart-box"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">胜率热力图</div>
                <div id="chart-heatmap" class="chart-box"></div>
            </div>
        </div>

        <h2 class="section-title">收敛曲线画廊</h2>
        <div class="gallery-grid" id="algo-gallery"></div>
    `;

    setTimeout(() => {
        const indicators = ['成功率', '速度', '稳定性', '收敛效率', 'FOM'];
        const radarData = algoStats.map(s => {
            const successScore = Math.min(100, s.successRate);
            const speedScore = Math.max(0, 100 - (s.avgEvals / 5));
            const stabilityScore = s.foms.length > 1
                ? Math.max(0, 100 - (stdDev(s.foms) * 100))
                : 80;
            const efficiencyScore = s.avgFOM === 0 ? 100 : Math.max(0, 100 - s.avgFOM * 50);
            const fomScore = s.avgFOM === 0 ? 100 : Math.max(0, 100 - s.avgFOM * 100);
            return {
                name: s.name.split(' ')[0],
                value: [successScore, speedScore, stabilityScore, efficiencyScore, fomScore],
            };
        });
        renderRadarChart('chart-radar', indicators, radarData);

        const algoKeys = algoStats.map(s => s.key);
        const algoLabels = algoStats.map(s => s.name.split(' ')[0]);
        const heatmapData = algoKeys.map((ak, i) => {
            return algoKeys.map((bk, j) => {
                if (i === j) return 50;
                let wins = 0, total = 0;
                for (const data of Object.values(DataStore.algoData || {})) {
                    const a = data.algorithms[ak];
                    const b = data.algorithms[bk];
                    if (a && b) {
                        total++;
                        if (a.best_obj < b.best_obj) wins++;
                        else if (a.best_obj === b.best_obj) wins += 0.5;
                    }
                }
                return total > 0 ? Math.round((wins / total) * 100) : 50;
            });
        });
        renderHeatmapChart('chart-heatmap', algoLabels, algoLabels, heatmapData);

        renderAlgoGallery();
    }, 100);
}

function stdDev(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

function renderAlgoGallery() {
    const gallery = document.getElementById('algo-gallery');
    if (!gallery) return;

    const algoNames = { ga: 'GA', turbo: 'TuRBO', hebo: 'HEBO' };
    const algoColors = { ga: '#22c55e', turbo: '#38bdf8', hebo: '#f59e0b' };

    let html = '';
    let idx = 0;
    for (const [circuitId, data] of Object.entries(DataStore.algoData || {})) {
        const circuit = DataStore.getCircuitById(circuitId);
        const chartId = `gallery-chart-${idx++}`;
        html += `
            <div class="gallery-item" data-circuit="${circuitId}">
                <div class="gallery-item-title">${circuit ? circuit.display_name : circuitId}</div>
                <div id="${chartId}" class="gallery-item-chart"></div>
            </div>
        `;
    }
    gallery.innerHTML = html;

    idx = 0;
    for (const data of Object.values(DataStore.algoData || {})) {
        const chartId = `gallery-chart-${idx++}`;
        const algos = data.algorithms;
        const allEvals = new Set();
        Object.values(algos).forEach(a => {
            a.history.forEach(h => allEvals.add(h.eval));
        });
        const sortedEvals = Array.from(allEvals).sort((a, b) => a - b);

        const seriesData = Object.entries(algos).map(([key, res]) => {
            const seriesValues = sortedEvals.map(e => {
                let best = Infinity;
                for (const h of res.history) {
                    if (h.eval <= e && h.best_obj < best) best = h.best_obj;
                }
                return best === Infinity ? null : best;
            });
            return {
                name: algoNames[key] || key.toUpperCase(),
                data: seriesValues,
                color: algoColors[key] || ChartColors.primary[0],
            };
        });

        renderConvergenceChart(chartId, seriesData, seriesData.map(s => s.name));
    }

    gallery.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => Router.navigate('circuit', item.dataset.circuit));
    });
}

// ===== 规格满足矩阵 / Compliance Matrix =====
let matrixAlgoFilter = '';

function renderMatrix(container) {
    const algoNames = DataStore.getAlgoNames();

    container.innerHTML = `
        <div class="page-header">
            <h1>规格满足矩阵</h1>
            <p>全局视角：${DataStore.getStats().total_circuits} 个电路 × 规格项的满足状态一览</p>
        </div>

        <div class="filter-bar" style="margin-bottom:16px">
            <div class="filter-group">
                <label>算法筛选</label>
                <select id="matrix-algo">
                    <option value="">基线 (Baseline)</option>
                    ${algoNames.map(a => `<option value="${a}" ${matrixAlgoFilter === a ? 'selected' : ''}>${a.toUpperCase()}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="table-container matrix-container" id="matrix-table-container"></div>
    `;

    document.getElementById('matrix-algo').addEventListener('change', e => {
        matrixAlgoFilter = e.target.value;
        updateMatrix();
    });

    updateMatrix();
}

function updateMatrix() {
    const circuits = DataStore.getCircuits();
    const container = document.getElementById('matrix-table-container');

    const allSpecs = new Set();
    for (const c of circuits) {
        for (const s of c.specs || []) allSpecs.add(s.name);
    }
    const specList = Array.from(allSpecs);

    let html = `
        <table class="matrix-table">
            <thead>
                <tr>
                    <th style="text-align:left;min-width:160px">电路</th>
                    ${specList.map(s => `<th>${s.toUpperCase()}</th>`).join('')}
                    <th>Overall</th>
                </tr>
            </thead>
            <tbody>
    `;

    const colRates = new Array(specList.length).fill(0);
    const colCounts = new Array(specList.length).fill(0);

    for (const c of circuits) {
        const metrics = matrixAlgoFilter
            ? (DataStore.getAlgoResults(c.id)?.algorithms?.[matrixAlgoFilter]?.best_metrics || c.baseline.metrics)
            : c.baseline.metrics;

        let passedCount = 0;
        let specCount = 0;

        html += `<tr><td style="text-align:left;font-weight:500">${c.display_name}</td>`;

        for (let i = 0; i < specList.length; i++) {
            const specName = specList[i];
            const specDef = c.specs?.find(s => s.name === specName);
            if (!specDef) {
                html += `<td><span class="matrix-cell" style="color:var(--text-muted)">-</span></td>`;
                continue;
            }

            const actual = metrics[specName];
            let status = 'fail';
            if (actual !== null && actual !== undefined) {
                if (specDef.operator === '<' && actual < specDef.target) status = 'pass';
                else if (specDef.operator === '>' && actual > specDef.target) status = 'pass';
                else {
                    const gap = specDef.operator === '<' ? actual - specDef.target : specDef.target - actual;
                    if (gap < Math.abs(specDef.target) * 0.1) status = 'near';
                }
            }

            if (status === 'pass') passedCount++;
            specCount++;
            colRates[i] += status === 'pass' ? 1 : 0;
            colCounts[i]++;

            const symbol = status === 'pass' ? '✓' : status === 'near' ? '~' : '✗';
            html += `<td><span class="matrix-cell ${status}">${symbol}</span></td>`;
        }

        const overallRate = specCount > 0 ? Math.round((passedCount / specCount) * 100) : 0;
        const overallColor = overallRate >= 80 ? 'var(--success)' : overallRate >= 50 ? 'var(--warning)' : 'var(--danger)';
        html += `<td><span class="matrix-overall" style="color:${overallColor}">${overallRate}%</span></td></tr>`;
    }

    html += `<tr style="border-top:2px solid var(--border-color);background:rgba(255,255,255,0.02)">
        <td style="text-align:left;font-weight:600">满足率</td>
        ${specList.map((_, i) => {
            const rate = colCounts[i] > 0 ? Math.round((colRates[i] / colCounts[i]) * 100) : 0;
            const color = rate >= 80 ? 'var(--success)' : rate >= 50 ? 'var(--warning)' : 'var(--danger)';
            return `<td style="font-weight:600;color:${color}">${rate}%</td>`;
        }).join('')}
        <td></td>
    </tr>`;

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ===== 初始化 =====
Router.init();
