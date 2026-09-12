# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The whole project is one file, `site-signal-playbook.html`. It's a self-contained playbook for measuring revenue and performance on a SaaS marketing website, written for the technical owner who works with marketing stakeholders. It has no build step, package manager, tests, linter or git repo. To view it, open the file in a browser:

```bash
open site-signal-playbook.html
```

The only external dependency is Google Fonts (Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono), and each font has a system fallback. Don't add other CDNs or external assets. Anything new should be inlined.

## File layout

The file has three parts, in this order:

1. **`<head>` plus the top of `<body>`.** A minimal reset lives in `<head>`. The page's real `<title>`, font `<link>` and main `<style>` block sit at the top of `<body>`.
2. **Static HTML chapters.** Each chapter is a `<section class="chapter" id="...">` inside `<main>`. Only the section with `.active` is shown.
3. **One inline `<script>`.** It holds the data arrays and the render code.

Some content is plain HTML and some is generated from data. Check which kind you're editing before you change it:

| Chapter (section id) | Where the content lives |
|---|---|
| `overview`, `questions`, `contract`, `diagnostics`, `reporting`, `app` | Hand-written HTML in the section |
| `recipes` | Intro and the five-step loop are HTML. The recipe cards come from the `RECIPES` array, rendered into `#recipeList` |
| `phases` | `PHASES` array. Rendered into `#phaseTabs` / `#phaseBody` |
| `catalog` | `METRICS` array, plus the `L` (layers) and `P` (phases) lookup maps. Rendered into `#cards` |
| `lessons` | `LESSONS` array. Rendered into `#lessonGrid` |

### Routing and nav
- `CHAPTERS` is the single list of `[id, label]` pairs. It builds both the desktop sidebar (`#navlinks`) and the mobile top bar's scrolling link row (`#topbarLinks` inside `#topbar`). The mobile bar appears below 820px.
- Navigation uses the URL hash (`show(location.hash)`). To add a chapter, add a `<section class="chapter" id="x">` and a matching `CHAPTERS` entry. An unknown hash falls back to `overview`.
- Deep links take the form `#chapter/target`, handled by `openTarget()`:
  - `#recipes/<recipe id>` opens that recipe.
  - `#catalog/<signal id>` clears the filters and opens that card.
  - `#diagnostics/d1` (or `d2`, `d3`) selects that tab.
- The first `show()` call is at the very end of the script, so everything it can open already exists when a deep link loads.

### Data shapes
- **`METRICS` entries are positional arrays:** `[id, title, layerKey, phases[], question, definition, source, howToCapture, howToRead, fieldNote]`.
  - `layerKey` must be a key of `L`: `rev`, `acq`, `eng`, `ai`, `perf` or `int`.
  - Phase filter buttons are built only from `P`, which currently covers phases 2–5. If you tag a signal with phase 1 or 6, add that phase to `P` too, or no filter will match it.
- **`PHASES` entries:** `{n, t, w, why, items[], deliv[]}`.
- **`LESSONS` entries:** `[title, body]`.
- **`RECIPES` entries:** `{id, q, who, box, want, steps[], read[], check, say, signals?, diags?, related?, links?}`.
  - The recipes are standard procedures for the questions a marketer or executive asks. They're written for that audience: GA4 and Search Console menu paths in plain steps, not API queries or field names. Keep them at that level.
  - `box` is the timebox, and `check` renders as "Before you start".
  - In `say`, each `[placeholder]` is highlighted on the page, and the Copy button copies the raw string.
  - `signals` are catalog ids; unknown ones are dropped silently. `diags` are keys of `DIAGS`. `related` are other recipe ids. `links` are `[href, label]` pairs.
  - Recipe 00 ("Can we trust these numbers?") is the prerequisite that the other recipes link back to.
- All strings go into `innerHTML` through template literals, so they're HTML. Use entities for a literal `&` or `<`. Inline tags like `<code>` render as markup.

### Checklist persistence
- Phase checklist state is saved in `localStorage` under the key `ssp-checks`.
- Each item's key is `phaseIndex-itemIndex`, based on array position. Inserting, deleting or reordering items in `PHASES` shifts which saved checkmarks attach to which items.
- The sidebar progress count adds up every truthy key, including keys for items that no longer exist.

## Styling conventions
- All colors come from CSS custom properties: `--ink*`, `--ground`, `--surface*`, `--line`, `--accent*`, and `--good` / `--warn` / `--crit` with their `-soft` variants.
- The light palette is on `:root`. The dark palette is defined **twice**, identically: once under `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])`, and once under `:root[data-theme="dark"]`. When you change a dark token, change both copies.
- **Theme toggle:** with no saved choice, the page follows the OS setting and leaves `data-theme` unset. Clicking a `.theme-btn` sets `data-theme` on `<html>` and saves it in `localStorage` under `ssp-theme`.
  - There are two buttons, kept in sync by `renderTheme()`: one with a text label at the bottom of the sidebar, and one icon-only button in the mobile top bar.
  - A one-line script right after the main `<style>` applies the saved theme before any content renders, which prevents a flash of the wrong theme. Keep it above the markup.
- Fonts use `--sans`, `--mono` and `--display`. The corner radius is `--r`.
- Wide tables go inside a `.tw` wrapper, which scrolls horizontally, so the page body never does.
- Reusable pieces: `.panel`, `.grid.g2` / `.g3`, `.pill` (`.acc` / `.good` / `.warn` / `.crit`), `.callout` (`.warn`), `.thesis`, `.ledger`, `.flow` + `.step` (auto-numbered with a CSS counter), `.eyebrow`, `.lede`.

## Content consistency
The Overview's prose quotes counts that must match the data: "Nine chapters" (every chapter except Overview), "a 48-signal catalog" (the length of `METRICS`), "six-phase", and "six layers" (the keys of `L`). If you add or remove signals, chapters, phases or layers, update that copy as well.

The footer states the Core Web Vitals thresholds (LCP, INP, CLS, TTFB). The `lcp`, `inp`, `cls` and `ttfb` catalog entries repeat them, so keep both places in sync.
