# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The operating playbook for an SEO and AI search agency working on B2B marketing websites. The owner runs the agency on it.

It covers:

- the questions leadership asks, with step-by-step answers
- the engagement model and offers
- a six-pillar audit and a play library, where every failed check names the play that fixes it
- diagnostics, reporting, a signal catalog, measurement setup, and principles

The content is plain Markdown files, so several tools can read it: the Astro site, the MCP server (for Claude Desktop, Claude Code and other clients), and later Figma and Playwright.

## Commands

Node 24 LTS (see `.nvmrc`); Node 22.18 or newer is the minimum. Run everything from the repo root.

```bash
npm install
npm run dev        # site at http://localhost:4321, reloads on content edits
npm run validate   # check /content against the schemas and references (no build)
npm run export     # write dist/playbook.json and dist/playbook.schema.json
npm run build      # validate, then build the static site to apps/site/dist
npm run preview    # serve the built site (run build first)
npm run check      # tsc for packages/playbook, apps/mcp and tests/visual, astro check for apps/site
npm test           # MCP server tests (node:test)
npm run test:visual  # compare every page with main, pixel by pixel (needs Google Chrome)
npm run mcp        # run the MCP server on stdio
npm run format     # prettier (content/ is excluded on purpose)
```

To run a single MCP test: `node --disable-warning=ExperimentalWarning --test --test-name-pattern="audit worksheet" apps/mcp/test/server.test.ts`.

After editing anything in `content/`, run `npm run validate`.

## Architecture

```
content/            source of truth: one Markdown file per entry, grouped by collection
packages/playbook/  schemas (Zod), loader, reference checks, link resolution, validate/export CLIs
apps/site/          Astro site with React components for the interactive parts
apps/mcp/           MCP server (stdio): read-only tools, playbook:// resources, workflow prompts
tests/visual/       screenshot comparison of the built site against a git ref
```

Every tool that uses the playbook goes through `@site-signal/playbook`. Its `loadPlaybook(contentDir)` reads every collection, validates frontmatter with strict schemas, and checks cross-references. It throws a `PlaybookError` listing every problem at once.

- **Collections, schemas and references live in `packages/playbook/src/schema.ts`.** That covers `collections`, `references`, `linkTypes` and the page `block` union. To add a field or collection, change it there, then update the site component that renders it.
- **Shared helpers:** `titleOf` (a readable title for any entry), `linksTo` (every entry whose text links to a given entry) and the play enum labels (`effortLabel`, `firstSignalLabel`, `ownerLabel`) live in the package, so the site and the MCP server agree.
- **The package runs as TypeScript directly on Node** (type stripping), with no build step:
  - Relative imports must use `.ts` extensions.
  - Only erasable syntax is allowed: no enums, no parameter properties (`erasableSyntaxOnly` is set).
- **`@site-signal/playbook/paths` is a separate export.** It locates `content/` through `import.meta.url`, which bundlers rewrite. The site doesn't import it; `astro.config.mjs` passes the folder as the `__PLAYBOOK_CONTENT_DIR__` define instead.
- **TypeScript is pinned to 6.x** because `@astrojs/check` doesn't support TypeScript 7 yet.

## Content rules

- **Files and ids:** each file's name is its id, in kebab-case. Ids are referenced across collections and will become URLs and MCP resource names, so treat renames as breaking.
- **Frontmatter holds every structured field.** Schemas are strict, so an unknown key fails validation.
  - Body text is used only by `phases` (why the phase matters), `signals` (the field note), `principles` and `glossary` (why the term matters here).
  - Every other collection must have an empty body.
- **Markdown only, never HTML.** The loader rejects HTML tags.
- **Links between entries:**
  - In prose, use inline links of the form `[text](type:id)`, where type is `question`, `play`, `signal`, `audit`, `diagnostic`, `page`, `phase`, `layer`, `offer`, `principle` or `term` (a glossary entry). Each tool resolves them itself: the site through `hrefFor()` in `apps/site/src/lib/links.ts`.
  - In structured fields, reference other entries by id in frontmatter (`layer`, `phases`, `signals`, `moves`, `plays`, `dependsOn`, `diagnostics`, `questions`, `related`, `pages`). These are validated; `references` in `schema.ts` is the full list. A reference field may take one dotted step through a list of objects, as `audit`'s `checks.plays` does.
- **Glossary** (`content/glossary/*.md`): one file per term.
  - The id is a short kebab-case form of the term (`ctr`, `branded-search`). Terms are listed alphabetically by `term`.
  - A term, expansion or alias can belong to only one entry; duplicates fail validation.
  - The definition says what the word means. How we measure something belongs in its signal, which the term links to through `signals`.
