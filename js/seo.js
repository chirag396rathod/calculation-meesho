/**
 * ══════════════════════════════════════════════════════════════════════
 * PER-ROUTE SEO MANAGER
 * Updates <title>, meta description, canonical, Open Graph tags, robots
 * directives and route-level JSON-LD (BreadcrumbList) on every SPA route
 * change. Hooked into navigateTo() in landing.js.
 * ══════════════════════════════════════════════════════════════════════
 */

const SITE_URL = 'https://sellermarginmeesho.vercel.app';
const BRAND = 'FC Analytics';

function titleSuffix() {
  return ` | ${BRAND}`;
}

/**
 * Canonical route keys → metadata.
 * titles kept ≤ 65 chars, descriptions ≤ 165 chars.
 */
export const ROUTE_META = {
  home: {
    title: `Free Meesho Label Crop & Sort Tool + Profit Calculator${titleSuffix()}`,
    description: 'Free Meesho label crop & sort tool — remove invoices, sort by SKU or courier, print 4×6 thermal labels. Plus Meesho profit calculator with RTO, GST & settlement. No signup.',
    path: '/'
  },
  'meesho-profit-calculator': {
    title: `Free Meesho Profit Calculator 2026 – Profit, GST, RTO & Margin${titleSuffix()}`,
    description: 'Free Meesho profit calculator for sellers. Calculate net profit, margin, GST, shipping, commission and RTO loss instantly — plus the recommended selling price to list at. No signup.',
    path: '/meesho-profit-calculator',
    breadcrumb: [
      ['Home', '/'],
      ['Meesho Profit Calculator', null]
    ],
    breadcrumb: [
      ['Home', '/'],
      ['Meesho Profit Calculator', null]
    ],
    schemas: [
      {
        '@type': 'SoftwareApplication',
        'name': 'Meesho Profit Calculator 2026',
        'applicationCategory': 'FinanceApplication',
        'operatingSystem': 'Web',
        'url': `${SITE_URL}/meesho-profit-calculator`,
        'description': 'Free Meesho profit calculator for sellers. Calculate net profit, margin, GST, shipping, commission and RTO loss instantly, plus the recommended selling price to list at.',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Is the Meesho profit calculator free?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — 100% free with no signup. All calculations run locally in your browser.' }
          },
          {
            '@type': 'Question',
            'name': 'How is Meesho profit calculated?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Net profit = selling price − product cost − shipping − commission − GST on fees − expected RTO/return losses. The calculator shows each deduction separately.' }
          },
          {
            '@type': 'Question',
            'name': 'Does Meesho charge commission?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Meesho charges 0% referral commission on most categories, but shipping fees and 18% GST on those fees still apply — include them in pricing.' }
          },
          {
            '@type': 'Question',
            'name': 'Does Meesho charge for returns or RTO?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. Undelivered/RTO orders can cost forward shipping, packaging and reverse logistics. Enter an expected RTO rate to protect your margin.' }
          },
          {
            '@type': 'Question',
            'name': 'What is a good profit margin on Meesho?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Most healthy Meesho products run a 20–35% net margin after all deductions. Below 15%, returns and ad spend can quickly wipe you out.' }
          },
          {
            '@type': 'Question',
            'name': 'Can I sell on Meesho without GST?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'GST registration is mandatory for Meesho suppliers. If you are GST-registered, you can offset part of the fee GST through Input Tax Credit.' }
          },
          {
            '@type': 'Question',
            'name': 'Is selling on Meesho profitable in 2026?',
            'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes, if you price wisely. Most sellers lose money by underpricing or ignoring deductions — calculate real net profit per unit before listing.' }
          }
        ]
      }
    ]
  },
  'labels/meesho': {
    title: `Free Meesho Label Crop & Sort Tool — 4×6 Thermal PDF${titleSuffix()}`,
    description: 'Crop Meesho shipping labels online free — remove the tax invoice, sort by SKU or courier (Xpress Bees, Valmo, Shadowfax), add QR codes & download 4×6 thermal-ready PDFs. No signup, 100% private.',
    path: '/labels/meesho',
    breadcrumb: [
      ['Home', '/'],
      ['Label Tools', '/labels'],
      ['Meesho Label Crop & Sort', null]
    ]
  },
  'labels/flipkart': {
    title: `Free Flipkart Label Crop Tool — 3×5 Thermal PDF${titleSuffix()}`,
    description: 'Crop Flipkart shipping labels online free — remove the tax invoice section, sort by SKU or courier (Ekart, Delhivery, Shadowfax) and download 3×5 thermal-ready PDFs. No signup.',
    path: '/labels/flipkart',
    breadcrumb: [
      ['Home', '/'],
      ['Label Tools', '/labels'],
      ['Flipkart Label Crop', null]
    ]
  },
  labels: {
    title: `Shipping Label Sort & Crop Tool — Meesho & Flipkart${titleSuffix()}`,
    description: 'Free marketplace shipping label tools — crop invoices, trim to 4×6 thermal or A4, and sort label PDFs by SKU or courier partner for Meesho, Flipkart and Amazon. 100% browser-based.',
    path: '/labels',
    breadcrumb: [
      ['Home', '/'],
      ['Label Tools', null]
    ]
  },
  blog: {
    title: `Blog — Meesho Seller Guides & Label Tutorials${titleSuffix()}`,
    description: 'Free Meesho seller guides — crop & sort shipping labels, master the profit formula with GST and RTO, and dispatch faster. Practical playbooks updated for 2026.',
    path: '/blog',
    breadcrumb: [['Home', '/'], ['Blog', null]]
  },
  'blog/how-to-crop-meesho-label': {
    title: `How to Crop Meesho Labels & Remove Invoice — Free${titleSuffix()}`,
    description: 'Learn how to crop Meesho shipping labels online free — remove the tax invoice, trim to 4×4 thermal size and print clean scannable labels in under 2 minutes.',
    path: '/blog/how-to-crop-meesho-label',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Crop Meesho Labels', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'How to Crop Meesho Shipping Labels & Remove the Tax Invoice (Free, 2026)',
        'description': 'Step-by-step guide to crop Meesho shipping labels online — remove the tax invoice section, trim to 4×4 thermal size, and print clean labels in under 2 minutes.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/how-to-crop-meesho-label'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'Is cropping Meesho labels allowed?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. The invoice is for your accounting; the courier only needs the shipping label with the barcode and address. Cropping the invoice from your printed copy is standard practice.' } },
          { '@type': 'Question', 'name': 'Does the tool upload my labels to a server?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'No. All cropping and PDF generation happens locally in your browser. Files never leave your device.' } },
          { '@type': 'Question', 'name': 'Can I crop labels from multiple Meesho accounts at once?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes, upload several PDFs in one batch, then sort by SKU or courier before generating the final file.' } },
          { '@type': 'Question', 'name': 'Is the Meesho label cropper free?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — 100% free with no signup.' } }
        ]
      }
    ]
  },
  'blog/meesho-profit-calculator-formula': {
    title: `Meesho Profit Calculator Formula & Net Margin 2026${titleSuffix()}`,
    description: 'The exact Meesho profit formula — selling price minus shipping, 18% GST, commission and RTO losses. Worked examples plus a free calculator to test any SKU instantly.',
    path: '/blog/meesho-profit-calculator-formula',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Meesho Profit Formula', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'Meesho Profit Calculator Formula: GST, RTO & Real Net Margin (2026)',
        'description': 'The exact Meesho profit formula sellers use — with worked examples and a free calculator to check any SKU instantly.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/meesho-profit-calculator-formula'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'What is the Meesho profit formula?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Net Profit = Selling Price − Product Cost − Shipping − Commission − GST on fees − expected RTO/return losses.' } },
          { '@type': 'Question', 'name': 'Does Meesho charge commission in 2026?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Meesho charges 0% referral commission on most categories, but 18% GST on shipping and fee components still applies to every order.' } },
          { '@type': 'Question', 'name': 'How much does one Meesho return cost?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Typically ₹140–₹170 in return shipping plus packaging, and the product cost if it comes back damaged.' } },
          { '@type': 'Question', 'name': 'Is the profit calculator free?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — 100% free, no signup, and runs entirely in your browser.' } }
        ]
      }
    ]
  },
  'blog/meesho-rto-return-charges': {
    title: `Meesho RTO & Return Charges — Real Cost Per Return${titleSuffix()}`,
    description: 'Exact Meesho RTO and customer-return charges explained — forward freight, reverse shipping, packaging loss. Learn your break-even return rate before returns eat your margin.',
    path: '/blog/meesho-rto-return-charges',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Meesho RTO & Return Charges', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'Meesho RTO & Return Charges: What Each Return Really Costs Sellers (2026)',
        'description': 'Every Meesho RTO and return charge broken down — with a worked example and the break-even return rate formula.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/meesho-rto-return-charges'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'Does Meesho charge for RTO orders?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Meesho states RTOs do not carry a separate return shipping fee, but you still lose forward freight and packaging on every RTO.' } },
          { '@type': 'Question', 'name': 'What is the customer return shipping fee on Meesho?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Return shipping is weight-based, typically ₹140–₹170 for lightweight products including taxes.' } },
          { '@type': 'Question', 'name': 'What return rate is safe on Meesho?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Compute your break-even rate; most sellers treat anything above 25–30% on a SKU as a stop signal.' } },
          { '@type': 'Question', 'name': 'How do I track returns per SKU?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Upload your Meesho payment report to the FC Analytics dashboard for per-SKU return and RTO analytics.' } }
        ]
      }
    ]
  },
  'blog/sort-meesho-labels-by-sku-courier': {
    title: `How to Sort Meesho Labels by SKU & Courier Partner${titleSuffix()}`,
    description: 'Sort Meesho label PDFs by SKU or courier partner (Xpress Bees, Valmo, Shadowfax, Delhivery) before printing — pack faster and stop pick errors. Free tool, no signup.',
    path: '/blog/sort-meesho-labels-by-sku-courier',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Sort Meesho Labels', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'How to Sort Meesho Labels by SKU & Courier Partner Before Packing (2026)',
        'description': 'Sort Meesho shipping label PDFs by SKU or courier partner before printing — pack faster, hand over courier batches instantly, and stop pick errors.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/sort-meesho-labels-by-sku-courier'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'Which couriers are auto-detected?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Xpress Bees, Valmo, Shadowfax, Delhivery, Ecom Express, Bluedart and DTDC are recognised and grouped automatically from the label PDF text.' } },
          { '@type': 'Question', 'name': 'Can I sort labels from multiple Meesho accounts together?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — upload all PDFs in one batch and the tool merges, sorts and exports a single consolidated file.' } },
          { '@type': 'Question', 'name': 'Does sorting change the label content?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'No. Pages are only reordered; barcodes and addresses stay untouched.' } },
          { '@type': 'Question', 'name': 'Is the sorting tool free?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — 100% free, no signup, and processes everything locally in your browser.' } }
        ]
      }
    ]
  },
  'blog/meesho-shipping-charges-2026': {
    title: `Meesho Shipping Charges 2026 — Weight Slabs, GST & Rate Card${titleSuffix()}`,
    description: 'Meesho shipping charges for 2026 explained — forward shipping by weight slab, 18% GST on shipping, return shipping fees and 7 ways to cut logistics cost per order. Free guide.',
    path: '/blog/meesho-shipping-charges-2026',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Meesho Shipping Charges 2026', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'Meesho Shipping Charges 2026: Weight Slabs, GST & Real Rate Card',
        'description': 'The complete Meesho shipping charges breakdown for 2026 — weight-slab rates by zone, the 18% GST treatment, volumetric weight traps, return shipping fees and seven ways to pay less per order.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/meesho-shipping-charges-2026'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'What are the Meesho shipping charges in 2026?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Forward shipping runs roughly ₹40–₹90 per order depending on weight slab (under 500 g to above 2 kg) and zone (local, regional, national). Verify your exact slabs in the Supplier Panel rate card.' } },
          { '@type': 'Question', 'name': 'Does Meesho charge GST on shipping?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes — 18% GST applies on the shipping fee and is deducted from your settlement. GST-registered sellers can claim it back as Input Tax Credit.' } },
          { '@type': 'Question', 'name': 'Who pays return shipping on Meesho?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'The seller pays reverse shipping on customer returns — typically ₹150–₹165 for parcels under 500 g and up to ₹340 at 2.5 kg. Pure RTO orders carry no separate reverse fee, but forward freight, packaging and stock time are still lost.' } },
          { '@type': 'Question', 'name': 'Why is my shipping charge higher than the rate card?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Common causes: volumetric weight pushing you up a slab, courier-specific surcharges, 18% GST added on top, or a courier-recorded weight discrepancy. Compare per-order shipping against the rate card and dispute wrong deductions.' } },
          { '@type': 'Question', 'name': 'Is shipping free for Meesho sellers?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'No. Buyers may see free delivery in the app, but the seller account is charged forward shipping plus GST on every order. 0% commission refers to referral commission only.' } }
        ]
      }
    ]
  },
  'blog/meesho-tcs-tds-deductions': {
    title: `Meesho TCS & TDS 2026 — Rates, GSTR-2B Claims & New Tax Act${titleSuffix()}`,
    description: 'Meesho TCS and TDS explained — 1% GST TCS under Section 52, TDS under Section 393 of the Income-tax Act 2025, GSTR-2B claiming steps and why they are credits, not costs.',
    path: '/blog/meesho-tcs-tds-deductions',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Meesho TCS & TDS Guide', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'Meesho TCS & TDS Explained (2026): Rates, Claims & the New Tax Act',
        'description': 'How Meesho TCS and TDS actually work in 2026 — the 1% GST TCS under Section 52, the TDS transition to Section 393 of the Income-tax Act 2025, and the monthly routine to claim every rupee back.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/meesho-tcs-tds-deductions'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'Does Meesho deduct TCS from payments?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. Meesho collects 1% GST TCS under Section 52 (0.5% CGST + 0.5% SGST or 1% IGST) on the net taxable value of your sales and deducts it from every settlement.' } },
          { '@type': 'Question', 'name': 'What is the TDS rate on Meesho payments?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Through 31 March 2026 it was 0.1% under Section 194-O of the Income-tax Act, 1961. From 1 April 2026, TDS on e-commerce operators is governed by Section 393 of the Income-tax Act, 2025 — verify the current rate in Form 26AS/AIS.' } },
          { '@type': 'Question', 'name': 'How do I claim TCS deducted by Meesho?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Wait for Meesho\u2019s GSTR-8 filing (by the 10th of the next month), confirm the credit in your GSTR-2B/cash ledger, then claim it in GSTR-3B. For returned orders, wait for the TCS reversal before claiming that portion.' } },
          { '@type': 'Question', 'name': 'Is TCS a cost of selling on Meesho?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'No. TCS and TDS are advance tax credits in your own name. Only unreconciled, unclaimed amounts become real losses.' } },
          { '@type': 'Question', 'name': 'Why is my Meesho settlement lower than my sales?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Settlements subtract shipping (+18% GST), return shipping, TCS and TDS. TCS/TDS come back as credits; shipping and returns are real costs. Reconcile line by line to spot wrong deductions.' } }
        ]
      }
    ]
  },
  'blog/meesho-payment-reconciliation': {
    title: `Meesho Payment Reconciliation Guide 2026 — Match Every Rupee${titleSuffix()}`,
    description: 'Meesho payment reconciliation step by step — match sub-orders to payment events and bank credits, catch missing payouts, decode negative settlements and verify TCS/TDS. Free guide.',
    path: '/blog/meesho-payment-reconciliation',
    breadcrumb: [['Home', '/'], ['Blog', '/blog'], ['Meesho Payment Reconciliation', null]],
    schemas: [
      {
        '@type': 'Article',
        'headline': 'Meesho Payment Reconciliation: Match Orders to Bank Credits (2026)',
        'description': 'The complete Meesho payment reconciliation workflow — three records to match, the delivery-anchored payment cycle, four exceptions that hide missing money, and how to decode negative settlements.',
        'inLanguage': 'en-IN',
        'author': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'publisher': { '@id': 'https://sellermarginmeesho.vercel.app/#organization' },
        'mainEntityOfPage': 'https://sellermarginmeesho.vercel.app/blog/meesho-payment-reconciliation'
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'Why is my Meesho payment late?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Payments are delivery-anchored — roughly a week after delivery, longer for returned orders. Check the future-payment view first; only treat it as missing if the payment report shows a settled order with no payout reference and no bank credit after the cycle.' } },
          { '@type': 'Question', 'name': 'Why is my Meesho settlement less than my sales?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'The settlement subtracts forward shipping + 18% GST, customer-return fees, TCS (1%), TDS and ads spend. TCS and TDS return as tax credits; shipping and returns are real costs.' } },
          { '@type': 'Question', 'name': 'What is a negative Meesho settlement?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'When return deductions in a cycle exceed forward sales, the balance goes negative — common in fashion with 30–40% return rates. Meesho carries it forward against your next settlement instead of debiting your bank.' } },
          { '@type': 'Question', 'name': 'How do I verify Meesho actually paid me?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Match the payout reference and amount from the payment report to an actual bank credit. A panel status or report row alone is not proof of payment.' } },
          { '@type': 'Question', 'name': 'How do I track Meesho payments per SKU?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'Import your payment Excel into the FC Analytics dashboard — it reconciles deductions per order and shows net profit per SKU with returns and RTO separated automatically.' } }
        ]
      }
    ]
  },
  about: {
    title: `About Us — Free Tools for Indian Marketplace Sellers${titleSuffix()}`,
    description: 'Learn about FC Analytics — a free, privacy-first toolkit helping Meesho, Flipkart and Amazon sellers crop labels, track profits and reconcile settlements.',
    path: '/about',
    breadcrumb: [['Home', '/'], ['About Us', null]]
  },
  contact: {
    title: `Contact Us — Seller Support${titleSuffix()}`,
    description: 'Get help with Meesho label cropping, profit tracking or your FC Analytics account. Reach our seller support team on WhatsApp.',
    path: '/contact',
    breadcrumb: [['Home', '/'], ['Contact Us', null]]
  },
  privacy: {
    title: `Privacy Policy${titleSuffix()}`,
    description: 'How FC Analytics handles your data — all label and payment file processing happens locally in your browser. Read our full privacy policy.',
    path: '/privacy',
    breadcrumb: [['Home', '/'], ['Privacy Policy', null]]
  },
  terms: {
    title: `Terms & Conditions${titleSuffix()}`,
    description: 'Terms and conditions for using FC Analytics free Meesho seller tools, label crop & sort utilities and the business analytics dashboard.',
    path: '/terms',
    breadcrumb: [['Home', '/'], ['Terms & Conditions', null]]
  },
  cookies: {
    title: `Cookie Policy${titleSuffix()}`,
    description: 'How FC Analytics uses cookies and local storage to keep you signed in and remember your dashboard preferences.',
    path: '/cookies',
    breadcrumb: [['Home', '/'], ['Cookie Policy', null]]
  },
  disclaimer: {
    title: `Disclaimer${titleSuffix()}`,
    description: 'FC Analytics provides free seller tools for Meesho, Flipkart and Amazon. Calculator results are estimates — verify charges in your marketplace seller panel.',
    path: '/disclaimer',
    breadcrumb: [['Home', '/'], ['Disclaimer', null]]
  },
  login: {
    title: `Login — Seller Dashboard Access${titleSuffix()}`,
    description: 'Log in to your FC Analytics seller dashboard with OTP — orders, SKU profits, returns and label tools in one workspace.',
    path: '/login',
    robots: 'noindex, follow'
  },
  dashboard: {
    title: `Business Dashboard${titleSuffix()}`,
    description: 'Your private FC Analytics workspace — SKU profit analytics, return charges, monthly sessions and label tools.',
    path: '/dashboard',
    robots: 'noindex, nofollow'
  }
};

