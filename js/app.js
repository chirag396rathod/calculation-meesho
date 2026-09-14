/**
 * app.js — Main Application Controller
 * Orchestrates file parsing, analytics, UI rendering, and state management
 */

import { parsePaymentFile } from './fileParser.js';
import { calculateAnalytics, formatCurrency } from './analytics.js';
import { skuManager } from './skuManager.js';
import {
  renderStatusChart,
  renderProfitBreakdownChart,
  renderSkuProfitChart,
  renderMonthlyChart,
  renderReturnRateChart,
  renderReturnChargesChart,
  renderGroupReturnChart
} from './charts.js';
import {
  showToast,
  renderMetrics,
  renderSkuTable,
  renderGroupTable,
  renderReturnAnalysis,
  renderReturnTable,
  renderGroupReturnTable,
  renderCostingTable,
  renderSkuGroups,
  renderGroupDetail,
  setupCreateGroupModal,
  renderUploadedFiles,
  updateHeaderBadge,
  exportCSV,
  exportJSON,
  switchSection
} from './ui.js';

// ── App State ──
const state = {
  parsedFiles: [],
  allOrders: [],       // All orders (unfiltered)
  filteredOrders: [],  // Orders after date filter
  allAds: [],
  allSkus: [],
  analytics: null,
  currentSection: 'dashboard',
  selectedGroupId: null,
  skuTableFilter: 'all',
  skuTableSearch: '',
  // Date filter state
  dateFilter: {
    start: null,  // Date object or null
    end: null,    // Date object or null
    active: false
  }
};

/**
 * Initialize the application
 */
function init() {
  setupNavigation();
  setupUploadModal();
  setupSkuManager();
  setupSkuTableControls();
  setupExportButtons();
  setupDateFilter();
  
  // Listen for SKU cost changes to recalculate
  skuManager.onChange(() => {
    if (state.allOrders.length > 0) {
      recalculate();
    }
  });

  // Show dashboard section
  switchSection('dashboard');
  updateHeaderBadge(0, 0);

  // Check if we have stored data
  loadStoredFiles();
}

/**
 * Setup navigation sidebar
 */
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      state.currentSection = sectionId;
      switchSection(sectionId);
      
      // Re-render charts when switching to their sections
      if (sectionId === 'dashboard' && state.analytics) {
        renderCharts();
      }
      if (sectionId === 'returns' && state.analytics) {
        renderReturnCharts();
      }
    });
  });
}

// ═══════════════════════════════════════════
//  DATE RANGE FILTER
// ═══════════════════════════════════════════

/**
 * Setup date range filter controls
 */
function setupDateFilter() {
  const startInput = document.getElementById('dateStart');
  const endInput = document.getElementById('dateEnd');
  const applyBtn = document.getElementById('applyDateFilter');
  const clearBtn = document.getElementById('clearDateFilter');
  const badgeClear = document.getElementById('badgeClearFilter');
  const presetBtns = document.querySelectorAll('.date-preset');

  // Apply date filter
  applyBtn.addEventListener('click', () => {
    const start = startInput.value ? new Date(startInput.value + 'T00:00:00') : null;
    const end = endInput.value ? new Date(endInput.value + 'T23:59:59') : null;
    
    if (!start && !end) {
      showToast('Please select at least a start or end date', 'error');
      return;
    }

    applyDateFilter(start, end);
    
    // Clear active preset styling
    presetBtns.forEach(b => b.classList.remove('active'));
  });

  // Clear date filter
  clearBtn.addEventListener('click', () => {
    clearDateFilter();
    startInput.value = '';
    endInput.value = '';
    presetBtns.forEach(b => b.classList.remove('active'));
  });

  // Badge clear button
  badgeClear.addEventListener('click', () => {
    clearDateFilter();
    startInput.value = '';
    endInput.value = '';
    presetBtns.forEach(b => b.classList.remove('active'));
  });

  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      presetBtns.forEach(b => b.classList.remove('active'));
      
      if (preset === 'all') {
        clearDateFilter();
        startInput.value = '';
        endInput.value = '';
        btn.classList.add('active');
        return;
      }

      let start, end;
      if (preset === 'july') {
        start = new Date('2026-07-01T00:00:00');
        end = new Date('2026-07-31T23:59:59');
        startInput.value = '2026-07-01';
        endInput.value = '2026-07-31';
      } else if (preset === 'august') {
        start = new Date('2026-08-01T00:00:00');
        end = new Date('2026-08-31T23:59:59');
        startInput.value = '2026-08-01';
        endInput.value = '2026-08-31';
      } else if (preset === 'june') {
        start = new Date('2026-06-01T00:00:00');
        end = new Date('2026-06-30T23:59:59');
        startInput.value = '2026-06-01';
        endInput.value = '2026-06-30';
      }

      btn.classList.add('active');
      applyDateFilter(start, end);
    });
  });
}

