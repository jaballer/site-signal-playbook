import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import type { Browser } from "playwright-core";
import { site } from "../../apps/site/src/site.ts";
import { buildRef, buildWorkingTree, git } from "./builds.ts";
import { capturePage, checkPage, launchBrowser, type Capture } from "./capture.ts";
import { compareCaptures, type ShotFiles } from "./compare.ts";
import { summarize, writeReport, type ShotResult } from "./report.ts";
import { pagesIn, serveStatic } from "./server.ts";
import { planVariants, type Variant } from "./shots.ts";

const VARIANT_NAMES = planVariants([], { quick: false }).map((v) => v.name);

const USAGE = `Compares every page of the site, pixel by pixel, between a git ref and the working tree.

Usage: npm run test:visual -- [options]

  --base <ref>      Git ref to compare against (default: main)
  --quick           Only chapter pages and the first page of each collection
  --only <names>    Comma-separated variants, for example desktop-light,mobile-dark
  --pages <paths>   Comma-separated page paths, for example /signals/,/glossary/geo/
  -h, --help        Show this help

Variants: ${VARIANT_NAMES.join(", ")}

Needs Google Chrome (or CHROME_PATH set to a Chrome or Chromium binary) and a network connection for
the site's fonts. Writes a report to .visual/report/index.html. Exits with 1 when any shot differs or
a page from the base is missing, and 2 when the comparison can't run.`;

const OPTIONS = {
  base: { type: "string", default: "main" },
  quick: { type: "boolean", default: false },
  only: { type: "string" },
  pages: { type: "string" },
  help: { type: "boolean", short: "h", default: false },
} as const;

// Pages captured at the same time, in one browser.
const CONCURRENCY = 8;

const log = (message: string) => console.log(message);
const listPages = (pages: string[]) =>
  pages.length > 10
    ? `${pages.slice(0, 10).join(", ")} and ${pages.length - 10} more`
    : pages.join(", ");
const firstLine = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split("\n")[0];
const splitList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
/** "signals", "/signals" and "/signals/" all mean the page at /signals/. */
const pagePath = (value: string) => {
  const inner = value.replace(/^\/+|\/+$/g, "");
  return inner ? `/${inner}/` : "/";
};

async function pool(tasks: Array<() => Promise<void>>, size: number) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) await tasks[next++]();
  };
  await Promise.all(Array.from({ length: size }, worker));
}

/** Captures every shot of a variant from both builds, then compares each pair. */
async function runVariant(
  browser: Browser,
  variant: Variant,
  reportDir: string,
  origins: { before: string; after: string },
): Promise<ShotResult[]> {
  const dir = join(reportDir, variant.name);
  const sides = ["before", "after", "diff"];
  for (const side of sides) mkdirSync(join(dir, side), { recursive: true });

  const captures = variant.shots.map(
    (): { before?: Capture; after?: Capture; error?: string } => ({}),
  );
  const context = await browser.newContext({
    viewport: variant.viewport,
    colorScheme: variant.colorScheme,
  });
  try {
    // Saved state a returning visitor would have: a theme choice (toggle variants).
    await context.addInitScript(
      ({ keys, theme }) => {
        try {
          if (theme) localStorage.setItem(keys.theme, theme);
        } catch {
          // Without storage the page still renders.
        }
      },
      { keys: site.storageKeys, theme: variant.theme ?? null },
    );
    const tasks = variant.shots.flatMap((shot, i) =>
      (["before", "after"] as const).map((side) => async () => {
        try {
          const url = origins[side] + shot.path;
          captures[i][side] = await capturePage(
            context,
            url,
            join(dir, side, shot.name),
            variant.viewport.width,
            shot.prep,
          );
        } catch (error) {
          captures[i].error ??=
            `${side === "before" ? "base" : "working tree"}: ${firstLine(error)}`;
        }
      }),
    );
    await pool(tasks, CONCURRENCY);
  } finally {
    await context.close();
  }

  const results: ShotResult[] = [];
  for (const [i, shot] of variant.shots.entries()) {
    const { before, after, error } = captures[i];
    const files: ShotFiles = {
      before: join(dir, "before", shot.name),
      after: join(dir, "after", shot.name),
      diff: join(dir, "diff", shot.name),
    };
    let result: ShotResult["result"];
    if (!before || !after || error) {
      result = { status: "error", message: error ?? "capture failed" };
    } else {
      result = await compareCaptures(before, after, files);
      // Only shots with differences keep their images.
      if (result.status === "same") {
        for (let tile = 0; tile < before.tiles; tile++) {
          rmSync(`${files.before}.${tile}.png`, { force: true });
          rmSync(`${files.after}.${tile}.png`, { force: true });
        }
      }
    }
    results.push({ variant: variant.name, shot: shot.name, path: shot.path, result });
  }

  for (const side of sides) {
    if (!readdirSync(join(dir, side)).length) rmSync(join(dir, side), { recursive: true });
  }
  if (!readdirSync(dir).length) rmSync(dir, { recursive: true });
  return results;
}

