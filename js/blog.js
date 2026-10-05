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
  },

  'meesho-shipping-charges-2026': {
    slug: 'meesho-shipping-charges-2026',
    title: 'Meesho Shipping Charges 2026 — Weight Slabs, GST & Rate Card',
    headline: 'Meesho Shipping Charges 2026: Weight Slabs, GST & Real Rate Card',
    badge: 'Shipping Cost Guide',
    subtitle: 'Meesho shipping charges for 2026 explained — forward shipping by weight slab, the 18% GST added on top, return shipping fees and seven practical ways to cut your logistics cost per order.',
    date: 'October 5, 2026',
    readTime: '7 min read',
    render: () => `
      <p>Meesho advertises 0% commission — and it is true. But zero commission does not mean zero cost. The single biggest deduction on every Meesho settlement is the <strong>Meesho shipping charge</strong>: a weight-slab based fee for delivering each order, plus 18% GST on that fee. If you price products without knowing your exact shipping cost, you are guessing at your profit. This guide gives you the 2026 slab table, the GST treatment, return shipping rates, and seven ways to pay less per order.</p>

      <h2>Meesho Shipping Charges 2026 — Weight Slab Table</h2>
      <p>Meesho calculates forward shipping on your parcel's billable weight — the higher of dead weight or volumetric weight — and your delivery zone. Typical 2026 rate-card figures look like this (always verify your own card in the Supplier Panel, rates are revised periodically):</p>
      <table>
        <tr><th>Weight Slab</th><th>Local</th><th>Regional</th><th>National</th></tr>
        <tr><td>Under 500 g</td><td>₹40</td><td>₹50</td><td>₹60</td></tr>
        <tr><td>500 g – 1 kg</td><td>₹50</td><td>₹60</td><td>₹70</td></tr>
        <tr><td>1 – 2 kg</td><td>₹60</td><td>₹70</td><td>₹80</td></tr>
        <tr><td>Above 2 kg</td><td>₹70</td><td>₹80</td><td>₹90</td></tr>
      </table>
      <p>These Meesho shipping charges are per delivered order. A 400 g kurti going to a national zone costs about ₹60 to deliver; a 2 kg home product can cost ₹80–₹90. On a ₹300 product, shipping alone can be 20–30% of the selling price — which is why most "0% commission" products still lose money when priced carelessly.</p>

      <h2>The 18% GST on Shipping Charges</h2>
      <p>Meesho adds 18% GST on the shipping fee and deducts it from your settlement. A ₹60 national shipment actually costs you ₹60 + ₹10.80 GST = ₹70.80 out of pocket:</p>
      <table>
        <tr><th>Shipping Charge</th><th>GST @ 18%</th><th>Total Deduction</th></tr>
        <tr><td>₹40</td><td>₹7.20</td><td>₹47.20</td></tr>
        <tr><td>₹60</td><td>₹10.80</td><td>₹70.80</td></tr>
        <tr><td>₹90</td><td>₹16.20</td><td>₹106.20</td></tr>
      </table>
      <p>If you are GST-registered, you can claim the GST on Meesho shipping charges back as Input Tax Credit — effectively reducing your net cost. If you sell without GST registration, the full amount is a permanent cost, which is one more reason GST registration pays off once you cross a few hundred orders a month.</p>

      <h2>Volumetric Weight: The Hidden Slab Jumper</h2>
      <p>Couriers bill on whichever is greater: actual weight or volumetric weight (length × width × height ÷ 5000 for most partners). A lightweight but bulky product — pillows, lamps, toys — often jumps two slabs because of its box size. Before you finalise packaging, compute the volumetric weight of your packed parcel and compare it against the dead weight. Shaving 3 cm off a carton can drop a 2 kg-billed parcel back to the 1 kg slab and save ₹10–₹20 on every single order.</p>

      <h2>Return Shipping Charges vs Forward Shipping</h2>
      <p>Forward shipping is only half the picture. When a delivered order comes back as a customer return, you pay a reverse shipping fee that is roughly double the forward rate:</p>
      <table>
        <tr><th>Scenario</th><th>What you pay</th></tr>
        <tr><td>Forward delivery (500 g national)</td><td>₹60 + GST</td></tr>
        <tr><td>Customer return (500 g)</td><td>≈₹150–₹165 reverse shipping + GST</td></tr>
        <tr><td>Customer return (2–2.5 kg)</td><td>≈₹200–₹340 depending on assigned courier</td></tr>
        <tr><td>RTO (never delivered)</td><td>No separate reverse fee — but forward cost, packaging and blocked stock are lost</td></tr>
      </table>
      <p>This is why returns hurt more than most sellers expect: one customer return on a ₹350 kurti can wipe out the profit of two delivered orders. See our full breakdown in the <a href="/blog/meesho-rto-return-charges" data-sb-route="blog/meesho-rto-return-charges">Meesho RTO &amp; return charges guide</a>.</p>

      <h2>How to Check Your Exact Meesho Rate Card</h2>
      <ul>
        <li>Log in to the <strong>Meesho Supplier Panel</strong> and open the Payments / Charges section.</li>
        <li>Download the current rate card — slabs differ by courier partner (Valmo, Xpress Bees, Shadowfax, Delhivery).</li>
        <li>Check whether figures are shown inclusive or exclusive of 18% GST — it changes your real cost by ~₹27 on a 2 kg parcel.</li>
        <li>Re-check after every Meesho policy update; slabs get revised quietly.</li>
      </ul>

      <h2>7 Ways to Reduce Meesho Shipping Charges Per Order</h2>
      <ul>
        <li><strong>Stay under the slab line:</strong> 490 g bills as "under 500 g". Weigh your packed parcel, not the product.</li>
        <li><strong>Shrink the box:</strong> smaller cartons cut volumetric weight and slab jumps.</li>
        <li><strong>Lighten packaging:</strong> swap heavy bubble layers for polybags + honeycomb where safe.</li>
        <li><strong>Shift buyers to prepaid:</strong> prepaid orders also RTO less, cutting two-way cost.</li>
        <li><strong>Watch courier assignment:</strong> you cannot pick the courier, but tracking charge differences per courier exposes overcharges worth claiming.</li>
        <li><strong>Claim wrong charges:</strong> weight-discrepancy and duplicate shipping deductions are recoverable via Supplier Panel tickets.</li>
        <li><strong>Price with the real number:</strong> test every SKU in the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">Meesho profit calculator</a> with your actual slab + GST before listing.</li>
      </ul>

      <h2>Shipping Charges in the Profit Formula</h2>
      <table>
        <tr><th>Formula</th><th>Example (₹399 product, national zone)</th></tr>
        <tr><td>Selling Price</td><td>₹399</td></tr>
        <tr><td>− Product cost</td><td>−₹140</td></tr>
        <tr><td>− Shipping (₹60 + 18% GST)</td><td>−₹70.80</td></tr>
        <tr><td>− Return/RTO buffer (18% rate)</td><td>−₹25 approx</td></tr>
        <tr><td><strong>≈ Net profit per unit</strong></td><td><strong>₹163</strong></td></tr>
      </table>
      <p>Run your own numbers in the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">free Meesho profit calculator</a> — it applies shipping, GST, commission and your return rate in one shot.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>What are the Meesho shipping charges in 2026?</h3>
      <p>Forward shipping runs roughly ₹40–₹90 per order depending on weight slab (under 500 g to above 2 kg) and zone (local, regional, national). Heavy national shipments sit at the top of the range. Verify your exact slabs in the Supplier Panel rate card.</p>
      <h3>Does Meesho charge GST on shipping?</h3>
      <p>Yes — 18% GST applies on the shipping fee and is deducted from your settlement. GST-registered sellers can claim it back as Input Tax Credit.</p>
      <h3>Who pays return shipping on Meesho?</h3>
      <p>The seller pays reverse shipping on customer returns — typically ₹150–₹165 for parcels under 500 g and up to ₹340 at 2.5 kg. Pure RTO orders carry no separate reverse fee, but you still lose forward freight, packaging and stock time.</p>
      <h3>Why is my shipping charge higher than the rate card?</h3>
      <p>Common causes: volumetric weight pushing you up a slab, courier-specific surcharges, GST added on top, or a weight discrepancy recorded by the courier. Compare your settlement's per-order shipping against the rate card and dispute wrong deductions.</p>
      <h3>Is shipping free for Meesho sellers?</h3>
      <p>No. Buyers may see free or low delivery fees in the app, but the seller's account is charged the forward shipping fee plus GST on every order. "0% commission" refers to referral commission only — always include Meesho shipping charges in your pricing.</p>
    `
  },

  'meesho-tcs-tds-deductions': {
    slug: 'meesho-tcs-tds-deductions',
    title: 'Meesho TCS & TDS 2026 — Rates, GSTR-2B Claims & New Tax Act',
    headline: 'Meesho TCS & TDS Explained (2026): Rates, Claims & the New Tax Act',
    badge: 'Tax & Compliance Guide',
    subtitle: 'Meesho TCS and TDS decoded — 1% GST TCS under Section 52, TDS moving to Section 393 of the Income-tax Act 2025, where each credit appears, and the monthly routine to claim every rupee back.',
    date: 'October 5, 2026',
    readTime: '8 min read',
    render: () => `
      <p>Two mysterious lines shrink almost every Meesho settlement: <strong>TCS</strong> and <strong>TDS</strong>. Most sellers treat them as costs — and that mistake quietly overstates their expenses and loses them money at filing time. The truth: TCS and TDS on Meesho are <em>withholdings</em>, not costs. They are deducted from your payout, but they come back as tax credits if you reconcile and claim them properly. This guide explains both, including the 2026 change that moved TDS to the new Income-tax Act.</p>

      <h2>What Is TCS on Meesho?</h2>
      <p>TCS (Tax Collected at Source) is GST that Meesho must collect on the net taxable value of the supplies it facilitates, under <strong>Section 52 of the CGST Act</strong>:</p>
      <ul>
        <li><strong>Rate:</strong> 1% of net taxable value — 0.5% CGST + 0.5% SGST for intra-state sales, 1% IGST for inter-state.</li>
        <li><strong>Where it is deducted:</strong> straight from your settlement every cycle.</li>
        <li><strong>Where it lands for you:</strong> Meesho files <strong>GSTR-8</strong> by the 10th of the following month; the credit then appears in your <strong>GSTR-2B</strong> and your GST cash ledger as TCS credit.</li>
        <li><strong>How you claim it:</strong> offset it against your GST liability when filing <strong>GSTR-3B</strong>.</li>
      </ul>
      <p>It also shows in <strong>Form 26AS Part F</strong> for cross-verification. If a TCS amount never appears in GSTR-2B, do not claim it — a credit Meesho later reverses becomes excess ITC and triggers a mismatch notice.</p>

      <h2>What Is TDS on Meesho? (And the 2026 Change)</h2>
      <p>TDS (Tax Deducted at Source) is income-tax withheld on your gross sales by the e-commerce operator:</p>
      <table>
        <tr><th>Period</th><th>Rule</th><th>Rate & Section</th></tr>
        <tr><td>Up to 31 March 2026</td><td>Income-tax Act, 1961</td><td>0.1% under Section 194-O</td></tr>
        <tr><td>On or after 1 April 2026</td><td>Income-tax Act, 2025</td><td>Section 393 (check current table item & threshold)</td></tr>
      </table>
      <p>The transition rule is simple: whichever event happens <em>earlier</em> — credit or payment — decides which Act applies. Because 1 April 2026 started a new fiscal year, your FY 2026-27 settlements reference the new Act's provisions. The practical consequences: section numbers in statements change, but the mechanics stay the same — Meesho withholds, reports it against your PAN, and you claim it as credit against your income-tax liability. Verify the deducted amount against <strong>Form 26AS / AIS</strong> each quarter instead of assuming the old 0.1% automatically.</p>

      <h2>TCS on Meesho Returns: The Timing Trap</h2>
      <p>TCS is deducted on the original sale. When an order is later returned, three timelines come into play:</p>
      <table>
        <tr><th>Event</th><th>Where it appears</th><th>When</th></tr>
        <tr><td>Original TCS deducted</td><td>Settlement → GSTR-2B</td><td>Sale cycle</td></tr>
        <tr><td>Return processed</td><td>Settlement (negative line)</td><td>Return cycle</td></tr>
        <tr><td>TCS reversal</td><td>Revised GSTR-8 → GSTR-2B</td><td>A later month</td></tr>
      </table>
      <p>In high-return categories (30–40% in fashion), sellers who claimed every TCS credit as it appeared — without waiting for return reversals — end up with excess ITC. Track TCS <em>and</em> its reversals across periods, and reconcile against the settlement statement before filing GSTR-3B.</p>

      <h2>Worked Example: What Leaves, What Comes Back</h2>
      <table>
        <tr><th>Item</th><th>Amount</th></tr>
        <tr><td>Gross sales (100 orders × ₹499)</td><td>₹49,900</td></tr>
        <tr><td>GST TCS @ 1% (deducted)</td><td>−₹499</td></tr>
        <tr><td>TDS (deducted, ~0.1%)</td><td>−₹49.90</td></tr>
        <tr><td>Shipping + GST (deducted)</td><td>−₹7,080</td></tr>
        <tr><td>20 customer returns (reverse fee)</td><td>−₹3,200</td></tr>
        <tr><td><strong>Settlement received</strong></td><td><strong>≈₹39,071</strong></td></tr>
        <tr><td>TCS + TDS recoverable later as credits</td><td>₹548.90 (not a cost)</td></tr>
      </table>
      <p>Notice what changed: your real operating costs are shipping and returns — ₹10,280. The TCS/TDS line of ₹548.90 is your own money parked with the government, recoverable through filings. Sellers who treat it as a cost overstate expenses by that amount every single month.</p>

      <h2>Monthly Reconciliation Routine (30 Minutes)</h2>
      <ul>
        <li><strong>Export</strong> the payment/settlement report and note the TCS and TDS columns per cycle.</li>
        <li><strong>Match</strong> TCS against your GSTR-2B entries for the period Meesho filed GSTR-8.</li>
        <li><strong>Check reversals</strong> for returned orders — wait for the revised GSTR-8 before claiming those credits.</li>
        <li><strong>Match TDS</strong> against Form 26AS / AIS quarterly; chase differences with Meesho support early.</li>
        <li><strong>File</strong> GSTR-3B claiming only the TCS that survived return reversals; carry the rest forward.</li>
      </ul>

      <h2>Common Meesho TCS/TDS Mistakes to Avoid</h2>
      <ul>
        <li>Booking TCS and TDS as business expenses — they are recoverable withholdings.</li>
        <li>Claiming TCS before checking that returns did not reverse part of it in a later GSTR-8.</li>
        <li>Using "0.1% TDS" blindly after 1 April 2026 — verify against the new Act's Section 393 table and your AIS.</li>
        <li>Ignoring small mismatches: unresolved differences compound into assessment notices.</li>
        <li>Doing it all in spreadsheets — the <a href="/dashboard" data-sb-route="dashboard">FC Analytics dashboard</a> imports your Meesho payment Excel and separates every deduction automatically.</li>
      </ul>
      <p>For the deduction lines that <em>are</em> real costs, see the <a href="/blog/meesho-shipping-charges-2026" data-sb-route="blog/meesho-shipping-charges-2026">Meesho shipping charges guide</a> and the <a href="/blog/meesho-rto-return-charges" data-sb-route="blog/meesho-rto-return-charges">RTO &amp; return charges breakdown</a>.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Does Meesho deduct TCS from payments?</h3>
      <p>Yes. Meesho collects 1% GST TCS under Section 52 (0.5% CGST + 0.5% SGST or 1% IGST) on the net taxable value of your sales and deducts it from every settlement.</p>
      <h3>What is the TDS rate on Meesho payments?</h3>
      <p>Through 31 March 2026 it was 0.1% under Section 194-O of the Income-tax Act, 1961. From 1 April 2026, TDS on e-commerce operators is governed by Section 393 of the Income-tax Act, 2025 — verify the current rate and threshold in your Form 26AS/AIS.</p>
      <h3>How do I claim TCS deducted by Meesho?</h3>
      <p>Wait for Meesho's GSTR-8 filing (by the 10th of the next month), confirm the credit in your GSTR-2B/cash ledger, then claim it in GSTR-3B. For returns, wait for the TCS reversal before claiming that portion.</p>
      <h3>Is TCS a cost of selling on Meesho?</h3>
      <p>No. TCS and TDS are advance tax credits in your own name. Only unreconciled, unclaimed amounts become real losses — which is why a monthly reconciliation habit matters.</p>
      <h3>Why is my Meesho settlement lower than my sales?</h3>
      <p>Settlements subtract shipping (+18% GST), return shipping, TCS and TDS. TCS/TDS come back as credits; shipping and returns are real costs. Reconcile line by line or import the payment file into the FC Analytics dashboard to see true per-SKU profit.</p>
    `
  },

  'meesho-payment-reconciliation': {
    slug: 'meesho-payment-reconciliation',
    title: 'Meesho Payment Reconciliation Guide 2026 — Match Every Rupee',
    headline: 'Meesho Payment Reconciliation: Match Orders to Bank Credits (2026)',
    badge: 'Payouts & Reconciliation Guide',
    subtitle: 'Meesho payment reconciliation step by step — match sub-orders to payment events and bank credits, catch missing payouts, decode negative settlements and verify TCS/TDS without spreadsheets.',
    date: 'October 5, 2026',
    readTime: '8 min read',
    render: () => `
      <p>Your Meesho settlement lands, and the number feels wrong. Too low, late, or missing entirely. Before you raise a support ticket, you need <strong>Meesho payment reconciliation</strong>: the discipline of matching every distinct order to its payment events and the actual bank credit. Sellers who reconcile weekly catch wrong shipping deductions, lost RTO parcels and missing payouts within days — sellers who do not, donate thousands of rupees a year to nobody.</p>

      <h2>The Three Records You Must Reconcile</h2>
      <p>Meesho payment problems almost always come from confusing three different records:</p>
      <table>
        <tr><th>Record</th><th>What it is</th><th>What it is NOT</th></tr>
        <tr><td>Supplier Panel "future payment"</td><td>Scheduled payout estimate</td><td>Not money in the bank</td></tr>
        <tr><td>Payment report (Excel/CSV)</td><td>Per-order payment events and deductions</td><td>Not proof of bank receipt</td></tr>
        <tr><td>Bank credit</td><td>The actual payout, possibly grouping many orders</td><td>Not itemised — needs matching</td></tr>
      </table>
      <p>Only the bank credit is money. The other two are claims about money — and reconciliation is how you verify the chain from order → report → bank.</p>

      <h2>How the Meesho Payment Cycle Works</h2>
      <p>Meesho settles on a delivery-anchored cycle: payment for a non-return order lands roughly a week after <em>delivery</em>, not dispatch. Deductions (shipping + GST, TCS, TDS, return fees, ads) are netted inside the settlement. Two consequences:</p>
      <ul>
        <li><strong>Returns delay payouts:</strong> a returns spike this week becomes a payout dip two cycles later — do not mistake it for a sales drop.</li>
        <li><strong>The headline number lies:</strong> order-level errors (wrong weights, duplicate charges, missing orders) only surface when you match lines to orders.</li>
      </ul>

      <h2>Meesho Payment Reconciliation: Step by Step</h2>
      <h3>Step 1 — Export orders and payments for one account</h3>
      <p>Pick one seller account and a date range covering the order period plus later payment and return events. Download the order report and the payment report from the Supplier Panel.</p>
      <h3>Step 2 — Count sub-orders once</h3>
      <p>Orders and payments exports repeat rows as an order moves through its lifecycle. Count each <strong>distinct sub-order ID</strong> once — repeated status rows are events, not extra sales.</p>
      <h3>Step 3 — Match payment events by sub-order</h3>
      <p>Join every payment row to its sub-order. Keep the sign (debits are negative). Keep legitimate later adjustments — returns, compensation, corrections — instead of keeping only the first row you see.</p>
      <h3>Step 4 — Classify outcomes</h3>
      <p>Separate delivered, customer-return and RTO orders. Check returned inventory actually arrived. RTO and customer returns have different fee treatments — mixing them hides recoverable money.</p>
      <h3>Step 5 — Match the payout to the bank</h3>
      <p>Find the payout reference in the payment report, then match the amount to your bank statement. One bank transfer can cover many sub-orders; the total must reconcile to the rupee.</p>

      <h2>Four Exceptions That Hide Missing Money</h2>
      <table>
        <tr><th>Exception</th><th>First check</th><th>Evidence to keep</th></tr>
        <tr><td>Delivered, but no payment row</td><td>Delivery date, future-payment view, later report windows</td><td>Sub-order ID, delivery proof</td></tr>
        <tr><td>Payment row, but no order row</td><td>Other seller account, earlier export</td><td>Raw row + source file name</td></tr>
        <tr><td>Return marked complete, parcel never arrived</td><td>Tracking, warehouse receipt log</td><td>Return status, tracking, handover records</td></tr>
        <tr><td>Bank amount differs from report</td><td>Payout grouping, signed adjustments</td><td>Payment rows, payout reference, bank entry</td></tr>
      </table>
      <p>When records still disagree after checking these, raise the query through the Supplier Panel with the sub-order ID, expected vs observed events, and attached proof. Save the ticket ID — and re-verify the actual payment report and bank record after "resolution", because a support reply is not a bank deposit.</p>

      <h2>Negative Settlements: Why Meesho Can Pay You ₹0</h2>
      <p>In fashion and lifestyle categories, return rates of 30–40% are common. A week with heavy sales followed by a wave of returns can produce a settlement where return deductions exceed forward sales. Meesho does not debit your bank account — the negative balance carries forward and nets against your next positive settlement. Account for it as a receivable reduction, not a current-period expense, and watch for the classic trap: TCS already deducted on the original sales still needs reversing via GSTR-8 (see the <a href="/blog/meesho-tcs-tds-deductions" data-sb-route="blog/meesho-tcs-tds-deductions">TCS &amp; TDS guide</a>).</p>

      <h2>Deductions That Are Real Costs vs Recoverable</h2>
      <table>
        <tr><th>Deduction line</th><th>Nature</th></tr>
        <tr><td>Forward shipping + 18% GST</td><td>Real cost (GST part claimable as ITC if registered)</td></tr>
        <tr><td>Customer return shipping</td><td>Real cost — but wrong weights/duplicates are claimable</td></tr>
        <tr><td>GST TCS (1%)</td><td>Recoverable credit via GSTR-2B</td></tr>
        <tr><td>Income-tax TDS</td><td>Recoverable credit via 26AS/AIS</td></tr>
        <tr><td>RTO reverse fee on never-delivered orders</td><td>Often wrongly charged — pure RTOs should not carry a reverse fee; dispute it</td></tr>
      </table>

      <h2>Automate the Whole Reconciliation</h2>
      <p>Manual Meesho payment reconciliation in spreadsheets takes hours and still misses duplicate rows. The <a href="/dashboard" data-sb-route="dashboard">FC Analytics dashboard</a> does it in one upload: import your Meesho payment Excel and it separates shipping, GST, TCS, TDS, returns and RTO per order, then computes true per-SKU profit after every deduction — so your next pricing decision uses bank-truth numbers, not guesses. Pair it with the <a href="/meesho-profit-calculator" data-sb-route="meesho-profit-calculator">profit calculator</a> for forward pricing on new SKUs.</p>

      <h2>Frequently Asked Questions</h2>
      <h3>Why is my Meesho payment late?</h3>
      <p>Payments are delivery-anchored — roughly a week after delivery, longer if the order was returned or the settlement period closed near a weekend. Check the future-payment view first; only treat it as missing if the payment report shows a settled order with no payout reference and no bank credit after the cycle.</p>
      <h3>Why is my Meesho settlement less than my sales?</h3>
      <p>The settlement subtracts forward shipping + 18% GST, customer-return fees, TCS (1%), TDS and any ads spend. TCS and TDS return as tax credits; shipping and returns are real costs. Reconcile line by line to see which deductions are wrong.</p>
      <h3>What is a negative Meesho settlement?</h3>
      <p>When return deductions in a cycle exceed forward sales, the balance goes negative — common in fashion with 30–40% return rates. Meesho carries it forward against your next settlement instead of debiting your bank account.</p>
      <h3>How do I verify Meesho actually paid me?</h3>
      <p>Match the payout reference and amount from the payment report to an actual bank credit. A panel status or report row alone is not proof. Keep the bank statement line as your final evidence.</p>
      <h3>How do I track Meesho payments per SKU?</h3>
      <p>Import your payment Excel into the FC Analytics dashboard — it reconciles deductions per order and shows net profit per SKU, per month, with returns and RTO separated automatically.</p>
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
