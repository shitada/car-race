/**
 * Generate PNG app icons for PWA / apple-touch-icon
 * Run: node scripts/generate-icons.mjs
 */
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

// ── Minimal PNG encoder ──
function encodePNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crc = crc32(buf.subarray(4, 4 + type.length + data.length));
    buf.writeUInt32BE(crc >>> 0, buf.length - 4);
    return buf;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT - raw pixel data with filter byte
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      row[1 + x * 4 + 0] = pixels[i];
      row[1 + x * 4 + 1] = pixels[i + 1];
      row[1 + x * 4 + 2] = pixels[i + 2];
      row[1 + x * 4 + 3] = pixels[i + 3];
    }
    rawRows.push(row);
  }
  const rawData = Buffer.concat(rawRows);
  const compressed = deflateSync(rawData);

  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', iend),
  ]);
}

// CRC32
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── Drawing helpers ──
function createCanvas(w, h) {
  const pixels = new Uint8Array(w * h * 4);
  return {
    width: w, height: h, pixels,
    setPixel(x, y, r, g, b, a = 255) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const i = (y * w + x) * 4;
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = a;
    },
    fillRect(x1, y1, rw, rh, r, g, b, a = 255) {
      for (let dy = 0; dy < rh; dy++)
        for (let dx = 0; dx < rw; dx++)
          this.setPixel(x1 + dx, y1 + dy, r, g, b, a);
    },
    fillCircle(cx, cy, radius, r, g, b, a = 255) {
      for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++)
          if (dx * dx + dy * dy <= radius * radius)
            this.setPixel(cx + dx, cy + dy, r, g, b, a);
    },
    fillTriangle(x1, y1, x2, y2, x3, y3, r, g, b, a = 255) {
      const minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
      const minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (pointInTriangle(x, y, x1, y1, x2, y2, x3, y3))
            this.setPixel(x, y, r, g, b, a);
        }
      }
    },
  };
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// ── Draw the icon ──
function drawIcon(size) {
  const c = createCanvas(size, size);
  const s = size / 180; // scale factor

  // Background - dark blue with slight gradient effect
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = Math.round(20 + t * 15);
    const g = Math.round(25 + t * 10);
    const b = Math.round(55 + t * 25);
    for (let x = 0; x < size; x++) {
      c.setPixel(x, y, r, g, b);
    }
  }

  // Road (center, vertical)
  const roadL = Math.round(50 * s);
  const roadR = Math.round(130 * s);
  const roadW = roadR - roadL;
  c.fillRect(roadL, 0, roadW, size, 60, 60, 60);

  // Road edge lines
  c.fillRect(roadL, 0, Math.round(3 * s), size, 255, 255, 255);
  c.fillRect(roadR - Math.round(3 * s), 0, Math.round(3 * s), size, 255, 255, 255);

  // Center dashes
  const dashLen = Math.round(18 * s);
  const dashGap = Math.round(14 * s);
  const cx = Math.round(90 * s);
  for (let y = 0; y < size; y += dashLen + dashGap) {
    c.fillRect(cx - Math.round(1.5 * s), y, Math.round(3 * s), dashLen, 200, 200, 200);
  }

  // Grass (sides)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < roadL; x++) {
      c.setPixel(x, y, 40, 130 + Math.round(Math.sin(y * 0.1) * 10), 40);
    }
    for (let x = roadR; x < size; x++) {
      c.setPixel(x, y, 40, 130 + Math.round(Math.sin(y * 0.1) * 10), 40);
    }
  }

  // Player car (blue) - center bottom
  const carX = Math.round(90 * s);
  const carY = Math.round(125 * s);
  const carW = Math.round(28 * s);
  const carH = Math.round(42 * s);

  // Car body
  c.fillRect(carX - carW / 2, carY - carH / 2, carW, carH, 30, 120, 255);
  // Windshield
  c.fillRect(carX - Math.round(8 * s), carY - Math.round(8 * s), Math.round(16 * s), Math.round(10 * s), 180, 220, 255);
  // Tires
  const tw = Math.round(5 * s), th = Math.round(8 * s);
  c.fillRect(carX - carW / 2 - tw, carY - Math.round(14 * s), tw, th, 30, 30, 30);
  c.fillRect(carX + carW / 2, carY - Math.round(14 * s), tw, th, 30, 30, 30);
  c.fillRect(carX - carW / 2 - tw, carY + Math.round(8 * s), tw, th, 30, 30, 30);
  c.fillRect(carX + carW / 2, carY + Math.round(8 * s), tw, th, 30, 30, 30);

  // Obstacle (demon face) - upper area, left lane
  const obsX = Math.round(68 * s);
  const obsY = Math.round(40 * s);
  const obsS = Math.round(22 * s);
  c.fillRect(obsX - obsS / 2, obsY - obsS / 2, obsS, obsS, 120, 50, 50);
  // Horns
  c.fillTriangle(
    obsX - Math.round(8 * s), obsY - obsS / 2,
    obsX - Math.round(3 * s), obsY - obsS / 2,
    obsX - Math.round(5 * s), obsY - obsS / 2 - Math.round(8 * s),
    255, 200, 50
  );
  c.fillTriangle(
    obsX + Math.round(3 * s), obsY - obsS / 2,
    obsX + Math.round(8 * s), obsY - obsS / 2,
    obsX + Math.round(5 * s), obsY - obsS / 2 - Math.round(8 * s),
    255, 200, 50
  );
  // Eyes
  c.fillCircle(obsX - Math.round(4 * s), obsY - Math.round(2 * s), Math.round(3 * s), 255, 255, 255);
  c.fillCircle(obsX + Math.round(4 * s), obsY - Math.round(2 * s), Math.round(3 * s), 255, 255, 255);
  c.fillCircle(obsX - Math.round(4 * s), obsY - Math.round(2 * s), Math.round(1.5 * s), 200, 30, 30);
  c.fillCircle(obsX + Math.round(4 * s), obsY - Math.round(2 * s), Math.round(1.5 * s), 200, 30, 30);

  // Star item (invincible) - right lane, upper
  const starX = Math.round(112 * s);
  const starY = Math.round(65 * s);
  c.fillCircle(starX, starY, Math.round(8 * s), 255, 100, 255);
  // Star shape (simple 4-point)
  const sr = Math.round(5 * s);
  c.fillTriangle(starX, starY - sr, starX - Math.round(2 * s), starY, starX + Math.round(2 * s), starY, 255, 255, 255);
  c.fillTriangle(starX, starY + sr, starX - Math.round(2 * s), starY, starX + Math.round(2 * s), starY, 255, 255, 255);
  c.fillTriangle(starX - sr, starY, starX, starY - Math.round(2 * s), starX, starY + Math.round(2 * s), 255, 255, 255);
  c.fillTriangle(starX + sr, starY, starX, starY - Math.round(2 * s), starX, starY + Math.round(2 * s), 255, 255, 255);

  // Flame particles behind car
  const flameColors = [[255, 220, 50], [255, 140, 20], [255, 50, 20]];
  const flames = [
    [carX - 4 * s, carY + carH / 2 + 5 * s, 5 * s],
    [carX + 3 * s, carY + carH / 2 + 3 * s, 4 * s],
    [carX - 1 * s, carY + carH / 2 + 8 * s, 3 * s],
    [carX + 5 * s, carY + carH / 2 + 6 * s, 3.5 * s],
    [carX - 6 * s, carY + carH / 2 + 4 * s, 3 * s],
  ];
  flames.forEach(([fx, fy, fr], i) => {
    const col = flameColors[i % 3];
    c.fillCircle(Math.round(fx), Math.round(fy), Math.round(fr), col[0], col[1], col[2], 200);
  });

  // Rounded corner mask (iOS icon standard)
  const cornerR = Math.round(size * 0.22);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let masked = false;
      // Top-left
      if (x < cornerR && y < cornerR) {
        const dx = cornerR - x, dy = cornerR - y;
        if (dx * dx + dy * dy > cornerR * cornerR) masked = true;
      }
      // Top-right
      if (x >= size - cornerR && y < cornerR) {
        const dx = x - (size - cornerR), dy = cornerR - y;
        if (dx * dx + dy * dy > cornerR * cornerR) masked = true;
      }
      // Bottom-left
      if (x < cornerR && y >= size - cornerR) {
        const dx = cornerR - x, dy = y - (size - cornerR);
        if (dx * dx + dy * dy > cornerR * cornerR) masked = true;
      }
      // Bottom-right
      if (x >= size - cornerR && y >= size - cornerR) {
        const dx = x - (size - cornerR), dy = y - (size - cornerR);
        if (dx * dx + dy * dy > cornerR * cornerR) masked = true;
      }
      if (masked) c.setPixel(x, y, 0, 0, 0, 0);
    }
  }

  return c;
}

// ── Generate icons ──
for (const size of [180, 192, 512]) {
  const canvas = drawIcon(size);
  const png = encodePNG(canvas.width, canvas.height, canvas.pixels);
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  const path = join(publicDir, name);
  const stream = createWriteStream(path);
  stream.write(png);
  stream.end();
  console.log(`✓ Generated ${name} (${size}x${size})`);
}

// Favicon (32x32)
const faviconCanvas = drawIcon(32);
const faviconPng = encodePNG(32, 32, faviconCanvas.pixels);
const faviconPath = join(publicDir, 'favicon.png');
createWriteStream(faviconPath).end(faviconPng);
console.log('✓ Generated favicon.png (32x32)');
