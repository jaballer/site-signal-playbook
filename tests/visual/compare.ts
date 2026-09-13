import { readFile, writeFile } from "node:fs/promises";
import { PNG } from "pngjs";
import type { Capture } from "./capture.ts";

// Rounded corners of scrolling containers can anti-alias a level or two differently between captures of
// the same page, so channel differences up to this much don't count as changes.
const TOLERANCE = 2;

/**
 * The box from `left`,`top` to `right`,`bottom` (inclusive) in a tile image of `width` × `height` pixels:
 * tile number `tile` of the before capture and `afterTile` of the after capture. The two numbers only
 * differ when the page size changed.
 */
export type Region = {
  tile: number;
  afterTile: number;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type Comparison =
  | { status: "same" }
  /** Same page size. `regions` holds the changed area of each tile that changed. */
  | { status: "changed"; before: Capture; after: Capture; changedPixels: number; regions: Region[] }
  /** The page size changed, so pixels can't be compared one to one. `region` is where the pages first differ. */
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
  const resized = async (): Promise<Comparison> => ({
    status: "resized",
    before,
    after,
    region: await firstDifference(before, after, files),
  });
  if (
    before.width !== after.width ||
    before.height !== after.height ||
    before.tiles !== after.tiles
  ) {
    return resized();
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
    if (a.width !== b.width || a.height !== b.height) return resized();
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
    const { width, height } = a;
    regions.push({ tile: index, afterTile: index, width, height, top, bottom, left, right });
    await writeFile(tileFile(files.diff, index), PNG.sync.write(diff));
  }
  if (!regions.length) return { status: "same" };
  return { status: "changed", before, after, changedPixels, regions };
}

/**
 * Where two captures of different sizes first differ. Tiles are matched by row and column in reading
 * order, and a tile that only one capture has is matched with the other capture's nearest tile.
 */
async function firstDifference(before: Capture, after: Capture, files: ShotFiles): Promise<Region> {
  const rowsOf = (capture: Capture) => capture.tiles / capture.columns;
  const tileAt = (capture: Capture, row: number, column: number) =>
    Math.min(row, rowsOf(capture) - 1) * capture.columns + Math.min(column, capture.columns - 1);
  const rows = Math.max(rowsOf(before), rowsOf(after));
  const columns = Math.max(before.columns, after.columns);

  let region: Region | undefined;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const tile = tileAt(before, row, column);
      const afterTile = tileAt(after, row, column);
      const a = PNG.sync.read(await readFile(tileFile(files.before, tile)));
      const b = PNG.sync.read(await readFile(tileFile(files.after, afterTile)));
      const shared = Math.min(a.height, b.height);
      let y = 0;
      if (a.width === b.width) {
        scan: for (; y < shared; y++) {
          for (let x = 0; x < a.width; x++) {
            if (differs(a.data, b.data, (y * a.width + x) * 4)) break scan;
          }
        }
      }
      // Everything after the first difference can shift, so the region spans the tile's full width.
      const height = Math.max(a.height, b.height);
      region = {
        tile,
        afterTile,
        width: a.width,
        height,
        top: y,
        bottom: y,
        left: 0,
        right: a.width - 1,
      };
      if (y < shared || a.height !== b.height) return region;
    }
  }
  // Every matched pair was identical; point at the last one.
  return region!;
}