- **Pages** (`content/pages/*.md`) are chapter layouts made of typed `blocks`:
  - `markdown`, `panels`, `strip`, `thesis`, `table`, `ledger`, `flow`, `note`
  - `collection`, which lists questions, audit, plays, diagnostics, principles, offers or glossary
  - `scorecard` (from `layers`) and `signals` (the catalog)

  Nav order and labels come from each page's `order` and `navLabel`. A block with a heading can take an `id`, which becomes its anchor: phase links point to the Engagement table with `id: phases`.

- **Writing level:** write for marketers, executives and account strategists. Use plain procedural steps with menu paths in GA4, Search Console and standard SEO tools. Don't write API request bodies, dimension or metric field names, or SQL unless asked. Don't invent statistics. Name tools as examples ("Ahrefs, Semrush or similar").
- **The Overview names the chapter count in words** ("Ten chapters"). Update it when pages change.
- **Everything routes to a play.** Every audit check names the plays that fix it (`checks.plays`), and diagnostics and leader questions name theirs. A new play needs at least one entry pointing at it, or it can only be found by browsing the Plays chapter.
- **Plays are sortable.** `effort` (S/M/L), `firstSignal` (immediate/days/weeks/months) and `owner` are enums, so the roadmap can be ranked and `list_entries` can filter on them. Nuance the buckets flatten goes in the optional `timing` line, not back into the enum.

## Site (apps/site)

- **Routes:**
  - `/` (the overview page) and `/[page]/` for the other pages
  - item pages at `/questions/[id]/`, `/plays/[id]/`, `/audit/[id]/`, `/diagnostics/[id]/`, `/signals/[id]/`, `/glossary/[id]/` and `/offers/[id]/`
- **Loading content:** `getPlaybook()` loads content once per build. In dev it caches for 500ms, then reloads so edits show up. `getEntry(collection, id)` throws on unknown ids.
- **Vite caches:** dev and build use separate Vite dependency caches (`node_modules/.vite/` and `node_modules/.vite-build/` under `apps/site`), set in `astro.config.mjs`. When they shared one, a build wrote production React into it, and every React component in dev failed with `_jsxDEV is not a function`. If that error ever shows up again, stop the dev server, delete `apps/site/node_modules/.vite`, and restart.
- **Live reload:** the `watchContent` plugin in `astro.config.mjs` watches `content/`. It reports any change as a change to `src/lib/playbook.ts`, so new files get routes without a restart.
- **Components:** static rendering uses `.astro` components (`Blocks`, `Fold`, the `*Body` components, `RefPills`, `Md`). Interactive parts are React components in `src/components/react/`: `ThemeToggle`, `CopyButton` and `SignalCatalog`. Markdown is rendered to HTML on the server and passed to React as HTML strings.
- **Styles** (`src/styles/`, plain CSS with no framework):
  - `global.css` is the entry point. It declares the cascade layers (`reset, tokens, base, layout, components, utilities`) and imports each file into one. Vite inlines the imports and wraps each file in its `@layer` block.
  - **Layers decide precedence before specificity.** A rule in a later layer beats any rule in an earlier one. So a rule that targets a component's elements from outside it (like `nav.side .theme-btn`) must live in the component's own file: from `layout` it would lose, for example to the component's `all: unset`.
  - `tokens.css` holds the tokens from the 916 Marketing style guide (`styleguide-916-marketing.html` in the `style-guide-916-marketing` repo, which mirrors its Figma design system). Names follow Figma with `/` swapped for `-` (`text/default` is `--text-default`).
    - Components use semantic tokens only, never palette steps (`--purple-800`). When the guide changes, update the values in `tokens.css`, not in components.
    - `--text-secondary`, `--text-muted` and `--font-mono` aren't design-system tokens. `--text-secondary` and `--font-mono` copy values the guide uses only for its own page; `--text-muted` is the site's own.
    - Each theme color is defined once as `light-dark(light, dark)`, with the guide's Light and Dark values. It follows `color-scheme`, which comes from the OS setting or from `data-theme` on `<html>` (set by the theme toggle). Status colors are the same in both modes; status text set directly on the page surface uses `light-dark(var(--text-error), var(--text-error-inverse))` so it reads in dark mode.
  - **Type:** Roboto 400, 500 and 700 (loaded in `Base.astro`). Set type with `font: var(--type-*)`, the guide's text styles, rather than setting family, size and line height separately. Small labels and controls (pills, field labels, the filter and copy buttons) may shrink a style with `font-size`, as the guide's small badge does. Label/Caps and Label/Field also take `letter-spacing: var(--tracking-caps)` and `text-transform: uppercase`. Headings map to the nearest text style: `h1.display` Display/Hero, `h1.title` Heading/H2, `h2` Heading/H3, `h3` Heading/H4.
  - **Spacing and radius:** use `--space-*` for layout spacing and `--radius-sm` (the only radius in the system) for corners. Small gaps inside components that fall between the steps (like 6px, 12px or 14px) stay as raw pixels, as they do in the guide.
  - `components/`: one file per component, named after the component or block that renders it. Styles use native nesting, and the 820px small-screen overrides sit inside the rule they change.
  - Component styles stay global rather than going in Astro-scoped `<style>` blocks. Scoping wouldn't reach Markdown rendered through `set:html`, slotted children, or the React islands that share classes like `.pill`.
