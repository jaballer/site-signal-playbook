# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The whole project is one file, `site-signal-playbook.html`. It's the operating playbook for an SEO and AI search agency working on B2B marketing websites. The owner runs the agency on it.

It covers:
- the questions leadership asks, with step-by-step answers
- the engagement model and service offers
- a six-pillar audit and a play library
- diagnostics, reporting, a signal catalog, measurement setup, and principles

There's no build step, package manager, tests or linter. The project is a git repo, so earlier versions are in git history. To view the page:

```bash
open site-signal-playbook.html
```

The only external dependency is Google Fonts, and every font has a system fallback. Don't add other CDNs or external assets.

## Writing level

Write for marketers, executives and account strategists. Use plain procedural steps with menu paths in GA4, Search Console and standard SEO tools. Don't write API request bodies, dimension or metric field names, or SQL; offer those as an optional appendix only if asked. Avoid made-up statistics. Name tools as examples ("Ahrefs, Semrush or similar"), never as requirements.

## File layout

The file has three parts, in this order:

1. **`<head>` plus the top of `<body>`.** A minimal reset lives in `<head>`. The page's real `<title>`, font link, main `<style>` block, and a one-line early theme script sit at the top of `<body>`.
2. **Static HTML chapters.** Each chapter is a `<section class="chapter" id="...">` inside `<main>`. Only the section with `.active` is shown.
3. **One inline `<script>`.** It holds the data arrays and the render code.

Some chapter content is plain HTML and some is generated from data:

| Chapter (section id) | Where the content lives |
|---|---|
| `overview`, `reporting`, `measurement` | Hand-written HTML |
| `diagnostics` | Hand-written HTML: tab buttons with `data-d`, and `.diag#d1`–`#d4` panels. Tab labels are repeated in the `DIAGS` map. |
| `recipes` (nav label "Leader questions") | Intro HTML, plus the `RECIPES` array rendered into `#recipeList` |
| `engagement` | `PHASES` array rendered into `#phaseTabs` / `#phaseBody`. The Offers and Who-does-what tables are HTML. |
| `audit` | `AUDIT` array rendered into `#auditList`. The scoring table and "From checks to findings" are HTML. |
| `plays` | `PLAYS` array rendered into `#playList`. The prioritization model is HTML. |
| `catalog` | `METRICS` array plus the `L` layer map, rendered into `#cards` |
| `principles` | `LESSONS` array rendered into `#lessonGrid` |

### Routing
- `CHAPTERS` lists `[id, label]` pairs. It builds the desktop sidebar (`#navlinks`) and the mobile top bar's link row (`#topbarLinks`). The mobile bar appears below 820px.
- Deep links take the form `#chapter/target`, handled by `openTarget()`:
  - `#recipes/<id>`, `#audit/<id>` and `#plays/<id>` open the `<details class="fold">` whose element id is `<chapter>-<id>`.
  - `#catalog/<signal id>` clears the filters and opens that card.
  - `#diagnostics/d1` (through `d4`) selects that tab.
- The first `show()` call is at the very end of the script, after everything it can open has rendered.

### Data shapes
- **`METRICS`:** positional arrays, `[id, title, layerKey, phases[], question, definition, source, howToCapture, howToRead, fieldNote]`.
  - `layerKey` must be a key of `L`: `found`, `content`, `vis`, `ai`, `traffic`, `rev` or `int`. The scorecard table in Overview lists the same seven layers by name, so keep the two in sync.
  - `phases` are 1-based indexes into `PHASES`. The phase filter buttons are built from whichever phases the signals actually use.
- **`PHASES`:** `{n, t, w, why, items[], deliv[]}`.
- **`RECIPES`:** `{id, q, who, box, want, steps[], read[], check, say, signals?, diags?, related?, links?}`.
  - `box` is the timebox, and `check` renders as "Before you start".
  - In `say`, each `[placeholder]` is highlighted, and the Copy button copies the raw string.
  - `diags` are `DIAGS` keys, `related` are recipe ids, and `links` are `[href, label]` pairs.
- **`AUDIT`:** `{id, name, q, signals[], checks: [[check, howToCheck, failLooksLike]]}`.
- **`PLAYS`:** `{id, name, when, effort, signal, steps[], moves[], watch}`. `signal` is the time to first signal, and `moves` are catalog ids.
- **`LESSONS`:** `[title, body]`.
- **Links between them:** `signals` and `moves` must be catalog ids, and unknown ids are dropped silently. After adding or renaming a signal, check in the console that every reference still resolves.
- **HTML strings:** everything is rendered through `innerHTML`, so strings are HTML. Inside double-quoted JS strings, use single-quoted attributes (`<a href='#plays'>`).

### State
- The phase checklist is saved in `localStorage` under `ssp-checks-v2`, keyed `phaseIndex-itemIndex` by position. Reordering or inserting `PHASES` items shifts which saved ticks attach to which items. The progress count only includes items that currently exist.
- The theme choice is saved under `ssp-theme`. With no saved choice, the page follows the OS setting and leaves `data-theme` unset. Clicking a `.theme-btn` sets `data-theme` on `<html>`.

## Styling conventions
- All colors come from CSS custom properties. The light palette is on `:root`.
- The dark palette is defined **twice**, identically: once under `@media (prefers-color-scheme: dark)` scoped to `:root:not([data-theme="light"])`, and once under `:root[data-theme="dark"]`. When you change a dark token, change both copies.
- Wide tables go inside a `.tw` wrapper, which scrolls horizontally, so the page body never does.
- Reusable pieces:
  - `.panel`, `.grid.g2` / `.g3`, `.pill` (`.acc` / `.good` / `.warn` / `.crit`), `.callout` (`.warn`), `.thesis`, `.ledger`
  - `.flow` + `.step` (auto-numbered), `.loop` (numbered strip), `.chain-base`
  - `.fold` (accordion card used by recipes, audit and plays)
  - `.eyebrow`, `.lede`

## Content consistency
- The Overview says "Nine chapters" (every chapter except Overview) and names each one. Update it when chapters change.
- The signal count renders automatically into `[data-count="signals"]`.
- The Core Web Vitals thresholds appear in the `cwv` signal and in the Principles footer. Keep them in sync.
