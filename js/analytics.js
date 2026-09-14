/**
 * analytics.js — Business Calculations Engine
 * Calculates profit, losses, return charges, and SKU-wise analytics
 */

import { skuManager } from './skuManager.js';

/**
 * Calculate complete business analytics from order data
 * @param {Array} orders - Parsed order data
 * @param {Array} ads - Parsed ads cost data
 * @returns {Object} Complete analytics object
 */
export function calculateAnalytics(orders, ads = []) {
  if (!orders || orders.length === 0) {
    return getEmptyAnalytics();
  }

  const delivered = orders.filter(o => o.status === 'Delivered');
  const shipped = orders.filter(o => o.status === 'Shipped');
  const returned = orders.filter(o => o.status === 'Return');
  const rto = orders.filter(o => o.status === 'RTO');
  const cancelled = orders.filter(o => o.status === 'Cancelled');
  const exchange = orders.filter(o => o.status === 'Exchange');

  // ── Core Financial Metrics ──
  // Net Settlement = Sum of all positive settlement amounts
  const totalPositiveSettlement = orders
    .filter(o => o.settlementAmount > 0)
    .reduce((sum, o) => sum + o.settlementAmount, 0);

  // Total negative settlement (Return + RTO charges)
  const totalNegativeSettlement = Math.abs(
    orders
      .filter(o => o.settlementAmount < 0)
      .reduce((sum, o) => sum + o.settlementAmount, 0)
  );

  // Net Settlement (all settlements combined)
  const netSettlement = orders.reduce((sum, o) => sum + o.settlementAmount, 0);

  // Return charges breakdown
  const returnCharges = returned.reduce((sum, o) => sum + Math.abs(o.settlementAmount), 0);
  const rtoCharges = rto.reduce((sum, o) => sum + Math.abs(o.settlementAmount), 0);
  const totalReturnCharges = returnCharges + rtoCharges;

  // Ads spend
  const totalAdsSpend = ads.reduce((sum, a) => sum + a.total, 0);

  // Raw cost calculation (Delivered + Shipped orders only)
  const productiveOrders = [...delivered, ...shipped];
  let totalRawCost = 0;
  productiveOrders.forEach(o => {
    const cost = skuManager.getCostForSku(o.sku);
    totalRawCost += cost * o.quantity;
  });

  // Main Profit Formula:
  // Net Profit = Net Settlement - Return Charges - Raw Cost Spend - Ads Spend
  // But since netSettlement already accounts for negative returns:
  // Net Profit = Total Positive Settlement - Total Return Charges - Raw Cost - Ads
  const netProfit = netSettlement - totalRawCost - totalAdsSpend;
  
  // Revenue from delivered orders
  const grossRevenue = delivered.reduce((sum, o) => sum + o.totalSaleAmount, 0);
  
  // Profit margin
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue * 100) : 0;

  // Total deductions (commissions, fees, shipping)
  const totalCommissions = orders.reduce((sum, o) => sum + Math.abs(o.commissionAmount || 0), 0);
  const totalShippingCharges = orders.reduce((sum, o) => sum + Math.abs(o.shippingCharge || 0), 0);
  const totalReturnShipping = orders.reduce((sum, o) => sum + Math.abs(o.returnShippingCharge || 0), 0);
  const totalFixedFees = orders.reduce((sum, o) => sum + Math.abs(o.fixedFee || 0), 0);
  const totalTCS = orders.reduce((sum, o) => sum + Math.abs(o.tcs || 0), 0);
  const totalTDS = orders.reduce((sum, o) => sum + Math.abs(o.tds || 0), 0);

  // ── Claims & Compensation (Reimbursements for damaged/lost/wrong returns) ──
  const totalClaims = orders.reduce((sum, o) => sum + (o.claims || 0), 0);
  const totalCompensation = orders.reduce((sum, o) => sum + (o.compensation || 0), 0);
  const totalRecovery = orders.reduce((sum, o) => sum + (o.recovery || 0), 0);
  const totalClaimsAndCompensation = totalClaims + totalCompensation;
  const claimsCount = orders.filter(o => (o.claims || 0) > 0 || (o.compensation || 0) > 0).length;

  // ── SKU-wise Analytics ──
  const skuAnalytics = calculateSkuAnalytics(orders, ads);

  // ── SKU Group Analytics ──
  const groupAnalytics = calculateGroupAnalytics(orders, skuAnalytics);

  // ── Monthly Analytics ──
  const monthlyAnalytics = calculateMonthlyAnalytics(orders);

  // ── Order Status Distribution ──
  const statusDistribution = {
    Delivered: delivered.length,
    Shipped: shipped.length,
    Return: returned.length,
    RTO: rto.length,
    Cancelled: cancelled.length,
    Exchange: exchange.length
  };

  return {
    // Summary
    totalOrders: orders.length,
    deliveredCount: delivered.length,
    shippedCount: shipped.length,
    returnCount: returned.length,
    rtoCount: rto.length,
    cancelledCount: cancelled.length,
    exchangeCount: exchange.length,

    // Financial
    grossRevenue,
    totalPositiveSettlement,
    totalNegativeSettlement,
    netSettlement,
    returnCharges,
    rtoCharges,
    totalReturnCharges,
    totalRawCost,
    totalAdsSpend,
    netProfit,
    profitMargin,

    // Claims & Compensation
    totalClaims,
    totalCompensation,
    totalRecovery,
    totalClaimsAndCompensation,
    claimsCount,

    // Deductions breakdown
    totalCommissions,
    totalShippingCharges,
    totalReturnShipping,
    totalFixedFees,
    totalTCS,
    totalTDS,

    // Detailed
    skuAnalytics,
    groupAnalytics,
    monthlyAnalytics,
    statusDistribution
  };
}

