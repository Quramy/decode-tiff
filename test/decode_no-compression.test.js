import test from "ava";
import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import glob from "glob";
import { decode } from "../src";
import { PNG } from "pngjs";

const inputs = glob.sync("input/*.tiff", { cwd: path.resolve(__dirname, "images/no-compression") });

inputs.map(f => {
  const baseDir = path.resolve(__dirname, "images/no-compression");
  const baseName = path.basename(f);
  const caseName = baseName.replace(/\.tiff/, "").replace(/_/g, " ");
  const inputFilename = path.join(baseDir, f);
  const actualFilename = path.join(baseDir, "actual", baseName.replace(/tiff$/, "png"));
  const expectedFilename = path.join(baseDir, "expected", baseName.replace(/tiff$/, "png"));
  return {
    caseName,
    inputFilename,
    actualFilename,
    expectedFilename,
  }
}).forEach(c => {
  test(c.caseName, t => {
    rimraf.sync(c.actualFilename);
    const buf = fs.readFileSync(c.inputFilename);
    const { width, height, data, ifdEntries } = decode(buf);
    console.log(c.caseName, ifdEntries);
    const png =  new PNG({ width, height });
    png.data = data;
    const pngBuffer = PNG.sync.write(png);
    fs.writeFileSync(c.actualFilename, pngBuffer);
    const expectedBuffer = fs.readFileSync(c.expectedFilename);
    t.deepEqual(pngBuffer, expectedBuffer);
  });
})
;