/**
 * Apply date filter and recalculate
 */
function applyDateFilter(start, end) {
  state.dateFilter = { start, end, active: true };
  
  // Filter orders by order date
  state.filteredOrders = state.allOrders.filter(order => {
    if (!order.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    if (start && orderDate < start) return false;
    if (end && orderDate > end) return false;
    return true;
  });

  // Update active filter badge
  const badge = document.getElementById('activeFilterBadge');
  const text = document.getElementById('activeFilterText');
  badge.style.display = 'inline-flex';
  
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (start && end) {
    text.textContent = `📅 ${fmt(start)} → ${fmt(end)} (${state.filteredOrders.length} orders)`;
  } else if (start) {
    text.textContent = `📅 From ${fmt(start)} (${state.filteredOrders.length} orders)`;
  } else {
    text.textContent = `📅 Until ${fmt(end)} (${state.filteredOrders.length} orders)`;
  }

  recalculate();
  showToast(`Filtered to ${state.filteredOrders.length} orders`, 'info');
}

/**
 * Clear date filter
 */
function clearDateFilter() {
  state.dateFilter = { start: null, end: null, active: false };
  state.filteredOrders = [...state.allOrders];
  
  const badge = document.getElementById('activeFilterBadge');
  badge.style.display = 'none';

  recalculate();
  showToast('Date filter cleared — showing all orders', 'info');
}

/**
 * Get the currently active orders (filtered or all)
 */
function getActiveOrders() {
  return state.dateFilter.active ? state.filteredOrders : state.allOrders;
}

// ═══════════════════════════════════════════
//  FILE UPLOAD
// ═══════════════════════════════════════════

/**
 * Setup file upload modal
 */
function setupUploadModal() {
  const modal = document.getElementById('uploadModal');
  const uploadBtns = document.querySelectorAll('.upload-trigger');
  const closeBtn = modal.querySelector('.modal-close');
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const processBtn = document.getElementById('processFilesBtn');

  // Open modal
  uploadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modal.classList.add('active');
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => 
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    );
    if (files.length > 0) {
      handleFiles(files);
    } else {
      showToast('Please upload .xlsx files only', 'error');
    }
  });

  // Click to browse
  zone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const files = [...fileInput.files];
    if (files.length > 0) {
      handleFiles(files);
    }
  });

  // Process button
  processBtn.addEventListener('click', () => {
    if (state.parsedFiles.length > 0) {
      processAllData();
      modal.classList.remove('active');
    }
  });
}

/**
 * Handle uploaded files
 */
async function handleFiles(files) {
  const listContainer = document.getElementById('pendingFilesList');
  const processBtn = document.getElementById('processFilesBtn');

  for (const file of files) {
    // Show processing state
    const item = document.createElement('div');
    item.className = 'upload-file-item';
    item.innerHTML = `
      <span class="file-icon">📊</span>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
      </div>
      <span class="file-status processing">⏳ Parsing...</span>
    `;
    listContainer.appendChild(item);

    try {
      const result = await parsePaymentFile(file);
      state.parsedFiles.push(result);
      
      // Update UI
      item.querySelector('.file-status').className = 'file-status success';
      item.querySelector('.file-status').textContent = `✓ ${result.orders.length} orders`;
      item.querySelector('.file-size').textContent += ` · ${result.month} · ${result.platform}`;
      
      showToast(`Parsed ${result.orders.length} orders from ${file.name}`, 'success');
    } catch (err) {
      item.querySelector('.file-status').className = 'file-status error';
      item.querySelector('.file-status').textContent = '✕ Error';
      showToast(`Error parsing ${file.name}: ${err.message}`, 'error');
    }
  }

  processBtn.style.display = state.parsedFiles.length > 0 ? 'flex' : 'none';
}

