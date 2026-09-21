import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_META } from '../js/seo.js';
import { buildInfoPageHtml } from '../js/infoPages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const SITE_URL = 'https://calculation-meesho.vercel.app';

const LANDING_OPEN = '<div class="sb-landing-view" id="landingView">';
const LANDING_HIDDEN = '<div class="sb-landing-view" id="landingView" style="display: none;">';

const INFO_KEYS = ['about', 'privacy', 'terms', 'cookies', 'disclaimer', 'contact'];

const FLIPKART_HERO_TITLE = 'Free Flipkart Label Crop <br>\n              <span class="highlight">&amp; Sort Tool</span>\n            ';
const FLIPKART_HERO_DESC = '\n              <p>Every Flipkart seller faces the same daily problem: shipping label PDFs include both the shipping label and tax invoice on the same page.</p>\n              <p>FC Analytics helps you crop Flipkart labels away from the invoice section, sort labels by SKU, and download a clean, print-ready 3×5 file for free with no signup needed.</p>\n            ';

function assertNoQuote(value, label) {
  if (value.includes('"')) throw new Error(`prerender: double quote in ${label}`);
  return value;
}

function setHead(html, route) {
  const meta = ROUTE_META[route];
  const url = SITE_URL + meta.path;
  const robots = meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const title = assertNoQuote(meta.title, `title of ${route}`);
  const description = assertNoQuote(meta.description, `description of ${route}`);

  const swaps = [
    [/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`],
    [/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`],
    [/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`],
    [/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`],
    [/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`],
    [/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`],
    [/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`],
    [/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`],
    [/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${robots}">`]
  ];

  for (const [pattern, replacement] of swaps) {
    if (!pattern.test(html)) throw new Error(`prerender: head tag missing for ${route}: ${pattern}`);
    html = html.replace(pattern, replacement);
  }

  if (meta.breadcrumb) {
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: meta.breadcrumb.map(([name, item], idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name,
        ...(item ? { item: SITE_URL + item } : {})
      }))
    };
    html = html.replace('</head>', `  <script type="application/ld+json" id="fc-route-schema">${JSON.stringify(ld)}</script>\n</head>`);
  }

  return html;
}

function setBody(html, route) {
  const swaps = [];

  if (ROUTE_META[route].path !== '/') swaps.push([LANDING_OPEN, LANDING_HIDDEN]);

  if (route === 'labels/meesho' || route === 'labels/flipkart') {
    swaps.push([
      'id="labelCropMeeshoView" style="display: none;"',
      'id="labelCropMeeshoView" style="display: block;"'
    ]);
  } else if (route === 'labels') {
    swaps.push([
      'id="labelCropView" style="display: none;"',
      'id="labelCropView" style="display: block;"'
    ]);
  } else if (route === 'login') {
    swaps.push([
      '<div id="publicSite">',
      '<div id="publicSite" style="display: none;">'
    ]);
    swaps.push([
      'id="loginView" style="display: none; flex-direction: column;"',
      'id="loginView" style="display: flex; flex-direction: column;"'
    ]);
  } else if (route === 'dashboard') {
    swaps.push([
      '<div id="publicSite">',
      '<div id="publicSite" style="display: none;">'
    ]);
    swaps.push([
      'id="appLayout" style="display: none;"',
      'id="appLayout" style="display: flex;"'
    ]);
  } else if (INFO_KEYS.includes(route)) {
    swaps.push([
      'id="infoPageView" style="display: none;"></div>',
      `id="infoPageView" style="display: block;">${buildInfoPageHtml(route)}</div>`
    ]);
  }

  for (const [from, to] of swaps) {
    if (!html.includes(from)) throw new Error(`prerender: body marker missing for ${route}: ${from.slice(0, 70)}`);
    html = html.replace(from, to);
  }

  if (route === 'labels/flipkart') {
    html = html.replace(
      /(<h1[^>]*id="sbMarketplaceHeroTitle"[^>]*>)[\s\S]*?(<\/h1>)/,
      `$1${FLIPKART_HERO_TITLE}$2`
    );
    html = html.replace(
      /(<div[^>]*id="sbMarketplaceHeroDesc"[^>]*>)[\s\S]*?(<\/div>)/,
      `$1${FLIPKART_HERO_DESC}$2`
    );
  }

  return html;
}

const baseHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

for (const route of Object.keys(ROUTE_META)) {
  let html = setHead(baseHtml, route);
  html = setBody(html, route);

  const segments = ROUTE_META[route].path.split('/').filter(Boolean);
  const outFile = segments.length
    ? path.join(distDir, ...segments, 'index.html')
    : path.join(distDir, 'index.html');

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  console.log(`prerendered ${ROUTE_META[route].path} -> ${path.relative(distDir, outFile)}`);
}

const sitemapPath = path.join(distDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = fs.readFileSync(sitemapPath, 'utf8').replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  fs.writeFileSync(sitemapPath, xml);
  console.log('sitemap lastmod refreshed');
}
