import { writeFile } from "node:fs/promises";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import type { Prep } from "./shots.ts";

export type Capture = { width: number; height: number; tiles: number };

// Software rasterization and full compositing before each frame make repeated captures byte-identical.
const CHROME_ARGS = [
  "--disable-gpu",
  "--disable-gpu-rasterization",
  "--disable-partial-raster",
  "--disable-skia-runtime-opts",
  "--force-color-profile=srgb",
  "--run-all-compositor-stages-before-draw",
  "--disable-new-content-rendering-timeout",
  "--disable-threaded-animation",
  "--disable-threaded-scrolling",
  "--disable-checker-imaging",
  "--disable-image-animation-resync",
  "--font-render-hinting=none",
  "--disable-lcd-text",
];

/** Uses the installed Google Chrome, or the browser at CHROME_PATH. */
export async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.CHROME_PATH;
  try {
    return await chromium.launch({
      ...(executablePath ? { executablePath } : { channel: "chrome" }),
      headless: true,
      args: CHROME_ARGS,
    });
  } catch (error) {
    const reason = (error as Error).message.split("\n")[0];
    throw new Error(
      `Couldn't start Chrome (${reason}). Install Google Chrome, or set CHROME_PATH to a Chrome or Chromium binary.`,
    );
  }
}

// Pages taller than this are captured as overlapping scrolled tiles.
const MAX_HEIGHT = 20000;
const TILE_OVERLAP = 200;

const nextFrames = (page: Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const pageHeight = (page: Page) =>
  page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));

/** A capture right after a large resize can be partly redrawn, so capture until two in a row match. */
async function stableScreenshot(page: Page, file: string) {
  const shoot = () => page.screenshot({ animations: "disabled", caret: "hide" });
  let previous = await shoot();
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.waitForTimeout(200);
    const current = await shoot();
    if (current.equals(previous)) {
      await writeFile(file, current);
      return;
    }
    previous = current;
  }
  throw new Error("the page never rendered the same way twice");
}

/**
 * Loads a page, waits until fonts and client:load islands are ready, applies `prep`, then captures
 * the whole page as ordinary viewport screenshots. Chrome's beyond-viewport capture isn't deterministic,
 * so the window is resized to the page height instead.
 */
export async function capturePage(
  context: BrowserContext,
  url: string,
  fileBase: string,
  width: number,
  prep?: Prep,
): Promise<Capture> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    // Load every font face up front, so content revealed later (open folds) can't reflow mid-capture.
    await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((face) => face.load().catch(() => undefined)));
      await document.fonts.ready;
    });
    await page
      .waitForFunction(() => !document.querySelector('astro-island[ssr][client="load"]'), null, {
        timeout: 10000,
      })
      .catch(() => undefined);
    await page.waitForTimeout(150);
    if (prep) {
      await prep(page);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.waitForTimeout(150);
    }
    // In a window thousands of pixels tall, Chrome sometimes paints the sticky mobile top bar at a stale
    // position, so it's pinned in place for capture.
    await page.addStyleTag({ content: ".topbar { position: relative !important; }" });
    await nextFrames(page);
    // Measure once at the normal window size, then resize to fit. Resizing again never settles on
    // mobile: .shell has min-height: 100vh and the top bar sits outside it.
    const height = await pageHeight(page);
    const windowHeight = Math.min(height, MAX_HEIGHT);
    await page.setViewportSize({ width, height: windowHeight });
    await nextFrames(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    let tiles = 0;
    for (let y = 0; ; y += windowHeight - TILE_OVERLAP) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await nextFrames(page);
      await stableScreenshot(page, `${fileBase}.${tiles++}.png`);
      if (y + windowHeight >= height) break;
    }
    return { width: scrollWidth, height, tiles };
  } finally {
    await page.close();
  }
}
