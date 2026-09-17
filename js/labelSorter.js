/**
 * labelSorter.js — Label Sorting & PDF Generation Controller
 * Orchestrates the complete label sorting workflow:
 * upload → parse → sort → reorder → crop/trim → generate PDF → download
 * 
 * Uses pdf-lib for PDF manipulation and generation.
 * All processing happens client-side.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { parseMultiplePDFs, getLabelStats } from './labelParser.js';
import { showToast } from './ui.js';

// ── Label Sorter State ──
const labelState = {
  platform: 'meesho',      // 'meesho' | 'flipkart'
  uploadedFiles: [],       // [{name, size, bytes: Uint8Array}]
  labels: [],              // Parsed label data from all files
  pdfDocs: [],             // Loaded PDFDocument instances for page copying
  sortType: 'sku',         // 'sku' | 'courier'
  sortBy: 'name',          // 'name' | 'count'
  sortDirection: 'asc',    // 'asc' | 'desc'
  cropInvoice: true,       // Option 1 Checkbox: Crop Below Product Details (remove invoice)
  trim4x4: false,          // Option 2 Checkbox: Trim outer border whitespace (4x4 Standard)
  comboMode: 'none',       // 'none' | 'keepOnTop' | 'separatePdf'
  customMessage: { enabled: false, text: '' },
  qrCode: { enabled: false, url: '' },
  skuOrder: [],            // Ordered list of unique keys [{key, count, labels}]
  excludedKeys: new Set(), // SKUs/couriers removed from output
  isProcessing: false,
  isParsed: false,
  generatedPdfBytes: null,
  stats: null
};

// ── Color palette for SKU order items ──
const SKU_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef', '#10b981', '#0ea5e9', '#f59e0b',
  '#ef4444', '#84cc16', '#64748b', '#7c3aed', '#0891b2'
];

/**
 * Initialize the label sorter — set up all event listeners
 */
export function initLabelSorter() {
  setupMarketplaceSelector();
  setupUploadZone();
  setupSortControls();
  setupTrimCropControls();
  setupComboControls();
  setupCustomMessage();
  setupActionButtons();
}

/**
 * Set the active marketplace for sorting & cropping
 * @param {'meesho' | 'flipkart'} platform
 */
export function setMarketplace(platform) {
  labelState.platform = platform === 'flipkart' ? 'flipkart' : 'meesho';
  const isFlipkart = labelState.platform === 'flipkart';

  // Update pills in workspace
  const btnMeesho = document.getElementById('platformBtnMeesho');
  const btnFlipkart = document.getElementById('platformBtnFlipkart');
  if (btnMeesho) btnMeesho.classList.toggle('active', !isFlipkart);
  if (btnFlipkart) btnFlipkart.classList.toggle('active', isFlipkart);

  // Update header and description
  const uploadTitle = document.getElementById('labelUploadHeaderTitle');
  const uploadSubtitle = document.getElementById('labelUploadHeaderSubtitle');
  const uploadText = document.getElementById('labelUploadText');

  if (uploadTitle) {
    uploadTitle.textContent = isFlipkart ? 'Upload Flipkart Shipping Labels' : 'Upload Meesho Shipping Labels';
  }
  if (uploadSubtitle) {
    uploadSubtitle.textContent = isFlipkart
      ? 'Upload your Flipkart shipping label PDFs to crop invoice space, sort labels by SKU, and prepare a 3×5 thermal print file.'
      : 'Upload your Meesho shipping label PDF to crop invoice space, sort labels, and prepare a cleaner print-ready file.';
  }
  if (uploadText) {
    uploadText.textContent = isFlipkart
      ? 'Click here to upload or Drag & Drop Flipkart Label PDFs Here'
      : 'Click here to upload or Drag & Drop Meesho Label PDFs Here';
  }

  // Update Crop labels and sections in config panel
  const cropCb = document.getElementById('cropInvoiceCheckbox');
  const trimCb = document.getElementById('trim4x4Checkbox');
  const cropLabel = document.getElementById('cropInvoiceOptionLabel');
  const trim4x4Label = document.getElementById('trim4x4OptionLabel');
  const comboSection = document.getElementById('comboSection');
  const customMsgSection = document.getElementById('customMsgSection');
  const cropTitle = document.querySelector('#cropInvoiceOptionLabel .trim-option-title');
  const cropDesc = document.querySelector('#cropInvoiceOptionLabel .trim-option-desc');

  if (isFlipkart) {
    // For Flipkart: auto-select crop setting by default and remove 4x4, combo, and custom message
    labelState.cropInvoice = true;
    labelState.trim4x4 = false;
    if (cropCb) cropCb.checked = true;
    if (trimCb) trimCb.checked = false;
    if (cropLabel) cropLabel.classList.add('active');
    if (trim4x4Label) trim4x4Label.style.display = 'none';
    if (comboSection) comboSection.style.display = 'none';
    if (customMsgSection) customMsgSection.style.display = 'none';
    if (cropTitle) cropTitle.textContent = '✂️ Crop labels (remove invoice section)';
    if (cropDesc) cropDesc.textContent = 'Removes the tax-invoice block below the label.';
  } else {
    // For Meesho: restore 4x4 option, combo section, and meesho defaults
    if (trim4x4Label) trim4x4Label.style.display = '';
    if (comboSection) comboSection.style.display = '';
    if (customMsgSection) customMsgSection.style.display = labelState.cropInvoice ? 'none' : '';
    if (cropTitle) cropTitle.textContent = '✂️ Crop labels (remove invoice section)';
    if (cropDesc) cropDesc.textContent = 'Removes the tax-invoice block below the label.';
  }

  // Update hero title and subtitle on public page
  const heroTitle = document.getElementById('sbMarketplaceHeroTitle');
  const heroDesc = document.getElementById('sbMarketplaceHeroDesc');
  if (heroTitle) {
    heroTitle.innerHTML = isFlipkart
      ? 'Free Flipkart Label Crop <br><span class="highlight">&amp; Sort Tool</span>'
      : 'Free Meesho Label Crop <br><span class="highlight">&amp; Sort Tool</span>';
  }
  if (heroDesc) {
    heroDesc.innerHTML = isFlipkart
      ? '<p>Every Flipkart seller faces the same daily problem: shipping label PDFs include both the shipping label and tax invoice on the same page.</p><p>FC Analytics helps you crop Flipkart labels away from the invoice section, sort labels by SKU, and download a clean, print-ready 3×5 file for free with no signup needed.</p>'
      : '<p>Every Meesho seller faces the same daily problem: shipping label PDFs include both the shipping label and tax invoice on the same page.</p><p>FC Analytics helps you crop Meesho labels away from the invoice section, sort labels by SKU or courier partner, and download a clean, print-ready file for free with no signup needed.</p>';
  }

  // Sync public switcher bar if visible
  document.querySelectorAll('.sb-meesho-switch-item').forEach(btn => {
    const route = btn.getAttribute('data-sb-route');
    if (isFlipkart) {
      const isCurrent = route === 'label-sort-crop/flipkart';
      btn.classList.toggle('active', isCurrent);
      btn.classList.toggle('flipkart-active', isCurrent);
    } else {
      const isCurrent = route === 'label-sort-crop/meesho';
      btn.classList.toggle('active', isCurrent);
      btn.classList.remove('flipkart-active');
    }
  });

  // Manage route change on tab change when on public tool page
  const meeshoPageView = document.getElementById('labelCropMeeshoView');
  if (meeshoPageView && meeshoPageView.style.display !== 'none') {
    const targetPath = isFlipkart ? '/labels/flipkart' : '/labels/meesho';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }
}

