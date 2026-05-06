// ECharts 图表封装
const ChartColors = {
    primary: ['#38bdf8', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#06b6d4', '#fb923c'],
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    grid: '#334155',
    bg: '#1e293b',
};

const ChartTheme = {
    textStyle: { color: ChartColors.text, fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' },
    title: { textStyle: { color: ChartColors.text } },
    legend: { textStyle: { color: ChartColors.textSecondary } },
    tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
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
    document.querySelectorAll('.chart-box').forEach(el => {
        const chart = echarts.getInstanceByDom(el);
        if (chart) chart.resize();
    });
}

window.addEventListener('resize', resizeCharts);

// ===== 饼图（环形） =====
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
            radius: ['45%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#0f172a', borderWidth: 2 },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 13, fontWeight: 'bold', color: ChartColors.text }
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
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        series: [{
            type: 'bar',
            data: values,
            itemStyle: {
                color: color || '#38bdf8',
                borderRadius: [4, 4, 0, 0],
            },
            barWidth: '55%',
        }],
    });
}

// ===== 水平柱状图 =====
function renderHorizontalBarChart(domId, categories, values, title, color) {
    return initChart(domId, {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
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
                color: color || '#38bdf8',
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
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        yAxis: {
            type: 'value',
            name: yName,
            nameTextStyle: { color: ChartColors.textSecondary },
            axisLine: { lineStyle: { color: ChartColors.grid } },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
            axisLabel: { color: ChartColors.textSecondary },
        },
        series: [{
            type: 'scatter',
            data: data,
            symbolSize: 10,
            itemStyle: { color: '#38bdf8' },
        }],
    });
}

// ===== 收敛曲线图 =====
function renderConvergenceChart(domId, seriesData, legendData) {
    return initChart(domId, {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: '#334155',
            textStyle: { color: '#f1f5f9' },
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
            textStyle: { color: '#cbd5e1', fontSize: 12 },
            top: 10,
            itemGap: 20,
        },
        grid: { left: '3%', right: '4%', bottom: '5%', top: '18%', containLabel: true },
        xAxis: {
            type: 'category',
            name: '评估次数',
            nameTextStyle: { color: '#64748b', fontSize: 12 },
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' },
            splitLine: { show: false },
        },
        yAxis: {
            type: 'value',
            name: '最优目标值',
            nameTextStyle: { color: '#64748b', fontSize: 12 },
            axisLine: { lineStyle: { color: '#334155' } },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
            axisLabel: { color: '#64748b' },
        },
        series: seriesData.map((s, i) => {
            const color = s.color || ChartColors.primary[i % ChartColors.primary.length];
            return {
                name: s.name,
                type: 'line',
                data: s.data,
                smooth: 0.3,
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: false,
                lineStyle: { width: 2.5, color: color },
                itemStyle: { color: color },
                emphasis: { focus: 'series', lineStyle: { width: 3.5 } },
            };
        }),
    });
}

// ===== 规格偏差图 =====
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
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
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
            barWidth: '55%',
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

// ===== 雷达图 =====
function renderRadarChart(domId, indicators, seriesData) {
    return initChart(domId, {
        tooltip: { trigger: 'item' },
        legend: {
            data: seriesData.map(s => s.name),
            textStyle: { color: ChartColors.textSecondary },
            bottom: 0,
        },
        radar: {
            indicator: indicators.map(i => ({ name: i, max: 100 })),
            shape: 'polygon',
            splitNumber: 4,
            axisName: { color: ChartColors.textSecondary, fontSize: 12 },
            splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.3)' } },
            splitArea: { show: true, areaStyle: { color: ['rgba(15,23,42,0.5)', 'rgba(15,23,42,0.3)'] } },
            axisLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.5)' } },
        },
        series: [{
            type: 'radar',
            data: seriesData.map((s, i) => ({
                value: s.value,
                name: s.name,
                lineStyle: { width: 2, color: ChartColors.primary[i % ChartColors.primary.length] },
                itemStyle: { color: ChartColors.primary[i % ChartColors.primary.length] },
                areaStyle: { opacity: 0.15, color: ChartColors.primary[i % ChartColors.primary.length] },
            })),
        }],
    });
}

// ===== 热力图（胜率矩阵） =====
function renderHeatmapChart(domId, xLabels, yLabels, data) {
    const flatData = [];
    for (let i = 0; i < yLabels.length; i++) {
        for (let j = 0; j < xLabels.length; j++) {
            flatData.push([j, i, data[i][j]]);
        }
    }

    return initChart(domId, {
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return `${yLabels[params.data[1]]} vs ${xLabels[params.data[0]]}<br/>胜率: ${params.data[2]}%`;
            }
        },
        grid: { left: '12%', right: '8%', bottom: '12%', top: '5%' },
        xAxis: {
            type: 'category',
            data: xLabels,
            splitArea: { show: true, areaStyle: { color: ['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.1)'] } },
            axisLabel: { color: ChartColors.textSecondary },
            axisLine: { show: false },
        },
        yAxis: {
            type: 'category',
            data: yLabels,
            splitArea: { show: true, areaStyle: { color: ['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.1)'] } },
            axisLabel: { color: ChartColors.textSecondary },
            axisLine: { show: false },
        },
        visualMap: {
            min: 0,
            max: 100,
            calculable: false,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: {
                color: ['#ef4444', '#f59e0b', '#22c55e']
            },
            textStyle: { color: ChartColors.textSecondary },
        },
        series: [{
            type: 'heatmap',
            data: flatData,
            label: {
                show: true,
                formatter: function(params) {
                    return params.data[2] + '%';
                },
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold',
            },
            itemStyle: {
                borderColor: '#0f172a',
                borderWidth: 2,
                borderRadius: 4,
            },
            emphasis: {
                itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' }
            }
        }],
    });
}

// ===== 环形仪表图 =====
function renderGaugeChart(domId, value, name, color) {
    return initChart(domId, {
        series: [{
            type: 'gauge',
            startAngle: 90,
            endAngle: -270,
            pointer: { show: false },
            progress: {
                show: true,
                overlap: false,
                roundCap: true,
                clip: false,
                itemStyle: { color: color || '#38bdf8' }
            },
            axisLine: { lineStyle: { width: 12, color: [[1, '#334155']] } },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            data: [{
                value: value,
                name: name,
                title: { offsetCenter: ['0%', '30%'], fontSize: 14, color: ChartColors.textSecondary },
                detail: {
                    valueAnimation: true,
                    offsetCenter: ['0%', '-10%'],
                    fontSize: 28,
                    fontWeight: 'bold',
                    formatter: '{value}%',
                    color: ChartColors.text,
                }
            }],
        }]
    });
}
