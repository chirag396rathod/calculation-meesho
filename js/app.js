/**
 * app.js — Main Application Controller
 * Orchestrates file parsing, analytics, UI rendering, report management, session management, and state management
 */

import { parsePaymentFile } from './fileParser.js';
import { calculateAnalytics, formatCurrency } from './analytics.js';
import { skuManager } from './skuManager.js';
import { sessionManager } from './sessionManager.js';
import { initLabelSorter, mountLabelSorter } from './labelSorter.js';
import { initLandingPage, navigateTo } from './landing.js';
import { initBottomSheetPan } from './bottomSheetPan.js';
import { fetchMe, initOtpFlow, authHeaders, logout, updateAuthUI, openProfileModal, setupProfileModal, authState, onAuthChange } from './auth.js';
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
  setupRenameModal,
  openRenameModal,
  renderSessionsList,
  setupCreateSessionModal,
  openCreateSessionModal,
  setupSaveSessionModal,
  openSaveSessionModal,
  setupEditSessionModal,
  openEditSessionModal,
  updateActiveSessionBadge,
  exportCSV,
  exportJSON,
  switchSection,
  toggleMobileSidebar,
  closeMobileSidebar
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
async function init() {
  // 1. Restore auth session first (checks JWT token with server)
  //    initLandingPage() handles routing so it must know auth state
  await fetchMe();
  updateAuthUI();

  // 2. Wire OTP flow into global so landing.js can call it
  window.fcAuthInit = initOtpFlow;

  // 3. Set up logout button in sidebar
  const logoutBtn = document.getElementById('sidebarLogoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // 4. Set up profile modal & sidebar user badge click
  setupProfileModal();
  const sidebarUserBadge = document.getElementById('sidebarUserBadge');
  if (sidebarUserBadge) {
    sidebarUserBadge.addEventListener('click', () => {
      if (authState.token && authState.user) {
        openProfileModal();
      } else {
        navigateTo('login');
      }
    });
  }

  // 5. Reload per-business SKU groups and sessions whenever user signs in or switches account
  onAuthChange(async () => {
    try {
      await skuManager.reloadForUser();
      refreshSkuManager();
      updateSkuNavBadge();
      await sessionManager.fetchSessions();
      updateSessionNavBadge();
      updateActiveSessionBadge(sessionManager.getActiveSessionName());
    } catch (e) {
      console.warn('[App] Error reloading per-user data on auth change:', e);
    }
  });

  setupNavigation();
  setupUploadModal();
  setupSkuManager();
  setupSkuTableControls();
  setupExportButtons();
  setupDateFilter();
  setupRenameModal(handleRenameReport);
  setupSessionHandlers();
  initLabelSorter();
  initLandingPage();
  initBottomSheetPan();

  // Initialize SKU Groups from backend REST API
  try {
    await skuManager.init();
    refreshSkuManager();
    updateSkuNavBadge();
  } catch (err) {
    console.warn('[App] SKU Manager API init error:', err);
    refreshSkuManager();
    updateSkuNavBadge();
  }

  // Initialize Monthly Sessions from backend REST API
  try {
    await sessionManager.fetchSessions();
    updateSessionNavBadge();
    updateActiveSessionBadge(sessionManager.getActiveSessionName());
  } catch (err) {
    console.warn('[App] Session Manager init error:', err);
  }

  // Listen for SKU cost changes to recalculate
  skuManager.onChange(() => {
    updateSkuNavBadge();
    refreshSkuManager();
    if (state.allOrders.length > 0) {
      recalculate();
    }
  });

  // Listen for Session changes
  sessionManager.onChange(() => {
    updateSessionNavBadge();
    refreshSessionsView();
    updateActiveSessionBadge(sessionManager.getActiveSessionName());
  });

  // Show dashboard section
  switchSection('dashboard');
  updateHeaderBadge(0, 0);

  // Check if we have stored data
  loadStoredFiles();
  updateDashboardWelcomeView();
}

/**
 * Setup navigation sidebar & mobile bottom navigation bar
 */
function setupNavigation() {
  const handleNavClick = (sectionId) => {
    if (sectionId === 'labelSorter') {
      mountLabelSorter('dashboard');
      state.currentSection = 'labelSorter';
      switchSection('labelSorterSection');
      return;
    }
    state.currentSection = sectionId;
    switchSection(sectionId);

    // Re-render charts when switching to their sections
    if (sectionId === 'dashboard' && state.analytics) {
      renderCharts();
    }
    if (sectionId === 'returns' && state.analytics) {
      renderReturnCharts();
    }
    if (sectionId === 'skuManager') {
      refreshSkuManager();
    }
    if (sectionId === 'sessionsSection') {
      refreshSessionsView();
    }
  };

  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => handleNavClick(item.dataset.section));
  });

  document.querySelectorAll('.mobile-bottom-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => handleNavClick(item.dataset.section));
  });

  // Mobile sidebar drawer triggers
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileClose = document.getElementById('mobileSidebarClose');
  const backdrop = document.getElementById('sidebarBackdrop');

  mobileToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileSidebar();
  });

  mobileClose?.addEventListener('click', () => {
    closeMobileSidebar();
  });

  backdrop?.addEventListener('click', () => {
    closeMobileSidebar();
  });

  // Close drawer on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileSidebar();
    }
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
  applyBtn?.addEventListener('click', () => {
    const startVal = startInput.value;
    const endVal = endInput.value;

    if (!startVal && !endVal) {
      showToast('Please select a start or end date', 'info');
      return;
    }

    const start = startVal ? new Date(startVal + 'T00:00:00') : null;
    const end = endVal ? new Date(endVal + 'T23:59:59') : null;

    if (start && end && start > end) {
      showToast('Start date cannot be after end date', 'error');
      return;
    }

    applyDateFilter(start, end);
    presetBtns.forEach(b => b.classList.remove('active'));
  });

  // Clear date filter
  clearBtn?.addEventListener('click', () => {
    startInput.value = '';
    endInput.value = '';
    presetBtns.forEach(b => b.classList.remove('active'));
    clearDateFilter();
  });

  badgeClear?.addEventListener('click', () => {
    startInput.value = '';
    endInput.value = '';
    presetBtns.forEach(b => b.classList.remove('active'));
    clearDateFilter();
  });

  // Quick preset buttons (e.g. Jul 2026, Aug 2026, All Time)
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.dataset.preset;
      if (preset === 'all') {
        startInput.value = '';
        endInput.value = '';
        clearDateFilter();
        return;
      }

      if (preset === 'jul2026' || preset === 'july') {
        startInput.value = '2026-07-01';
        endInput.value = '2026-07-31';
        applyDateFilter(new Date('2026-07-01T00:00:00'), new Date('2026-07-31T23:59:59'));
      } else if (preset === 'aug2026' || preset === 'august') {
        startInput.value = '2026-08-01';
        endInput.value = '2026-08-31';
        applyDateFilter(new Date('2026-08-01T00:00:00'), new Date('2026-08-31T23:59:59'));
      }
    });
  });
}