function setupMarketplaceSelector() {
  const btnMeesho = document.getElementById('platformBtnMeesho');
  const btnFlipkart = document.getElementById('platformBtnFlipkart');

  btnMeesho?.addEventListener('click', (e) => {
    e.preventDefault();
    setMarketplace('meesho');
  });

  btnFlipkart?.addEventListener('click', (e) => {
    e.preventDefault();
    setMarketplace('flipkart');
  });
}

// ═══════════════════════════════════════════
//  FILE UPLOAD
// ═══════════════════════════════════════════

function setupUploadZone() {
  const dropZone = document.getElementById('labelUploadZone');
  const fileInput = document.getElementById('labelFileInput');
  const addMoreBtn = document.getElementById('labelAddMoreFiles');

  if (!dropZone || !fileInput) return;

  // Click to browse
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('.label-file-remove')) return;
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFileUpload(Array.from(fileInput.files));
      fileInput.value = ''; // Reset for re-upload
    }
  });

  // Drag & Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      handleFileUpload(files);
    } else {
      showToast('Please upload PDF files only', 'error');
    }
  });

  // Add more files button
  addMoreBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
}

/**
 * Handle uploaded PDF files
 */
async function handleFileUpload(files) {
  for (const file of files) {
    if (file.type !== 'application/pdf') {
      showToast(`"${file.name}" is not a PDF file`, 'error');
      continue;
    }

    // Check for duplicates
    if (labelState.uploadedFiles.some(f => f.name === file.name)) {
      showToast(`"${file.name}" is already uploaded`, 'info');
      continue;
    }

    try {
      const buffer = await file.arrayBuffer();
      labelState.uploadedFiles.push({
        name: file.name,
        size: file.size,
        bytes: new Uint8Array(buffer)
      });
    } catch (err) {
      showToast(`Error reading "${file.name}"`, 'error');
    }
  }

  renderUploadedFileList();
  updatePrepareButtonState();
}

/**
 * Remove a file from the upload list
 */
function removeFile(index) {
  labelState.uploadedFiles.splice(index, 1);
  renderUploadedFileList();
  updatePrepareButtonState();
}

/**
 * Render the uploaded file list in the upload zone
 */
function renderUploadedFileList() {
  const container = document.getElementById('labelFileList');
  const emptyState = document.getElementById('labelUploadEmpty');
  const addMoreBtn = document.getElementById('labelAddMoreFiles');

  if (!container) return;

  if (labelState.uploadedFiles.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = '';
    if (addMoreBtn) addMoreBtn.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (addMoreBtn) addMoreBtn.style.display = '';

  container.innerHTML = labelState.uploadedFiles.map((file, idx) => `
    <div class="label-file-item">
      <div class="label-file-icon">📄</div>
      <div class="label-file-info">
        <div class="label-file-name" title="${file.name}">${file.name}</div>
        <div class="label-file-size">${formatFileSize(file.size)}</div>
      </div>
      <button class="label-file-remove" data-index="${idx}" title="Remove file">🗑</button>
    </div>
  `).join('');

  // Bind remove buttons
  container.querySelectorAll('.label-file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFile(parseInt(btn.dataset.index));
    });
  });
}

