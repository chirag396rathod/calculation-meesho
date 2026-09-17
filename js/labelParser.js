/**
 * labelParser.js — Meesho Label PDF Parser
 * Uses pdfjs-dist to extract structured data (SKU, courier, qty, order no.)
 * from each page of a Meesho shipping label PDF.
 * Runs entirely client-side — no data leaves the browser.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker source via Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
/**
 * Known courier partner names for matching (order longer phrases first)
 */
const COURIER_PATTERNS = [
  'Xpress Bees', 'Xpressbees', 'ElasticRun', 'Elastic Run',
  'ValmoPlus', 'Valmo Plus', 'Valmo', 'Delhivery', 'Shadowfax',
  'Ecom Express', 'Blue Dart', 'DTDC', 'Ekart', 'Amazon Shipping',
  'Spoton', 'Gati', 'Rivigo', 'Delivery', 'Professional', 'Smartr',
  'Movin', 'Loadshare', 'Pickrr', 'ShipDelight', 'iThink'
];

// Case-insensitive regex to match courier names
const courierRegex = new RegExp(
  `\\b(${COURIER_PATTERNS.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

function normalizeCourierName(name) {
  if (!name) return 'Unknown Courier';
  const clean = name.trim();
  if (/^xpress\s*bees$/i.test(clean) || /^bees$/i.test(clean)) return 'Xpress Bees';
  if (/^valmo(?:plus|\s+plus)?$/i.test(clean)) return 'Valmo';
  if (/^elastic\s*run$/i.test(clean)) return 'ElasticRun';
  if (/^delhivery$/i.test(clean)) return 'Delhivery';
  if (/^shadowfax$/i.test(clean)) return 'Shadowfax';
  if (/^ecom\s*express$/i.test(clean)) return 'Ecom Express';
  if (/^blue\s*dart$/i.test(clean)) return 'Blue Dart';
  if (/^dtdc$/i.test(clean)) return 'DTDC';
  if (/^ekart$/i.test(clean)) return 'Ekart';
  if (/^amazon/i.test(clean)) return 'Amazon Shipping';
  return clean;
}

/**
 * Parse a single PDF file and extract label data from each page
 * @param {ArrayBuffer|Uint8Array} inputData — Raw PDF bytes
 * @param {string} [platform='auto'] — 'meesho' | 'flipkart' | 'auto'
 * @returns {Promise<Array<LabelData>>} — Array of label data objects
 */
export async function parseLabelPDF(inputData, platform = 'auto') {
  // Defensive clone: create an independent Uint8Array so worker transfer never detaches the caller's buffer
  const rawBytes = inputData instanceof Uint8Array ? inputData : new Uint8Array(inputData);
  const bufferCopy = new Uint8Array(rawBytes.length);
  bufferCopy.set(rawBytes);

  const pdfDoc = await pdfjsLib.getDocument({ data: bufferCopy }).promise;
  const totalPages = pdfDoc.numPages;
  const labels = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    // Collect all text items with their positions
    const textItems = textContent.items.map(item => ({
      text: item.str.trim(),
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height || (item.transform[3] || 12)
    }));

    // Full page text for regex matching
    const fullText = textItems.map(item => item.text).join(' ');

    // Detect platform if set to auto
    let effectivePlatform = platform;
    if (!effectivePlatform || effectivePlatform === 'auto') {
      if (/\bOD\d{16,22}\b/i.test(fullText) || /E-?Kart Logistics/i.test(fullText) || /SKU\s*ID\s*(?:\|)?\s*Description/i.test(fullText)) {
        effectivePlatform = 'flipkart';
      } else {
        effectivePlatform = 'meesho';
      }
    }

    // Find TAX INVOICE Y and lowest/highest text bounds for dynamic 4x4 cropping (Meesho)
    let taxInvoiceY = null;
    let minTextY = 9999;
    let maxTextY = -9999;
    for (const item of textItems) {
      if (/TAX\s+INVOICE/i.test(item.text)) {
        taxInvoiceY = item.y;
      }
      if (item.text.length > 0) {
        if (item.y < minTextY && item.y > 50) minTextY = item.y;
        if (item.y > maxTextY) maxTextY = item.y;
      }
    }

    const isFlipkart = effectivePlatform === 'flipkart';

    const labelData = {
      pageIndex: i - 1,
      platform: effectivePlatform,
      sku: isFlipkart ? extractFlipkartSKU(textItems, fullText) : extractSKU(textItems, fullText),
      courierPartner: isFlipkart ? extractFlipkartCourier(textItems, fullText) : extractCourierPartner(textItems, fullText),
      quantity: isFlipkart ? extractFlipkartQuantity(textItems, fullText) : extractQuantity(textItems, fullText),
      orderNo: isFlipkart ? extractFlipkartOrderNo(textItems, fullText) : extractOrderNo(textItems, fullText),
      isMultiQty: false,
      rawText: fullText,
      taxInvoiceY: taxInvoiceY,
      minTextY: Number.isFinite(minTextY) && minTextY < 9000 ? minTextY : 247,
      maxTextY: Number.isFinite(maxTextY) && maxTextY > 0 ? maxTextY : 825
    };

    // Flag multi-quantity orders
    labelData.isMultiQty = labelData.quantity > 1;

    labels.push(labelData);
  }

  return labels;
}

/**
 * Extract SKU from text items
 * Meesho labels have "SKU" as a header followed by the SKU value in the Product Details section
 */
function extractSKU(textItems, fullText) {
  // Strategy 1: Look for "SKU" field header followed by value
  // Meesho format has a product details table with columns: SKU, Size, Qty, Color, Order No.
  for (let i = 0; i < textItems.length; i++) {
    const item = textItems[i];

    if (item.text === 'SKU' || item.text === 'Sku') {
      // The SKU value is typically on the next line below the header
      // Look for the next text item that's at a lower Y position (same X region)
      const skuCandidates = textItems.slice(i + 1).filter(t => {
        return t.text.length > 0 &&
               t.text !== 'Size' &&
               t.text !== 'Qty' &&
               t.text !== 'Color' &&
               t.text !== 'Order No.' &&
               t.text !== 'Product Details';
      });

      if (skuCandidates.length > 0) {
        // Return first non-header candidate
        const sku = skuCandidates[0].text;
        if (sku && sku.length > 1 && !sku.match(/^\d+$/)) {
          return sku;
        }
      }
    }
  }

  // Strategy 2: Regex match for SKU patterns in full text
  const skuMatch = fullText.match(/SKU\s*[:\-]?\s*([A-Za-z0-9\-_\s]+?)(?:\s+(?:Size|Qty|Color|Order|No\.|Pack))/i);
  if (skuMatch && skuMatch[1]) {
    return skuMatch[1].trim();
  }

  // Strategy 3: Look for Product Details section
  const productMatch = fullText.match(/Product\s+Details\s+SKU\s+([\w\s\-]+?)(?:\s+\d|\s+Size|\s+Qty)/i);
  if (productMatch && productMatch[1]) {
    return productMatch[1].trim();
  }

  return 'Unknown SKU';
}

/**
 * Extract courier partner name from label text
 * Courier name usually appears near the top of the label
 */
function extractCourierPartner(textItems, fullText) {
  // Strategy 1: Direct match against known courier names (includes Xpress Bees, ElasticRun, etc.)
  const match = fullText.match(courierRegex);
  if (match) {
    return normalizeCourierName(match[1]);
  }

  // Strategy 2: Look for text near "Pickup" or tracking area (top-right of label)
  const multiPickupMatch = fullText.match(/(Xpress\s+Bees|Elastic\s*Run|Valmo(?:\s*Plus)?|Delhivery|Shadowfax)\s+Pickup/i);
  if (multiPickupMatch && multiPickupMatch[1]) {
    return normalizeCourierName(multiPickupMatch[1]);
  }

  const pickupMatch = fullText.match(/(\w+(?:\s+\w+)?)\s+Pickup/i);
  if (pickupMatch && pickupMatch[1]) {
    const candidate = pickupMatch[1].trim();
    if (candidate.length > 2 && !/^\d+$/.test(candidate) && !/check|payable|amount/i.test(candidate)) {
      return normalizeCourierName(candidate);
    }
  }

  // Strategy 3: Check top text items
  const topItems = textItems
    .sort((a, b) => b.y - a.y)
    .slice(0, 15);

  for (const item of topItems) {
    const courierCheck = item.text.match(courierRegex);
    if (courierCheck) {
      return normalizeCourierName(courierCheck[1]);
    }
  }

  return 'Unknown Courier';
}

/**
 * Extract quantity from label text
 */
function extractQuantity(textItems, fullText) {
  // Look for Qty field value
  const qtyMatch = fullText.match(/Qty\s*[:\-]?\s*(\d+)/i);
  if (qtyMatch) {
    return parseInt(qtyMatch[1], 10);
  }

  // Look for quantity in product details table
  for (let i = 0; i < textItems.length; i++) {
    if (textItems[i].text === 'Qty' || textItems[i].text === 'QTY') {
      // The qty value should be below this header
      for (let j = i + 1; j < Math.min(i + 10, textItems.length); j++) {
        const val = parseInt(textItems[j].text, 10);
        if (!isNaN(val) && val > 0 && val < 100) {
          return val;
        }
      }
    }
  }

  return 1; // Default to 1
}

/**
 * Extract order number from label text
 */
function extractOrderNo(textItems, fullText) {
  // Look for Order No. or tracking number patterns
  const orderMatch = fullText.match(/Order\s*No\.?\s*[:\-]?\s*([A-Z0-9]+)/i);
  if (orderMatch) {
    return orderMatch[1];
  }

  // Look for Meesho-style tracking number (VL prefix, etc.)
  const trackingMatch = fullText.match(/\b([A-Z]{2}\d{10,})\b/);
  if (trackingMatch) {
    return trackingMatch[1];
  }

  // Look for barcode number (long numeric string)
  const barcodeMatch = fullText.match(/\b(\d{12,})\b/);
  if (barcodeMatch) {
    return barcodeMatch[1];
  }

  return '';
}

/**
 * Extract SKU for Flipkart labels
 * Flipkart labels have an item table with "SKU ID | Description" or "SKU ID Description"
 */
function extractFlipkartSKU(textItems, fullText) {
  // Strategy 1: Look for "SKU ID" header in text items
  const skuHeaderIdx = textItems.findIndex(t => /SKU\s*ID/i.test(t.text));
  if (skuHeaderIdx !== -1) {
    for (let i = skuHeaderIdx + 1; i < Math.min(skuHeaderIdx + 10, textItems.length); i++) {
      const item = textItems[i].text;
      if (/^(Description|Total|HSN|Tax|Rate|Qty|IGST|CGST|SGST|Applicable|Taxable|Amount|Invoice)$/i.test(item)) continue;
      if (item.includes('|')) {
        const candidate = item.split('|')[0].trim();
        if (candidate) return candidate;
      } else if (item.length > 1 && !/^\d+$/.test(item)) {
        return item.trim();
      }
    }
  }

  // Strategy 2: Regex match on full text
  const matchWithPipe = fullText.match(/SKU\s*ID\s*(?:\|)?\s*Description\s+([A-Za-z0-9_\-\s]+?)(?:\s*\||\s+HSN|\s+IGST|\s+Total)/i);
  if (matchWithPipe && matchWithPipe[1]) {
    return matchWithPipe[1].trim();
  }

  // Strategy 3: Search for SKU ID prefix
  const skuPrefixMatch = fullText.match(/SKU\s*ID[:\s]+([A-Za-z0-9_\-\s]+?)(?:\s*\||\s+Description|\s+Qty)/i);
  if (skuPrefixMatch && skuPrefixMatch[1]) {
    return skuPrefixMatch[1].trim();
  }

  return 'Unknown SKU';
}

/**
 * Extract courier partner for Flipkart labels
 */
function extractFlipkartCourier(textItems, fullText) {
  if (/E-?Kart/i.test(fullText)) return 'Ekart Logistics';
  if (/Delhivery/i.test(fullText)) return 'Delhivery';
  if (/Shadowfax/i.test(fullText)) return 'Shadowfax';
  if (/Xpress\s*bees/i.test(fullText)) return 'Xpressbees';
  if (/Blue\s*Dart/i.test(fullText)) return 'Blue Dart';
  if (/DTDC/i.test(fullText)) return 'DTDC';
  return 'Ekart Logistics'; // Default for Flipkart
}

/**
 * Extract Flipkart order number (OD...) or AWB
 */
function extractFlipkartOrderNo(textItems, fullText) {
  const odMatch = fullText.match(/\b(OD\d{16,22})\b/i);
  if (odMatch) return odMatch[1];

  const awbMatch = fullText.match(/\b(FMPP\w+|SF\w+|DEL\w+)\b/i);
  if (awbMatch) return awbMatch[1];

  return '';
}

/**
 * Extract Flipkart quantity
 */
function extractFlipkartQuantity(textItems, fullText) {
  const qtyMatch = fullText.match(/Qty\s*[:\-]?\s*(\d+)/i);
  if (qtyMatch) return parseInt(qtyMatch[1], 10);
  return 1;
}

/**
 * Parse multiple PDF files and combine results
 * @param {Array<{name: string, bytes: ArrayBuffer}>} files
 * @param {string} [platform='auto'] — 'meesho' | 'flipkart' | 'auto'
 * @returns {Promise<Array<LabelData>>}
 */
export async function parseMultiplePDFs(files, platform = 'auto') {
  const allLabels = [];
  let globalPageOffset = 0;

  for (const file of files) {
    try {
      const labels = await parseLabelPDF(file.bytes, platform);
      // Add file reference and adjust page indices for multi-file tracking
      labels.forEach(label => {
        label.fileName = file.name;
        label.globalPageIndex = globalPageOffset + label.pageIndex;
        allLabels.push(label);
      });
      globalPageOffset += labels.length;
    } catch (err) {
      console.error(`[LabelParser] Error parsing ${file.name}:`, err);
      throw new Error(`Failed to parse "${file.name}": ${err.message}`);
    }
  }

  return allLabels;
}

/**
 * Get summary statistics from parsed labels
 * @param {Array<LabelData>} labels
 * @returns {{ totalLabels, uniqueSkus, courierPartners, skuCounts, courierCounts }}
 */
export function getLabelStats(labels) {
  const skuCounts = {};
  const courierCounts = {};

  labels.forEach(label => {
    skuCounts[label.sku] = (skuCounts[label.sku] || 0) + 1;
    courierCounts[label.courierPartner] = (courierCounts[label.courierPartner] || 0) + 1;
  });

  return {
    totalLabels: labels.length,
    uniqueSkus: Object.keys(skuCounts).length,
    courierPartners: Object.keys(courierCounts).length,
    skuCounts,
    courierCounts
  };
}
