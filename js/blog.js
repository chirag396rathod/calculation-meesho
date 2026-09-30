/**
 * FC Analytics — Blog Module
 * SEO guide posts for Meesho sellers. Prerendered per-route by scripts/prerender-routes.mjs
 * and mounted client-side into #blogView by landing.js.
 */

export const BLOG_POSTS = {
  'how-to-crop-meesho-label': {
    slug: 'how-to-crop-meesho-label',
    title: 'How to Crop Meesho Labels & Remove Invoice — Free',
    headline: 'How to Crop Meesho Shipping Labels & Remove the Tax Invoice (Free, 2026)',
    badge: 'Meesho Label Crop Guide',
    subtitle: 'Step-by-step guide to crop Meesho shipping labels online — remove the tax invoice section, trim to 4×4 thermal size, and print clean labels in under 2 minutes. 100% free, no signup.',
    date: 'September 30, 2026',
    readTime: '4 min read',
    render: () => `
      <p>Every Meesho shipping label PDF ships with two things on the same page: the <strong>shipping label</strong> (barcode, address, SKU) and a <strong>tax invoice</strong> block below it. Printing both wastes thermal paper, slows packing, and sometimes confuses warehouse staff. Cropping the invoice away gives you a clean, scannable label — and you can do it free in your browser.</p>

      <h2>Why Crop the Invoice From a Meesho Label?</h2>
      <ul>
        <li><strong>Save thermal paper:</strong> removing the invoice block cuts label height by 30–40%, so a 4×4 inch roll lasts far longer.</li>
        <li><strong>Faster packing:</strong> a compact label fits standard 4×4 or 4×6 thermal slots without resizing.</li>
        <li><strong>Cleaner barcodes:</strong> less clutter means scanners read the AWB barcode on the first pass.</li>
        <li><strong>No data leakage:</strong> the invoice shows your product cost and pricing — crop it before labels circulate in the warehouse.</li>
      </ul>

      <h2>How to Crop Meesho Labels Online (3 Steps)</h2>
      <h3>Step 1 — Upload your label PDF</h3>
      <p>Open the <a href="/labels/meesho" data-sb-route="labels/meesho">Meesho Label Crop &amp; Sort tool</a> and drag-and-drop your label PDF. Multi-page PDFs with dozens of labels work fine, and you can upload files from multiple seller accounts in one batch.</p>
      <h3>Step 2 — Choose the crop mode</h3>
      <p>Pick <strong>Crop labels (remove invoice section)</strong> to cut the tax invoice below the product details, or <strong>Trim whitespace (4×4 label size)</strong> to tighten the border for thermal rolls. Both run 100% locally in your browser — the file never leaves your device.</p>
      <h3>Step 3 — Generate &amp; print</h3>
      <p>Click <strong>Generate Sorted PDF</strong>, check the preview map, and print at 100% actual size. The output is a print-ready PDF with clean, scannable labels.</p>

      <h2>Crop Modes Compared</h2>
      <table>
        <tr><th>Mode</th><th>What it does</th><th>Best for</th></tr>
        <tr><td>Crop below product details</td><td>Removes the full invoice block under the label</td><td>Maximum paper saving</td></tr>
        <tr><td>Trim whitespace (4×4)</td><td>Cuts outer white border to standard thermal size</td><td>4×4 thermal rolls</td></tr>
        <tr><td>Both combined</td><td>Invoice removed + border trimmed</td><td>Fastest daily dispatch</td></tr>
      </table>

      <h2>Common Cropping Mistakes to Avoid</h2>
      <ul>
        <li>Cropping into the barcode zone — always keep the AWB barcode and address fully visible.</li>
        <li>Printing at fit-to-page — always print at 100% actual size or barcodes blur.</li>
        <li>Mixing accounts without sorting — use the multi-account batch to merge, then sort.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Is cropping Meesho labels allowed?</h3>
      <p>Yes. The invoice is for your accounting; the courier only needs the shipping label with the barcode and address. Cropping the invoice from your printed copy is standard practice.</p>
      <h3>Does the tool upload my labels to a server?</h3>
      <p>No. All cropping and PDF generation happens locally in your browser. Files never leave your device.</p>
      <h3>Can I crop labels from multiple Meesho accounts at once?</h3>
      <p>Yes, upload several PDFs in one batch, then sort by SKU or courier before generating the final file.</p>
      <h3>Is the Meesho label cropper free?</h3>
      <p>Yes — 100% free with no signup. Open the <a href="/labels/meesho" data-sb-route="labels/meesho">Meesho label tool</a> and start cropping.</p>
    `
  },

  'meesho-profit-calculator-formula': {
    slug: 'meesho-profit-calculator-formula',
    title: 'Meesho Profit Calculator Formula & Net Margin 2026',
    headline: 'Meesho Profit Calculator Formula: GST, RTO & Real Net Margin (2026)',
    badge: 'Profit Formula Guide',
    subtitle: 'The exact Meesho profit formula sellers use — selling price minus shipping, GST, returns and RTO. Includes worked examples and a free calculator to check any SKU instantly.',
    date: 'September 30, 2026',
    readTime: '6 min read',
    render: () => `
      <p>Meesho shows you a selling price — but your real earning is what survives after shipping, GST, returns and RTO. This guide gives you the exact <strong>Meesho profit calculator formula</strong> with worked examples, so you can price any SKU with confidence before you list it.</p>

      <h2>The Meesho Profit Formula</h2>
      <table>
        <tr><th>Formula</th><th>Meaning</th></tr>
        <tr><td>Net Payout = Selling Price − Commission − Shipping (incl. 18% GST)</td><td>What Meesho actually pays you per delivered order.</td></tr>
        <tr><td>Net Profit = Net Payout − Product Cost − Return/RTO Buffer</td><td>Your true earning after expected return losses.</td></tr>
        <tr><td>Net Margin % = Net Profit ÷ Selling Price × 100</td><td>Profit as a percentage of the listed price.</td></tr>
      </table>

      <h2>Every Deduction That Eats Your Margin</h2>
      <h3>Shipping charges (₹40–₹90)</h3>
      <p>You pay forward shipping per order based on weight and delivery zone. Check your supplier panel rate card for exact slabs.</p>
      <h3>18% GST on shipping &amp; fees</h3>
      <p>Meesho adds 18% GST on logistics and fee components and deducts it from your settlement. GST-registered sellers can claim Input Tax Credit on these amounts.</p>
      <h3>Commission (mostly 0%)</h3>
      <p>Meesho is 0% commission for most categories, but keep the field in your calculations — some categories and accounts see charges.</p>
      <h3>Returns &amp; RTO (the margin killer)</h3>
      <p>Every return burns reverse logistics cost, packaging, and sometimes the product itself. Fashion categories commonly run 20–40% returns. Always price with an RTO buffer.</p>
      <h3>TDS/TCS deductions</h3>
      <p>0.1% TDS under Section 194-O and applicable TCS are deducted but come back as tax credits when you file — track them, but don't count them as a cost.</p>

      <h2>Worked Example: ₹399 Kurti</h2>
      <table>
        <tr><th>Cost Factor</th><th>Amount</th></tr>
        <tr><td>Selling Price</td><td>₹399</td></tr>
        <tr><td>Product / Making Cost</td><td>−₹140</td></tr>
        <tr><td>Shipping Charges</td><td>−₹65</td></tr>
        <tr><td>Logistics GST (18%)</td><td>−₹11.7</td></tr>
        <tr><td>Platform Deductions (0% commission)</td><td>₹0</td></tr>
        <tr><td><strong>Net Payout (delivered)</strong></td><td><strong>₹322.3</strong></td></tr>
        <tr><td><strong>Net Profit / Unit (before returns)</strong></td><td><strong>₹182.3</strong></td></tr>
      </table>
      <p>Now add the return buffer: at an 18% RTO/return rate, each return costs you two-way freight plus dead packaging. A ₹182 margin at 0% returns can drop below ₹120 at realistic return rates — that is why you must always test your SKU in the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">free Meesho profit calculator</a> before scaling ads.</p>

      <h2>What Is a Good Net Margin on Meesho?</h2>
      <ul>
        <li><strong>20–35% net margin</strong> — healthy; room to absorb ad spend and return shocks.</li>
        <li><strong>15–20%</strong> — workable but fragile; one bad return week wipes the month.</li>
        <li><strong>Below 15%</strong> — dangerous on high-return categories like kurtis, sarees and footwear.</li>
      </ul>

      <h2>How to Set the Right Selling Price</h2>
      <ul>
        <li>Calculate landed product cost first (raw material + labour + packaging).</li>
        <li>Add shipping and GST on fees.</li>
        <li>Add an RTO buffer based on your category's real return rate.</li>
        <li>Target minimum 20% net margin — never list below break-even.</li>
        <li>Verify with the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">Meesho profit calculator</a>, then compare with competitor listings.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>What is the Meesho profit formula?</h3>
      <p>Net Profit = Selling Price − Product Cost − Shipping − Commission − GST on fees − expected RTO/return losses. The calculator shows each deduction separately.</p>
      <h3>Does Meesho charge commission in 2026?</h3>
      <p>Meesho charges 0% referral commission on most categories, but 18% GST on shipping and fee components still applies to every order.</p>
      <h3>How much does one Meesho return cost?</h3>
      <p>Typically ₹140–₹170 in return shipping plus packaging, and the product cost if it comes back damaged. See our RTO charges guide for the full breakdown.</p>
      <h3>Is the profit calculator free?</h3>
      <p>Yes — the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">Meesho profit calculator</a> is 100% free, no signup, and runs entirely in your browser.</p>
    `
  },

  'meesho-rto-return-charges': {
    slug: 'meesho-rto-return-charges',
    title: 'Meesho RTO & Return Charges — Real Cost Per Return',
    headline: 'Meesho RTO & Return Charges: What Each Return Really Costs Sellers (2026)',
    badge: 'Returns & RTO Guide',
    subtitle: 'Exact Meesho RTO and customer-return charges explained — forward freight, reverse shipping fees, packaging loss and GST. Learn how to compute your break-even return rate before it eats your margin.',
    date: 'September 30, 2026',
    readTime: '5 min read',
    render: () => `
      <p>Returns are the silent killer on Meesho. A product that looks profitable at 0% returns can be bleeding cash at 25%. This guide breaks down every <strong>Meesho RTO and return charge</strong>, shows a worked cost example, and gives you the formula for your break-even return rate.</p>

      <h2>RTO vs Customer Return — Not the Same Cost</h2>
      <table>
        <tr><th>Type</th><th>What happens</th><th>What you pay</th></tr>
        <tr><td>RTO (Return to Origin)</td><td>Customer never accepts; shipment comes back to you</td><td>Forward freight lost + packaging; Meesho states no separate return shipping fee for RTO</td></tr>
        <tr><td>Customer Return</td><td>Delivered, then returned within the return window</td><td>Return shipping fee based on weight (typically ₹140–₹170) + packaging</td></tr>
        <tr><td>Damaged Return</td><td>Product comes back unusable</td><td>All of the above + full product cost</td></tr>
      </table>
      <p>Always verify the current fee schedule in your Meesho supplier panel — policies and weight slabs get revised periodically.</p>

      <h2>The Real Cost of One Return (Example)</h2>
      <p>Take a ₹399 kurti that costs ₹140 to make, with ₹65 forward shipping:</p>
      <table>
        <tr><th>Cost Component</th><th>Loss</th></tr>
        <tr><td>Forward shipping (non-recoverable)</td><td>₹65</td></tr>
        <tr><td>Return shipping fee (customer return)</td><td>≈₹160</td></tr>
        <tr><td>Packaging (pouch, tape, label)</td><td>≈₹10</td></tr>
        <tr><td>Handling time (repack/restock)</td><td>≈₹10</td></tr>
        <tr><td>Product loss if damaged (15% of returns)</td><td>≈₹21 expected</td></tr>
        <tr><td><strong>Total expected cost per return</strong></td><td><strong>≈₹266</strong></td></tr>
      </table>
      <p>One return wipes out the profit of roughly 1.5 delivered orders. That is the number most sellers never compute.</p>

      <h2>Break-Even Return Rate Formula</h2>
      <table>
        <tr><th>Formula</th><th>Meaning</th></tr>
        <tr><td>Profit per Delivered = Net Payout − Product Cost</td><td>Earning on a successful order.</td></tr>
        <tr><td>Break-even Return % = Profit per Delivered ÷ (Profit per Delivered + Cost per Return)</td><td>The return rate at which you make ₹0.</td></tr>
      </table>
      <p>Example: ₹182 profit per delivered order and ₹266 cost per return gives a break-even return rate of about 41%. Anything above that and the SKU is losing money on average — no matter how good the sales volume looks.</p>

      <h2>5 Ways to Reduce Meesho Returns</h2>
      <ul>
        <li><strong>Accurate listings:</strong> real photos, correct size charts, honest colour names.</li>
        <li><strong>Quality packaging:</strong> tamper-proof polybags with bubble wrap for fragile SKUs.</li>
        <li><strong>Fast dispatch:</strong> delayed orders convert to RTO far more often.</li>
        <li><strong>Track SKU-level return %:</strong> pause or re-source any SKU above 30%.</li>
        <li><strong>Price with a buffer:</strong> bake your category's average return rate into the price using the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">Meesho profit calculator</a>.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Does Meesho charge for RTO orders?</h3>
      <p>Meesho states RTOs do not carry a separate return shipping fee, but you still lose forward freight and packaging on every RTO.</p>
      <h3>What is the customer return shipping fee on Meesho?</h3>
      <p>Return shipping is weight-based, typically ₹140–₹170 for lightweight products including taxes. Check your panel for your exact slabs.</p>
      <h3>What return rate is safe on Meesho?</h3>
      <p>Compute your break-even rate with the formula above; most sellers treat anything above 25–30% on a SKU as a stop signal.</p>
      <h3>How do I track returns per SKU?</h3>
      <p>Upload your Meesho payment report to the FC Analytics dashboard for per-SKU return and RTO analytics, or test single products in the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">profit calculator</a>.</p>
    `
  },

  'sort-meesho-labels-by-sku-courier': {
    slug: 'sort-meesho-labels-by-sku-courier',
    title: 'How to Sort Meesho Labels by SKU & Courier Partner',
    headline: 'How to Sort Meesho Labels by SKU & Courier Partner Before Packing (2026)',
    badge: 'Dispatch Sorting Guide',
    subtitle: 'Sort Meesho shipping label PDFs by SKU or courier partner (Xpress Bees, Valmo, Shadowfax, Delhivery) before printing — pack faster, hand over courier batches instantly, and stop pick errors. Free tool.',
    date: 'September 30, 2026',
    readTime: '4 min read',
    render: () => `
      <p>If your packing team walks back and forth across the warehouse for every order, your labels are not sorted. Sorting <strong>Meesho labels by SKU or courier partner</strong> before printing turns dispatch chaos into an assembly line — and it takes about 30 seconds with a free tool.</p>

      <h2>Why Sort Labels Before Printing?</h2>
      <ul>
        <li><strong>SKU sorting:</strong> all orders of the same product print together — pick one product, pack all its orders in one run.</li>
        <li><strong>Courier sorting:</strong> Xpress Bees, Valmo, Shadowfax and Delhivery pickups each want their own stack — sorted labels mean instant handover.</li>
        <li><strong>Fewer mistakes:</strong> grouped labels make missing or extra units obvious before sealing the bag.</li>
        <li><strong>Multi-account friendly:</strong> merge PDFs from several Meesho accounts, then sort everything in one pass.</li>
      </ul>

      <h2>How to Sort Meesho Labels (3 Steps)</h2>
      <h3>Step 1 — Upload all label PDFs</h3>
      <p>Open the <a href="/labels/meesho" data-sb-route="labels/meesho">Meesho Label Sort &amp; Crop tool</a> and drop in one or many label PDFs — multi-page files from different seller accounts are supported in a single batch.</p>
      <h3>Step 2 — Choose sort type and order</h3>
      <p>Select <strong>Sort by SKU</strong> or <strong>Sort by Courier Partner</strong>, then pick ascending/descending and whether to sort by SKU name or label count. Combo and multi-quantity orders can be kept on top or exported as a separate PDF so packers never miss extra units.</p>
      <h3>Step 3 — Preview, generate, pack</h3>
      <p>Check the preview map to verify grouping and counts, add an optional custom message or QR code, then generate the sorted PDF and print at 100% size.</p>

      <h2>Sort Options Reference</h2>
      <table>
        <tr><th>Option</th><th>Use it when</th></tr>
        <tr><td>Sort by SKU (A→Z)</td><td>Products stored alphabetically on shelves</td></tr>
        <tr><td>Sort by SKU (label count)</td><td>Want best-sellers printed first</td></tr>
        <tr><td>Sort by Courier Partner</td><td>Multiple courier pickups on the same day</td></tr>
        <tr><td>Combos kept on top / separate PDF</td><td>Multi-unit orders need special packing</td></tr>
      </table>

      <h2>Pro Packing Workflow (50+ Orders/Day)</h2>
      <ul>
        <li>Download all label PDFs from the Meesho panel after order processing.</li>
        <li>Sort by courier → generate one PDF per courier → hand each stack to its pickup.</li>
        <li>Within each courier stack, SKU grouping means one product, one pick, many packs.</li>
        <li>Stamp a thank-you message + QR code (review link, Instagram, warranty) in the same pass — no reprinting.</li>
      </ul>

      <h2>Frequently Asked Questions</h2>
      <h3>Which couriers are auto-detected?</h3>
      <p>Xpress Bees, Valmo, Shadowfax, Delhivery, Ecom Express, Bluedart and DTDC are recognised and grouped automatically from the label PDF text.</p>
      <h3>Can I sort labels from multiple Meesho accounts together?</h3>
      <p>Yes — upload all PDFs in one batch and the tool merges, sorts and exports a single consolidated file.</p>
      <h3>Does sorting change the label content?</h3>
      <p>No. Pages are only reordered; you can optionally crop invoices or add messages, but barcodes and addresses stay untouched.</p>
      <h3>Is the sorting tool free?</h3>
      <p>Yes — the <a href="/labels/meesho" data-sb-route="labels/meesho">Meesho label sorter</a> is 100% free, no signup, and processes everything locally in your browser.</p>
    `
  }
};

