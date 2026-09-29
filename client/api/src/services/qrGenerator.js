/**
 * Pure JavaScript QR Code Generator (Model 2 ISO/IEC 18004 standard)
 * 100% self-contained with zero external dependencies.
 * Generates valid, high-contrast, scannable QR Code SVGs and Data URLs.
 */

// QR Code Constants & Tables
const PAD0 = 0xEC;
const PAD1 = 0x11;

const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);
for (let i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
for (let i = 8; i < 256; i++) EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
for (let i = 0; i < 255; i++) LOG_TABLE[EXP_TABLE[i]] = i;

function glog(n) {
  if (n < 1) throw new Error("glog(" + n + ")");
  return LOG_TABLE[n];
}
function gexp(n) {
  while (n < 0) n += 255;
  while (n >= 255) n -= 255;
  return EXP_TABLE[n];
}

class Polynomial {
  constructor(num, shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[offset + i];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }
  get(index) { return this.num[index]; }
  getLength() { return this.num.length; }
  multiply(e) {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new Polynomial(num);
  }
  mod(e) {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new Polynomial(num).mod(e);
  }
}

function getErrorCorrectPolynomial(errorCorrectLength) {
  let a = new Polynomial([1], 0);
  for (let i = 0; i < errorCorrectLength; i++) {
    a = a.multiply(new Polynomial([1, gexp(i)], 0));
  }
  return a;
}

// RS Block parameters [totalCount, dataCount] for Version 1..10 (Level M)
const RS_BLOCK_TABLE = [
  // L, M, Q, H
  // Level M versions 1-10
  null,
  [1, 26, 16], // v1
  [1, 44, 28], // v2
  [1, 70, 44], // v3
  [2, 50, 32], // v4: 2 blocks of 50 bytes (32 data each)
  [2, 67, 43], // v5
  [4, 43, 27], // v6
  [4, 59, 31], // v7
  [4, 66, 36], // v8
  [5, 68, 36], // v9
  [5, 87, 43]  // v10
];

class BitBuffer {
  constructor() {
    this.buffer = [];
    this.length = 0;
  }
  put(num, length) {
    for (let i = 0; i < length; i++) {
      this.putBit(((num >>> (length - i - 1)) & 1) === 1);
    }
  }
  putBit(bit) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
  getBuffer() { return this.buffer; }
  getLengthInBits() { return this.length; }
}

export class QRCodeModel {
  constructor(typeNumber = 4) {
    this.typeNumber = typeNumber;
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  addData(data) {
    this.dataList.push(data);
  }

  make() {
    this.makeImpl(false, 0);
  }

  makeImpl(test, maskPattern) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = new Array(this.moduleCount);
    for (let row = 0; row < this.moduleCount; row++) {
      this.modules[row] = new Array(this.moduleCount).fill(null);
    }

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    const data = this.createData(this.typeNumber);
    this.mapData(data, maskPattern);
  }

  setupPositionProbePattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules[row + r][col + c] = true;
        } else {
          this.modules[row + r][col + c] = false;
        }
      }
    }
  }

  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules[r][6] !== null) continue;
      this.modules[r][6] = (r % 2 === 0);
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules[6][c] !== null) continue;
      this.modules[6][c] = (c % 2 === 0);
    }
  }

  setupPositionAdjustPattern() {
    const pos = this.typeNumber > 1 ? [6, this.typeNumber * 4 + 10] : [];
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules[row][col] !== null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules[row + r][col + c] = true;
            } else {
              this.modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  }

  setupTypeInfo(test, maskPattern) {
    // Format info bits for Level M (00) and maskPattern
    const data = (0 << 3) | maskPattern;
    let d = data << 10;
    while (Polynomial_getBCHDigit(d) - Polynomial_getBCHDigit(1335) >= 0) {
      d ^= (1335 << (Polynomial_getBCHDigit(d) - Polynomial_getBCHDigit(1335)));
    }
    const bits = ((data << 10) | d) ^ 21522;

    for (let i = 0; i < 15; i++) {
      const mod = !test && (((bits >> i) & 1) === 1);
      if (i < 6) this.modules[i][8] = mod;
      else if (i < 8) this.modules[i + 1][8] = mod;
      else this.modules[this.moduleCount - 15 + i][8] = mod;

      if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
      else this.modules[8][15 - i - 1] = mod;
    }
    this.modules[this.moduleCount - 8][8] = !test;
  }

  createData(typeNumber) {
    const rsBlock = RS_BLOCK_TABLE[typeNumber] || RS_BLOCK_TABLE[4];
    const totalDataCount = rsBlock[0] * rsBlock[2];

    const buffer = new BitBuffer();
    for (let i = 0; i < this.dataList.length; i++) {
      const text = this.dataList[i];
      buffer.put(4, 4); // 8-bit byte mode
      buffer.put(text.length, typeNumber < 10 ? 8 : 16);
      for (let j = 0; j < text.length; j++) {
        buffer.put(text.charCodeAt(j), 8);
      }
    }

    // Terminate
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(false);
    }
    while (buffer.getLengthInBits() < totalDataCount * 8) {
      buffer.put(PAD0, 8);
      if (buffer.getLengthInBits() < totalDataCount * 8) buffer.put(PAD1, 8);
    }

    return this.createBytes(buffer, rsBlock);
  }

  createBytes(buffer, rsBlock) {
    const totalBlockCount = rsBlock[0];
    const totalCount = rsBlock[1];
    const dataCount = rsBlock[2];
    const ecCount = totalCount - dataCount;

    let offset = 0;
    const rawData = buffer.getBuffer();
    const dcdata = new Array(totalBlockCount);
    const ecdata = new Array(totalBlockCount);

    for (let r = 0; r < totalBlockCount; r++) {
      dcdata[r] = new Array(dataCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & rawData[i + offset];
      }
      offset += dataCount;

      const rsPoly = getErrorCorrectPolynomial(ecCount);
      const rawPoly = new Polynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
      }
    }

    const data = [];
    for (let i = 0; i < dataCount; i++) {
      for (let r = 0; r < totalBlockCount; r++) data.push(dcdata[r][i]);
    }
    for (let i = 0; i < ecCount; i++) {
      for (let r = 0; r < totalBlockCount; r++) data.push(ecdata[r][i]);
    }
    return data;
  }

  mapData(data, maskPattern) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules[row][col - c] === null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
            }
            const mask = ((row + (col - c)) % 2 === 0);
            if (mask) dark = !dark;
            this.modules[row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }

  /**
   * Generates clean SVG markup
   */
  toSVG({ size = 300, dark = '#003882', light = '#ffffff', margin = 4 } = {}) {
    const count = this.moduleCount;
    const totalSize = count + margin * 2;
    const paths = [];

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (this.modules[r][c]) {
          paths.push(`M${c + margin},${r + margin}h1v1h-1z`);
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="${light}"/>
  <path d="${paths.join('')}" fill="${dark}"/>
</svg>`;
  }

  toDataURL(options = {}) {
    const svg = this.toSVG(options);
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
}

function Polynomial_getBCHDigit(data) {
  let digit = 0;
  while (data !== 0) {
    digit++;
    data >>>= 1;
  }
  return digit;
}

/**
 * Convenience helper to generate QR SVG or Data URL for any text
 */
export function generateQRCode(text, options = {}) {
  // Determine appropriate version based on text length
  let version = 3;
  if (text.length > 32) version = 4;
  if (text.length > 50) version = 5;
  if (text.length > 70) version = 6;
  if (text.length > 100) version = 8;

  const qr = new QRCodeModel(version);
  qr.addData(text);
  qr.make();
  return {
    svg: qr.toSVG(options),
    dataUrl: qr.toDataURL(options),
    targetUrl: text
  };
}

export default generateQRCode;
