import fs from 'fs';
import * as pdfjsLib from './node_modules/pdfjs-dist/legacy/build/pdf.mjs';

async function inspectInputFile(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log(`\n=== Checking: ${filePath} (${doc.numPages} pages) ===`);

  for (let i = 1; i <= Math.min(doc.numPages, 4); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.filter(it => it.str && it.str.trim());
    
    // Check key strings
    console.log(`\n--- Page ${i} ---`);
    for (let j = 0; j < items.length; j++) {
      const it = items[j];
      const s = it.str.trim();
      if (s.includes('SKU') || s.includes('AWB') || s.includes('Ordered through') || s.includes('Logistics') || s.includes('Tax Invoice') || s.includes('OD438')) {
        console.log(`  [y=${it.transform[5].toFixed(1)}, x=${it.transform[4].toFixed(1)}] ${s}`);
      }
    }
  }
}

async function run() {
  await inspectInputFile('D:/FC/Invoices/Input/invoice_labels_1789613660349.pdf');
  await inspectInputFile('D:/FC/Invoices/Input/invoice_labels_1789613675980.pdf');
  await inspectInputFile('D:/FC/Invoices/Input/invoice_labels_1789613916336.pdf');
}

run().catch(console.error);