/**
 * Process all parsed data and render dashboard
 */
function processAllData() {
  // Combine all orders and ads
  state.allOrders = state.parsedFiles.flatMap(f => f.orders);
  state.allAds = state.parsedFiles.flatMap(f => f.ads);
  state.filteredOrders = [...state.allOrders];

  // Extract unique SKUs
  state.allSkus = [...new Set(state.allOrders.map(o => o.sku))].sort();

  // Auto-detect date range from data and set input hints
  setDateRangeHints();

  // Save file info for persistence
  localStorage.setItem('fc_file_info', JSON.stringify(
    state.parsedFiles.map(f => ({ filename: f.filename, month: f.month, platform: f.platform, orderCount: f.orders.length }))
  ));

  // Save raw order data for persistence
  localStorage.setItem('fc_orders', JSON.stringify(state.allOrders));
  localStorage.setItem('fc_ads', JSON.stringify(state.allAds));

  recalculate();
  showToast(`Dashboard loaded with ${state.allOrders.length} orders!`, 'success');
}

/**
 * Set date input min/max based on loaded data
 */
function setDateRangeHints() {
  const dates = state.allOrders
    .map(o => o.orderDate ? new Date(o.orderDate) : null)
    .filter(d => d && !isNaN(d.getTime()));

  if (dates.length === 0) return;

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  
  const fmt = (d) => d.toISOString().split('T')[0];
  
  const startInput = document.getElementById('dateStart');
  const endInput = document.getElementById('dateEnd');
  
  startInput.min = fmt(minDate);
  startInput.max = fmt(maxDate);
  endInput.min = fmt(minDate);
  endInput.max = fmt(maxDate);
  
  // Set placeholder hints
  startInput.title = `Start Date (earliest: ${fmt(minDate)})`;
  endInput.title = `End Date (latest: ${fmt(maxDate)})`;
}

/**
 * Load stored files from localStorage
 */
function loadStoredFiles() {
  try {
    const orders = localStorage.getItem('fc_orders');
    const ads = localStorage.getItem('fc_ads');
    const fileInfo = localStorage.getItem('fc_file_info');

    if (orders) {
      state.allOrders = JSON.parse(orders);
      state.allAds = ads ? JSON.parse(ads) : [];
      state.filteredOrders = [...state.allOrders];
      state.allSkus = [...new Set(state.allOrders.map(o => o.sku))].sort();
      
      if (fileInfo) {
        const info = JSON.parse(fileInfo);
        state.parsedFiles = info.map(f => ({
          filename: f.filename,
          month: f.month,
          platform: f.platform,
          orders: state.allOrders.filter(() => true), // Will be combined anyway
          ads: state.allAds
        }));
      }

      if (state.allOrders.length > 0) {
        setDateRangeHints();
        recalculate();
      }
    }
  } catch (err) {
    console.warn('Could not load stored data:', err);
  }
}

// ═══════════════════════════════════════════
//  RECALCULATION & RENDERING
// ═══════════════════════════════════════════

/**
 * Recalculate analytics and re-render everything
 */
function recalculate() {
  const activeOrders = getActiveOrders();
  state.analytics = calculateAnalytics(activeOrders, state.allAds);
  
  // Update all views
  const label = state.dateFilter.active
    ? `${activeOrders.length} of ${state.allOrders.length} orders`
    : `${state.allOrders.length} orders`;
  updateHeaderBadge(activeOrders.length, state.parsedFiles.length || 1);
  
  renderMetrics(state.analytics);
  renderSkuTable(state.analytics.skuAnalytics, state.skuTableFilter, state.skuTableSearch);
  renderGroupTable(state.analytics.groupAnalytics);
  renderReturnAnalysis(state.analytics);
  renderReturnTable(state.analytics.skuAnalytics);
  renderGroupReturnTable(state.analytics.groupAnalytics);
  renderCostingTable(state.analytics.groupAnalytics);
  renderUploadedFiles(state.parsedFiles);
  
  // Update SKU count badge
  const skuBadge = document.querySelector('.nav-item[data-section="skuManager"] .nav-badge');
  if (skuBadge) skuBadge.textContent = state.allSkus.length;

  // Render charts
  renderCharts();
  
  // Update SKU manager
  refreshSkuManager();

  // Update nav badges
  updateNavBadges();
}

