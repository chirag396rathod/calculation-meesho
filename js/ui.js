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
        ${(analytics.totalClaimsAndCompensation || 0) > 0 ? `<span class="metric-change positive" title="Reimbursements received for damaged/lost returns">+${formatCurrency(analytics.totalClaimsAndCompensation)} claims</span>` : ''}
      </div>
      <div class="metric-value text-success">${formatCurrency(analytics.netSettlement)}</div>
      <div class="metric-label">Net Settlement</div>
      <div class="metric-sub">Received: ${formatCurrency(analytics.totalPositiveSettlement)}${(analytics.totalClaimsAndCompensation || 0) > 0 ? ` · Incl. Claims: +${formatCurrency(analytics.totalClaimsAndCompensation)}` : ''}</div>
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
      <div class="metric-sub">Settlement (incl. Claims) - Returns - Cost - Ads</div>
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
      <td class="amount ${s.totalSettlement >= 0 ? 'positive' : 'negative'}">
        ${formatCurrency(s.totalSettlement)}
        ${s.claimsAndCompensation > 0 ? `<div style="font-size: 0.70rem; color: var(--accent-emerald, #10b981); font-weight: 600;" title="Claims & Compensation reimbursed for this SKU">+${formatCurrency(s.claimsAndCompensation)} claim</div>` : ''}
      </td>
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

  const claimsTotal = analytics.totalClaimsAndCompensation || 0;
  const claimsCount = analytics.claimsCount || 0;

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
    <div class="return-card" style="border-left: 3px solid var(--accent-emerald, #10b981);">
      <div class="return-value" style="color: var(--accent-emerald, #10b981);">+${formatCurrency(claimsTotal)}</div>
      <div class="return-label">Claims & Compensation Received</div>
      <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">${claimsCount} orders reimbursed</div>
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
      .flatMap(g => g.skus || [])
  );

  const candidateSkus = [...new Set([...(group.skus || []), ...(allSkus || [])])];
  const availableSkus = candidateSkus.filter(sku => !assignedByOthers.has(sku)).sort();

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
  panel.querySelector('#saveGroupBtn').addEventListener('click', async () => {
    const saveBtn = panel.querySelector('#saveGroupBtn');
    const selectedSkus = [...panel.querySelectorAll('.chip.selected')].map(c => c.dataset.sku);
    const name = panel.querySelector('#editGroupName').value;
    const cost = panel.querySelector('#editGroupCost').value;

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ Saving...';
      await skuManager.updateGroup(groupId, { name, rawCost: cost, skus: selectedSkus });
      showToast(`Group "${name}" updated successfully!`, 'success');
      onUpdate();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '💾 Save Changes';
    }
  });

  // Delete button
  panel.querySelector('#deleteGroupBtn').addEventListener('click', async () => {
    if (confirm(`Delete group "${group.name}"?`)) {
      try {
        await skuManager.deleteGroup(groupId);
        showToast(`Group "${group.name}" deleted`, 'info');
        onUpdate();
      } catch (err) {
        showToast(err.message, 'error');
      }
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
    const skus = typeof allSkus === 'function' ? allSkus() : (allSkus || []);
    renderCreateGroupSkuSelector(skus);
    modal.classList.add('active');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = document.getElementById('newGroupName').value;
    const cost = document.getElementById('newGroupCost').value;
    const selectedSkus = [...document.querySelectorAll('#newGroupSkuSelector .chip.selected')]
      .map(c => c.dataset.sku);

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Creating...';
      await skuManager.createGroup(name, cost, selectedSkus);
      showToast(`Group "${name}" created with ${selectedSkus.length} SKUs!`, 'success');
      modal.classList.remove('active');
      form.reset();
      onCreated();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Create Group';
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
 * Setup Rename Report Modal
 */
export function setupRenameModal(onRenamed) {
  const modal = document.getElementById('renameReportModal');
  if (!modal) return;
  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('renameReportForm');
  const input = document.getElementById('renameReportInput');
  const idInput = document.getElementById('renameReportId');

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = parseInt(idInput.value, 10);
    const newName = input.value.trim();
    if (newName && !isNaN(idx)) {
      onRenamed(idx, newName);
      modal.classList.remove('active');
    }
  });
}

export function openRenameModal(index, currentName) {
  const modal = document.getElementById('renameReportModal');
  const input = document.getElementById('renameReportInput');
  const idInput = document.getElementById('renameReportId');
  if (modal && input && idInput) {
    idInput.value = index;
    input.value = currentName || '';
    modal.classList.add('active');
    setTimeout(() => input.focus(), 80);
  }
}

/**
 * Render loaded files list with Report Names and Management
 */
export function renderUploadedFiles(files, { onRename, onDelete } = {}) {
  const container = document.getElementById('uploadedFilesList');
  if (!container) return;

  if (!files || files.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <div class="empty-icon">📂</div>
        <div class="empty-title">No files loaded</div>
        <div class="empty-description">Upload payment files to see saved reports here</div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="reports-list">
      ${files.map((f, idx) => {
    const reportName = f.reportName || f.filename;
    const uploadDate = f.uploadedAt
      ? new Date(f.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';
    const count = f.orderCount || (f.orders ? f.orders.length : 0);
    return `
          <div class="report-card-item" data-index="${idx}">
            <div class="report-card-left">
              <span class="file-icon" style="font-size: 1.5rem;">📊</span>
              <div class="file-info">
                <div class="report-title-row">
                  <span class="report-name">${reportName}</span>
                  <span class="file-status success">✓ Loaded</span>
                </div>
                <div class="report-meta-row">
                  <span class="file-filename" title="Source File">📄 ${f.filename}</span>
                  ${f.month ? `<span class="meta-dot">·</span> <span>${f.month}</span>` : ''}
                  ${f.platform ? `<span class="meta-dot">·</span> <span>${f.platform}</span>` : ''}
                  <span class="meta-dot">·</span>
                  <span class="meta-highlight">${formatNumber(count)} orders</span>
                  ${uploadDate ? `<span class="meta-dot">·</span> <span class="meta-date">Saved ${uploadDate}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="report-card-actions">
              <button class="btn btn-secondary btn-sm rename-report-btn" data-index="${idx}" title="Rename Report">✏️ Rename</button>
              <button class="btn btn-danger btn-sm delete-report-btn" data-index="${idx}" title="Remove Report">🗑 Remove</button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  // Bind rename
  container.querySelectorAll('.rename-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      if (onRename) onRename(idx);
    });
  });

  // Bind delete
  container.querySelectorAll('.delete-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      if (onDelete) onDelete(idx);
    });
  });
}

