# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The operating playbook for an SEO and AI search agency working on B2B marketing websites. The owner runs the agency on it.

It covers:

- the questions leadership asks, with step-by-step answers
- the engagement model and offers
- a six-pillar audit and a play library
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
npm run check      # tsc for packages/playbook and apps/mcp, astro check for apps/site
npm test           # MCP server tests (node:test)
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
```

Every tool that uses the playbook goes through `@site-signal/playbook`. Its `loadPlaybook(contentDir)` reads every collection, validates frontmatter with strict schemas, and checks cross-references. It throws a `PlaybookError` listing every problem at once.

- **Collections, schemas and references live in `packages/playbook/src/schema.ts`.** That covers `collections`, `references`, `linkTypes` and the page `block` union. To add a field or collection, change it there, then update the site component that renders it.
- **Shared helpers:** `titleOf` (a readable title for any entry) and `linksTo` (every entry whose text links to a given entry) live in the package, so the site and the MCP server agree.
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
  - In structured fields, reference other entries by id in frontmatter (`layer`, `phases`, `signals`, `moves`, `diagnostics`, `questions`, `related`, `pages`). These are validated; `references` in `schema.ts` is the full list.
- **Glossary** (`content/glossary/*.md`): one file per term.
  - The id is a short kebab-case form of the term (`ctr`, `branded-search`). Terms are listed alphabetically by `term`.
  - A term, expansion or alias can belong to only one entry; duplicates fail validation.
  - The definition says what the word means. How we measure something belongs in its signal, which the term links to through `signals`.
- **Pages** (`content/pages/*.md`) are chapter layouts made of typed `blocks`:
  - `markdown`, `panels`, `strip`, `thesis`, `table`, `ledger`, `flow`, `note`
  - `collection`, which lists questions, audit, plays, diagnostics, principles, offers or glossary
  - `scorecard` (from `layers`), `phases` (the checklist) and `signals` (the catalog)

  Nav order and labels come from each page's `order` and `navLabel`.

- **Writing level:** write for marketers, executives and account strategists. Use plain procedural steps with menu paths in GA4, Search Console and standard SEO tools. Don't write API request bodies, dimension or metric field names, or SQL unless asked. Don't invent statistics. Name tools as examples ("Ahrefs, Semrush or similar").
- **The Overview names the chapter count in words** ("Ten chapters"). Update it when pages change.

## Site (apps/site)

- **Routes:**
  - `/` (the overview page) and `/[page]/` for the other pages
  - item pages at `/questions/[id]/`, `/plays/[id]/`, `/audit/[id]/`, `/diagnostics/[id]/`, `/signals/[id]/` and `/glossary/[id]/`
- **Loading content:** `getPlaybook()` loads content once per build. In dev it caches for 500ms, then reloads so edits show up. `getEntry(collection, id)` throws on unknown ids.
- **Vite caches:** dev and build use separate Vite dependency caches (`node_modules/.vite/` and `node_modules/.vite-build/` under `apps/site`), set in `astro.config.mjs`. When they shared one, a build wrote production React into it, and every React component in dev failed with `_jsxDEV is not a function`. If that error ever shows up again, stop the dev server, delete `apps/site/node_modules/.vite`, and restart.
- **Live reload:** the `watchContent` plugin in `astro.config.mjs` watches `content/`. It reports any change as a change to `src/lib/playbook.ts`, so new files get routes without a restart.
- **Components:** static rendering uses `.astro` components (`Blocks`, `Fold`, the `*Body` components, `RefPills`, `Md`). Interactive parts are React components in `src/components/react/`: `ThemeToggle`, `CopyButton`, `PhaseChecklist` and `SignalCatalog`. Markdown is rendered to HTML on the server and passed to React as HTML strings.
- **Styles:** `src/styles/global.css` holds the design tokens. The dark palette is defined twice: once under `prefers-color-scheme` scoped to `:root:not([data-theme="light"])`, and once under `:root[data-theme="dark"]`. Change both copies together.
- **Variables:** site-wide values (name, version, storage keys) live in `src/site.ts`.
- **Saved state in `localStorage`:**
  - `ssp-theme`: the theme choice.
  - `ssp-checklist`: checklist ticks, keyed `phaseId:itemIndex`, so reordering a phase's checklist shifts saved ticks.

## MCP server (apps/mcp)

- **Structure:** `src/server.ts` is the stdio entrypoint. `createPlaybookServer({ contentDir })` in `src/playbook-server.ts` registers everything, and tests connect to it in-process.
- **Surface:**
  - Five read-only tools: `search_playbook`, `get_entry`, `list_entries`, `get_audit_checklist`, `validate_content`.
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

## History

The single-file HTML playbook (v2) was converted into `content/` and then removed. It's available at commit `2f5aba7` (`git show 2f5aba7:site-signal-playbook.html`).