/**
 * Calculate per-SKU analytics
 */
function calculateSkuAnalytics(orders) {
  const skuMap = {};

  orders.forEach(order => {
    const sku = order.sku;
    if (!skuMap[sku]) {
      skuMap[sku] = {
        sku,
        productName: order.productName,
        totalOrders: 0,
        delivered: 0,
        shipped: 0,
        returned: 0,
        rto: 0,
        cancelled: 0,
        exchange: 0,
        totalSettlement: 0,
        positiveSettlement: 0,
        negativeSettlement: 0,
        returnCharges: 0,
        rtoCharges: 0,
        totalSaleAmount: 0,
        listingPrice: order.listingPrice,
        rawCost: skuManager.getCostForSku(sku),
        rawCostTotal: 0,
        quantity: 0,
        claims: 0,
        compensation: 0,
        recovery: 0,
        claimsAndCompensation: 0,
        group: skuManager.getGroupForSku(sku)?.name || 'Ungrouped'
      };
    }

    const s = skuMap[sku];
    s.totalOrders++;
    s.quantity += order.quantity;
    s.totalSettlement += order.settlementAmount;
    s.totalSaleAmount += order.totalSaleAmount || 0;
    s.claims += order.claims || 0;
    s.compensation += order.compensation || 0;
    s.recovery += order.recovery || 0;
    s.claimsAndCompensation += (order.claims || 0) + (order.compensation || 0);

    if (order.settlementAmount > 0) {
      s.positiveSettlement += order.settlementAmount;
    } else {
      s.negativeSettlement += Math.abs(order.settlementAmount);
    }

    switch (order.status) {
      case 'Delivered':
        s.delivered++;
        s.rawCostTotal += s.rawCost * order.quantity;
        break;
      case 'Shipped':
        s.shipped++;
        s.rawCostTotal += s.rawCost * order.quantity;
        break;
      case 'Return':
        s.returned++;
        s.returnCharges += Math.abs(order.settlementAmount);
        break;
      case 'RTO':
        s.rto++;
        s.rtoCharges += Math.abs(order.settlementAmount);
        break;
      case 'Cancelled':
        s.cancelled++;
        break;
      case 'Exchange':
        s.exchange++;
        break;
    }
  });

  // Calculate profit for each SKU
  Object.values(skuMap).forEach(s => {
    s.totalReturnCharges = s.returnCharges + s.rtoCharges;
    s.netProfit = s.totalSettlement - s.rawCostTotal;
    s.returnRate = s.totalOrders > 0 ? ((s.returned + s.rto) / s.totalOrders * 100) : 0;
    s.deliveryRate = s.totalOrders > 0 ? (s.delivered / s.totalOrders * 100) : 0;
  });

  return Object.values(skuMap).sort((a, b) => b.totalOrders - a.totalOrders);
}

/**
 * Calculate group-level analytics
 */
