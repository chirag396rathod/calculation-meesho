/**
 * charts.js — Chart.js Visualizations
 * Renders beautiful charts for the analytics dashboard
 */

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Custom chart defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.95)';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };

const chartInstances = {};

/**
 * Destroy an existing chart instance
 */
function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

/**
 * Render Order Status Distribution (Donut Chart)
 */
export function renderStatusChart(canvasId, statusDistribution) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = Object.keys(statusDistribution).filter(k => statusDistribution[k] > 0);
  const data = labels.map(k => statusDistribution[k]);
  
  const colorMap = {
    'Delivered': '#10b981',
    'Shipped': '#3b82f6',
    'Return': '#ef4444',
    'RTO': '#f97316',
    'Cancelled': '#64748b',
    'Exchange': '#8b5cf6'
  };

  const colors = labels.map(l => colorMap[l] || '#8b5cf6');

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render Profit Breakdown (Donut Chart)
 */
export function renderProfitBreakdownChart(canvasId, analytics) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = ['Net Profit', 'Return Charges', 'Raw Cost', 'Ads Spend'];
  const data = [
    Math.max(0, analytics.netProfit),
    analytics.totalReturnCharges,
    analytics.totalRawCost,
    analytics.totalAdsSpend
  ].filter((v, i) => v > 0 || i === 0);

  const filteredLabels = labels.filter((_, i) => data[i] > 0 || i === 0);

  const colors = ['#10b981', '#ef4444', '#f59e0b', '#6366f1'];
  const filteredColors = colors.filter((_, i) => data[i] > 0 || i === 0);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: filteredLabels,
      datasets: [{
        data: data.filter(v => v > 0),
        backgroundColor: filteredColors,
        borderWidth: 0,
        hoverOffset: 8,
        spacing: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              return ` ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render SKU-wise Profit Bar Chart
 */
export function renderSkuProfitChart(canvasId, skuAnalytics, limit = 15) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const sorted = [...skuAnalytics].sort((a, b) => b.netProfit - a.netProfit).slice(0, limit);
  const labels = sorted.map(s => s.sku.length > 18 ? s.sku.substring(0, 18) + '…' : s.sku);
  const profits = sorted.map(s => s.netProfit);
  const colors = profits.map(p => p >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
  const borderColors = profits.map(p => p >= 0 ? '#10b981' : '#ef4444');

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Net Profit',
        data: profits,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Profit: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            callback: (val) => `₹${(val / 1000).toFixed(0)}K`,
            font: { size: 11 }
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' } }
        }
      }
    }
  });
}

/**
 * Render Monthly Comparison Chart
 */
export function renderMonthlyChart(canvasId, monthlyAnalytics) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = monthlyAnalytics.map(m => m.label);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Delivered',
          data: monthlyAnalytics.map(m => m.delivered),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Returns',
          data: monthlyAnalytics.map(m => m.returned),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'RTO',
          data: monthlyAnalytics.map(m => m.rto),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderColor: '#f97316',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 12, weight: '500' }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/**
 * Render Return Rate by SKU Chart
 */
export function renderReturnRateChart(canvasId, skuAnalytics, limit = 10) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const sorted = [...skuAnalytics]
    .filter(s => s.totalOrders >= 3)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, limit);

  const labels = sorted.map(s => s.sku.length > 18 ? s.sku.substring(0, 18) + '…' : s.sku);
  const rates = sorted.map(s => s.returnRate);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Return Rate %',
        data: rates,
        backgroundColor: rates.map(r => {
          if (r > 50) return 'rgba(239, 68, 68, 0.7)';
          if (r > 30) return 'rgba(249, 115, 22, 0.7)';
          return 'rgba(245, 158, 11, 0.7)';
        }),
        borderColor: rates.map(r => {
          if (r > 50) return '#ef4444';
          if (r > 30) return '#f97316';
          return '#f59e0b';
        }),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Return Rate: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          max: 100,
          ticks: {
            callback: (val) => `${val}%`,
            font: { size: 11 }
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' } }
        }
      }
    }
  });
}

/**
 * Render Return Charges by SKU (horizontal bar)
 */
export function renderReturnChargesChart(canvasId, skuAnalytics, limit = 10) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const sorted = [...skuAnalytics]
    .filter(s => s.totalReturnCharges > 0)
    .sort((a, b) => b.totalReturnCharges - a.totalReturnCharges)
    .slice(0, limit);

  const labels = sorted.map(s => s.sku.length > 18 ? s.sku.substring(0, 18) + '…' : s.sku);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Return Charges',
          data: sorted.map(s => s.returnCharges),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'RTO Charges',
          data: sorted.map(s => s.rtoCharges),
          backgroundColor: 'rgba(249, 115, 22, 0.6)',
          borderColor: '#f97316',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 11, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            callback: (val) => `₹${(val / 1000).toFixed(0)}K`,
            font: { size: 11 }
          }
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' } }
        }
      }
    }
  });
}

/**
 * Render Group-wise Return Charges Chart
 */
export function renderGroupReturnChart(canvasId, groupAnalytics) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const sorted = [...groupAnalytics]
    .filter(g => g.totalReturnCharges > 0)
    .sort((a, b) => b.totalReturnCharges - a.totalReturnCharges);

  if (sorted.length === 0) return;

  const labels = sorted.map(g => g.name.length > 20 ? g.name.substring(0, 20) + '…' : g.name);

  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Return Charges',
          data: sorted.map(g => {
            // Sum return charges from SKU analytics
            return g.returnCharges || 0;
          }),
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'RTO Charges',
          data: sorted.map(g => {
            return g.rtoCharges || 0;
          }),
          backgroundColor: 'rgba(249, 115, 22, 0.6)',
          borderColor: '#f97316',
          borderWidth: 1,
          borderRadius: 4
        },
        {
          label: 'Delivered (Settlement)',
          data: sorted.map(g => g.deliveredSettlement || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { size: 11, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '500' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            callback: (val) => `₹${(val / 1000).toFixed(0)}K`,
            font: { size: 11 }
          }
        }
      }
    }
  });
}

/**
 * Destroy all chart instances
 */
export function destroyAllCharts() {
  Object.keys(chartInstances).forEach(id => destroyChart(id));
}