- **Variables:** site-wide values (name, version, storage keys) live in `src/site.ts`.
- **Saved state in `localStorage`:** `ssp-theme`, the theme choice.

## MCP server (apps/mcp)

- **Structure:** `src/server.ts` is the stdio entrypoint. `createPlaybookServer({ contentDir })` in `src/playbook-server.ts` registers everything, and tests connect to it in-process.
- **Surface:**
  - Five read-only tools: `search_playbook`, `get_entry`, `list_entries`, `get_audit_checklist`, `validate_content`. `list_entries` filters signals by layer or phase, and plays by effort, first signal or owner. `get_audit_checklist` carries a "fixed by" column from each check's `plays`.
  - Resources: every entry at `playbook://{collection}/{id}`, plus `playbook://guide` and `playbook://schema`.
  - Four prompts: `answer_leader_question`, `run_audit`, `diagnose`, `plan_roadmap`.
- **Rendering:** `src/render.ts` turns entries into Markdown for LLMs and rewrites `[text](type:id)` links to `playbook://` URIs.
- **Collections need wiring in several places.** Adding a collection or field means updating `renderEntry` and `summaryOf` (here), `titleOf` and `linkTypes` (package), `COLLECTION_GUIDE`, and the site's `hrefFor`, routes and components together.
- **Code changes need a reconnect.** Content is re-read on every request, but changes to the server or the package only load when the client restarts the server: `/mcp` in Claude Code, or restarting Claude Desktop.
- **Loading:** content is re-read on demand, with results reused for up to a second (`src/content.ts`). If content is invalid, reading tools return `isError` with the issue list; `validate_content` always reads fresh.
- **Search:** `src/search.ts` is keyword search with title weighting and crude stemming. Every word must match; if nothing does, any word will.
- **stdout carries the MCP protocol.** Never `console.log` in the server; use `console.error`.
- **Content folder:** `PLAYBOOK_CONTENT_DIR` overrides where the server reads content; the default is the repo's `/content`.
- **Connecting:** `.mcp.json` registers the server for Claude Code with a relative path, so Claude Code must start from the repo root. Claude Desktop needs absolute paths (see `apps/mcp/README.md`).

## Visual tests (tests/visual)

`npm run test:visual` checks that a change looks the way it should, on every page. Run it after any CSS or component change; for a refactor, 0 differences is the pass mark.

- **How it works:**
  - It builds the base ref (`main` by default) in a temporary git worktree with a clean install, and saves that build in `.visual/base/<commit>`. It builds the working tree the usual way.
  - It captures every page common to both builds in headless Chrome (installed Google Chrome, or `CHROME_PATH`), in light and dark, desktop and mobile. It also captures a saved theme overriding the OS, open folds, and hover and keyboard-focus states. The list lives in `shots.ts`.
  - It writes `.visual/report/index.html`, with before, after and changed-pixel images cropped to each change, and `results.json`. It exits with 1 when any shot differs or a page from the base is missing (unless `--pages` narrows the run), and 2 when it can't run.
  - **It refuses to screenshot a page that didn't load properly.** A shot fails when a font or stylesheet doesn't load or a `client:load` island doesn't hydrate, and the run stops before capturing if either build's home page can't load. Otherwise fallback fonts in both builds would match and pass. The fonts come from Google Fonts, so a run needs a network connection.
- **Options:** `--base <ref>`, `--quick` (chapter pages and one page per collection), `--only desktop-light,mobile-dark` and `--pages /signals/,/glossary/geo/`. Pass them after `--`: `npm run test:visual -- --quick`.
- **Captures are deterministic on purpose.** Don't loosen these without re-checking that the same build captured twice gives 0 differences:
  - Chrome runs with software rendering and full compositing before each frame (`CHROME_ARGS` in `capture.ts`).
  - Every font face loads before capture, and each screenshot is retaken until two in a row match.
  - The window is resized to the page height instead of using full-page capture, which repeats content on tall pages. Pages over 20,000px are captured in overlapping rows of tiles. The page is measured again after the resize: on small screens it grows with the window (`.shell` has `min-height: 100vh` and the top bar sits outside it), so the rows below the window are captured by scrolling down.
  - Content wider than the window is captured in extra columns by scrolling sideways. Widening the window would change the layout under test.
  - The mobile `.topbar` is pinned with `position: relative` during capture, because Chrome paints the sticky bar at stale positions in very tall windows.
  - Channel differences of 2/255 or less are ignored: rounded corners of scrolling containers anti-alias slightly differently between captures.

## History

The single-file HTML playbook (v2) was converted into `content/` and then removed. It's available at commit `2f5aba7` (`git show 2f5aba7:site-signal-playbook.html`).
