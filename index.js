/**
 *
 * Required Fields for Bilevel Images
 *
 *   ImageWidth 256 100 SHORT or LONG
 *   ImageLength 257 101 SHORT or LONG
 *   Compression 259 103 SHORT 1, 2 or 32773
 *   PhotometricInterpretation 262 106 SHORT 0 or 1
 *   StripOffsets 273 111 SHORT or LONG
 *   RowsPerStrip 278 116 SHORT or LONG
 *   StripByteCounts 279 117 LONG or SHORT
 *   XResolution 282 11A RATIONAL
 *   YResolution 283 11B RATIONAL
 *   ResolutionUnit 296 128 SHORT 1, 2 or 3
 *
**/
const TAG_NAME_MAP = {
  0x0100: "imageWidth",
  0x0101: "imageLength",
  0x0102: "bitsPerSample",
  0x0103: "compression",
  0x0106: "photometricInterpretation",
  0x0111: "stripOffsets",
  0x0116: "rowsPerStrip",
  0x0117: "stripByteCounts",
  0x0128: "resolutionUnit",
};

function loadPages(buf) {
  
  let idx = 0;
  let isMSB;
  let ifdEntries = { };
  let stripData;
  
  function read(offset, length) {
    const begin = offset, end = offset + length;
    if (isMSB) {
      return buf.subarray(begin, end);
    } else {
      const s = buf.subarray(begin, end);
      const x = new Uint8Array(end - begin);
      for (let i = 0; i < s.byteLength; i++) {
        x[s.byteLength - i - 1] = s[i];
      }
      return x;
    }
  }
  
  function readAsUint16(offset, length = 1, force) {
    if (isMSB) {
      const dd = new DataView(buf.buffer);
      if (length > 1 || force) {
        const y = new Uint16Array(length);
        for (let i = 0; i < length; i++) {
          y[i] = dd.getUint16(offset + (i << 1));
        }
        return y;
      } else {
        return dd.getUint16(offset);
      }
    } else {
      const d = new DataView(read(offset, length << 1).buffer);
      if (length > 1 || force) {
        const x = new Uint16Array(length);
        for (let i = 0; i < length; i++) {
          x[i] = d.getUint16(i << 1);
        }
        return x;
      } else {
        return d.getUint16(0);
      }
    }
  }
  
  function readAsUint32(offset, length = 1, force)  {
    if (isMSB) {
      const dd = new DataView(buf.buffer);
      if (length > 1 || force) {
        const y = new Uint32Array(length);
        for (let i = 0; i < length; i++) {
          y[i] = dd.getUint32(offset + (i << 2));
        }
        return y;
      } else {
        return dd.getUint32(offset);
      }
    } else {
      const d = new DataView(read(offset, length << 2).buffer);
      if (length > 1 || force) {
        const x = new Uint32Array(length);
        for (let i = 0; i < length; i++) {
          x[i] = d.getUint32(i << 2);
        }
        return x;
      } else {
        return d.getUint32(0);
      }
    }
  }
  
  /**
   *
   * The field types and their sizes are:
   *
   *   1  = BYTE 8-bit unsigned integer.
   *   2  = ASCII 8-bit byte that contains a 7-bit ASCII code; the last byte must be NUL (binary zero).
   *   3  = SHORT 16-bit (2-byte) unsigned integer.
   *   4  = LONG 32-bit (4-byte) unsigned integer.
   *   5  = RATIONAL Two LONGs: the first represents the numerator of a fraction; the second, the denominator.
   *
   * In TIFF 6.0, some new field types have been defined:
   *
   *   6  = SBYTE An 8-bit signed (twos-complement) integer.
   *   7  = UNDEFINED An 8-bit byte that may contain anything, depending on the definition of the field.
   *   8  = SSHORT A 16-bit (2-byte) signed (twos-complement) integer.
   *   9  = SLONG A 32-bit (4-byte) signed (twos-complement) integer.
   *   10 = SRATIONAL Two SLONG’s: the first represents the numerator of a fraction, the second the denominator.
   *   11 = FLOAT Single precision (4-byte) IEEE format.
   *   12 = DOUBLE Double precision (8-byte) IEEE format
   *
   **/
  function byteLength(fieldType, numOfValues) {
    switch (fieldType) {
      case 1:
        return numOfValues;
      case 3:
        return numOfValues << 1;
      case 4:
        return numOfValues << 2;
      case 5:
        return numOfValues << 3;
      default:
        return numOfValues << 2;
    }
  }
  
  function parseIFDFieldValueToArray(fieldType, numOfValues, valueOffset) {
    const bl = byteLength(fieldType, numOfValues);
    let l;
    if (bl > 4) valueOffset = readAsUint32(valueOffset);
    if (bl < 4) {
      l = 4 / bl;
    } else {
      l = numOfValues;
    }
    let x;
    switch (fieldType) {
      case 1:
        break;
      case 3:
        x = readAsUint16(valueOffset, l, true);
        break;
      case 4:
        x = readAsUint32(valueOffset, l, true);
        break;
    }
    if (!x) return;
    if (bl < 4) {
      return isMSB ? x.slice(0, l - numOfValues) : x.slice(l - numOfValues);
    } else {
      return x;
    }
  }

  function parseIFDEntry(tagId, fieldType, numOfValues, valueOffset) {
    const k = TAG_NAME_MAP[tagId];
    if (k) {
      ifdEntries[k] = parseIFDFieldValueToArray(fieldType, numOfValues, valueOffset);
    } else {
      // TODO
      // console.log("unknown IFD entry: ", tagId, fieldType, numOfValues, valueOffset);
    }
  }
  
  function readStrips(ifdEntries) {
    const ret = new Uint8Array(ifdEntries.imageWidth[0] * ifdEntries.imageLength[0] * ifdEntries.bitsPerSample.length);
    let copiedBl = 0;
    for (let s = 0; s < ifdEntries.stripOffsets.length; s++) {
      let x = buf.subarray(ifdEntries.stripOffsets[s], ifdEntries.stripByteCounts[s]);
      ret.set(x, copiedBl);
      copiedBl += x.byteLength;
    }
    return ret;
  }
  
  // Image File Header
  // Byte order
  if (buf[0] === 0x4d && buf[1] === 0x4d) {
    isMSB = true;
  } else if (buf[0] === 0x49 && buf[1] === 0x49) {
    isMSB = false;
  } else {
    throw new Error("Invalid byte order " + buf[0] + buf[1]);
  }
  
  if (read(2, 2)[1] !== 0x2a) {
    throw new Error("not tiff");
  }
  // console.log(readAsUint32(4), read(4, 4));
  
  const pages = [];
  for (let ifdOffset = readAsUint32(4); ifdOffset !== 0; ifdOffset = readAsUint32(idx)) {
    // Number of Directory Entries
    idx = ifdOffset;
    const numOfIFD = readAsUint16(idx);
    ifdEntries = { };
    // IFD Entries
    idx += 2;
    for(let i = 0; i < numOfIFD; i++) {
      // TAG
      const tagId = readAsUint16(idx);

      // Field type
      idx += 2;
      const fieldType = readAsUint16(idx);

      // The number of values
      idx += 2;
      const numOfValues = readAsUint32(idx);

      // The value offset
      idx += 4;
      const valueOffset = idx;
      parseIFDEntry(tagId, fieldType, numOfValues, valueOffset);
      idx += 4;
    }
    stripData = readStrips(ifdEntries);
    pages.push({ stripData, ifdEntries });
  }

  return pages;
}

