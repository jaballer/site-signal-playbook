import { writeFile } from "node:fs/promises";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";
import type { Prep } from "./shots.ts";

/**
 * One captured page: its scrollable size, and `tiles` screenshots saved row by row, `columns` to a row.
 * A page taller or wider than the window is captured by scrolling.
 */
export type Capture = { width: number; height: number; tiles: number; columns: number };

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

// Pages taller than this are captured as overlapping scrolled rows of tiles.
const MAX_HEIGHT = 20000;
const TILE_OVERLAP = 200;

const nextFrames = (page: Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

const pageHeight = (page: Page) =>
  page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));

type Clip = { x: number; y: number; width: number; height: number };

/** A capture right after a large resize can be partly redrawn, so capture until two in a row match. */
async function stableScreenshot(page: Page, file: string, clip?: Clip) {
  const shoot = () => page.screenshot({ animations: "disabled", caret: "hide", clip });
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
 * Opens a page and waits until its fonts and client:load islands are ready. Throws when a font or
 * stylesheet doesn't load or an island doesn't hydrate, because screenshots of that page wouldn't show
 * the real site (fallback fonts, for example) and could still match each other.
 */
async function openPage(context: BrowserContext, url: string): Promise<Page> {
  const page = await context.newPage();
  const failed: string[] = [];
  const noteFailure = (resourceType: string, assetUrl: string) => {
    if (resourceType === "font" || resourceType === "stylesheet") failed.push(assetUrl);
  };
  page.on("requestfailed", (request) => noteFailure(request.resourceType(), request.url()));
  page.on("response", (response) => {
    if (response.status() >= 400) noteFailure(response.request().resourceType(), response.url());
  });
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    // Load every font face up front, so content revealed later (open folds) can't reflow mid-capture.
    const brokenFaces = await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((face) => face.load().catch(() => undefined)));
      await document.fonts.ready;
      return [...document.fonts]
        .filter((face) => face.status === "error")
        .map((face) => `${face.family} ${face.weight}`);
    });
    const missing = [...failed, ...brokenFaces];
    if (missing.length) {
      throw new Error(`fonts or stylesheets didn't load: ${missing.slice(0, 3).join(", ")}`);
    }
    await page
      .waitForFunction(() => !document.querySelector('astro-island[ssr][client="load"]'), null, {
        timeout: 10000,
      })
      .catch(() => {
        throw new Error("client:load islands didn't hydrate within 10 seconds");
      });
    return page;
  } catch (error) {
    await page.close();
    throw error;
  }
}

/** Opens a page once and throws if it doesn't load properly, so a broken setup fails before any capture. */
export async function checkPage(browser: Browser, url: string) {
  const context = await browser.newContext();
  try {
    const page = await openPage(context, url);
    await page.close();
  } finally {
    await context.close();
  }
}

/**
 * Loads a page, applies `prep`, then captures the whole page as ordinary window screenshots. Chrome's
 * beyond-viewport capture isn't deterministic, so the window is resized to the page height instead.
 */
export async function capturePage(
  context: BrowserContext,
  url: string,
  fileBase: string,
  width: number,
  prep?: Prep,
): Promise<Capture> {
  const page = await openPage(context, url);
  try {
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
    // Size the window to the page, then measure again. On small screens the page grows with the window
    // (.shell has min-height: 100vh and the top bar sits outside it), so it never fits, and the rows below
    // the window are captured by scrolling down.
    const windowHeight = Math.min(await pageHeight(page), MAX_HEIGHT);
    await page.setViewportSize({ width, height: windowHeight });
    await nextFrames(page);
    const height = await pageHeight(page);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    let tiles = 0;
    let columns = 0;
    let capturedTo = 0;
    for (let row = 0; capturedTo < height; row++) {
      // Rows overlap by TILE_OVERLAP. The last row can only scroll as far as the page ends, so it keeps
      // just the rows not captured yet, plus the overlap.
      const top = Math.min(row * (windowHeight - TILE_OVERLAP), Math.max(0, height - windowHeight));
      const skip = row ? Math.max(0, capturedTo - TILE_OVERLAP - top) : 0;
      const clip = skip ? { x: 0, y: skip, width, height: windowHeight - skip } : undefined;
      // Content wider than the window is captured by scrolling sideways. Widening the window instead
      // would change the layout being tested.
      columns = 0;
      for (let left = 0; ; left += width) {
        await page.evaluate((position) => window.scrollTo(position), { left, top });
        await nextFrames(page);
        await stableScreenshot(page, `${fileBase}.${tiles++}.png`, clip);
        columns++;
        if (left + width >= scrollWidth) break;
      }
      capturedTo = top + windowHeight;
    }
    return { width: scrollWidth, height, tiles, columns };
  } finally {
    await page.close();
  }
}