async function main(): Promise<number> {
  const { values: options } = parseArgs({ options: OPTIONS });
  if (options.help) {
    log(USAGE);
    return 0;
  }
  const onlyVariants = splitList(options.only);
  const unknownVariants = onlyVariants?.filter((name) => !VARIANT_NAMES.includes(name)) ?? [];
  if (unknownVariants.length) {
    throw new Error(
      `Unknown variant: ${unknownVariants.join(", ")}. Variants: ${VARIANT_NAMES.join(", ")}.`,
    );
  }
  const onlyPages = splitList(options.pages)?.map(pagePath);

  const repo = git(process.cwd(), "rev-parse", "--show-toplevel");
  const reportDir = join(repo, ".visual", "report");
  // Launching first means a missing Chrome is reported before the builds run.
  const browser = await launchBrowser();
  try {
    const base = buildRef(repo, options.base, join(repo, ".visual", "base"), log);
    log("Building the working tree…");
    const currentDist = buildWorkingTree(repo);

    const basePages = pagesIn(base.dist);
    const currentPages = pagesIn(currentDist);
    const pages = currentPages.filter((p) => basePages.includes(p));
    const added = currentPages.filter((p) => !basePages.includes(p));
    const removed = basePages.filter((p) => !currentPages.includes(p));
    const unknownPages = onlyPages?.filter((p) => !pages.includes(p)) ?? [];
    if (unknownPages.length)
      throw new Error(`Not a page in both builds: ${unknownPages.join(", ")}.`);

    const variants = planVariants(pages, { quick: options.quick })
      .filter((v) => !onlyVariants || onlyVariants.includes(v.name))
      .map((v) => ({
        ...v,
        shots: v.shots.filter((s) => !onlyPages || onlyPages.includes(s.path)),
      }))
      .filter((v) => v.shots.length);
    if (!variants.length)
      throw new Error("The chosen variants don't include any of the chosen pages.");

    const { label } = base;
    const total = variants.reduce((sum, v) => sum + v.shots.length, 0);
    log(
      `Comparing ${label} with the working tree: ${total} shots in ${variants.length} variants.\n`,
    );

    rmSync(reportDir, { recursive: true, force: true });
    mkdirSync(reportDir, { recursive: true });
    const [baseServer, currentServer] = await Promise.all([
      serveStatic(base.dist),
      serveStatic(currentDist),
    ]);
    const results: ShotResult[] = [];
    try {
      // Check each build's home page once, so a broken setup (offline, for example) fails before any capture.
      for (const [name, origin] of [
        [label, baseServer.origin],
        ["the working tree", currentServer.origin],
      ]) {
        try {
          await checkPage(browser, `${origin}/`);
        } catch (error) {
          const reason = firstLine(error);
          const hint = reason.startsWith("fonts or stylesheets")
            ? " The fonts come from Google Fonts, so check the network connection."
            : "";
          throw new Error(`The home page of ${name} didn't load properly: ${reason}.${hint}`);
        }
      }
      for (const variant of variants) {
        const origins = { before: baseServer.origin, after: currentServer.origin };
        const variantResults = await runVariant(browser, variant, reportDir, origins);
        const differ = variantResults.filter((r) => r.result.status !== "same").length;
        const count = `${variant.shots.length} shots`.padStart(9);
        log(`  ${variant.name.padEnd(24)} ${count}, ${differ ? `${differ} differ` : "all match"}`);
        results.push(...variantResults);
      }
    } finally {
      baseServer.server.close();
      currentServer.server.close();
    }

    await writeReport(reportDir, { base: label, results, added, removed });
    writeFileSync(
      join(reportDir, "results.json"),
      `${JSON.stringify({ base: label, added, removed, results }, null, 2)}\n`,
    );

    const problems = results.filter((r) => r.result.status !== "same");
    log(
      `\n${results.length} shots: ${results.length - problems.length} match, ${problems.length} differ.`,
    );
    for (const p of problems.slice(0, 25)) {
      log(
        `  ${p.variant} ${p.path}${p.variant === "states" ? ` (${p.shot})` : ""}: ${summarize(p.result)}`,
      );
    }
    if (problems.length > 25) log(`  …and ${problems.length - 25} more.`);
    // A page that disappeared is a regression too, unless --pages limited the run to other pages.
    const missingFails = removed.length > 0 && !onlyPages;
    if (removed.length) {
      const note = missingFails ? "" : " (not counted as a failure, because --pages was given)";
      log(`Missing from the working tree: ${listPages(removed)}${note}.`);
    }
    if (added.length) log(`New in the working tree, not compared: ${listPages(added)}.`);
    log(`Report: ${join(reportDir, "index.html")}`);
    return problems.length || missingFails ? 1 : 0;
  } finally {
    await browser.close();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  },
);
