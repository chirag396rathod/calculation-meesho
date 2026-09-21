import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public');

const C0 = [139, 24, 116];
const C1 = [255, 107, 157];
const BASELINE = 0.78;
const BARS = [
  [0.2, 0.46, 0.35],
  [0.425, 0.28, 0.575],
  [0.65, 0.1, 0.8]
];

function coverage(x, y) {
  const r = 0.225;
  const dx = Math.max(Math.abs(x - 0.5) - (0.5 - r), 0);
  const dy = Math.max(Math.abs(y - 0.5) - (0.5 - r), 0);
  if (Math.hypot(dx, dy) > r) return null;
  for (const [x0, y0, x1] of BARS) {
    if (x >= x0 && x <= x1 && y >= y0 && y <= BASELINE) return [255, 255, 255];
  }
  const t = (x + y) / 2;
  return [
    Math.round(C0[0] + (C1[0] - C0[0]) * t),
    Math.round(C0[1] + (C1[1] - C0[1]) * t),
    Math.round(C0[2] + (C1[2] - C0[2]) * t)
  ];
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = 3;
  const n = S * S;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const c = coverage((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }
      const i = (py * size + px) * 4;
      if (a > 0) {
        rgba[i] = Math.round((r / a) * 255);
        rgba[i + 1] = Math.round((g / a) * 255);
        rgba[i + 2] = Math.round((b / a) * 255);
      }
      rgba[i + 3] = Math.round((a / n));
    }
  }
  return rgba;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
}

function encodeICO(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dirChunks = [];
  for (const [size, data] of entries) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = e[0];
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    dirChunks.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...dirChunks, ...entries.map(([, d]) => d)]);
}

function validate(png, size) {
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  if (w !== size || h !== size) throw new Error(`PNG ${w}x${h} != ${size}`);
}

const png16 = encodePNG(16, render(16));
const png32 = encodePNG(32, render(32));
const png48 = encodePNG(48, render(48));
const png180 = encodePNG(180, render(180));
[png16, png32, png48, png180].forEach((p, i) => validate(p, [16, 32, 48, 180][i]));

fs.writeFileSync(path.join(outDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(outDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), encodeICO([[16, png16], [32, png32], [48, png48]]));

console.log('favicons written to', outDir);
