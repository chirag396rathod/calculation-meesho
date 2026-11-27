/**
 * flipkartParser.js — Flipkart market settlement report parsing
 * Parses the "Orders" sheet of the seller settlement report
 * (sheets: Report Help, Summary of report, Orders, Ads, ...)
 * into the same normalized order shape the Meesho parser emits,
 * so analytics.js runs unchanged for both platforms.
 *
 * Status mapping (Return Type + Refund + settlement sign):
 *   Return Type NA                          → Delivered
 *   Customer Return with Refund < 0         → Return
 *   Logistics Return with Refund < 0        → RTO
 *   Return rows with Refund = 0 are rejected or reversed returns
 *   (the customer kept the item and the sale stands), so they count
 *   as Delivered, except pure charge rows (sale 0, settlement < 0)
 *   which count as Return. This reproduces Flipkart's own summary
 *   counts of sale vs return orders.
 * Adjustment rows (Sale Amount 0) get quantity 0 so they never add
 * raw product cost.
 */

let XLSX = null;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ORDER_COLUMNS = {
  neftId: 'neft id',
  paymentDate: 'payment date',
  bankSettlement: 'bank settlement value (rs.)',
  orderId: 'order id',
  orderItemId: 'order item id',
  saleAmount: 'sale amount (rs.)',
  refund: 'refund (rs.)',
  commissionRate: 'commission rate (%)',
  commission: 'commission (rs.)',
  fixedFee: 'fixed fee (rs.)',
  shippingFee: 'shipping fee (rs.)',
  reverseShippingFee: 'reverse shipping fee (rs.)',
  tcs: 'tcs (rs.)',
  tds: 'tds (rs.)',
  orderDate: 'order date',
  dispatchDate: 'dispatch date',
  sku: 'seller sku',
  quantity: 'quantity',
  returnType: 'return type'
};

/**
 * True when the workbook is a Flipkart market settlement report
 * @param {string[]} sheetNamesLower - lowercased sheet names
 */
export function isFlipkartSettlement(sheetNamesLower) {
  return sheetNamesLower.includes('orders')
    && (sheetNamesLower.includes('summary of report') || sheetNamesLower.includes('report help'));
}

/**
 * Parse a Flipkart settlement workbook
 * @returns {Promise<{orders: Array, ads: Array, month: string}>}
 */
export async function parseFlipkartSettlement(workbook) {
  if (!XLSX) XLSX = await import('xlsx');
  const orders = parseOrdersSheet(workbook);
  const ads = parseAdsSheet(workbook);
  const month = extractMonthFromSummary(workbook) || extractMonthFromOrders(orders);
  return { orders, ads, month };
}

function parseOrdersSheet(workbook) {
  const sheet = workbook.Sheets['Orders'];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const headerRowIdx = findHeaderRow(rawData, ['order id', 'seller sku']);
  if (headerRowIdx === -1) return [];

  const col = resolveColumns(buildHeaderMap(rawData, headerRowIdx), ORDER_COLUMNS);

  const orders = [];
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row) continue;

    const orderId = String(row[col.orderId] ?? '');
    if (!orderId.startsWith('OD')) continue;

    const sku = String(row[col.sku] ?? '').trim();
    if (!sku || sku === 'NA') continue;

    const refund = toNum(row[col.refund]);
    const settlement = toNum(row[col.bankSettlement]);
    const saleAmount = toNum(row[col.saleAmount]);
    const status = statusFromReturn(String(row[col.returnType] ?? ''), refund, settlement);

    orders.push({
      subOrderNo: String(row[col.orderItemId] ?? orderId),
      orderDate: parseDate(row[col.orderDate]),
      dispatchDate: parseDate(row[col.dispatchDate]),
      productName: sku,
      sku,
      orderSource: 'Flipkart',
      status,
      gstPercent: 0,
      listingPrice: 0,
      quantity: saleAmount > 0 ? (toNum(row[col.quantity]) || 1) : 0,
      transactionId: String(row[col.neftId] ?? '').trim(),
      paymentDate: parseDate(row[col.paymentDate]),
      settlementAmount: settlement,
      totalSaleAmount: saleAmount,
      totalReturnAmount: refund < 0 ? Math.abs(refund) : 0,
      fixedFee: Math.abs(toNum(row[col.fixedFee])),
      warehousingFee: 0,
      returnPremium: 0,
      returnPremiumOfReturn: 0,
      commissionPercent: toNum(row[col.commissionRate]),
      commissionAmount: Math.abs(toNum(row[col.commission])),
      shippingCharge: Math.abs(toNum(row[col.shippingFee])),
      returnShippingCharge: Math.abs(toNum(row[col.reverseShippingFee])),
      tcs: Math.abs(toNum(row[col.tcs])),
      tds: Math.abs(toNum(row[col.tds])),
      compensation: 0,
      claims: 0,
      recovery: 0
    });
  }

  return orders;
}

