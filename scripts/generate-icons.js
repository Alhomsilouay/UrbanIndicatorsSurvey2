import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1d6fb8" />
      <stop offset="100%" stop-color="#0f3c63" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>
  <!-- Background with squircle shape for Android -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />
  
  <!-- Map grid subtle lines -->
  <path d="M70 170 H442 M70 270 H442 M70 370 H442 M170 70 V442 M270 70 V442 M370 70 V442" 
        stroke="rgba(255,255,255,0.08)" stroke-width="3" stroke-linecap="round" />

  <!-- Road / Avenue path -->
  <path d="M120 420 L220 220 L300 240 L400 90" 
        stroke="rgba(255,255,255,0.3)" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M120 420 L220 220 L300 240 L400 90" 
        stroke="#ffffff" stroke-width="12" stroke-dasharray="16 14" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Central Map Pin / Survey Marker -->
  <g filter="url(#shadow)" transform="translate(256, 210)">
    <!-- Pin body -->
    <path d="M0 -120 C-65 -120 -115 -70 -115 0 C-115 65 0 145 0 145 C0 145 115 65 115 0 C115 -70 65 -120 0 -120 Z" 
          fill="url(#goldGrad)" />
    <!-- Pin center circle -->
    <circle cx="0" cy="-10" r="48" fill="#ffffff" />
    <!-- Clipboard / Checkmark inside Pin -->
    <path d="M-22 -8 L-8 6 L22 -24" fill="none" stroke="#1d6fb8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- Title Badge in Arabic -->
  <rect x="76" y="420" width="360" height="48" rx="24" fill="#ffffff" opacity="0.95" />
  <text x="256" y="452" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#0f3c63" text-anchor="middle">
    مسح سلمية الميداني ALSUC
  </text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon, 'utf-8');

// Function to create minimal solid PNG with custom dimension using uncompressed/zlib deflate
function createPngBuffer(width, height, r, g, b) {
  // Simple PNG encoder for solid colored with icon
  // Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: height scanlines, each starts with filter byte 0, then width * 4 bytes RGBA
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // create nice blue gradient background with gold emblem center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.42;

      if (dist < radius * 0.4) {
        // Center gold/white
        if (dist < radius * 0.18) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = 245;
          rawData[pxOffset + 1] = 158;
          rawData[pxOffset + 2] = 11;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Gradient blue (#1d6fb8 to #0f3c63)
        const factor = y / height;
        rawData[pxOffset] = Math.round(29 * (1 - factor) + 15 * factor);
        rawData[pxOffset + 1] = Math.round(111 * (1 - factor) + 60 * factor);
        rawData[pxOffset + 2] = Math.round(184 * (1 - factor) + 99 * factor);
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  // Calculate CRC32 on type + data
  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(crcTarget);
  chunk.writeInt32BE(crcVal, 8 + length);
  return chunk;
}

// Fast CRC32
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1));
}

const pwa192 = createPngBuffer(192, 192);
const pwa512 = createPngBuffer(512, 512);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pwa192);

console.log('PWA icons successfully created in /public');