/**
 * Apply date filter to orders
 */
function applyDateFilter(start, end) {
  state.dateFilter = { start, end, active: true };

  state.filteredOrders = state.allOrders.filter(order => {
    if (!order.orderDate) return false;
    const orderDate = new Date(order.orderDate);
    if (isNaN(orderDate.getTime())) return false;

    if (start && orderDate < start) return false;
    if (end && orderDate > end) return false;
    return true;
  });

  // Update active filter badge
  const badge = document.getElementById('activeFilterBadge');
  const text = document.getElementById('activeFilterText');
  if (badge && text) {
    badge.style.display = 'inline-flex';
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (start && end) {
      text.textContent = `📅 ${fmt(start)} → ${fmt(end)} (${state.filteredOrders.length} orders)`;
    } else if (start) {
      text.textContent = `📅 From ${fmt(start)} (${state.filteredOrders.length} orders)`;
    } else {
      text.textContent = `📅 Until ${fmt(end)} (${state.filteredOrders.length} orders)`;
    }
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
  if (badge) badge.style.display = 'none';

  recalculate();
  showToast('Date filter cleared — showing all orders', 'info');
}

/**
 * Get active orders
 */
function getActiveOrders() {
  return state.dateFilter.active ? state.filteredOrders : state.allOrders;
}

// ═══════════════════════════════════════════
//  FILE UPLOAD & REPORT NAMING
// ═══════════════════════════════════════════

let pendingParsedFiles = [];

/**
 * Setup file upload modal
 */
function setupUploadModal() {
  const modal = document.getElementById('uploadModal');
  const uploadBtns = document.querySelectorAll('.upload-trigger');
  const closeBtn = modal?.querySelector('.modal-close');
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const processBtn = document.getElementById('processFilesBtn');

  // Open modal
  uploadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pendingParsedFiles = [];
      const list = document.getElementById('pendingFilesList');
      if (list) list.innerHTML = '';
      if (processBtn) processBtn.style.display = 'none';
      modal?.classList.add('active');
    });
  });

  // Close modal
  closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Drag & drop
  zone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone?.addEventListener('dragleave', () => {
    zone.classList.remove('drag-over');
  });

  zone?.addEventListener('drop', (e) => {
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
  zone?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', () => {
    const files = [...fileInput.files];
    if (files.length > 0) {
      handleFiles(files);
    }
  });

  // Process button
  processBtn?.addEventListener('click', () => {
    if (pendingParsedFiles.length > 0) {
      processAllData();
      modal?.classList.remove('active');
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
      const defaultReportName = result.month
        ? `${result.month} - ${result.platform || 'Payment'} Report`
        : file.name.replace(/\.[^/.]+$/, '');

      result.id = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      result.reportName = defaultReportName;
      result.uploadedAt = new Date().toISOString();

      // Tag orders and ads with this report's ID
      result.orders.forEach(o => { o._reportId = result.id; });
      result.ads.forEach(a => { a._reportId = result.id; });

      pendingParsedFiles.push(result);

      // Enhance UI with Report Name input
      item.innerHTML = `
        <span class="file-icon">📊</span>
        <div class="file-info">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; width: 100%;">
            <div class="file-name">${file.name}</div>
            <span class="file-status success" style="flex-shrink: 0; white-space: nowrap;">✓ ${result.orders.length} orders</span>
          </div>
          <div class="file-size" style="margin-top: 2px;">${(file.size / 1024).toFixed(1)} KB · ${result.month} · ${result.platform}</div>
          <div class="report-name-input-wrapper">
            <label>Report Name (saved with this file):</label>
            <input type="text" class="form-input report-name-input" data-id="${result.id}" value="${defaultReportName}">
          </div>
        </div>
      `;

      showToast(`Parsed ${result.orders.length} orders from ${file.name}`, 'success');
    } catch (err) {
      item.querySelector('.file-status').className = 'file-status error';
      item.querySelector('.file-status').textContent = '✕ Error';
      showToast(`Error parsing ${file.name}: ${err.message}`, 'error');
    }
  }

  if (processBtn) {
    processBtn.style.display = pendingParsedFiles.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Process all parsed data and render dashboard
 */
function processAllData() {
  // Read any customized report names from inputs
  document.querySelectorAll('.report-name-input').forEach(input => {
    const reportId = input.dataset.id;
    const fileObj = pendingParsedFiles.find(f => f.id === reportId);
    if (fileObj && input.value.trim()) {
      fileObj.reportName = input.value.trim();
    }
  });

  // Add newly parsed files to state
  state.parsedFiles = [...state.parsedFiles, ...pendingParsedFiles];
  pendingParsedFiles = [];

  // Rebuild orders and ads collections
  refreshOrderCollections();

  // Save to persistence
  saveStateToStorage();

  recalculate();
  showToast(`Loaded ${state.allOrders.length} orders across ${state.parsedFiles.length} reports!`, 'success');
}

/**
 * Re-aggregate orders, ads, and SKUs from parsedFiles
 */
function refreshOrderCollections() {
  state.allOrders = state.parsedFiles.flatMap(f => f.orders || []);
  state.allAds = state.parsedFiles.flatMap(f => f.ads || []);
  state.filteredOrders = [...state.allOrders];
  state.allSkus = [...new Set(state.allOrders.map(o => o.sku))].sort();
  setDateRangeHints();
}

/**
 * Save current state to localStorage
 */
function saveStateToStorage() {
  localStorage.setItem('fc_file_info', JSON.stringify(
    state.parsedFiles.map(f => ({
      id: f.id,
      reportName: f.reportName || f.filename,
      filename: f.filename,
      month: f.month,
      platform: f.platform,
      orderCount: (f.orders || []).length,
      uploadedAt: f.uploadedAt || new Date().toISOString()
    }))
  ));

  localStorage.setItem('fc_orders', JSON.stringify(state.allOrders));
  localStorage.setItem('fc_ads', JSON.stringify(state.allAds));
}

/**
 * Handle renaming a report
 */
function handleRenameReport(index, newName) {
  const file = state.parsedFiles[index];
  if (!file) return;

  file.reportName = newName;
  saveStateToStorage();
  renderUploadedFiles(state.parsedFiles, { onRename: onReportRenameClick, onDelete: handleDeleteReport });
  updateHeaderBadge(getActiveOrders().length, state.parsedFiles.length, state.parsedFiles);
  showToast(`Report renamed to "${newName}"`, 'success');
}

function onReportRenameClick(index) {
  const file = state.parsedFiles[index];
  if (file) {
    openRenameModal(index, file.reportName || file.filename);
  }
}

/**
 * Handle deleting a report
 */
function handleDeleteReport(index) {
  const file = state.parsedFiles[index];
  if (!file) return;

  const displayName = file.reportName || file.filename;
  if (!confirm(`Delete report "${displayName}"? This will remove its orders from the dashboard.`)) {
    return;
  }

  const reportId = file.id;
  state.parsedFiles.splice(index, 1);

  // Filter out orders that belong to this report
  if (reportId) {
    state.allOrders = state.allOrders.filter(o => o._reportId !== reportId);
    state.allAds = state.allAds.filter(a => a._reportId !== reportId);
  } else {
    // Fallback: re-aggregate remaining
    refreshOrderCollections();
  }

  state.filteredOrders = [...state.allOrders];
  state.allSkus = [...new Set(state.allOrders.map(o => o.sku))].sort();

  saveStateToStorage();
  recalculate();
  showToast(`Report "${displayName}" removed`, 'info');
}

// ═══════════════════════════════════════════
//  MONTHLY SESSIONS MANAGEMENT
// ═══════════════════════════════════════════

/**
 * Setup Monthly Session Handlers
 */
function setupSessionHandlers() {
  // Save Session Buttons
  document.getElementById('headerSaveSessionBtn')?.addEventListener('click', triggerSaveSessionModal);

  // Clear Dashboard Button (Minimalist fresh start)
  document.getElementById('headerClearDashboardBtn')?.addEventListener('click', () => {
    if (state.allOrders.length === 0) return;
    document.getElementById('clearDashboardModal')?.classList.add('active');
  });

  document.getElementById('cancelClearDashboardBtn')?.addEventListener('click', () => {
    document.getElementById('clearDashboardModal')?.classList.remove('active');
  });

  document.getElementById('confirmClearDashboardBtn')?.addEventListener('click', () => {
    executeClearDashboard();
    document.getElementById('clearDashboardModal')?.classList.remove('active');
  });

  // Welcome Hero Browse Sessions
  document.getElementById('welcomeBrowseSessionsBtn')?.addEventListener('click', () => {
    switchSection('sessionsSection');
  });

  // Welcome Hero Label Sort & Print
  document.getElementById('welcomeLabelSortBtn')?.addEventListener('click', () => {
    mountLabelSorter('dashboard');
    state.currentSection = 'labelSorter';
    switchSection('labelSorterSection');
  });

  // Header Active Session Pill -> Click to view/edit active session details
  document.getElementById('headerActiveSessionPill')?.addEventListener('click', () => {
    const activeId = sessionManager.getActiveSessionId();
    const activeSession = sessionManager.sessions.find(s => s.id === activeId);
    if (activeSession) {
      openEditSessionModal(activeSession);
    } else {
      switchSection('sessionsSection');
      refreshSessionsView();
    }
  });

  // Edit Modal -> Browse All Sessions button
  document.getElementById('editModalBrowseAllBtn')?.addEventListener('click', () => {
    document.getElementById('editSessionModal')?.classList.remove('active');
    switchSection('sessionsSection');
    refreshSessionsView();
  });

  // Sessions Section -> Back to Dashboard button
  document.getElementById('sessionsBackToDashboardBtn')?.addEventListener('click', () => {
    switchSection('dashboard');
  });

  // Backdrop click for Clear Dashboard Modal
  const clearModal = document.getElementById('clearDashboardModal');
  clearModal?.addEventListener('click', (e) => {
    if (e.target === clearModal) clearModal.classList.remove('active');
  });

  // Setup Modals
  setupCreateSessionModal(handleCreateSession);
  setupSaveSessionModal(handleSaveSession);
  setupEditSessionModal(handleEditSession);
}

/**
 * Execute Clear Dashboard
 */
function executeClearDashboard() {
  // Clear current active state
  state.allOrders = [];
  state.allAds = [];
  state.parsedFiles = [];
  state.filteredOrders = [];
  state.allSkus = [];
  state.analytics = null;
  state.dateFilter = { start: null, end: null, active: false };

  // Clear cache from storage
  localStorage.removeItem('fc_orders');
  localStorage.removeItem('fc_ads');
  localStorage.removeItem('fc_file_info');

  // Deactivate active session
  sessionManager.setActiveSession(null, null);
  updateActiveSessionBadge(null);

  recalculate();
  showToast('Dashboard cleared. Welcome to fresh workspace!', 'info');
}

/**
 * Update Dashboard Welcome Hero vs Analytics View
 */
function updateDashboardWelcomeView() {
  const welcomeHero = document.getElementById('dashboardWelcomeHero');
  const analyticsContent = document.getElementById('dashboardAnalyticsContent');
  const clearBtn = document.getElementById('headerClearDashboardBtn');
  const saveBtn = document.getElementById('headerSaveSessionBtn');
  const hasOrders = state.allOrders.length > 0;

  if (hasOrders) {
    if (welcomeHero) welcomeHero.style.display = 'none';
    if (analyticsContent) analyticsContent.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'inline-flex';
    if (saveBtn) saveBtn.style.display = 'inline-flex';
  } else {
    if (welcomeHero) welcomeHero.style.display = 'block';
    if (analyticsContent) analyticsContent.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';

    renderWelcomeRecentSessions();
  }
}

/**
 * Render quick jump chips for saved monthly sessions in Welcome Hero
 */
function renderWelcomeRecentSessions() {
  const container = document.getElementById('welcomeRecentSessions');
  const chipsList = document.getElementById('welcomeRecentChips');
  if (!container || !chipsList) return;

  const sessions = sessionManager.sessions || [];
  if (sessions.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  chipsList.innerHTML = sessions.slice(0, 5).map(sess => `
    <button class="recent-session-chip" data-id="${sess.id}" title="Load session: ${sess.name}">
      <span class="chip-tag">${sess.month || 'Month'}</span>
      <span>${sess.name}</span>
      <span style="opacity: 0.6">· ${(sess.orderCount || 0).toLocaleString('en-IN')} orders</span>
    </button>
  `).join('');

  chipsList.querySelectorAll('.recent-session-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSwitchSession(btn.dataset.id);
    });
  });
}

