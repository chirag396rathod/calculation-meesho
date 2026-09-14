/**
 * ui.js — DOM Rendering & Interactions
 * Handles all UI rendering, event binding, and DOM updates
 */

import { formatCurrency, formatNumber, formatPercent } from './analytics.js';
import { skuManager } from './skuManager.js';

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Render the dashboard metrics cards
 */
export function renderMetrics(analytics) {
  const container = document.getElementById('metricsGrid');
  if (!container) return;

  const profitClass = analytics.netProfit >= 0 ? 'profit' : 'loss';
  const profitSign = analytics.netProfit >= 0 ? '+' : '';

  container.innerHTML = `
    <div class="metric-card info">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: rgba(99, 102, 241, 0.15)">📦</div>
        <span class="metric-change positive">${analytics.deliveredCount + analytics.shippedCount} success</span>
      </div>
      <div class="metric-value">${formatNumber(analytics.totalOrders)}</div>
      <div class="metric-label">Total Orders</div>
      <div class="metric-sub">${analytics.deliveredCount} delivered · ${analytics.shippedCount} shipped</div>
    </div>

    <div class="metric-card profit">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: rgba(16, 185, 129, 0.15)">💰</div>
      </div>
      <div class="metric-value text-success">${formatCurrency(analytics.netSettlement)}</div>
      <div class="metric-label">Net Settlement</div>
      <div class="metric-sub">Received: ${formatCurrency(analytics.totalPositiveSettlement)}</div>
    </div>

    <div class="metric-card loss">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: rgba(239, 68, 68, 0.15)">🔄</div>
        <span class="metric-change negative">${analytics.returnCount + analytics.rtoCount} returns</span>
      </div>
      <div class="metric-value text-danger">-${formatCurrency(analytics.totalReturnCharges)}</div>
      <div class="metric-label">Return & RTO Charges</div>
      <div class="metric-sub">Returns: ${formatCurrency(analytics.returnCharges)} · RTO: ${formatCurrency(analytics.rtoCharges)}</div>
    </div>

    <div class="metric-card warning">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: rgba(245, 158, 11, 0.15)">🏭</div>
      </div>
      <div class="metric-value text-warning">${formatCurrency(analytics.totalRawCost)}</div>
      <div class="metric-label">Raw Cost (Product)</div>
      <div class="metric-sub">${analytics.deliveredCount + analytics.shippedCount} units × avg cost</div>
    </div>

    <div class="metric-card info">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: rgba(99, 102, 241, 0.15)">📢</div>
      </div>
      <div class="metric-value" style="color: #818cf8">${formatCurrency(analytics.totalAdsSpend)}</div>
      <div class="metric-label">Ads Spend</div>
      <div class="metric-sub">Total advertising cost</div>
    </div>

    <div class="metric-card ${profitClass}">
      <div class="metric-header">
        <div class="metric-icon" style="--icon-bg: ${analytics.netProfit >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}">
          ${analytics.netProfit >= 0 ? '📈' : '📉'}
        </div>
        <span class="metric-change ${analytics.netProfit >= 0 ? 'positive' : 'negative'}">
          ${profitSign}${formatPercent(analytics.profitMargin)} margin
        </span>
      </div>
      <div class="metric-value ${analytics.netProfit >= 0 ? 'text-success' : 'text-danger'}">
        ${formatCurrency(analytics.netProfit)}
      </div>
      <div class="metric-label">Net Profit</div>
      <div class="metric-sub">Settlement - Returns - Cost - Ads</div>
    </div>
  `;
}

/**
 * Render SKU Analytics Table
 */
