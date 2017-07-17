# decode-tiff
[![npm version](https://badge.fury.io/js/decode-tiff.svg)](https://badge.fury.io/js/decode-tiff)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

:zap: A lightweight pure JavaScript TIFF decoder. :art:

## How to use it
### Node.js

```sh
npm i tiff-decode
```

The following example reads .tiff and converts to .png file using [pngjs](https://www.npmjs.com/package/pngjs).

```js
const { decode } = require("decode-tiff");

const { PNG } = require("pngjs");
const fs = require("fs");

const { width, height, data } = decode(fs.readFileSync(__dirname + "/lena_color.tiff"));

const png =  new PNG({ width, height });
png.data = data;
fs.writeFileSync(__dirname + "/lena.png", PNG.sync.write(png));
```

### Browser

This example show metadata of the dropped file. [Working demonstration is here.](https://quramy.github.io/decode-tiff/)

```js
const { decode } = require("decode-tiff");

const elm = document.getElementById("drop");

elm.addEventListener("dragenter", e => e.preventDefault());
elm.addEventListener("dragover", e => e.preventDefault());
elm.addEventListener("drop", (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", (e) => {
    const arrayBuffer = e.target.result;
    const { width, height, ifdEntries } = decode(arrayBuffer);
    const IFDs = JSON.stringify({ width, height, ifdEntries }, null, 2);
    elm.innerHTML = `
      <pre>${IFDs}</pre>
    `;
  });
  reader.readAsArrayBuffer(file);
});
```

## API
### `decode(buffer: ArrayBuffer | Buffer, options?: { singlePage?: boolean }): TiffImage | TiffImage[]`

- params
  - `buffer` - *Required* - Buffer of the target TIFF image. Node.js Buffer and ECMA Script's ArrayBuffer are acceptable.
  - `options.singlePage` - *Optional (default: `true`)* - If true, this function returns a single TiffImage object. If the input has 2 or more pages, return value will be the first page.
- returns
  - `TiffImage` - An object.
  - `TiffImage.width` - *number* - Width of the input image.
  - `TiffImage.height` - *number* - Height of the input image.
  - `TiffImage.data` - *Uint8Array* - Image pixel data. Every pixel consists 4 bytes: R, G, B, A (opacity)
  - `TiffImage.ifdEntries` - *{[key: string]: Array}* - Each IFD entries of the input image.

## Compatibility

- Byte Order
  - [x] Little endian
  - [x] Big endian
- Color resolusion
  - [x] 32bit Full Colors
  - [x] 24bit Full Colors
  - [x] 8bit Gray scale
  - [ ] Color Pallet
  - [ ] Bilevel(white)
  - [ ] Bilevel(black)
- Compression
  - [x] No Compression
  - [ ] LZW Compression
  - [ ] Packbits

## License
MIT. See LICENSE.txt.