/**
 * Open Create Session Modal
 */
function triggerCreateSessionModal() {
  const currentMonth = state.parsedFiles[0]?.month || '';
  openCreateSessionModal({
    currentOrderCount: state.allOrders.length,
    currentMonth
  });
}

/**
 * Handle Create Session form submit
 */
async function handleCreateSession({ name, month, notes, mode }) {
  if (mode === 'current') {
    await handleSaveSession({ name, month, notes });
    return;
  }

  // Fresh Session Mode for a new month
  const payload = {
    name,
    month: month || '',
    notes: notes || '',
    orderCount: 0,
    fileCount: 0,
    netSettlement: 0,
    netProfit: 0,
    returnRate: 0,
    orders: [],
    ads: [],
    parsedFiles: [],
    dateFilter: { start: null, end: null, active: false }
  };

  const saved = await sessionManager.saveSession(payload);
  sessionManager.setActiveSession(saved.id, saved.name);
  updateActiveSessionBadge(saved.name);

  // Clear current workspace in memory and storage for the new month
  state.allOrders = [];
  state.allAds = [];
  state.parsedFiles = [];
  state.filteredOrders = [];
  state.allSkus = [];
  state.analytics = null;
  state.dateFilter = { start: null, end: null, active: false };

  saveStateToStorage();
  recalculate();
  switchSection('dashboard');
  refreshSessionsView();

  showToast(`New session "${name}" created! Please upload payment files.`, 'success');

  // Automatically open the upload modal for this new session
  setTimeout(() => {
    document.getElementById('uploadModal')?.classList.add('active');
  }, 400);
}