/** Alias routes (as passed to navigateTo) → canonical ROUTE_META keys */
const ROUTE_ALIASES = {
  home: 'home',
  '': 'home',
  'profit-calculator': 'meesho-profit-calculator',
  'meesho-profit-calculator': 'meesho-profit-calculator',
  'label-sort': 'labels/meesho',
  labels: 'labels',
  'label-sort-crop': 'labels',
  'label-sort-crop/meesho': 'labels/meesho',
  'label-sort-crop-meesho': 'labels/meesho',
  'labels/meesho': 'labels/meesho',
  'label-sort-crop/flipkart': 'labels/flipkart',
  'label-sort-crop-flipkart': 'labels/flipkart',
  'labels/flipkart': 'labels/flipkart',
  'about-us': 'about',
  about: 'about',
  'privacy-policy': 'privacy',
  privacy: 'privacy',
  terms: 'terms',
  'terms-and-conditions': 'terms',
  'terms-conditions': 'terms',
  cookies: 'cookies',
  'cookie-policy': 'cookies',
  disclaimer: 'disclaimer',
  contact: 'contact',
  'contact-us': 'contact',
  login: 'login',
  signin: 'login',
  dashboard: 'dashboard',
  app: 'dashboard'
};

Object.keys(ROUTE_META).forEach(key => {
  if (ROUTE_ALIASES[key] === undefined) ROUTE_ALIASES[key] = key;
});

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, type, name] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (type === 'name') el.setAttribute('name', name);
    if (type === 'property') el.setAttribute('property', name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setRouteJsonLd(schemas) {
  let el = document.getElementById('fc-route-schema');
  if (!schemas || !schemas.length) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'fc-route-schema';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(
    schemas.length === 1 ? schemas[0] : { '@context': 'https://schema.org', '@graph': schemas }
  );
}

/**
 * Apply route metadata. Call on every navigation.
 * @param {string} route - route key as used by navigateTo()
 */
export function applySeo(route) {
  const key = ROUTE_ALIASES[route] !== undefined ? ROUTE_ALIASES[route] : 'home';
  const meta = ROUTE_META[key] || ROUTE_META.home;

  document.title = meta.title;
  setMeta('meta[name="description"]', 'content', meta.description);
  setLink('canonical', SITE_URL + meta.path);
  setMeta('meta[property="og:title"]', 'content', meta.title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:url"]', 'content', SITE_URL + meta.path);
  setMeta('meta[name="robots"]', 'content', meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  if (meta.breadcrumb || meta.schemas) {
    const schemas = [];
    if (meta.breadcrumb) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: meta.breadcrumb.map(([name, url], idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name,
          ...(url ? { item: SITE_URL + url } : {})
        }))
      });
    }
    if (meta.schemas) schemas.push(...meta.schemas);
    setRouteJsonLd(schemas);
  } else {
    setRouteJsonLd(null);
  }
}