/**
 * Update header badge with data status and report names
 */
export function updateHeaderBadge(orderCount, fileCount, activeReports = []) {
  const badge = document.getElementById('dataBadge');
  if (badge) {
    badge.remove();
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
 * Mobile Sidebar Drawer Controls
 */
export function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
  document.body.classList.remove('sidebar-open');
}

export function openMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('active');
  document.body.classList.add('sidebar-open');
}

export function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
}

/**
 * Switch between sections
 */
export function switchSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetId = (sectionId === 'labelSorter') ? 'labelSorterSection' : sectionId;
  const section = document.getElementById(targetId);
  if (section) {
    section.classList.add('active');
  }

  const navKey = (sectionId === 'labelSorterSection') ? 'labelSorter' : sectionId;
  const navItem = document.querySelector(`.nav-item[data-section="${navKey}"]`);
  if (navItem) {
    navItem.classList.add('active');
  }

  // Update mobile bottom nav active state
  document.querySelectorAll('.mobile-bottom-nav-item').forEach(b => b.classList.remove('active'));
  const bottomNavItem = document.querySelector(`.mobile-bottom-nav-item[data-section="${navKey}"]`);
  if (bottomNavItem) {
    bottomNavItem.classList.add('active');
  }

  // Close mobile sidebar drawer when navigating
  closeMobileSidebar();

  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

// ═══════════════════════════════════════════
//  MONTHLY SESSIONS UI HELPERS
// ═══════════════════════════════════════════

/**
 * Render list of monthly session cards
 */