function updatePrepareButtonState() {
  const btn = document.getElementById('labelPrepareBtn');
  if (btn) {
    btn.disabled = labelState.uploadedFiles.length === 0;
    btn.style.display = labelState.uploadedFiles.length > 0 ? '' : 'none';
  }
}

// ═══════════════════════════════════════════
//  PARSE & PROCESS
// ═══════════════════════════════════════════

/**
 * Process all uploaded PDFs — parse, extract, and display results
 */
export async function processLabels() {
  if (labelState.uploadedFiles.length === 0) {
    showToast('Please upload at least one PDF file', 'error');
    return;
  }

  const prepareBtn = document.getElementById('labelPrepareBtn');
  if (prepareBtn) {
    prepareBtn.disabled = true;
    prepareBtn.innerHTML = '⏳ Processing...';
  }

  labelState.isProcessing = true;

  try {
    // Parse all PDFs (passing active platform)
    labelState.labels = await parseMultiplePDFs(labelState.uploadedFiles, labelState.platform);

    if (labelState.labels.length === 0) {
      showToast('No labels found in the uploaded PDFs', 'error');
      return;
    }

    // Auto-detect if uploaded files are Flipkart labels
    if (labelState.labels.some(l => l.platform === 'flipkart')) {
      labelState.platform = 'flipkart';
    }

    // Load PDFDocument instances for pdf-lib manipulation
    labelState.pdfDocs = [];
    for (const file of labelState.uploadedFiles) {
      // Use a copy of the buffer since pdfjs may have touched the original
      const bufCopy = file.bytes.slice(0);
      const doc = await PDFDocument.load(bufCopy);
      labelState.pdfDocs.push({ name: file.name, doc });
    }

    // Calculate stats
    labelState.stats = getLabelStats(labelState.labels);
    labelState.isParsed = true;
    labelState.excludedKeys = new Set();

    // Build initial SKU order
    buildSkuOrder();

    // Show the sorting panel, hide upload panel
    showSortingPanel();

    showToast(`Successfully parsed ${labelState.labels.length} labels from ${labelState.uploadedFiles.length} file(s)`, 'success');
  } catch (err) {
    console.error('[LabelSorter] Parse error:', err);
    showToast(`Error processing PDFs: ${err.message}`, 'error');
  } finally {
    labelState.isProcessing = false;
    if (prepareBtn) {
      prepareBtn.disabled = false;
      prepareBtn.innerHTML = '🚀 Upload & Prepare Labels';
    }
  }
}

// ═══════════════════════════════════════════
//  SORTING LOGIC
// ═══════════════════════════════════════════

/**
 * Build the SKU/courier order list based on current sort settings
 */
function buildSkuOrder() {
  const groups = {};
  const key = labelState.sortType === 'sku' ? 'sku' : 'courierPartner';

  labelState.labels.forEach(label => {
    const k = label[key];
    if (!groups[k]) {
      groups[k] = { key: k, count: 0, labels: [] };
    }
    groups[k].count++;
    groups[k].labels.push(label);
  });

  let ordered = Object.values(groups);

  // Sort
  if (labelState.sortBy === 'name') {
    ordered.sort((a, b) => a.key.localeCompare(b.key));
  } else {
    ordered.sort((a, b) => b.count - a.count);
  }

  if (labelState.sortDirection === 'desc') {
    ordered.reverse();
  }

  // Handle combo/multi-qty: move multi-qty orders to top
  if (labelState.comboMode === 'keepOnTop') {
    const multiQty = [];
    const singleQty = [];
    ordered.forEach(group => {
      const hasMulti = group.labels.some(l => l.isMultiQty);
      if (hasMulti) {
        multiQty.push(group);
      } else {
        singleQty.push(group);
      }
    });
    ordered = [...multiQty, ...singleQty];
  }

  labelState.skuOrder = ordered;
  renderSkuOrderPanel();
}

function setupSortControls() {
  // Sort Type tabs: SKU vs Courier
  document.getElementById('sortTypeSku')?.addEventListener('click', () => {
    labelState.sortType = 'sku';
    document.getElementById('sortTypeSku')?.classList.add('active');
    document.getElementById('sortTypeCourier')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });

  document.getElementById('sortTypeCourier')?.addEventListener('click', () => {
    labelState.sortType = 'courier';
    document.getElementById('sortTypeCourier')?.classList.remove('active');
    document.getElementById('sortTypeCourier')?.classList.add('active');
    document.getElementById('sortTypeSku')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });

  // Sort By: Name vs Count
  document.getElementById('sortByName')?.addEventListener('click', () => {
    labelState.sortBy = 'name';
    document.getElementById('sortByName')?.classList.add('active');
    document.getElementById('sortByCount')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });

  document.getElementById('sortByCount')?.addEventListener('click', () => {
    labelState.sortBy = 'count';
    document.getElementById('sortByCount')?.classList.add('active');
    document.getElementById('sortByName')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });

  // Sort Direction
  document.getElementById('sortAsc')?.addEventListener('click', () => {
    labelState.sortDirection = 'asc';
    document.getElementById('sortAsc')?.classList.add('active');
    document.getElementById('sortDesc')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });

  document.getElementById('sortDesc')?.addEventListener('click', () => {
    labelState.sortDirection = 'desc';
    document.getElementById('sortDesc')?.classList.add('active');
    document.getElementById('sortAsc')?.classList.remove('active');
    if (labelState.isParsed) buildSkuOrder();
  });
}

