import { readFile, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";
import type { Capture } from "./capture.ts";

// Rounded corners of scrolling containers can anti-alias a level or two differently between captures of
// the same page, so channel differences up to this much don't count as changes.
const TOLERANCE = 2;

/** The box from `left`,`top` to `right`,`bottom` (inclusive) in one tile image of `width` × `height` pixels. */
export type Region = {
  tile: number;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type Comparison =
  | { status: "same" }
  /** Same page height. `regions` holds the changed rows of each tile that changed. */
  | { status: "changed"; before: Capture; after: Capture; changedPixels: number; regions: Region[] }
  /** The page height changed, so pixels can't be compared one to one. `region` is where the pages first differ. */
  | { status: "resized"; before: Capture; after: Capture; region: Region };

/** Base paths of one shot's images. Tile N of a shot is saved as `${base}.N.png`. */
export type ShotFiles = { before: string; after: string; diff: string };

const tileFile = (base: string, index: number) => `${base}.${index}.png`;

function differs(a: Buffer, b: Buffer, i: number) {
  return (
    Math.abs(a[i] - b[i]) > TOLERANCE ||
    Math.abs(a[i + 1] - b[i + 1]) > TOLERANCE ||
    Math.abs(a[i + 2] - b[i + 2]) > TOLERANCE ||
    Math.abs(a[i + 3] - b[i + 3]) > TOLERANCE
  );
}

/** Compares one shot tile by tile and writes a diff image for every tile that changed. */
export async function compareCaptures(
  before: Capture,
  after: Capture,
  files: ShotFiles,
): Promise<Comparison> {
  if (before.height !== after.height || before.tiles !== after.tiles) {
    return { status: "resized", before, after, region: await firstDifference(files) };
  }
  const regions: Region[] = [];
  let changedPixels = 0;
  for (let index = 0; index < before.tiles; index++) {
    const [bytesA, bytesB] = await Promise.all([
      readFile(tileFile(files.before, index)),
      readFile(tileFile(files.after, index)),
    ]);
    // Identical pixels encode to identical files, which is the common case.
    if (bytesA.equals(bytesB)) continue;
    const a = PNG.sync.read(bytesA);
    const b = PNG.sync.read(bytesB);
    if (a.width !== b.width || a.height !== b.height) {
      return { status: "resized", before, after, region: await firstDifference(files) };
    }
    const diff = new PNG({ width: a.width, height: a.height });
    let changed = 0;
    let top = -1;
    let bottom = -1;
    let left = a.width;
    let right = -1;
    for (let i = 0; i < a.data.length; i += 4) {
      if (differs(a.data, b.data, i)) {
        changed++;
        const pixel = i / 4;
        const row = Math.floor(pixel / a.width);
        const column = pixel % a.width;
        if (top < 0) top = row;
        bottom = row;
        left = Math.min(left, column);
        right = Math.max(right, column);
        diff.data[i] = 230;
        diff.data[i + 1] = 0;
        diff.data[i + 2] = 60;
      } else {
        // Unchanged pixels are washed out, so changes stand out.
        diff.data[i] =
          diff.data[i + 1] =
          diff.data[i + 2] =
            255 - (765 - a.data[i] - a.data[i + 1] - a.data[i + 2]) / 12;
      }
      diff.data[i + 3] = 255;
    }
    if (!changed) continue;
    changedPixels += changed;
    regions.push({ tile: index, width: a.width, height: a.height, top, bottom, left, right });
    await writeFile(tileFile(files.diff, index), PNG.sync.write(diff));
  }
  if (!regions.length && before.width === after.width) return { status: "same" };
  return { status: "changed", before, after, changedPixels, regions };
}

/** The first row of the top tile where the captures differ, or where the shorter one ends. */
async function firstDifference(files: ShotFiles): Promise<Region> {
  const a = PNG.sync.read(await readFile(tileFile(files.before, 0)));
  const b = PNG.sync.read(await readFile(tileFile(files.after, 0)));
  const rows = Math.min(a.height, b.height);
  let row = 0;
  if (a.width === b.width) {
    scan: for (; row < rows; row++) {
      for (let x = 0; x < a.width; x++) {
        if (differs(a.data, b.data, (row * a.width + x) * 4)) break scan;
      }
    }
  }
  // Everything below the first difference can shift, so the region spans the full width.
  const height = Math.max(a.height, b.height);
  return { tile: 0, width: a.width, height, top: row, bottom: row, left: 0, right: a.width - 1 };
}
