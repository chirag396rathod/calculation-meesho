/**
 * Generates public/logos/og-image.png (1200×630) — the social share preview card.
 * Pure Node.js PNG encoder (zlib) — no image libraries required.
 * Run: node scripts/generate-og-image.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 1200;
const H = 630;
const px = new Uint8Array(W * H * 3);

const BRAND_PINK = [139, 24, 116];     // #8B1874
const PINK_LIGHT = [192, 38, 130];     // #C02682
const BG_TOP = [90, 12, 74];           // deep magenta
const BG_BOTTOM = [30, 16, 74];        // deep purple
const WHITE = [255, 255, 255];
const SLATE = [51, 65, 85];            // #334155
const INK = [15, 23, 42];              // #0F172A
const LINE = [226, 232, 240];          // #E2E8F0

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function setPx(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}

function blendPx(x, y, c, alpha) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = Math.round(lerp(px[i], c[0], alpha));
  px[i + 1] = Math.round(lerp(px[i + 1], c[1], alpha));
  px[i + 2] = Math.round(lerp(px[i + 2], c[2], alpha));
}

function fillRect(x, y, w, h, c) {
  const x0 = Math.round(x), y0 = Math.round(y);
  const x1 = Math.round(x + w), y1 = Math.round(y + h);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) setPx(xx, yy, c);
}

function blendRect(x, y, w, h, c, a) {
  const x0 = Math.round(x), y0 = Math.round(y);
  const x1 = Math.round(x + w), y1 = Math.round(y + h);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) blendPx(xx, yy, c, a);
}

function roundRect(cx, cy, w, h, r, c) {
  const x0 = Math.floor(cx - w / 2), y0 = Math.floor(cy - h / 2);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.max(Math.abs(x - cx) - (w / 2 - r), 0);
      const dy = Math.max(Math.abs(y - cy) - (h / 2 - r), 0);
      if (dx * dx + dy * dy <= r * r) setPx(x, y, c);
    }
  }
}

function roundRectBlend(cx, cy, w, h, r, c, a) {
  const x0 = Math.floor(cx - w / 2), y0 = Math.floor(cy - h / 2);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.max(Math.abs(x - cx) - (w / 2 - r), 0);
      const dy = Math.max(Math.abs(y - cy) - (h / 2 - r), 0);
      if (dx * dx + dy * dy <= r * r) blendPx(x, y, c, a);
    }
  }
}

// Block letters drawn as rectangle unions
function drawF(x, y, s, c) {
  fillRect(x, y, 26 * s, 96 * s, c);
  fillRect(x, y, 66 * s, 26 * s, c);
  fillRect(x, y + 35 * s, 52 * s, 24 * s, c);
}

function drawC(x, y, s, c) {
  fillRect(x, y, 26 * s, 96 * s, c);
  fillRect(x, y, 68 * s, 26 * s, c);
  fillRect(x, y + 70 * s, 68 * s, 26 * s, c);
}

// ── 1. Background gradient ──
for (let y = 0; y < H; y++) {
  const row = mix(BG_TOP, BG_BOTTOM, y / H);
  for (let x = 0; x < W; x++) setPx(x, y, row);
}

// Subtle dot grid
for (let y = 40; y < H; y += 48) {
  for (let x = 40; x < W; x += 48) {
    blendPx(x, y, WHITE, 0.07);
    blendPx(x + 1, y, WHITE, 0.05);
    blendPx(x, y + 1, WHITE, 0.05);
  }
}

// ── 2. Main white "shipping label" card ──
roundRect(600, 295, 790, 440, 30, WHITE);

// Brand mark: blocky "FC" in brand pink
drawF(300, 165, 1.35, BRAND_PINK);
drawC(420, 165, 1.35, BRAND_PINK);

// Headline text bars beside the mark
fillRect(560, 180, 300, 22, SLATE);
fillRect(560, 222, 240, 22, SLATE);
blendRect(560, 264, 190, 22, PINK_LIGHT, 0.9);

// Divider
fillRect(300, 340, 600, 3, LINE);

// Barcode strip
const widths = [5, 3, 9, 4, 6, 2, 10, 4, 3, 8, 2, 6, 9, 3, 5, 2, 7, 10, 3, 6, 2, 9, 4, 7, 3, 8, 2, 6, 10, 4];
let bx = 310;
for (let i = 0; i < widths.length && bx < 890; i++) {
  const w = widths[i];
  if (i % 2 === 0) fillRect(bx, 375, w, 92, INK);
  bx += w + (i % 3 === 0 ? 6 : 4);
}

// Scissors + crop hint: dashed line under barcode
for (let x = 310; x < 890; x += 22) fillRect(x, 496, 12, 3, BRAND_PINK);

// ── 3. Caption bars below the card ──
roundRectBlend(600, 560, 470, 26, 13, WHITE, 0.32);
roundRectBlend(600, 602, 320, 20, 10, WHITE, 0.22);

// ── 4. Corner accents ──
fillRect(0, 0, W, 8, BRAND_PINK);
fillRect(0, H - 8, W, 8, PINK_LIGHT);

// ── 5. Encode PNG ──
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 2;   // color type: truecolor RGB

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'logos', 'og-image.png');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, png);
console.log(`Wrote ${outPath} (${(png.length / 1024).toFixed(1)} KB, ${W}x${H})`);
