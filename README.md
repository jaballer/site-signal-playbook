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
| `pages/`                 | Chapter layouts, built from blocks                                 |

Structured fields go in the frontmatter. Link to other entries with `[text](type:id)`, for example `[trust check](question:trust-the-numbers)`. Then run:

```bash
npm run validate
```

Validation reports unknown fields, broken references and broken links, with the file and field for each.

## Other commands

```bash
npm run build    # validate and build the static site (apps/site/dist)
npm run preview  # serve the built site at http://localhost:4321
npm run export   # dist/playbook.json and a JSON Schema, for other tools
npm run check    # type checks
```