function setupTrimCropControls() {
  const cropCb = document.getElementById('cropInvoiceCheckbox');
  const trimCb = document.getElementById('trim4x4Checkbox');
  const cropLabel = document.getElementById('cropInvoiceOptionLabel');
  const trimLabel = document.getElementById('trim4x4OptionLabel');
  const customMsgSection = document.getElementById('customMsgSection');

  function syncTrimCropState(selected) {
    if (selected === 'crop') {
      if (cropCb) cropCb.checked = true;
      if (trimCb) trimCb.checked = false;
    } else if (selected === 'trim') {
      if (trimCb) trimCb.checked = true;
      if (cropCb) cropCb.checked = false;
    } else {
      // 'none' — uncheck both
      if (cropCb) cropCb.checked = false;
      if (trimCb) trimCb.checked = false;
    }

    labelState.cropInvoice = cropCb ? cropCb.checked : false;
    labelState.trim4x4 = trimCb ? trimCb.checked : false;

    // Visual active highlight on the option cards
    if (cropLabel) cropLabel.classList.toggle('active', labelState.cropInvoice);
    if (trimLabel) trimLabel.classList.toggle('active', labelState.trim4x4);

    // When crop labels is selected or on Flipkart, hide QR code / custom message section
    if (customMsgSection) {
      if (labelState.cropInvoice || labelState.platform === 'flipkart') {
        customMsgSection.style.display = 'none';
        labelState.customMessage.enabled = false;
      } else {
        customMsgSection.style.display = '';
        const customCheckbox = document.getElementById('customMsgCheckbox');
        labelState.customMessage.enabled = customCheckbox ? customCheckbox.checked : false;
      }
    }
  }

  cropCb?.addEventListener('click', (e) => {
    e.stopPropagation();
    // If it was just checked by this click, select 'crop'; if it was already on and browser toggled it off, keep it off ('none')
    if (cropCb.checked) {
      syncTrimCropState('crop');
    } else {
      syncTrimCropState('none');
    }
  });

  trimCb?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (trimCb.checked) {
      syncTrimCropState('trim');
    } else {
      syncTrimCropState('none');
    }
  });

  cropLabel?.addEventListener('click', (e) => {
    if (e.target !== cropCb) {
      e.preventDefault();
      // Toggle: if crop is already active, deselect; otherwise select crop
      if (labelState.cropInvoice) {
        syncTrimCropState('none');
      } else {
        syncTrimCropState('crop');
      }
    }
  });

  trimLabel?.addEventListener('click', (e) => {
    if (e.target !== trimCb) {
      e.preventDefault();
      // Toggle: if trim is already active, deselect; otherwise select trim
      if (labelState.trim4x4) {
        syncTrimCropState('none');
      } else {
        syncTrimCropState('trim');
      }
    }
  });

  // Initialize with nothing selected
  syncTrimCropState('none');
}

function setupComboControls() {
  document.querySelectorAll('.combo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.combo-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      labelState.comboMode = btn.dataset.combo;
      if (labelState.isParsed) buildSkuOrder();
    });
  });
}

function setupCustomMessage() {
  const checkbox = document.getElementById('customMsgCheckbox');
  const textarea = document.getElementById('customMsgText');
  const presets = document.getElementById('customMsgPresets');
  const charCount = document.getElementById('customMsgCharCount');
  const msgArea = document.getElementById('customMsgArea');

  const qrCheckbox = document.getElementById('customQrCheckbox');
  const qrArea = document.getElementById('customQrArea');
  const qrUrlInput = document.getElementById('customQrUrl');
  const qrPreview = document.getElementById('customQrPreviewContainer');
  const qrCanvas = document.getElementById('customQrCanvas');

  checkbox?.addEventListener('change', () => {
    labelState.customMessage.enabled = checkbox.checked;
    if (msgArea) msgArea.style.display = checkbox.checked ? 'block' : 'none';
  });

  presets?.addEventListener('change', () => {
    if (presets.value) {
      textarea.value = presets.value;
      labelState.customMessage.text = presets.value;
      if (charCount) charCount.textContent = `${presets.value.length}/200`;
    }
  });

  textarea?.addEventListener('input', () => {
    const text = textarea.value.substring(0, 200);
    textarea.value = text;
    labelState.customMessage.text = text;
    if (charCount) charCount.textContent = `${text.length}/200`;
  });

  qrCheckbox?.addEventListener('change', () => {
    labelState.qrCode.enabled = qrCheckbox.checked;
    if (qrArea) qrArea.style.display = qrCheckbox.checked ? 'block' : 'none';
    renderQrPreview();
  });

  qrUrlInput?.addEventListener('input', () => {
    labelState.qrCode.url = qrUrlInput.value.trim();
    renderQrPreview();
  });

  async function renderQrPreview() {
    if (!labelState.qrCode.enabled || !labelState.qrCode.url) {
      if (qrPreview) qrPreview.style.display = 'none';
      return;
    }
    try {
      if (qrCanvas) {
        await QRCode.toCanvas(qrCanvas, labelState.qrCode.url, {
          width: 50,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' }
        });
        if (qrPreview) qrPreview.style.display = 'flex';
      }
    } catch (e) {
      console.warn('QR render error:', e);
      if (qrPreview) qrPreview.style.display = 'none';
    }
  }
}

