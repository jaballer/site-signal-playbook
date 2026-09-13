# Site Signal Playbook

The operating playbook for an SEO and AI search agency. It covers leader questions, the engagement model and offers, a six-pillar audit, a play library, diagnostics, reporting, a signal catalog, measurement setup and principles.

## Quick start

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## Editing the playbook

Everything lives in `content/`, one Markdown file per entry:

| Folder                   | What it holds                                                      |
| ------------------------ | ------------------------------------------------------------------ |
| `questions/`             | Leader questions, with steps, how to read the answer, and a script |
| `plays/`                 | Standard plays: when to run, steps, the signals they move          |
| `audit/`                 | Audit pillars and their checks                                     |
| `diagnostics/`           | Diagnostic flows                                                   |
| `signals/`               | The signal catalog                                                 |
| `phases/`                | Engagement phases, with checklists and deliverables                |
| `layers/`                | Scorecard layers                                                   |
| `offers/`, `principles/` | Offers and principles                                              |
| `glossary/`              | Glossary terms: definition, aliases, and why each one matters      |
| `pages/`                 | Chapter layouts, built from blocks                                 |

Structured fields go in the frontmatter. Link to other entries with `[text](type:id)`, for example `[trust check](question:trust-the-numbers)` or `[SERP](term:serp)`. Then run:

```bash
npm run validate
```

Validation reports unknown fields, broken references and broken links, with the file and field for each.

## Using it from Claude

The MCP server in `apps/mcp` lets Claude Desktop and Claude Code search and read the playbook, pull an audit worksheet, and run prompts such as "answer a leader question" or "plan a roadmap".

- **Claude Code:** start `claude` in this repo and approve the `playbook` server.
- **Claude Desktop:** see [apps/mcp/README.md](apps/mcp/README.md).

## Other commands

```bash
npm run build    # validate and build the static site (apps/site/dist)
npm run preview  # serve the built site at http://localhost:4321
npm run export   # dist/playbook.json and a JSON Schema, for other tools
npm run check    # type checks
npm test         # MCP server tests
npm run mcp      # run the MCP server on stdio (normally your MCP client starts it)
```

## Checking design changes

```bash
npm run test:visual
```

This compares every page of the site with the `main` branch, pixel by pixel, in light and dark, on desktop and mobile. It needs Google Chrome installed. When something differs, open `.visual/report/index.html` to see before, after and the changed pixels. Add `-- --quick` for a faster pass over one page of each kind, or `-- --base <branch>` to compare with another branch.