export function renderSessionsList(sessions, activeSessionId, { onSwitch, onEdit, onUpdateData, onDelete } = {}) {
  const container = document.getElementById('sessionsGrid');
  if (!container) return;

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <div class="empty-icon">📁</div>
        <div class="empty-title">No Monthly Sessions Saved</div>
        <div class="empty-description">
          Save your current month's loaded files and analytics as a session to easily revisit, view, and compare anytime!
        </div>
      </div>
    `;

    document.getElementById('emptySaveSessionBtn')?.addEventListener('click', () => {
      document.getElementById('sessionsSectionSaveBtn')?.click();
    });
    return;
  }

  container.innerHTML = sessions.map(sess => {
    const isActive = sess.id === activeSessionId;
    const createdFmt = sess.createdAt ? new Date(sess.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const profitClass = (sess.netProfit || 0) >= 0 ? 'text-success' : 'text-danger';

    return `
      <div class="session-card ${isActive ? 'active' : ''}" data-id="${sess.id}">
        <div>
          <div class="session-card-header">
            <div class="session-title-group">
              <div class="session-name">
                <span class="session-folder-icon">📁</span>
                <span class="session-name-text">${sess.name}</span>
              </div>
              <div class="session-meta-row">
                ${sess.month ? `<span class="session-month-badge">📅 ${sess.month}</span>` : ''}
                <span class="session-date-text">${createdFmt}</span>
              </div>
            </div>
            ${isActive ? `
              <span class="session-active-tag">
                <span class="dot-pulse"></span> Active
              </span>
            ` : ''}
          </div>

          ${sess.notes ? `<div class="session-card-notes">${sess.notes}</div>` : ''}

          <div class="session-card-metrics">
            <div class="session-metric-cell">
              <div class="session-metric-val">${formatNumber(sess.orderCount || 0)}</div>
              <div class="session-metric-lbl">Total Orders</div>
            </div>
            <div class="session-metric-cell">
              <div class="session-metric-val">${formatCurrency(sess.netSettlement || 0)}</div>
              <div class="session-metric-lbl">Net Settlement</div>
            </div>
            <div class="session-metric-cell">
              <div class="session-metric-val ${profitClass}">${formatCurrency(sess.netProfit || 0)}</div>
              <div class="session-metric-lbl">Net Profit</div>
            </div>
          </div>
        </div>

        <div class="session-card-footer">
          <div class="session-footer-actions">
            ${isActive ? `
              <button class="btn btn-primary btn-sm session-update-btn" data-id="${sess.id}" title="Overwrite this session with currently loaded active dashboard data">🔄 Update Data</button>
            ` : `
              <button class="btn btn-outline btn-sm session-switch-btn" data-id="${sess.id}">👁️ View / Switch</button>
            `}
          </div>
          <div class="session-footer-secondary">
            <button class="btn btn-ghost btn-sm session-edit-btn" data-id="${sess.id}" title="Edit Name & Notes">✏️ Edit</button>
            <button class="btn btn-danger-ghost btn-sm session-delete-btn" data-id="${sess.id}" title="Delete Session">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind Switch
  container.querySelectorAll('.session-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onSwitch) onSwitch(btn.dataset.id);
    });
  });

  // Bind Update Content
  container.querySelectorAll('.session-update-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onUpdateData) onUpdateData(btn.dataset.id);
    });
  });

  // Bind Edit
  container.querySelectorAll('.session-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onEdit) onEdit(btn.dataset.id);
    });
  });

  // Bind Delete
  container.querySelectorAll('.session-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onDelete) onDelete(btn.dataset.id);
    });
  });
}

/**
 * Setup Create Session Modal
 */
export function setupCreateSessionModal(onCreate) {
  const modal = document.getElementById('createSessionModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('createSessionForm');

  closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = document.getElementById('createSessionName').value.trim();
    const month = document.getElementById('createSessionMonth').value.trim();
    const notes = document.getElementById('createSessionNotes').value.trim();
    const mode = form.querySelector('input[name="createSessionMode"]:checked')?.value || 'fresh';

    if (!name) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Creating Session...';
      await onCreate({ name, month, notes, mode });
      modal.classList.remove('active');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Create Session';
    }
  });
}

/**
 * Open Create Session Modal
 */