/**
 * Render all dashboard charts
 */
function renderCharts() {
  if (!state.analytics) return;
  
  setTimeout(() => {
    renderStatusChart('statusChart', state.analytics.statusDistribution);
    renderProfitBreakdownChart('profitChart', state.analytics);
    renderSkuProfitChart('skuProfitChart', state.analytics.skuAnalytics);
    renderMonthlyChart('monthlyChart', state.analytics.monthlyAnalytics);
  }, 100);
}

/**
 * Render return analysis charts
 */
function renderReturnCharts() {
  if (!state.analytics) return;
  
  setTimeout(() => {
    renderReturnRateChart('returnRateChart', state.analytics.skuAnalytics);
    renderReturnChargesChart('returnChargesChart', state.analytics.skuAnalytics);
    renderGroupReturnChart('groupReturnChart', state.analytics.groupAnalytics);
  }, 100);
}

// ═══════════════════════════════════════════
//  SKU MANAGER & CONTROLS
// ═══════════════════════════════════════════

/**
 * Setup SKU Manager section
 */
function setupSkuManager() {
  setupCreateGroupModal(state.allSkus, () => {
    refreshSkuManager();
    recalculate();
  });
}

function refreshSkuManager() {
  renderSkuGroups(state.allSkus, (groupId) => {
    state.selectedGroupId = groupId;
    renderGroupDetail(groupId, state.allSkus, () => {
      refreshSkuManager();
      recalculate();
    });
  });

  if (state.selectedGroupId) {
    renderGroupDetail(state.selectedGroupId, state.allSkus, () => {
      refreshSkuManager();
      recalculate();
    });
  } else {
    // Show empty state for detail panel
    renderGroupDetail(null, state.allSkus, () => {});
  }

  // Update create modal's available SKUs  
  const newSkuSelector = document.getElementById('newGroupSkuSelector');
  if (newSkuSelector && state.allSkus.length > 0) {
    // Will be updated when modal opens
  }
}

/**
 * Setup SKU table filter and search controls
 */
function setupSkuTableControls() {
  const searchInput = document.getElementById('skuSearch');
  const filterSelect = document.getElementById('skuFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.skuTableSearch = e.target.value;
      if (state.analytics) {
        renderSkuTable(state.analytics.skuAnalytics, state.skuTableFilter, state.skuTableSearch);
      }
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      state.skuTableFilter = e.target.value;
      if (state.analytics) {
        renderSkuTable(state.analytics.skuAnalytics, state.skuTableFilter, state.skuTableSearch);
      }
    });
  }
}

/**
 * Setup export buttons
 */
function setupExportButtons() {
  document.getElementById('exportCSV')?.addEventListener('click', () => {
    if (state.analytics) exportCSV(state.analytics.skuAnalytics);
  });

  document.getElementById('exportJSON')?.addEventListener('click', () => {
    if (state.analytics) exportJSON(state.analytics);
  });

  document.getElementById('clearDataBtn')?.addEventListener('click', () => {
    if (confirm('Clear all loaded data? This will reset the dashboard.')) {
      localStorage.removeItem('fc_orders');
      localStorage.removeItem('fc_ads');
      localStorage.removeItem('fc_file_info');
      state.parsedFiles = [];
      state.allOrders = [];
      state.filteredOrders = [];
      state.allAds = [];
      state.allSkus = [];
      state.analytics = null;
      location.reload();
    }
  });
}

/**
 * Update navigation badges
 */
function updateNavBadges() {
  if (!state.analytics) return;
  
  const returnBadge = document.querySelector('.nav-item[data-section="returns"] .nav-badge');
  if (returnBadge) {
    returnBadge.textContent = state.analytics.returnCount + state.analytics.rtoCount;
  }
}

// ── Initialize when DOM ready ──
document.addEventListener('DOMContentLoaded', init);
