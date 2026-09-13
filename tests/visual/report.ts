import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Comparison, Region } from "./compare.ts";

export type ShotResult = {
  variant: string;
  shot: string;
  path: string;
  result: Comparison | { status: "error"; message: string };
};

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const escape = (text: string) => text.replace(/[&<>"]/g, (c) => ENTITIES[c]);
const px = (n: number) => `${n.toLocaleString("en-US")} px`;
const sentence = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;

/** A one-line description of a result, for the terminal and the report. */
export function summarize(result: ShotResult["result"]): string {
  switch (result.status) {
    case "same":
      return "matches";
    case "error":
      return `couldn't capture it (${result.message})`;
    case "resized":
      return `page height changed from ${px(result.before.height)} to ${px(result.after.height)}`;
    case "changed": {
      const parts: string[] = [];
      if (result.changedPixels)
        parts.push(`${result.changedPixels.toLocaleString("en-US")} pixels changed`);
      if (result.before.width !== result.after.width) {
        parts.push(
          `scrollable width changed from ${px(result.before.width)} to ${px(result.after.width)}`,
        );
      }
      return parts.join("; ");
    }
  }
}

// Figures show the changed area with some context around it instead of the whole page.
const CONTEXT = 80;
const MIN_COLUMNS = 400;
const MIN_ROWS = 240;
const MAX_ROWS = 1200;

/** The pixel range [from, to) covering `first` to `last` plus context, at least `min` long, within `size`. */
function span(first: number, last: number, min: number, size: number): [number, number] {
  const from = Math.max(0, first - CONTEXT);
  const to = Math.min(size, last + 1 + CONTEXT);
  if (to - from >= min) return [from, to];
  const start = Math.max(0, Math.min(from - Math.floor((min - (to - from)) / 2), size - min));
  return [start, Math.min(size, start + min)];
}

/** One image cropped to `region`, linking to the full image. */
function figure(label: string, src: string, region: Region) {
  const [left, right] = span(region.left, region.right, MIN_COLUMNS, region.width);
  const [top, end] = span(region.top, region.bottom, MIN_ROWS, region.height);
  const bottom = Math.min(end, top + MAX_ROWS);
  // The image is scaled so the cropped columns fill the box, then shifted. Percentages are of the box's
  // width, including the top margin.
  const percent = (n: number) => `${((n / (right - left)) * 100).toFixed(4)}%`;
  const style = `width: ${percent(region.width)}; margin: ${percent(-top)} 0 0 ${percent(-left)}`;
  return `<figure>
  <figcaption>${label} <a href="${escape(src)}">full image</a></figcaption>
  <a class="crop" href="${escape(src)}" style="aspect-ratio: ${right - left} / ${bottom - top}">
    <img src="${escape(src)}" alt="" loading="lazy" style="${style}">
  </a>
</figure>`;
}

const shotTitle = ({ variant, shot, path }: ShotResult) =>
  escape(`${variant} · ${path}${variant === "states" ? ` · ${shot}` : ""}`);

type Side = [label: string, folder: string];
const BEFORE_AFTER: Side[] = [
  ["Before", "before"],
  ["After", "after"],
];
const WITH_DIFF: Side[] = [...BEFORE_AFTER, ["Changed pixels", "diff"]];

function section(id: string, shotResult: ShotResult) {
  const { variant, shot, result } = shotResult;
  const figures = (sides: Side[], region: Region) =>
    `<div class="row">${sides
      .map(([label, folder]) =>
        figure(label, `${variant}/${folder}/${shot}.${region.tile}.png`, region),
      )
      .join("")}</div>`;

  let body = "";
  if (result.status === "resized") {
    body = `<p>The pages first differ ${px(result.region.top)} from the top.</p>
${figures(BEFORE_AFTER, result.region)}`;
  } else if (result.status === "changed") {
    const parts = result.before.tiles;
    body = result.regions
      .map((region) => {
        const heading = parts > 1 ? `<h3>Part ${region.tile + 1} of ${parts}</h3>\n` : "";
        return heading + figures(WITH_DIFF, region);
      })
      .join("\n");
  }
  return `<section id="${id}">
<h2>${shotTitle(shotResult)}</h2>
<p class="${result.status === "error" ? "bad" : ""}">${escape(sentence(summarize(result)))}</p>
${body}
</section>`;
}

/** Writes index.html next to the images, covering every shot that didn't match. */
export async function writeReport(
  dir: string,
  run: { base: string; results: ShotResult[]; added: string[]; removed: string[] },
) {
  const problems = run.results.filter((r) => r.result.status !== "same");
  const pageList = (label: string, pages: string[]) =>
    pages.length
      ? `<p>${label}: ${pages.map((p) => `<code>${escape(p)}</code>`).join(", ")}</p>`
      : "";
  const contents = problems
    .map(
      (r, i) => `<li><a href="#shot-${i}">${shotTitle(r)}</a>: ${escape(summarize(r.result))}</li>`,
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visual comparison</title>
<style>
  :root { color-scheme: light dark; --line: light-dark(#d6dde4, #2f3a46); --muted: light-dark(#4a5a6a, #b4bfca); }
  body { font: 14px/1.5 system-ui, sans-serif; margin: 0 auto; padding: 24px; max-width: 1600px; }
  h1 { font-size: 22px; margin: 0; }
  h2 { font-size: 16px; margin: 0; }
  h3 { font-size: 13px; margin: 16px 0 0; }
  section { border-top: 1px solid var(--line); padding: 20px 0; }
  .row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; align-items: start; margin-top: 10px; }
  figure { margin: 0; }
  figcaption { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
  figcaption a { margin-left: 6px; }
  .crop { display: block; overflow: hidden; border: 1px solid var(--line); }
  .crop img { display: block; max-width: none; }
  .bad { color: light-dark(#b23a48, #e07a87); }
  code { font-size: 13px; }
</style>
</head>
<body>
<h1>Visual comparison</h1>
<p>${escape(run.base)} compared with the working tree. ${run.results.length} shots: ${run.results.length - problems.length} match, ${problems.length} differ.</p>
${pageList("Pages only in the working tree, not compared", run.added)}
${pageList("Pages only in the base, not compared", run.removed)}
${problems.length ? `<ol>${contents}</ol>` : "<p>Every shot matches.</p>"}
${problems.map((r, i) => section(`shot-${i}`, r)).join("\n")}
</body>
</html>
`;
  await writeFile(join(dir, "index.html"), html);
}