export function buildBlogIndexHtml() {
  const cards = Object.values(BLOG_POSTS).map(p => `
    <a class="sb-faq-item motion-stagger-item" href="/blog/${p.slug}" data-sb-route="blog/${p.slug}" style="text-decoration: none; color: inherit; display: block; cursor: pointer;">
      <div style="padding: 22px 24px;">
        <div class="info-pill-badge" style="margin-bottom: 12px; display: inline-flex;">
          <span>📘</span>
          <span>${p.badge}</span>
        </div>
        <h3 style="font-size: 1.12rem; font-weight: 800; line-height: 1.4; margin-bottom: 10px; color: var(--sb-text-dark);">${p.headline}</h3>
        <p style="color: var(--sb-text-muted); font-size: 0.92rem; line-height: 1.65; margin-bottom: 14px;">${p.subtitle}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: var(--sb-text-muted);">
          <span>📅 ${p.date} · ⏱️ ${p.readTime}</span>
          <span style="color: var(--sb-primary); font-weight: 700;">Read guide →</span>
        </div>
      </div>
    </a>
  `).join('');

  return `
    <div class="info-hero-banner">
      <div class="info-hero-container">
        <div class="info-pill-badge">
          <span>📚</span>
          <span>Free Seller Guides · Updated 2026</span>
        </div>
        <h1 class="info-hero-title">FC Analytics Blog — Meesho Seller Guides</h1>
        <p class="info-hero-subtitle">Practical playbooks for Meesho sellers: crop and sort shipping labels, master the profit formula, control RTO losses and dispatch faster — all free.</p>
        <div class="info-meta-chips">
          <div class="info-meta-chip"><strong>Guides:</strong> <span>${Object.keys(BLOG_POSTS).length} in-depth articles</span></div>
          <div class="info-meta-chip"><strong>Cost:</strong> <span>Always free</span></div>
          <div class="info-meta-chip"><strong>Focus:</strong> <span>Meesho & marketplace sellers</span></div>
        </div>
      </div>
    </div>

    <div class="info-body-container">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 18px;">
        ${cards}
      </div>

      <div style="margin-top: 28px; background: white; border: 4px solid var(--sb-border); border-radius: 24px; padding: 26px; text-align: center;" data-motion-spotlight>
        <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 8px;">Ready to try the tools?</h3>
        <p style="color: var(--sb-text-muted); margin-bottom: 18px;">Crop &amp; sort shipping labels or calculate real SKU profit — free, no signup.</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a class="sb-btn sb-btn-primary" href="/labels/meesho" style="text-decoration: none;" data-sb-route="labels/meesho">🏷️ Label Crop &amp; Sort</a>
          <a class="sb-btn sb-btn-outline" href="/meesho-profit-calculator" style="text-decoration: none;" data-sb-route="meesho-profit-calculator">🧮 Profit Calculator</a>
        </div>
      </div>
    </div>
  `;
}

