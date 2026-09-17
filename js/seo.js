/**
 * ══════════════════════════════════════════════════════════════════════
 * PER-ROUTE SEO MANAGER
 * Updates <title>, meta description, canonical, Open Graph tags, robots
 * directives and route-level JSON-LD (BreadcrumbList) on every SPA route
 * change. Hooked into navigateTo() in landing.js.
 * ══════════════════════════════════════════════════════════════════════
 */

const SITE_URL = 'https://calculation-meesho.vercel.app';
const BRAND = 'FC Analytics';

function titleSuffix() {
  return ` | ${BRAND}`;
}

/**
 * Canonical route keys → metadata.
 * titles kept ≤ 65 chars, descriptions ≤ 165 chars.
 */
const ROUTE_META = {
  home: {
    title: `Free Meesho Label Crop & Sort Tool + Profit Calculator${titleSuffix()}`,
    description: 'Free Meesho label crop & sort tool — remove invoices, sort by SKU or courier, print 4×6 thermal labels. Plus Meesho profit calculator with RTO, GST & settlement. No signup.',
    path: '/'
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

function setRouteJsonLd(schema) {
  let el = document.getElementById('fc-route-schema');
  if (!schema) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'fc-route-schema';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
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

  if (meta.breadcrumb) {
    setRouteJsonLd({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumb.map(([name, url], idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name,
        ...(url ? { item: SITE_URL + url } : {})
      }))
    });
  } else {
    setRouteJsonLd(null);
  }
}