/**
 * Open Save Session Modal with current state data
 */
function triggerSaveSessionModal() {
  const defaultMonth = state.parsedFiles[0]?.month || '';
  const defaultName = defaultMonth ? `${defaultMonth} Session` : `Session ${new Date().toLocaleDateString('en-IN')}`;

  openSaveSessionModal({
    orderCount: state.allOrders.length,
    fileCount: state.parsedFiles.length,
    netSettlement: state.analytics?.totalSettlement || 0,
    defaultMonth,
    defaultName
  });
}

/**
 * Handle Save Session form submit
 */
async function handleSaveSession({ name, month, notes }) {
  const cleanFiles = (state.parsedFiles || []).map(f => ({
    id: f.id,
    reportName: f.reportName || f.filename,
    filename: f.filename,
    month: f.month,
    platform: f.platform,
    orderCount: f.orderCount || 0,
    uploadedAt: f.uploadedAt || new Date().toISOString()
  }));

  const payload = {
    name,
    month: month || (state.parsedFiles[0]?.month || ''),
    notes: notes || '',
    orderCount: state.allOrders.length,
    fileCount: cleanFiles.length,
    netSettlement: state.analytics?.totalSettlement || 0,
    netProfit: state.analytics?.netProfit || 0,
    returnRate: state.analytics?.returnRate || 0,
    orders: state.allOrders,
    ads: state.allAds,
    parsedFiles: cleanFiles,
    dateFilter: state.dateFilter
  };

  const saved = await sessionManager.saveSession(payload);
  updateActiveSessionBadge(saved.name);
  showToast(`Session "${name}" saved successfully!`, 'success');
  refreshSessionsView();
}