export function buildBlogPostHtml(slug) {
  const post = BLOG_POSTS[slug];
  if (!post) return buildBlogIndexHtml();

  const related = Object.values(BLOG_POSTS)
    .filter(p => p.slug !== slug)
    .map(p => `
      <li style="margin-bottom: 8px;">
        <a href="/blog/${p.slug}" data-sb-route="blog/${p.slug}" style="color: var(--sb-primary); font-weight: 600; text-decoration: none;">${p.headline} →</a>
      </li>
    `)
    .join('');

  return `
    <div class="info-hero-banner">
      <div class="info-hero-container">
        <div class="info-pill-badge">
          <span>📘</span>
          <span>${post.badge}</span>
        </div>
        <h1 class="info-hero-title">${post.headline}</h1>
        <p class="info-hero-subtitle">${post.subtitle}</p>
        <div class="info-meta-chips">
          <div class="info-meta-chip"><strong>Updated:</strong> <span>${post.date}</span></div>
          <div class="info-meta-chip"><strong>Read time:</strong> <span>${post.readTime}</span></div>
          <div class="info-meta-chip"><strong>Tools:</strong> <span>100% free, no signup</span></div>
        </div>
      </div>
    </div>

    <div class="info-body-container">
      <article class="info-article-card">
        <p style="margin-bottom: 4px;"><a href="/blog" data-sb-route="blog" style="color: var(--sb-primary); font-weight: 600; text-decoration: none;">← All Blog Posts</a></p>
        ${post.render()}
      </article>

      <div style="margin-top: 24px; background: white; border: 4px solid var(--sb-border); border-radius: 24px; padding: 26px;" data-motion-spotlight>
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 14px;">Keep Reading</h3>
        <ul style="list-style: none; padding: 0; margin-bottom: 18px;">${related}</ul>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a class="sb-btn sb-btn-primary" href="/labels/meesho" style="text-decoration: none;" data-sb-route="labels/meesho">🏷️ Open Label Tool</a>
          <a class="sb-btn sb-btn-outline" href="/meesho-profit-calculator" style="text-decoration: none;" data-sb-route="meesho-profit-calculator">🧮 Profit Calculator</a>
        </div>
      </div>
    </div>
  `;
}