// ═══════════════════════════════════════════
//  SKU ORDER PANEL (Drag & Drop)
// ═══════════════════════════════════════════

function renderSkuOrderPanel() {
  const container = document.getElementById('skuOrderList');
  if (!container) return;

  // Update stats badges
  if (labelState.stats) {
    const statsBadges = document.getElementById('labelStatsBadges');
    if (statsBadges) {
      statsBadges.innerHTML = `
        <span class="label-stat-badge label-stat-labels">${labelState.stats.totalLabels} labels</span>
        <span class="label-stat-badge label-stat-skus">${labelState.stats.uniqueSkus} unique SKUs</span>
        <span class="label-stat-badge label-stat-couriers">${labelState.stats.courierPartners} courier partners</span>
      `;
    }
  }

  const visibleOrder = labelState.skuOrder.filter(g => !labelState.excludedKeys.has(g.key));

  if (visibleOrder.length === 0) {
    container.innerHTML = '<div class="sku-order-empty">No items to display</div>';
    return;
  }

  container.innerHTML = visibleOrder.map((group, idx) => {
    const color = SKU_COLORS[idx % SKU_COLORS.length];
    return `
      <div class="sku-order-item" draggable="true" data-key="${group.key}" data-index="${idx}">
        <div class="sku-drag-handle" title="Drag to reorder">⠿</div>
        <div class="sku-order-num" style="background: ${color}">${idx + 1}</div>
        <div class="sku-order-name">${group.key}</div>
        <div class="sku-order-count">${group.count} labels</div>
        <button class="sku-order-remove" data-key="${group.key}" title="Remove from output">✕</button>
      </div>
    `;
  }).join('');

  // Setup drag-and-drop
  setupDragAndDrop(container);

  // Setup remove buttons
  container.querySelectorAll('.sku-order-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      labelState.excludedKeys.add(key);
      renderSkuOrderPanel();
      showToast(`Removed "${key}" from output`, 'info');
    });
  });
}

function setupDragAndDrop(container) {
  let draggedItem = null;
  let draggedIndex = -1;

  container.querySelectorAll('.sku-order-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      draggedIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.key);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      container.querySelectorAll('.sku-order-item').forEach(i => {
        i.classList.remove('drag-over-above', 'drag-over-below');
      });
      draggedItem = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (item === draggedItem) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      container.querySelectorAll('.sku-order-item').forEach(i => {
        i.classList.remove('drag-over-above', 'drag-over-below');
      });

      if (e.clientY < midY) {
        item.classList.add('drag-over-above');
      } else {
        item.classList.add('drag-over-below');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over-above', 'drag-over-below');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedItem || item === draggedItem) return;

      const targetIndex = parseInt(item.dataset.index);
      reorderSkuList(draggedIndex, targetIndex);
    });
  });
}

function reorderSkuList(fromIndex, toIndex) {
  // Filter out excluded keys for reordering
  const visibleOrder = labelState.skuOrder.filter(g => !labelState.excludedKeys.has(g.key));
  const [movedItem] = visibleOrder.splice(fromIndex, 1);
  visibleOrder.splice(toIndex, 0, movedItem);

  // Rebuild full order: excluded items stay at end
  const excludedItems = labelState.skuOrder.filter(g => labelState.excludedKeys.has(g.key));
  labelState.skuOrder = [...visibleOrder, ...excludedItems];

  renderSkuOrderPanel();
}

// ═══════════════════════════════════════════
//  UI STATE MANAGEMENT & DYNAMIC MOUNTING
// ═══════════════════════════════════════════

/**
 * Move the single labelSorter component into the active view container
 * (either inner dashboard workspace or public Meesho page)
 */
export function mountLabelSorter(destination) {
  const sorter = document.getElementById('labelSorter');
  if (!sorter) return;

  if (destination === 'dashboard') {
    const dashMount = document.getElementById('dashboardLabelSorterMount');
    if (dashMount && sorter.parentElement !== dashMount) {
      dashMount.appendChild(sorter);
    }
  } else if (destination === 'public') {
    const publicMount = document.getElementById('publicMeeshoLabelSorterMount');
    if (publicMount && sorter.parentElement !== publicMount) {
      publicMount.appendChild(sorter);
    }
  }
}

function showSortingPanel() {
  const uploadPanel = document.getElementById('labelUploadPanel');
  const sortPanel = document.getElementById('labelSortPanel');

  if (uploadPanel) uploadPanel.style.display = 'none';
  if (sortPanel) sortPanel.style.display = '';

  // Trigger full-screen wide view on public Meesho page
  const meeshoPage = document.getElementById('labelCropMeeshoView');
  if (meeshoPage) {
    meeshoPage.classList.add('sorting-active');
  }

  // Ensure active platform settings (e.g. Flipkart single crop setting auto-selected) apply
  setMarketplace(labelState.platform || 'meesho');
}