/**
 * Handle Switch / View Session
 */
async function handleSwitchSession(sessionId) {
  try {
    showToast('Loading session...', 'info');
    const session = await sessionManager.fetchSession(sessionId);

    state.allOrders = session.orders || [];
    state.allAds = session.ads || [];
    state.parsedFiles = session.parsedFiles || [];
    state.filteredOrders = [...state.allOrders];
    state.allSkus = [...new Set(state.allOrders.map(o => o.sku))].sort();
    state.dateFilter = session.dateFilter || { start: null, end: null, active: false };

    sessionManager.setActiveSession(session.id, session.name);
    updateActiveSessionBadge(session.name);

    // Save to local storage cache
    saveStateToStorage();

    recalculate();
    switchSection('dashboard');
    showToast(`Switched to session "${session.name}" (${state.allOrders.length} orders loaded)`, 'success');
  } catch (err) {
    showToast(`Error loading session: ${err.message}`, 'error');
  }
}

/**
 * Handle Edit Session Details
 */
async function handleEditSession(sessionId, { name, month, notes }) {
  await sessionManager.updateSession(sessionId, { name, month, notes });
  showToast('Session details updated!', 'success');
  refreshSessionsView();
}

/**
 * Handle Overwrite Session with Current Loaded Data
 */
async function handleUpdateSessionData(sessionId) {
  const session = sessionManager.sessions.find(s => s.id === sessionId);
  const name = session ? session.name : 'this session';

  if (!confirm(`Overwrite "${name}" with currently loaded dashboard data (${state.allOrders.length} orders)?`)) {
    return;
  }

  try {
    const cleanFiles = (state.parsedFiles || []).map(f => ({
      id: f.id,
      reportName: f.reportName || f.filename,
      filename: f.filename,
      month: f.month,
      platform: f.platform,
      orderCount: f.orderCount || 0,
      uploadedAt: f.uploadedAt || new Date().toISOString()
    }));

    await sessionManager.updateSession(sessionId, {
      orderCount: state.allOrders.length,
      fileCount: cleanFiles.length,
      netSettlement: state.analytics?.totalSettlement || 0,
      netProfit: state.analytics?.netProfit || 0,
      returnRate: state.analytics?.returnRate || 0,
      orders: state.allOrders,
      ads: state.allAds,
      parsedFiles: cleanFiles,
      dateFilter: state.dateFilter
    });
    showToast(`Session "${name}" updated with current data!`, 'success');
    refreshSessionsView();
  } catch (err) {
    showToast(`Failed to update session: ${err.message}`, 'error');
  }
}

