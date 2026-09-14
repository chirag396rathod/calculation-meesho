/**
 * fileParser.js — Excel file parsing module
 * Handles reading and parsing Meesho/Flipkart payment files
 */
import * as XLSX from 'xlsx';

/**
 * Parse an uploaded Excel file and extract order data
 * @param {File} file - The uploaded .xlsx file
 * @returns {Promise<{orders: Array, ads: Array, filename: string, month: string}>}
 */
export async function parsePaymentFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const result = {
          filename: file.name,
          month: extractMonth(file.name),
          orders: [],
          ads: [],
          platform: detectPlatform(workbook)
        };

        // Parse based on detected platform
        if (result.platform === 'meesho') {
          result.orders = parseMeeshoOrders(workbook);
          result.ads = parseMeeshoAds(workbook);
        } else if (result.platform === 'flipkart') {
          result.orders = parseFlipkartOrders(workbook);
        }

        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect whether the file is from Meesho or Flipkart
 */
function detectPlatform(workbook) {
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());
  
  if (sheetNames.includes('order payments')) {
    return 'meesho';
  }
  if (sheetNames.includes('final bank settlement') || sheetNames.includes('commission rate card')) {
    return 'flipkart';
  }
  // Default to meesho format based on user data
  return 'meesho';
}

/**
 * Parse Meesho Order Payments sheet
 */
function parseMeeshoOrders(workbook) {
  const sheet = workbook.Sheets['Order Payments'];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  // Find header row (contains 'Sub Order No')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => String(cell).includes('Sub Order No'))) {
      headerRowIdx = i;
      break;
    }
  }
  
  if (headerRowIdx === -1) return [];
  
  const headers = rawData[headerRowIdx].map(h => String(h || '').trim());
  
  // Find column indices
  const colMap = {};
  const columnMappings = {
    'subOrderNo': 'Sub Order No',
    'orderDate': 'Order Date',
    'dispatchDate': 'Dispatch Date',
    'productName': 'Product Name',
    'sku': 'Supplier SKU',
    'catalogId': 'Catalog ID',
    'orderSource': 'Order source',
    'status': 'Live Order Status',
    'gstPercent': 'Product GST %',
    'listingPrice': 'Listing Price (Incl. taxes)',
    'quantity': 'Quantity',
    'transactionId': 'Transaction ID',
    'paymentDate': 'Payment Date',
    'settlementAmount': 'Final Settlement Amount',
    'priceType': 'Price Type',
    'totalSaleAmount': 'Total Sale Amount (Incl. Shipping & GST)',
    'totalReturnAmount': 'Total Sale Return Amount (Incl. Shipping & GST)',
    'fixedFee': 'Fixed Fee (Incl. GST)',
    'warehousingFee': 'Warehousing fee (inc Gst)',
    'returnPremium': 'Return premium (incl GST)',
    'returnPremiumOfReturn': 'Return premium (incl GST) of Return',
    'commissionPercent': 'Meesho Commission Percentage',
    'commissionAmount': 'Meesho Commission (Incl. GST)',
    'shippingCharge': 'Shipping Charge (Incl. GST)',
    'returnShippingCharge': 'Return Shipping Charge (Incl. GST)',
    'tcs': 'TCS',
    'tds': 'TDS',
    'compensation': 'Compensation',
    'claims': 'Claims',
    'recovery': 'Recovery'
  };

  for (const [key, searchStr] of Object.entries(columnMappings)) {
    const idx = headers.findIndex(h => h.includes(searchStr));
    if (idx !== -1) colMap[key] = idx;
  }

  const orders = [];
  
  // Skip header row + formula row (usually row after header has formulas)
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[colMap.subOrderNo]) continue;
    
    // Skip formula/description rows
    const subOrder = String(row[colMap.subOrderNo] || '');
    if (subOrder.includes('=') || subOrder.includes('Track') || !subOrder.match(/\d/)) continue;

    const order = {
      subOrderNo: subOrder,
      orderDate: parseDate(row[colMap.orderDate]),
      dispatchDate: parseDate(row[colMap.dispatchDate]),
      productName: String(row[colMap.productName] || ''),
      sku: String(row[colMap.sku] || '').trim(),
      catalogId: row[colMap.catalogId],
      orderSource: row[colMap.orderSource] || 'Organic',
      status: normalizeStatus(String(row[colMap.status] || '')),
      gstPercent: toNum(row[colMap.gstPercent]),
      listingPrice: toNum(row[colMap.listingPrice]),
      quantity: toNum(row[colMap.quantity]) || 1,
      transactionId: row[colMap.transactionId],
      paymentDate: parseDate(row[colMap.paymentDate]),
      settlementAmount: toNum(row[colMap.settlementAmount]),
      totalSaleAmount: toNum(row[colMap.totalSaleAmount]),
      totalReturnAmount: toNum(row[colMap.totalReturnAmount]),
      fixedFee: toNum(row[colMap.fixedFee]),
      warehousingFee: toNum(row[colMap.warehousingFee]),
      returnPremium: toNum(row[colMap.returnPremium]),
      returnPremiumOfReturn: toNum(row[colMap.returnPremiumOfReturn]),
      commissionPercent: toNum(row[colMap.commissionPercent]),
      commissionAmount: toNum(row[colMap.commissionAmount]),
      shippingCharge: toNum(row[colMap.shippingCharge]),
      returnShippingCharge: toNum(row[colMap.returnShippingCharge]),
      tcs: toNum(row[colMap.tcs]),
      tds: toNum(row[colMap.tds]),
      compensation: toNum(row[colMap.compensation]),
      claims: toNum(row[colMap.claims]),
      recovery: toNum(row[colMap.recovery])
    };

    if (order.sku) {
      orders.push(order);
    }
  }

  return orders;
}