function calculateGroupAnalytics(orders, skuAnalytics) {
  const groups = skuManager.getGroups();
  const groupMap = {};

  const defaultGroup = () => ({
    rawCost: 0,
    skus: [],
    totalOrders: 0,
    delivered: 0,
    shipped: 0,
    returned: 0,
    rto: 0,
    totalSettlement: 0,
    totalReturnCharges: 0,
    returnCharges: 0,
    rtoCharges: 0,
    deliveredSettlement: 0,
    rawCostTotal: 0,
    netProfit: 0,
    returnRate: 0
  });

  // Initialize with defined groups
  groups.forEach(group => {
    groupMap[group.name] = {
      name: group.name,
      rawCost: group.rawCost,
      skus: group.skus,
      ...defaultGroup(),
    };
  });

  // Add ungrouped
  groupMap['Ungrouped'] = {
    name: 'Ungrouped',
    ...defaultGroup(),
  };

  // Aggregate SKU analytics into groups
  skuAnalytics.forEach(sku => {
    const groupName = sku.group || 'Ungrouped';
    if (!groupMap[groupName]) {
      groupMap[groupName] = {
        name: groupName,
        ...defaultGroup(),
      };
    }
    const g = groupMap[groupName];
    if (!g.skus.includes(sku.sku)) g.skus.push(sku.sku);
    g.totalOrders += sku.totalOrders;
    g.delivered += sku.delivered;
    g.shipped += sku.shipped;
    g.returned += sku.returned;
    g.rto += sku.rto;
    g.totalSettlement += sku.totalSettlement;
    g.totalReturnCharges += sku.totalReturnCharges;
    g.returnCharges += sku.returnCharges;
    g.rtoCharges += sku.rtoCharges;
    g.deliveredSettlement += sku.positiveSettlement;
    g.rawCostTotal += sku.rawCostTotal;
  });

  // Calculate net profit and return rate for each group
  Object.values(groupMap).forEach(g => {
    g.netProfit = g.totalSettlement - g.rawCostTotal;
    g.returnRate = g.totalOrders > 0 ? ((g.returned + g.rto) / g.totalOrders * 100) : 0;
  });

  return Object.values(groupMap).filter(g => g.totalOrders > 0).sort((a, b) => b.totalOrders - a.totalOrders);
}


/**
 * Calculate monthly analytics for trend comparison
 */
function calculateMonthlyAnalytics(orders) {
  const monthMap = {};

  orders.forEach(order => {
    if (!order.orderDate) return;
    const date = new Date(order.orderDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    if (!monthMap[key]) {
      monthMap[key] = {
        key,
        label,
        totalOrders: 0,
        delivered: 0,
        returned: 0,
        rto: 0,
        settlement: 0,
        returnCharges: 0
      };
    }

    const m = monthMap[key];
    m.totalOrders++;
    m.settlement += order.settlementAmount;

    switch (order.status) {
      case 'Delivered': m.delivered++; break;
      case 'Return':
        m.returned++;
        m.returnCharges += Math.abs(order.settlementAmount);
        break;
      case 'RTO':
        m.rto++;
        m.returnCharges += Math.abs(order.settlementAmount);
        break;
    }
  });

  return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Get top returning SKUs
 */
export function getTopReturningSkus(skuAnalytics, limit = 10) {
  return [...skuAnalytics]
    .filter(s => s.returned + s.rto > 0)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, limit);
}

/**
 * Get top profitable SKUs
 */
export function getTopProfitableSkus(skuAnalytics, limit = 10) {
  return [...skuAnalytics]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, limit);
}

/**
 * Get empty analytics object (for initial state)
 */
function getEmptyAnalytics() {
  return {
    totalOrders: 0,
    deliveredCount: 0,
    shippedCount: 0,
    returnCount: 0,
    rtoCount: 0,
    cancelledCount: 0,
    exchangeCount: 0,
    grossRevenue: 0,
    totalPositiveSettlement: 0,
    totalNegativeSettlement: 0,
    netSettlement: 0,
    returnCharges: 0,
    rtoCharges: 0,
    totalReturnCharges: 0,
    totalRawCost: 0,
    totalAdsSpend: 0,
    netProfit: 0,
    profitMargin: 0,
    totalClaims: 0,
    totalCompensation: 0,
    totalRecovery: 0,
    totalClaimsAndCompensation: 0,
    claimsCount: 0,
    totalCommissions: 0,
    totalShippingCharges: 0,
    totalReturnShipping: 0,
    totalFixedFees: 0,
    totalTCS: 0,
    totalTDS: 0,
    skuAnalytics: [],
    groupAnalytics: [],
    monthlyAnalytics: [],
    statusDistribution: {}
  };
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount) {
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(absAmount);
  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format percentage
 */
export function formatPercent(num) {
  return `${num.toFixed(1)}%`;
}