export function openCreateSessionModal({ currentOrderCount = 0, currentMonth = '' } = {}) {
  const modal = document.getElementById('createSessionModal');
  if (!modal) return;

  const nameInput = document.getElementById('createSessionName');
  const monthInput = document.getElementById('createSessionMonth');
  const currentCard = document.getElementById('createSessionCurrentCard');
  const currentDesc = document.getElementById('createSessionCurrentDesc');
  const freshRadio = modal.querySelector('input[name="createSessionMode"][value="fresh"]');
  const currentRadio = modal.querySelector('input[name="createSessionMode"][value="current"]');

  // Default suggested month and name
  const now = new Date();
  const nextMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  if (nameInput) nameInput.value = currentMonth ? `${currentMonth} Session` : `${nextMonthName} Session`;
  if (monthInput) monthInput.value = currentMonth || nextMonthName;

  if (currentCard && currentDesc) {
    if (currentOrderCount > 0) {
      currentCard.classList.remove('disabled');
      if (currentRadio) currentRadio.disabled = false;
      currentDesc.textContent = `Save currently loaded ${formatNumber(currentOrderCount)} orders into this new session.`;
    } else {
      currentCard.classList.add('disabled');
      if (currentRadio) currentRadio.disabled = true;
      if (freshRadio) freshRadio.checked = true;
      currentDesc.textContent = `No orders currently loaded in memory.`;
    }
  }

  modal.classList.add('active');
  setTimeout(() => nameInput?.focus(), 80);
}

/**
 * Setup Save Session Modal
 */
export function setupSaveSessionModal(onSave) {
  const modal = document.getElementById('saveSessionModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('saveSessionForm');

  closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const name = document.getElementById('saveSessionName').value.trim();
    const month = document.getElementById('saveSessionMonth').value.trim();
    const notes = document.getElementById('saveSessionNotes').value.trim();

    if (!name) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Saving Session...';
      await onSave({ name, month, notes });
      modal.classList.remove('active');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Save Session';
    }
  });
}

/**
 * Open Save Session Modal with current summaries
 */
export function openSaveSessionModal({ orderCount = 0, fileCount = 0, netSettlement = 0, defaultMonth = '', defaultName = '' }) {
  const modal = document.getElementById('saveSessionModal');
  if (!modal) return;

  const nameInput = document.getElementById('saveSessionName');
  const monthInput = document.getElementById('saveSessionMonth');
  const ordersEl = document.getElementById('saveSummaryOrders');
  const filesEl = document.getElementById('saveSummaryFiles');
  const settlementEl = document.getElementById('saveSummarySettlement');

  if (nameInput) nameInput.value = defaultName || (defaultMonth ? `${defaultMonth} Session` : `Session ${new Date().toLocaleDateString('en-IN')}`);
  if (monthInput) monthInput.value = defaultMonth || '';
  if (ordersEl) ordersEl.textContent = formatNumber(orderCount);
  if (filesEl) filesEl.textContent = fileCount;
  if (settlementEl) settlementEl.textContent = formatCurrency(netSettlement);

  modal.classList.add('active');
  setTimeout(() => nameInput?.focus(), 80);
}

/**
 * Setup Edit Session Modal
 */
export function setupEditSessionModal(onEditSave) {
  const modal = document.getElementById('editSessionModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  const form = document.getElementById('editSessionForm');

  closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const id = document.getElementById('editSessionId').value;
    const name = document.getElementById('editSessionName').value.trim();
    const month = document.getElementById('editSessionMonth').value.trim();
    const notes = document.getElementById('editSessionNotes').value.trim();

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Updating...';
      await onEditSave(id, { name, month, notes });
      modal.classList.remove('active');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Update Session';
    }
  });
}

/**
 * Open Edit Session Modal
 */
export function openEditSessionModal(session) {
  const modal = document.getElementById('editSessionModal');
  if (!modal || !session) return;

  document.getElementById('editSessionId').value = session.id;
  document.getElementById('editSessionName').value = session.name || '';
  document.getElementById('editSessionMonth').value = session.month || '';
  document.getElementById('editSessionNotes').value = session.notes || '';

  modal.classList.add('active');
  setTimeout(() => document.getElementById('editSessionName')?.focus(), 80);
}

/**
 * Update active session pill in header
 */
export function updateActiveSessionBadge(sessionName) {
  const pill = document.getElementById('headerActiveSessionPill');
  const label = document.getElementById('headerActiveSessionLabel');
  if (pill && label) {
    if (sessionName) {
      label.textContent = `Session: ${sessionName}`;
      pill.style.display = 'inline-flex';
    } else {
      pill.style.display = 'none';
    }
  }
}

