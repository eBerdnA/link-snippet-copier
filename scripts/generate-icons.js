#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "..", "src", "icons");
const SIZES = [16, 32, 48, 128];

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function setPixel(rgba, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) {
    return;
  }

  const idx = (y * size + x) * 4;
  rgba[idx] = color[0];
  rgba[idx + 1] = color[1];
  rgba[idx + 2] = color[2];
  rgba[idx + 3] = color[3];
}

function drawRect(rgba, size, x, y, w, h, color) {
  for (let py = y; py < y + h; py += 1) {
    for (let px = x; px < x + w; px += 1) {
      setPixel(rgba, size, px, py, color);
    }
  }
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const bgTop = [22, 90, 198, 255];
  const bgBottom = [11, 58, 141, 255];
  const fg = [245, 250, 255, 255];

  for (let y = 0; y < size; y += 1) {
    const t = y / (size - 1 || 1);
    const r = Math.round(bgTop[0] + (bgBottom[0] - bgTop[0]) * t);
    const g = Math.round(bgTop[1] + (bgBottom[1] - bgTop[1]) * t);
    const b = Math.round(bgTop[2] + (bgBottom[2] - bgTop[2]) * t);

    for (let x = 0; x < size; x += 1) {
      setPixel(rgba, size, x, y, [r, g, b, 255]);
    }
  }

  const stroke = Math.max(1, Math.round(size * 0.09));
  const left = Math.round(size * 0.19);
  const right = Math.round(size * 0.81);
  const top = Math.round(size * 0.24);
  const bottom = Math.round(size * 0.76);
  const midY = Math.round(size * 0.5);

  drawRect(rgba, size, left, top, stroke, bottom - top, fg);
  drawRect(rgba, size, left, top, Math.round(size * 0.17), stroke, fg);
  drawRect(rgba, size, left, bottom - stroke, Math.round(size * 0.17), stroke, fg);

  drawRect(rgba, size, right - stroke, top, stroke, bottom - top, fg);
  drawRect(rgba, size, right - Math.round(size * 0.17), top, Math.round(size * 0.17), stroke, fg);
  drawRect(
    rgba,
    size,
    right - Math.round(size * 0.17),
    bottom - stroke,
    Math.round(size * 0.17),
    stroke,
    fg
  );

  drawRect(
    rgba,
    size,
    Math.round(size * 0.36),
    midY - Math.floor(stroke / 2),
    Math.round(size * 0.28),
    stroke,
    fg
  );

  return rgba;
}

function writePng(filePath, size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4;
  const scanlines = Buffer.alloc((stride + 1) * size);

  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (stride + 1);
    scanlines[rowStart] = 0;
    rgba.copy(scanlines, rowStart + 1, y * stride, y * stride + stride);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });

  const png = Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const rgba = drawIcon(size);
  const outFile = path.join(OUT_DIR, `icon-${size}.png`);
  writePng(outFile, size, rgba);
  process.stdout.write(`Wrote ${outFile}\n`);
}