/**
 * Parse Meesho Ads Cost sheet
 */
function parseMeeshoAds(workbook) {
  const sheet = workbook.Sheets['Ads Cost'];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => String(cell).includes('Deduction Duration') || String(cell).includes('Spend'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return [];

  const headers = rawData[headerRowIdx].map(h => String(h || '').trim());
  const ads = [];

  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) continue;
    
    // Skip formula rows
    if (String(row[0]).includes('=') || String(row[0]).includes('(')) continue;

    // Try to detect columns
    const ad = {
      duration: String(row[0] || ''),
      spend: 0,
      tax: 0,
      total: 0,
      invoiceId: ''
    };

    // Map based on header names
    for (let j = 1; j < headers.length; j++) {
      const h = headers[j].toLowerCase();
      if (h.includes('spend') || h === 'ad cost') {
        ad.spend = Math.abs(toNum(row[j]));
      } else if (h.includes('tax') || h.includes('gst')) {
        ad.tax = Math.abs(toNum(row[j]));
      } else if (h.includes('total') || h.includes('ad cost incl')) {
        ad.total = Math.abs(toNum(row[j]));
      } else if (h.includes('invoice')) {
        ad.invoiceId = String(row[j] || '');
      }
    }

    if (ad.spend > 0 || ad.total > 0) {
      if (ad.total === 0) ad.total = ad.spend + ad.tax;
      ads.push(ad);
    }
  }

  return ads;
}

/**
 * Parse Flipkart Final Bank Settlement / Commission Rate Card
 */
function parseFlipkartOrders(workbook) {
  // Try Commission Rate Card first (more detailed)
  let sheetName = 'Commission Rate Card';
  if (!workbook.Sheets[sheetName]) {
    sheetName = 'Final Bank Settlement';
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (row && row.some(cell => String(cell).includes('Order Id'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) return [];
  const headers = rawData[headerRowIdx].map(h => String(h || '').trim());
  
  const orders = [];
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) continue;
    if (String(row[0]).includes('OD') === false) continue;

    const getCol = (name) => {
      const idx = headers.findIndex(h => h.includes(name));
      return idx !== -1 ? row[idx] : null;
    };

    const order = {
      subOrderNo: String(getCol('Sub Order') || row[1] || ''),
      orderDate: parseDate(getCol('Order Date')),
      productName: '',
      sku: String(getCol('SKU') || '').trim(),
      status: normalizeStatus(String(getCol('Order Status') || '')),
      listingPrice: toNum(getCol('Item Selling Price') || getCol('Order Amount')),
      quantity: 1,
      settlementAmount: toNum(getCol('Final Settlement Price') || getCol('Final Settlement')),
      shippingCharge: toNum(getCol('Shipping Fee') || getCol('Shipping')),
      commissionAmount: toNum(getCol('Total Commission')),
      tcs: toNum(getCol('TCS')),
      tds: toNum(getCol('TDS')),
      totalSaleAmount: toNum(getCol('Item Selling Price') || getCol('Order Amount')),
      totalReturnAmount: 0,
      fixedFee: toNum(getCol('Fixed Fee')),
      returnShippingCharge: 0
    };

    // For returns, settlement is negative
    if (order.settlementAmount < 0 && (order.status === 'Return' || order.status === 'RTO')) {
      order.totalReturnAmount = Math.abs(order.settlementAmount);
    }

    if (order.sku) {
      orders.push(order);
    }
  }

  return orders;
}

/**
 * Normalize order status strings
 */
function normalizeStatus(status) {
  const s = status.toLowerCase().trim();
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('return')) return 'Return';
  if (s.includes('rto') || s.includes('return to origin')) return 'RTO';
  if (s.includes('ship')) return 'Shipped';
  if (s.includes('cancel')) return 'Cancelled';
  if (s.includes('exchange')) return 'Exchange';
  return status || 'Unknown';
}

/**
 * Extract month from filename
 */
function extractMonth(filename) {
  const dateMatch = filename.match(/(\d{4})-(\d{2})-\d{2}/);
  if (dateMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(dateMatch[2]) - 1]} ${dateMatch[1]}`;
  }
  return 'Unknown';
}

/**
 * Parse date safely
 */
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convert value to number safely
 */
function toNum(val) {
  if (val === null || val === undefined || val === '' || val === 'None') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}