/**
 * Handle Delete Session
 */
async function handleDeleteSession(sessionId) {
  const session = sessionManager.sessions.find(s => s.id === sessionId);
  const name = session ? session.name : 'this session';

  if (!confirm(`Delete session "${name}" permanently?`)) {
    return;
  }

  try {
    await sessionManager.deleteSession(sessionId);
    showToast(`Session "${name}" deleted`, 'info');
    refreshSessionsView();
  } catch (err) {
    showToast(`Error deleting session: ${err.message}`, 'error');
  }
}

/**
 * Refresh Sessions UI list and badges
 */
function refreshSessionsView() {
  renderSessionsList(sessionManager.sessions, sessionManager.getActiveSessionId(), {
    onSwitch: handleSwitchSession,
    onEdit: (id) => {
      const sess = sessionManager.sessions.find(s => s.id === id);
      if (sess) openEditSessionModal(sess);
    },
    onUpdateData: handleUpdateSessionData,
    onDelete: handleDeleteSession
  });
  updateSessionNavBadge();
  renderWelcomeRecentSessions();
}

/**
 * Update navigation counter badge for sessions
 */
function updateSessionNavBadge() {
  const badge = document.getElementById('sessionsNavBadge');
  if (badge) {
    badge.textContent = sessionManager.sessions.length;
  }
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

  if (startInput && endInput) {
    startInput.min = fmt(minDate);
    startInput.max = fmt(maxDate);
    endInput.min = fmt(minDate);
    endInput.max = fmt(maxDate);
    startInput.title = `Start Date (earliest: ${fmt(minDate)})`;
    endInput.title = `End Date (latest: ${fmt(maxDate)})`;
  }
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
          id: f.id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          reportName: f.reportName || f.filename,
          filename: f.filename,
          month: f.month,
          platform: f.platform,
          orderCount: f.orderCount || 0,
          uploadedAt: f.uploadedAt || new Date().toISOString(),
          orders: state.allOrders.filter(o => !f.id || o._reportId === f.id),
          ads: state.allAds.filter(a => !f.id || a._reportId === f.id)
        }));
      }

      if (state.allOrders.length > 0) {
        setDateRangeHints();
        recalculate();
      }
    }
  } catch (err) {
    console.warn('[App] Could not load stored data:', err);
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

  // Header badge with active reports
  updateHeaderBadge(activeOrders.length, state.parsedFiles.length || (activeOrders.length > 0 ? 1 : 0), state.parsedFiles);

  renderMetrics(state.analytics);
  renderSkuTable(state.analytics.skuAnalytics, state.skuTableFilter, state.skuTableSearch);
  renderGroupTable(state.analytics.groupAnalytics);
  renderReturnAnalysis(state.analytics);
  renderReturnTable(state.analytics.skuAnalytics);
  renderGroupReturnTable(state.analytics.groupAnalytics);
  renderCostingTable(state.analytics.groupAnalytics);
  renderUploadedFiles(state.parsedFiles, { onRename: onReportRenameClick, onDelete: handleDeleteReport });

  // Update SKU count badge
  updateSkuNavBadge();

  // Render charts
  renderCharts();

  // Update SKU manager view
  refreshSkuManager();

  // Update nav badges
  updateNavBadges();

  // Toggle Welcome vs Analytics dashboard view
  updateDashboardWelcomeView();
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

/**
 * Get all known SKUs: both from uploaded orders and all configured SKU groups
 */
function getAllKnownSkus() {
  const skusFromGroups = skuManager.getGroups().flatMap(g => g.skus || []);
  return [...new Set([...state.allSkus, ...skusFromGroups])].sort();
}

/**
 * Update SKU navigation badge with the count of SKU groups
 */
function updateSkuNavBadge() {
  const badge = document.getElementById('skuNavBadge') || document.querySelector('.nav-item[data-section="skuManager"] .nav-badge');
  if (badge) {
    badge.textContent = skuManager.getGroups().length;
  }
}

/**
 * Refresh SKU manager view
 */
function refreshSkuManager() {
  const allSkus = getAllKnownSkus();
  renderSkuGroups(allSkus, (groupId) => {
    state.selectedGroupId = groupId;
    renderGroupDetail(groupId, allSkus, () => {
      refreshSkuManager();
      recalculate();
    });
  });

  if (state.selectedGroupId) {
    renderGroupDetail(state.selectedGroupId, allSkus, () => {
      refreshSkuManager();
      recalculate();
    });
  }
}

/**
 * Setup SKU Manager section
 */
function setupSkuManager() {
  setupCreateGroupModal(getAllKnownSkus, () => {
    refreshSkuManager();
    recalculate();
  });
}

/**
 * Setup SKU table search and filters
 */
function setupSkuTableControls() {
  const searchInput = document.getElementById('skuSearchInput');
  const filterSelect = document.getElementById('skuFilterSelect');

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
    if (confirm('Clear all loaded data? This will reset the dashboard. Saved monthly sessions and SKU groups will be preserved.')) {
      localStorage.removeItem('fc_orders');
      localStorage.removeItem('fc_ads');
      localStorage.removeItem('fc_file_info');
      state.parsedFiles = [];
      state.allOrders = [];
      state.filteredOrders = [];
      state.allAds = [];
      state.allSkus = [];
      state.analytics = null;
      sessionManager.setActiveSession(null, null);
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