function parseAdsSheet(workbook) {
  const sheet = workbook.Sheets['Ads'];
  if (!sheet) return [];

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    if ((rawData[i] || []).some(c => String(c).includes('Wallet Redeem'))) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) return [];

  const headers = rawData[headerRowIdx].map(h => String(h || '').trim().toLowerCase());
  const idx = (test) => headers.findIndex(test);

  const iNeft = idx(h => h.includes('neft'));
  const iDate = idx(h => h.includes('payment date'));
  const iSettle = idx(h => h.startsWith('settlement value'));
  const iType = idx(h => h === 'type');
  const iCampaign = idx(h => h.includes('campaign'));

  // The Ads sheet is a wallet ledger. Topup rows carry the cash that left
  // the settlement to fund campaign spend. Redeem rows net to zero because
  // the reversal column re-books the spend as an invoice the topups already
  // paid, so ad spend is the settlement column summed with its sign
  // (a wallet refund comes back positive and reduces the spend).
  const ads = [];
  for (let i = headerRowIdx + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || (iNeft >= 0 && !row[iNeft])) continue;

    const cashOut = -toNum(iSettle >= 0 ? row[iSettle] : 0);
    if (cashOut === 0) continue;

    const paymentDate = parseDate(iDate >= 0 ? row[iDate] : null);
    const dateLabel = paymentDate ? paymentDate.toISOString().slice(0, 10) : '';
    const typeLabel = iType >= 0 ? String(row[iType] || '') : '';

    ads.push({
      duration: `${dateLabel} ${typeLabel}`.trim(),
      spend: Math.max(cashOut, 0),
      tax: 0,
      total: cashOut,
      invoiceId: iCampaign >= 0 ? String(row[iCampaign] || '') : ''
    });
  }

  return ads;
}

function extractMonthFromSummary(workbook) {
  const sheet = workbook.Sheets['Summary of report'];
  if (!sheet) return '';

  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  for (const row of rawData) {
    if (!row) continue;
    const label = String(row[0] || '').toLowerCase();
    if (label.includes('payment duration') && row[1]) {
      const m = String(row[1]).match(/(\d{4})-(\d{2})-\d{2}/);
      if (m) return monthLabel(m[1], m[2]);
    }
  }
  return '';
}

function extractMonthFromOrders(orders) {
  for (const source of ['paymentDate', 'orderDate']) {
    for (const o of orders) {
      if (o[source]) return monthFromDate(o[source]);
    }
  }
  return '';
}

function statusFromReturn(returnType, refund, settlement) {
  const rt = returnType.toLowerCase().trim();
  if (!rt || rt === 'na' || rt === 'not available') return 'Delivered';
  if (refund < 0) {
    return rt.includes('logistics') || rt.includes('courier') ? 'RTO' : 'Return';
  }
  if (settlement < 0) return 'Return';
  return 'Delivered';
}

function findHeaderRow(rawData, requiredKeys) {
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const cells = (rawData[i] || []).map(normalizeHeader);
    if (requiredKeys.every(k => cells.includes(k))) return i;
  }
  return -1;
}

function buildHeaderMap(rawData, headerRowIdx) {
  const map = {};
  (rawData[headerRowIdx] || []).forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (key && !(key in map)) map[key] = idx;
  });
  return map;
}

function resolveColumns(headerMap, keys) {
  const col = {};
  for (const [name, headerKey] of Object.entries(keys)) {
    col[name] = headerKey in headerMap ? headerMap[headerKey] : -1;
  }
  return col;
}

function normalizeHeader(h) {
  return String(h || '').split('\n')[0].trim().toLowerCase().replace(/\s+/g, ' ');
}

function monthLabel(year, monthNum) {
  const idx = parseInt(monthNum, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return '';
  return `${MONTH_NAMES[idx]} ${year}`;
}

function monthFromDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return monthLabel(String(date.getFullYear()), String(date.getMonth() + 1));
}

function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function toNum(val) {
  if (val === null || val === undefined || val === '' || val === 'None') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}