function showUploadPanel() {
  const uploadPanel = document.getElementById('labelUploadPanel');
  const sortPanel = document.getElementById('labelSortPanel');

  if (uploadPanel) uploadPanel.style.display = '';
  if (sortPanel) sortPanel.style.display = 'none';

  // Restore split hero view on public Meesho page
  const meeshoPage = document.getElementById('labelCropMeeshoView');
  if (meeshoPage) {
    meeshoPage.classList.remove('sorting-active');
  }
}

function setupActionButtons() {
  // Prepare / Upload button
  document.getElementById('labelPrepareBtn')?.addEventListener('click', () => {
    processLabels();
  });

  // Start Over
  document.getElementById('labelStartOver')?.addEventListener('click', () => {
    startOver();
  });

  // Generate Sorted PDF
  document.getElementById('labelGeneratePdf')?.addEventListener('click', () => {
    generateSortedPdf();
  });

  // Preview Map
  document.getElementById('labelPreviewMap')?.addEventListener('click', () => {
    showPreviewMap();
  });

  // Modal close
  document.getElementById('labelModalClose')?.addEventListener('click', () => {
    closePdfModal();
  });

  // Modal download
  document.getElementById('labelDownloadPdf')?.addEventListener('click', () => {
    if (labelState.generatedPdfBytes) {
      downloadPdf(labelState.generatedPdfBytes, 'sorted_labels.pdf');
    }
  });

  // Modal open in new tab
  document.getElementById('labelOpenPdf')?.addEventListener('click', () => {
    if (labelState.generatedPdfBytes) {
      const blob = new Blob([labelState.generatedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  });
}

// ═══════════════════════════════════════════
//  PDF GENERATION
// ═══════════════════════════════════════════

/**
 * Generate the final sorted PDF
 */
async function generateSortedPdf() {
  const genBtn = document.getElementById('labelGeneratePdf');
  if (genBtn) {
    genBtn.disabled = true;
    genBtn.innerHTML = '⏳ Generating...';
  }

  try {
    const outputPdf = await PDFDocument.create();

    // Get ordered labels based on current SKU order (excluding removed ones)
    const visibleOrder = labelState.skuOrder.filter(g => !labelState.excludedKeys.has(g.key));
    const orderedLabels = [];

    visibleOrder.forEach(group => {
      group.labels.forEach(label => {
        orderedLabels.push(label);
      });
    });

    if (orderedLabels.length === 0) {
      showToast('No labels to generate. Please check your selections.', 'error');
      return;
    }

    // Track which source PDF each label came from
    const fileDocMap = {};
    labelState.pdfDocs.forEach(pd => {
      fileDocMap[pd.name] = pd.doc;
    });

    // Copy pages in sorted order
    for (const label of orderedLabels) {
      const srcDoc = fileDocMap[label.fileName];
      if (!srcDoc) continue;

      const [copiedPage] = await outputPdf.copyPages(srcDoc, [label.pageIndex]);

      // Apply platform-specific cropping
      if (labelState.platform === 'flipkart') {
        if (labelState.cropInvoice) {
          cropFlipkartLabel(copiedPage);
        }
      } else {
        // Existing Meesho Crop logic — 100% untouched
        if (labelState.cropInvoice) {
          cropBelowProductDetails(copiedPage, label);
          if (labelState.trim4x4) {
            trimOuterBordersCropped(copiedPage);
          }
        } else if (labelState.trim4x4) {
          trimWhitespace4x4(copiedPage, label);
        }
      }

      outputPdf.addPage(copiedPage);
    }

    // Add custom message and QR code if enabled AND cropInvoice is NOT selected
    // ("When I Select Crop labels (remove invoice section) this option when no need to show QR code as well as custom message")
    if (!labelState.cropInvoice && labelState.customMessage.enabled && (labelState.customMessage.text.trim() || (labelState.qrCode.enabled && labelState.qrCode.url))) {
      await addCustomMessageAndQr(outputPdf, orderedLabels);
    }

    // Save
    const pdfBytes = await outputPdf.save();
    labelState.generatedPdfBytes = pdfBytes;

    // Show modal
    showPdfReadyModal(pdfBytes, orderedLabels.length);

    showToast(`PDF generated successfully! ${orderedLabels.length} pages`, 'success');
  } catch (err) {
    console.error('[LabelSorter] PDF generation error:', err);
    showToast(`Error generating PDF: ${err.message}`, 'error');
  } finally {
    if (genBtn) {
      genBtn.disabled = false;
      genBtn.innerHTML = '📥 Generate Sorted PDF';
    }
  }
}

/**
 * Flipkart Thermal Shipping Label Crop (removes Tax Invoice section and outer whitespace)
 * Target coordinates verified against sellerbox_sorted_labels_20260917.pdf:
 * Bounding Box: [x: 185.5, y: 459.5, width: 223.5, height: 359]
 */
function cropFlipkartLabel(page) {
  page.setCropBox(185.5, 459.5, 223.5, 359);
  page.setMediaBox(185.5, 459.5, 223.5, 359);
}

/**
 * Option 1: Crop Below Product Details (removes Tax Invoice section completely)
 * Dynamically handles varying address / header sizes per page based on parsed text coordinates
 */
function cropBelowProductDetails(page, label) {
  const mediaBox = page.getMediaBox();
  const width = mediaBox.width;
  const height = mediaBox.height;
  const baseY = mediaBox.y || 0;
  const baseX = mediaBox.x || 0;
  
  // Cut right along the bottom border of the Product Details box
  let bottomCutY;
  if (label && Number.isFinite(label.taxInvoiceY)) {
    // TAX INVOICE text is at label.taxInvoiceY; border is ~12-14pt above it
    bottomCutY = Math.max(label.taxInvoiceY + 12, baseY + 60);
  } else {
    // Safe standard fallback
    bottomCutY = baseY + height * 0.58;
  }

  const cropHeight = (baseY + height) - bottomCutY;
  page.setCropBox(baseX, bottomCutY, width, cropHeight);
  page.setMediaBox(baseX, bottomCutY, width, cropHeight);
}

/**
 * Option 2: 4×4 Standard (Crop bottom white space below invoice and trim outer borders)
 * Keeps complete label and complete invoice, while removing the empty bottom space to fit 4x4 thermal format
 */
function trimWhitespace4x4(page, label) {
  const mediaBox = page.getMediaBox();
  const width = mediaBox.width;
  const height = mediaBox.height;
  const baseY = mediaBox.y || 0;
  const baseX = mediaBox.x || 0;

  // Determine bottom cut right below invoice disclaimer (removes all the bottom white space)
  let bottomCutY;
  if (label && Number.isFinite(label.minTextY)) {
    // Lowest text line is around ~247; border is ~8-10pt below it; add small 2pt padding
    bottomCutY = Math.max(label.minTextY - 10, baseY + 40);
  } else {
    // Default standard Meesho invoice bottom cut
    bottomCutY = baseY + 237;
  }

  // If custom message or QR code is printed, reserve clean bottom strip
  const hasMsg = !labelState.cropInvoice && labelState.customMessage.enabled && labelState.customMessage.text.trim();
  const hasQr = !labelState.cropInvoice && labelState.customMessage.enabled && labelState.qrCode.enabled && labelState.qrCode.url;
  if (hasMsg || hasQr) {
    const extraSpace = hasQr ? 44 : 24;
    bottomCutY = Math.max(bottomCutY - extraSpace, baseY);
  }

  // Determine top border (trim top whitespace margin)
  let topCutY;
  if (label && Number.isFinite(label.maxTextY)) {
    topCutY = Math.min(label.maxTextY + 9, baseY + height - 6);
  } else {
    topCutY = baseY + height - 8;
  }

  // Determine left and right outer borders
  const cropX = Math.max(baseX + 10, 0);
  const cropW = Math.min(width - 18, 576);
  const cropH = topCutY - bottomCutY;

  page.setCropBox(cropX, bottomCutY, cropW, cropH);
  page.setMediaBox(cropX, bottomCutY, cropW, cropH);
}

/**
 * Trim outer borders (left, right, top) of an already cropped label
 */
function trimOuterBordersCropped(page) {
  const mediaBox = page.getMediaBox();
  const trimMarginX = Math.min(mediaBox.width * 0.03, 14);
  const trimMarginTop = Math.min(mediaBox.height * 0.04, 12);
  
  const newX = mediaBox.x + trimMarginX;
  const newY = mediaBox.y; // keep the bottom cut line
  const newW = mediaBox.width - (trimMarginX * 2);
  const newH = mediaBox.height - trimMarginTop;

  page.setCropBox(newX, newY, newW, newH);
  page.setMediaBox(newX, newY, newW, newH);
}

/**
 * Add custom message text and scannable QR Code to each label page
 */
async function addCustomMessageAndQr(pdfDoc, orderedLabels) {
  const message = labelState.customMessage.text.trim();
  const hasMessage = labelState.customMessage.enabled && message.length > 0;
  const hasQr = labelState.customMessage.enabled && labelState.qrCode.enabled && labelState.qrCode.url;

  if (!hasMessage && !hasQr) return;

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 8;
  let qrImage = null;

  if (hasQr) {
    try {
      const qrDataUrl = await QRCode.toDataURL(labelState.qrCode.url, {
        margin: 1,
        width: 140,
        errorCorrectionLevel: 'M'
      });
      qrImage = await pdfDoc.embedPng(qrDataUrl);
    } catch (e) {
      console.error('[LabelSorter] QR Code generation error:', e);
    }
  }

  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const label = orderedLabels[i];
    const { width, height } = page.getSize();

    // Determine base Y coordinate for the footer
    const mediaBox = page.getMediaBox();
    const baseY = mediaBox.y + 4;

    if (hasQr && qrImage) {
      const qrSize = 34;
      const qrX = 16;
      const qrY = baseY + 4;
      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });

      if (hasMessage) {
        page.drawText(message, {
          x: qrX + qrSize + 10,
          y: qrY + 13,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1)
        });
      }
    } else if (hasMessage) {
      const textWidth = font.widthOfTextAtSize(message, fontSize);
      const calculatedX = (width - textWidth) / 2;
      const textX = Number.isFinite(calculatedX) ? Math.max(calculatedX, 10) : 10;

      page.drawText(message, {
        x: textX,
        y: baseY + 7,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15)
      });
    }
  }
}