export function renderSkuTable(skuAnalytics, filter = 'all', search = '') {
  const tbody = document.getElementById('skuTableBody');
  if (!tbody) return;

  let filtered = [...skuAnalytics];

  // Apply status filter
  if (filter !== 'all') {
    filtered = filtered.filter(s => {
      if (filter === 'profitable') return s.netProfit > 0;
      if (filter === 'loss') return s.netProfit <= 0;
      if (filter === 'high-return') return s.returnRate > 30;
      return true;
    });
  }

  // Apply search
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.sku.toLowerCase().includes(q) ||
      s.productName.toLowerCase().includes(q) ||
      s.group.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="11" style="text-align: center; padding: 40px; color: var(--text-muted);">
        No SKUs match your filter criteria
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td class="sku-name">${s.sku}</td>
      <td><span class="tag">${s.group}</span></td>
      <td>${s.totalOrders}</td>
      <td><span class="status-badge delivered">${s.delivered}</span></td>
      <td><span class="status-badge return">${s.returned}</span></td>
      <td><span class="status-badge rto">${s.rto}</span></td>
      <td class="amount ${s.totalSettlement >= 0 ? 'positive' : 'negative'}">${formatCurrency(s.totalSettlement)}</td>
      <td class="amount negative">${s.totalReturnCharges > 0 ? '-' + formatCurrency(s.totalReturnCharges) : '₹0'}</td>
      <td class="amount neutral">${formatCurrency(s.rawCostTotal)}</td>
      <td class="amount ${s.netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(s.netProfit)}</td>
      <td><span class="${s.returnRate > 30 ? 'text-danger' : s.returnRate > 15 ? 'text-warning' : 'text-success'}">${formatPercent(s.returnRate)}</span></td>
    </tr>
  `).join('');
}

/**
 * Render Group Analytics Table
 */
export function renderGroupTable(groupAnalytics) {
  const tbody = document.getElementById('groupTableBody');
  if (!tbody) return;

  tbody.innerHTML = groupAnalytics.map(g => `
    <tr>
      <td class="sku-name">${g.name}</td>
      <td>${g.skus.length} SKUs</td>
      <td>${formatCurrency(g.rawCost)}/unit</td>
      <td>${g.totalOrders}</td>
      <td><span class="status-badge delivered">${g.delivered}</span></td>
      <td><span class="status-badge return">${g.returned + g.rto}</span></td>
      <td class="amount ${g.totalSettlement >= 0 ? 'positive' : 'negative'}">${formatCurrency(g.totalSettlement)}</td>
      <td class="amount negative">${g.totalReturnCharges > 0 ? '-' + formatCurrency(g.totalReturnCharges) : '₹0'}</td>
      <td class="amount neutral">${formatCurrency(g.rawCostTotal)}</td>
      <td class="amount ${g.netProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(g.netProfit)}</td>
      <td><span class="${g.returnRate > 30 ? 'text-danger' : g.returnRate > 15 ? 'text-warning' : 'text-success'}">${formatPercent(g.returnRate)}</span></td>
    </tr>
  `).join('');
}

/**
 * Render Return Analysis section
 */
export function renderReturnAnalysis(analytics) {
  const container = document.getElementById('returnSummaryCards');
  if (!container) return;

  const totalReturns = analytics.returnCount + analytics.rtoCount;
  const overallReturnRate = analytics.totalOrders > 0
    ? ((totalReturns / analytics.totalOrders) * 100)
    : 0;

  container.innerHTML = `
    <div class="return-card">
      <div class="return-value">${totalReturns}</div>
      <div class="return-label">Total Returns + RTO</div>
    </div>
    <div class="return-card">
      <div class="return-value">${formatPercent(overallReturnRate)}</div>
      <div class="return-label">Overall Return Rate</div>
    </div>
    <div class="return-card">
      <div class="return-value text-danger">-${formatCurrency(analytics.totalReturnCharges)}</div>
      <div class="return-label">Total Return Charges</div>
    </div>
  `;
}

/**
 * Render Return Detail Table (SKU-wise return breakdown)
 */
export function renderReturnTable(skuAnalytics) {
  const tbody = document.getElementById('returnTableBody');
  if (!tbody) return;

  const returningSkus = skuAnalytics
    .filter(s => s.returned + s.rto > 0)
    .sort((a, b) => b.totalReturnCharges - a.totalReturnCharges);

  if (returningSkus.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
        No return data available
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = returningSkus.map(s => `
    <tr>
      <td class="sku-name">${s.sku}</td>
      <td><span class="tag">${s.group}</span></td>
      <td>${s.totalOrders}</td>
      <td><span class="status-badge return">${s.returned}</span></td>
      <td><span class="status-badge rto">${s.rto}</span></td>
      <td class="amount negative">-${formatCurrency(s.returnCharges)}</td>
      <td class="amount negative">-${formatCurrency(s.rtoCharges)}</td>
      <td><span class="${s.returnRate > 50 ? 'text-danger fw-bold' : s.returnRate > 30 ? 'text-danger' : 'text-warning'}">${formatPercent(s.returnRate)}</span></td>
    </tr>
  `).join('');
}

/**
 * Render Group-wise Return Table
 */
export function renderGroupReturnTable(groupAnalytics) {
  const tbody = document.getElementById('groupReturnTableBody');
  if (!tbody) return;

  const returningGroups = groupAnalytics
    .filter(g => g.returned + g.rto > 0)
    .sort((a, b) => b.totalReturnCharges - a.totalReturnCharges);

  if (returningGroups.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
        No group return data available. Create SKU groups first.
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = returningGroups.map(g => `
    <tr>
      <td class="sku-name">${g.name}</td>
      <td>${g.skus.length} SKUs</td>
      <td>${g.totalOrders}</td>
      <td><span class="status-badge delivered">${g.delivered}</span></td>
      <td><span class="status-badge return">${g.returned}</span></td>
      <td><span class="status-badge rto">${g.rto}</span></td>
      <td class="amount negative">-${formatCurrency(g.returnCharges)}</td>
      <td class="amount negative">-${formatCurrency(g.rtoCharges)}</td>
      <td class="amount negative fw-bold">-${formatCurrency(g.totalReturnCharges)}</td>
      <td><span class="${g.returnRate > 50 ? 'text-danger fw-bold' : g.returnRate > 30 ? 'text-danger' : 'text-warning'}">${formatPercent(g.returnRate)}</span></td>
    </tr>
  `).join('');
}


/**
 * Render Group-wise Costing Summary Table
 */
export function renderCostingTable(groupAnalytics) {
  const tbody = document.getElementById('costingTableBody');
  if (!tbody) return;

  // Filter groups that have a raw cost set (> 0) or have any orders
  const groups = groupAnalytics.filter(g => g.totalOrders > 0);

  if (groups.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
        Create SKU groups and set raw costs to see costing summary
      </td></tr>
    `;
    return;
  }

  // Calculate totals
  let totalUnits = 0, totalRawCost = 0, totalSettlement = 0, totalReturnCharges = 0, totalNetProfit = 0, totalOrders = 0;

  const rows = groups.map(g => {
    const units = g.delivered + g.shipped;
    const profitPerUnit = units > 0 ? (g.netProfit / units) : 0;
    const profitClass = g.netProfit >= 0 ? 'text-success' : 'text-danger';
    const costSet = g.rawCost > 0;

    totalUnits += units;
    totalRawCost += g.rawCostTotal;
    totalSettlement += g.totalSettlement;
    totalReturnCharges += g.totalReturnCharges;
    totalNetProfit += g.netProfit;
    totalOrders += g.totalOrders;

    return `
      <tr>
        <td class="sku-name">${g.name}</td>
        <td>${g.skus.length} SKUs</td>
        <td>${costSet ? formatCurrency(g.rawCost) : '<span class="text-warning">Not Set</span>'}</td>
        <td>${g.totalOrders}</td>
        <td><span class="status-badge delivered">${units}</span></td>
        <td class="${costSet ? 'amount' : 'text-muted'}">${costSet ? formatCurrency(g.rawCostTotal) : '—'}</td>
        <td class="amount">${formatCurrency(g.totalSettlement)}</td>
        <td class="amount negative">-${formatCurrency(g.totalReturnCharges)}</td>
        <td class="amount ${profitClass} fw-bold">${g.netProfit >= 0 ? '' : '-'}${formatCurrency(Math.abs(g.netProfit))}</td>
        <td class="${profitPerUnit >= 0 ? 'text-success' : 'text-danger'}">${costSet ? formatCurrency(Math.abs(profitPerUnit)) : '—'}</td>
      </tr>
    `;
  });

  // Add totals row
  const totalProfitPerUnit = totalUnits > 0 ? (totalNetProfit / totalUnits) : 0;
  rows.push(`
    <tr style="background: rgba(139, 92, 246, 0.08); font-weight: 700; border-top: 2px solid var(--border-glass);">
      <td>TOTAL</td>
      <td></td>
      <td></td>
      <td>${totalOrders}</td>
      <td><span class="status-badge delivered">${totalUnits}</span></td>
      <td class="amount">${formatCurrency(totalRawCost)}</td>
      <td class="amount">${formatCurrency(totalSettlement)}</td>
      <td class="amount negative">-${formatCurrency(totalReturnCharges)}</td>
      <td class="amount ${totalNetProfit >= 0 ? 'text-success' : 'text-danger'} fw-bold">${totalNetProfit >= 0 ? '' : '-'}${formatCurrency(Math.abs(totalNetProfit))}</td>
      <td class="${totalProfitPerUnit >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(Math.abs(totalProfitPerUnit))}</td>
    </tr>
  `);

  tbody.innerHTML = rows.join('');
}

