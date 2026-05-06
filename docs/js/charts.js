// ECharts 图表封装
const ChartColors = {
    primary: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    grid: '#1e1e2e',
};

const ChartTheme = {
    textStyle: { color: ChartColors.text, fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
    title: { textStyle: { color: ChartColors.text } },
    legend: { textStyle: { color: ChartColors.textSecondary } },
    tooltip: {
        backgroundColor: 'rgba(19, 19, 31, 0.95)',
        borderColor: '#1e1e2e',
        textStyle: { color: ChartColors.text },
    },
};

function initChart(domId, option) {
    const el = document.getElementById(domId);
    if (!el) return null;
    const chart = echarts.init(el, null, { renderer: 'canvas' });
    chart.setOption({ ...ChartTheme, ...option });
    return chart;
}

function resizeCharts() {
    echarts.getInstanceByDom(document.querySelector('.chart-box'));
    document.querySelectorAll('.chart-box').forEach(el => {
        const chart = echarts.getInstanceByDom(el);
        if (chart) chart.resize();
    });
}

window.addEventListener('resize', resizeCharts);

// ===== 饼图 =====
function renderPieChart(domId, data, title) {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    return initChart(domId, {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { color: ChartColors.textSecondary, fontSize: 12 },
        },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 6, borderColor: '#0a0a0f', borderWidth: 2 },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold', color: ChartColors.text }
            },
            data: entries.map(([name, value], i) => ({
                name, value,
                itemStyle: { color: ChartColors.primary[i % ChartColors.primary.length] }
            })),
        }],
    });
}

// ===== 柱状图 =====
function renderBarChart(domId, categories, values, title, color) {
    return initChart(domId, {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary, fontSize: 11 },
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        series: [{
            type: 'bar',
            data: values,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: color || '#3b82f6' },
                    { offset: 1, color: color ? color + '66' : '#3b82f666' }
                ]),
                borderRadius: [4, 4, 0, 0],
            },
            barWidth: '60%',
        }],
    });
}

// ===== 水平条形图 =====
function renderHorizontalBarChart(domId, categories, values, title, color) {
    return initChart(domId, {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary, fontSize: 11 },
        },
        series: [{
            type: 'bar',
            data: values,
            itemStyle: {
                color: color || '#3b82f6',
                borderRadius: [0, 4, 4, 0],
            },
            barWidth: '50%',
            label: { show: true, position: 'right', color: ChartColors.textSecondary, fontSize: 11 },
        }],
    });
}

// ===== 散点图 =====
function renderScatterChart(domId, data, xName, yName) {
    return initChart(domId, {
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                return `${params.data[2]}<br/>${xName}: ${params.data[0]}<br/>${yName}: ${params.data[1].toFixed(2)}s`;
            }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
            type: 'value',
            name: xName,
            nameTextStyle: { color: ChartColors.textSecondary },
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        yAxis: {
            type: 'value',
            name: yName,
            nameTextStyle: { color: ChartColors.textSecondary },
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        series: [{
            type: 'scatter',
            data: data,
            symbolSize: 12,
            itemStyle: {
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#1d4ed8' }
                ]),
                shadowBlur: 8,
                shadowColor: 'rgba(59, 130, 246, 0.3)',
            },
        }],
    });
}

// ===== 收敛曲线图 =====
function renderConvergenceChart(domId, seriesData, legendData) {
    return initChart(domId, {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(5, 5, 8, 0.95)',
            borderColor: 'rgba(0, 212, 255, 0.2)',
            textStyle: { color: '#e2e8f0' },
            formatter: function(params) {
                let s = `<div style="font-weight:600;margin-bottom:6px;">评估次数: ${params[0].axisValue}</div>`;
                params.forEach(p => {
                    const val = p.value?.toFixed ? p.value.toFixed(4) : p.value;
                    s += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
                        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};"></span>
                        <span style="flex:1;">${p.seriesName}:</span>
                        <span style="font-weight:600;">${val}</span>
                    </div>`;
                });
                return s;
            }
        },
        legend: {
            data: legendData,
            textStyle: { color: '#94a3b8', fontSize: 13 },
            top: 10,
            itemGap: 20,
            itemWidth: 20,
            itemHeight: 10,
        },
        grid: { left: '3%', right: '4%', bottom: '5%', top: '18%', containLabel: true },
        xAxis: {
            type: 'category',
            name: '评估次数',
            nameTextStyle: { color: '#64748b', fontSize: 12 },
            axisLine: { lineStyle: { color: 'rgba(100,116,139,0.2)' } },
            axisLabel: { color: '#64748b' },
            splitLine: { show: false },
        },
        yAxis: {
            type: 'value',
            name: '最优目标值 (log)',
            nameTextStyle: { color: '#64748b', fontSize: 12 },
            axisLine: { lineStyle: { color: 'rgba(100,116,139,0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(100,116,139,0.1)' } },
            axisLabel: { color: '#64748b' },
            logBase: 10,
        },
        series: seriesData.map((s, i) => {
            const color = s.color || ChartColors.primary[i % ChartColors.primary.length];
            return {
                name: s.name,
                type: 'line',
                data: s.data,
                smooth: 0.3,
                symbol: 'circle',
                symbolSize: 8,
                showSymbol: true,
                lineStyle: {
                    width: 3,
                    color: color,
                    shadowBlur: 10,
                    shadowColor: color,
                },
                itemStyle: {
                    color: color,
                    borderWidth: 2,
                    borderColor: '#050508',
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: color + '33' },
                        { offset: 1, color: color + '05' },
                    ]),
                },
                emphasis: {
                    focus: 'series',
                    lineStyle: { width: 4 },
                },
            };
        }),
    });
}

// ===== 规格满足率对比图 =====
function renderSpecBarChart(domId, data) {
    const categories = data.map(d => d.name);
    const violations = data.map(d => d.violation);
    const colors = violations.map(v => v <= 0 ? '#22c55e' : '#ef4444');

    return initChart(domId, {
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                const p = params[0];
                const d = data[p.dataIndex];
                return `${d.fullName}<br/>实际值: ${d.actual.toFixed(3)}<br/>目标值: ${d.target}<br/>偏差: ${d.violation.toFixed(3)}`;
            }
        },
        grid: { left: '3%', right: '5%', bottom: '3%', top: '5%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        yAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: ChartColors.grid } },
            axisLabel: { color: ChartColors.textSecondary, fontSize: 10 },
            inverse: true,
        },
        series: [{
            type: 'bar',
            data: violations.map((v, i) => ({
                value: Math.max(0, v),
                itemStyle: { color: colors[i], borderRadius: [0, 4, 4, 0] }
            })),
            barWidth: '60%',
            label: {
                show: true,
                position: 'right',
                formatter: function(params) {
                    const d = data[params.dataIndex];
                    return d.violation <= 0 ? '✓' : '+' + d.violation.toFixed(2);
                },
                color: ChartColors.textSecondary,
                fontSize: 10,
            },
        }],
    });
}