// ═══════════════════════════════════════════
//  PREVIEW & MODAL
// ═══════════════════════════════════════════

function showPreviewMap() {
  if (!labelState.isParsed) {
    showToast('Process labels first to see preview', 'info');
    return;
  }

  const visibleOrder = labelState.skuOrder.filter(g => !labelState.excludedKeys.has(g.key));
  let previewHtml = '<div class="preview-map-content">';
  let pageNum = 1;

  visibleOrder.forEach((group, gIdx) => {
    const color = SKU_COLORS[gIdx % SKU_COLORS.length];
    previewHtml += `<div class="preview-group">`;
    previewHtml += `<div class="preview-group-header" style="border-left: 3px solid ${color}">
      <span class="preview-group-name">${group.key}</span>
      <span class="preview-group-count">${group.count} pages</span>
    </div>`;
    previewHtml += `<div class="preview-pages">`;

    group.labels.forEach(() => {
      previewHtml += `<div class="preview-page" style="border-top: 3px solid ${color}">
        <span class="preview-page-num">${pageNum}</span>
      </div>`;
      pageNum++;
    });

    previewHtml += `</div></div>`;
  });

  previewHtml += '</div>';

  const modal = document.getElementById('labelPreviewModal');
  const content = document.getElementById('labelPreviewContent');
  if (modal && content) {
    content.innerHTML = previewHtml;
    modal.classList.add('active');
  }

  // Close button
  document.getElementById('labelPreviewClose')?.addEventListener('click', () => {
    modal?.classList.remove('active');
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

function showPdfReadyModal(pdfBytes, pageCount) {
  const modal = document.getElementById('labelPdfModal');
  const countEl = document.getElementById('labelPdfPageCount');

  if (countEl) countEl.textContent = `${pageCount} pages generated`;
  if (modal) modal.classList.add('active');

  // Render first page preview
  renderPdfPreview(pdfBytes);
}

async function renderPdfPreview(pdfBytes) {
  const canvas = document.getElementById('labelPdfPreviewCanvas');
  if (!canvas) return;

  try {
    // Dynamic import to use pdfjs for rendering
    const pdfjsLib = await import('pdfjs-dist');
    const pdfWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
    }
    const raw = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
    const copy = new Uint8Array(raw.length);
    copy.set(raw);
    const pdfDoc = await pdfjsLib.getDocument({ data: copy }).promise;
    const page = await pdfDoc.getPage(1);

    const viewport = page.getViewport({ scale: 1.2 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.error('[LabelSorter] Preview render error:', err);
  }
}

function closePdfModal() {
  const modal = document.getElementById('labelPdfModal');
  if (modal) modal.classList.remove('active');
}

// ═══════════════════════════════════════════
//  DOWNLOAD & RESET
// ═══════════════════════════════════════════

function downloadPdf(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('PDF downloaded!', 'success');
}

/**
 * Reset everything to initial state
 */
export function startOver() {
  labelState.uploadedFiles = [];
  labelState.labels = [];
  labelState.pdfDocs = [];
  labelState.sortType = 'sku';
  labelState.sortBy = 'name';
  labelState.sortDirection = 'asc';
  labelState.cropInvoice = true;
  labelState.trim4x4 = false;
  labelState.comboMode = 'none';
  labelState.customMessage = { enabled: false, text: '' };
  labelState.qrCode = { enabled: false, url: '' };
  labelState.skuOrder = [];
  labelState.excludedKeys = new Set();
  labelState.isProcessing = false;
  labelState.isParsed = false;
  labelState.generatedPdfBytes = null;
  labelState.stats = null;

  // Reset UI
  showUploadPanel();
  renderUploadedFileList();
  updatePrepareButtonState();

  const meeshoPage = document.getElementById('labelCropMeeshoView');
  if (meeshoPage) {
    meeshoPage.classList.remove('sorting-active');
  }

  // Reset form controls
  document.getElementById('sortTypeSku')?.classList.add('active');
  document.getElementById('sortTypeCourier')?.classList.remove('active');
  document.getElementById('sortByName')?.classList.add('active');
  document.getElementById('sortByCount')?.classList.remove('active');
  document.getElementById('sortAsc')?.classList.add('active');
  document.getElementById('sortDesc')?.classList.remove('active');

  const cropCb = document.getElementById('cropInvoiceCheckbox');
  if (cropCb) cropCb.checked = true;
  const trimCb = document.getElementById('trim4x4Checkbox');
  if (trimCb) trimCb.checked = false;
  const customMsgSection = document.getElementById('customMsgSection');
  if (customMsgSection) customMsgSection.style.display = 'none';

  document.querySelectorAll('.combo-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.combo === 'none');
  });

  const customCheckbox = document.getElementById('customMsgCheckbox');
  if (customCheckbox) customCheckbox.checked = false;
  const customArea = document.getElementById('customMsgArea');
  if (customArea) customArea.style.display = 'none';
  const customText = document.getElementById('customMsgText');
  if (customText) customText.value = '';
  const charCount = document.getElementById('customMsgCharCount');
  if (charCount) charCount.textContent = '0/200';
  const presets = document.getElementById('customMsgPresets');
  if (presets) presets.value = '';

  const qrCheckbox = document.getElementById('customQrCheckbox');
  if (qrCheckbox) qrCheckbox.checked = false;
  const qrArea = document.getElementById('customQrArea');
  if (qrArea) qrArea.style.display = 'none';
  const qrUrl = document.getElementById('customQrUrl');
  if (qrUrl) qrUrl.value = '';
  const qrPrev = document.getElementById('customQrPreviewContainer');
  if (qrPrev) qrPrev.style.display = 'none';

  setMarketplace(labelState.platform || 'meesho');

  showToast('Reset complete — ready for new labels', 'info');
}

// ═══════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