/**
 * Render SKU Groups panel
 */
export function renderSkuGroups(allSkus, onGroupSelect) {
  const list = document.getElementById('skuGroupsList');
  if (!list) return;

  const groups = skuManager.getGroups();
  const unassigned = skuManager.getUnassignedSkus(allSkus);

  if (groups.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-icon">📁</div>
        <div class="empty-title">No Groups Yet</div>
        <div class="empty-description">Create your first SKU group to organize products and assign raw costs</div>
      </div>
    `;
    return;
  }

  list.innerHTML = groups.map(g => `
    <div class="sku-group-item" data-group-id="${g.id}">
      <div>
        <div class="group-name">${g.name}</div>
        <div class="group-count">${g.skus.length} SKUs</div>
      </div>
      <div class="group-cost">₹${g.rawCost}</div>
    </div>
  `).join('') + (unassigned.length > 0 ? `
    <div style="margin-top: 12px; padding: 8px 12px; background: rgba(245, 158, 11, 0.08); border-radius: 8px;">
      <span style="font-size: 0.75rem; color: var(--color-warning);">⚠ ${unassigned.length} unassigned SKUs</span>
    </div>
  ` : '');

  // Bind click events
  list.querySelectorAll('.sku-group-item').forEach(item => {
    item.addEventListener('click', () => {
      list.querySelectorAll('.sku-group-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      onGroupSelect(item.dataset.groupId);
    });
  });
}

/**
 * Render SKU Group Detail panel
 */
export function renderGroupDetail(groupId, allSkus, onUpdate) {
  const panel = document.getElementById('skuDetailPanel');
  if (!panel) return;

  const group = skuManager.getGroup(groupId);
  if (!group) {
    panel.innerHTML = `
      <div class="panel-header"><h3>Select a Group</h3></div>
      <div class="panel-body">
        <div class="empty-state">
          <div class="empty-icon">👈</div>
          <div class="empty-title">Select a group</div>
          <div class="empty-description">Click a group from the left panel to view and edit details</div>
        </div>
      </div>
    `;
    return;
  }

  const assignedByOthers = new Set(
    skuManager.getGroups()
      .filter(g => g.id !== groupId)
      .flatMap(g => g.skus)
  );

  const availableSkus = allSkus.filter(sku => !assignedByOthers.has(sku));

  panel.innerHTML = `
    <div class="panel-header">
      <h3>${group.name}</h3>
      <button class="btn btn-danger btn-sm" id="deleteGroupBtn">🗑 Delete</button>
    </div>
    <div class="panel-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Group Name</label>
          <input type="text" class="form-input" id="editGroupName" value="${group.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Raw Cost (₹ per unit)</label>
          <input type="number" class="form-input" id="editGroupCost" value="${group.rawCost}" min="0" step="1">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Assigned SKUs (${group.skus.length})</label>
        <div class="chip-selector" id="skuChipSelector">
          ${availableSkus.map(sku => `
            <div class="chip ${group.skus.includes(sku) ? 'selected' : ''}" data-sku="${sku}">
              ${group.skus.includes(sku) ? '<span class="chip-check">✓</span>' : ''}
              ${sku}
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; gap: 8px; margin-top: 16px;">
        <button class="btn btn-primary" id="saveGroupBtn">💾 Save Changes</button>
        <button class="btn btn-secondary" id="cancelGroupBtn">Cancel</button>
      </div>
    </div>
  `;

  // Bind chip selection
  panel.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      if (chip.classList.contains('selected')) {
        chip.innerHTML = `<span class="chip-check">✓</span> ${chip.dataset.sku}`;
      } else {
        chip.textContent = chip.dataset.sku;
      }
    });
  });

  // Save button
  panel.querySelector('#saveGroupBtn').addEventListener('click', () => {
    const selectedSkus = [...panel.querySelectorAll('.chip.selected')].map(c => c.dataset.sku);
    const name = panel.querySelector('#editGroupName').value;
    const cost = panel.querySelector('#editGroupCost').value;
    
    try {
      skuManager.updateGroup(groupId, { name, rawCost: cost, skus: selectedSkus });
      showToast(`Group "${name}" updated successfully!`, 'success');
      onUpdate();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Delete button
  panel.querySelector('#deleteGroupBtn').addEventListener('click', () => {
    if (confirm(`Delete group "${group.name}"?`)) {
      skuManager.deleteGroup(groupId);
      showToast(`Group "${group.name}" deleted`, 'info');
      onUpdate();
    }
  });
}

/**
 * Setup the Create Group modal
 */
export function setupCreateGroupModal(allSkus, onCreated) {
  const modal = document.getElementById('createGroupModal');
  const btn = document.getElementById('createGroupBtn');
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('createGroupForm');
  
  btn.addEventListener('click', () => {
    renderCreateGroupSkuSelector(allSkus);
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newGroupName').value;
    const cost = document.getElementById('newGroupCost').value;
    const selectedSkus = [...document.querySelectorAll('#newGroupSkuSelector .chip.selected')]
      .map(c => c.dataset.sku);

    try {
      skuManager.createGroup(name, cost, selectedSkus);
      showToast(`Group "${name}" created with ${selectedSkus.length} SKUs!`, 'success');
      modal.classList.remove('active');
      form.reset();
      onCreated();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function renderCreateGroupSkuSelector(allSkus) {
  const container = document.getElementById('newGroupSkuSelector');
  if (!container) return;

  const assignedSkus = new Set(skuManager.getGroups().flatMap(g => g.skus));
  const available = allSkus.filter(sku => !assignedSkus.has(sku));

  container.innerHTML = available.length > 0
    ? available.map(sku => `
      <div class="chip" data-sku="${sku}">${sku}</div>
    `).join('')
    : '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 8px;">All SKUs are assigned to groups</div>';

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      if (chip.classList.contains('selected')) {
        chip.innerHTML = `<span class="chip-check">✓</span> ${chip.dataset.sku}`;
      } else {
        chip.textContent = chip.dataset.sku;
      }
    });
  });
}

/**
 * Render file upload list
 */
export function renderUploadedFiles(files) {
  const container = document.getElementById('uploadedFilesList');
  if (!container) return;

  container.innerHTML = files.map(f => `
    <div class="upload-file-item">
      <span class="file-icon">📊</span>
      <div class="file-info">
        <div class="file-name">${f.filename}</div>
        <div class="file-size">${f.orders.length} orders · ${f.month} · ${f.platform}</div>
      </div>
      <span class="file-status success">✓ Parsed</span>
    </div>
  `).join('');
}

/**
 * Update header badge with data status
 */
export function updateHeaderBadge(orderCount, fileCount) {
  const badge = document.getElementById('dataBadge');
  if (badge) {
    if (orderCount > 0) {
      badge.innerHTML = `<span class="dot"></span> ${formatNumber(orderCount)} orders · ${fileCount} file${fileCount > 1 ? 's' : ''}`;
    } else {
      badge.innerHTML = `<span class="dot" style="background: var(--color-warning)"></span> No data loaded`;
    }
  }
}

/**
 * Export data as CSV
 */
export function exportCSV(skuAnalytics, filename = 'sku_analytics.csv') {
  const headers = ['SKU', 'Group', 'Total Orders', 'Delivered', 'Returned', 'RTO', 'Settlement', 'Return Charges', 'Raw Cost', 'Net Profit', 'Return Rate %'];
  const rows = skuAnalytics.map(s => [
    s.sku, s.group, s.totalOrders, s.delivered, s.returned, s.rto,
    s.totalSettlement.toFixed(2), s.totalReturnCharges.toFixed(2),
    s.rawCostTotal.toFixed(2), s.netProfit.toFixed(2), s.returnRate.toFixed(1)
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  downloadFile(csv, filename, 'text/csv');
  showToast('CSV exported successfully!', 'success');
}

/**
 * Export data as JSON
 */
export function exportJSON(analytics, filename = 'analytics_report.json') {
  const json = JSON.stringify(analytics, null, 2);
  downloadFile(json, filename, 'application/json');
  showToast('JSON report exported!', 'success');
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Switch between sections
 */
export function switchSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
  }

  const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }
}