function normalizeStripData(ifdEntries, stripData) {
  const { colorMap, bitsPerSample, compression } = ifdEntries;
  let x;
  if (colorMap) {
    throw new Error("Color map is not implemented.");
  }
  if (compression && compression[0] !== 1) {
    throw new Error("Compression is not implemented.");
  }
  if (!bitsPerSample) {
    throw new Error("Bilevel image is not implemented.");
  }
  if (bitsPerSample.length === 4) {
    // 32bit RBGA image
    return stripData;
  } else if (bitsPerSample.length === 3) {
    // 24bit RBG image
    x = new Uint8Array(stripData.length / 3 * 4);
    for (let i = 0; i < stripData.length / 3; i++) {
      x[i * 4] = stripData[i * 3];
      x[i * 4 + 1] = stripData[i * 3 + 1];
      x[i * 4 + 2] = stripData[i * 3 + 2];
      x[i * 4 + 3] = 0xFf;
    }
    return x;
  }
  if (bitsPerSample.length === 1) {
    // 8bit grayscale image
    x = new Uint8Array(stripData.length * 4);
    for (let i = 0; i < stripData.length; i++) {
      x[i * 4] = stripData[i];
      x[i * 4 + 1] = stripData[i + 1];
      x[i * 4 + 2] = stripData[i + 2];
      x[i * 4 + 3] = 0xFF;
    }
    return x;
  }
}

function decode(buf, opt = { singlePage: true }) {
  rawPages = loadPages(new Uint8Array(buf));
  const pages = rawPages.map(rawPage => {
    const width = rawPage.ifdEntries.imageWidth[0];
    const height = rawPage.ifdEntries.imageLength[0];
    const data = normalizeStripData(rawPage.ifdEntries, rawPage.stripData);
    return { width, height, data, ifdEntries: rawPage.ifdEntries };
  });
  if (opt.singlePage) {
    if (!pages || !pages.length) {
      throw new Error("No pages");
    }
    return pages[0];
  } else {
    return pages;
  }
}

module.exports = { 
  decode,
};
