import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { completable } from "@modelcontextprotocol/sdk/server/completable.js";
import {
  collections,
  linkTypes,
  playbookSchema,
  titleOf,
  type AnyEntry,
  type CollectionName,
  type Page,
  type Playbook,
} from "@site-signal/playbook";
import { z } from "zod";
import { createContentSource, findEntry } from "./content.ts";
import { md, renderBlock, renderEntry, summaryOf, uriFor } from "./render.ts";
import { searchPlaybook, suggestIds } from "./search.ts";

const COLLECTION_NAMES = Object.keys(collections) as [CollectionName, ...CollectionName[]];

const COLLECTION_GUIDE: Record<CollectionName, string> = {
  questions:
    "Leader questions: step-by-step procedures for what executives ask, with a script for the report",
  plays:
    "Standard plays: when to run each, the steps, the signals it moves, and time to first signal",
  audit: "Audit pillars, each with checks, how to check, and what a fail looks like",
  diagnostics: "Diagnostic flows: ordered checks for when a number moves the wrong way",
  signals:
    "Signal catalog: every metric tracked, with definition, source, capture and reading guidance",
  phases: "Engagement phases from audit to renewal, with checklists and deliverables",
  layers: "Scorecard layers, each with a north-star metric, leading indicators and health checks",
  principles: "The principles behind the playbook",
  offers: "The agency's standard service offers",
  glossary:
    "Glossary: plain-language definitions of marketing and search terms, with aliases and what each means for the program",
  pages:
    "Chapter pages that tie the collections together (overview, reporting, measurement, glossary, and more)",
};

const INSTRUCTIONS = `Read-only access to the Site Signal Playbook, the operating playbook of an SEO and AI search agency.
Use search_playbook to find entries, get_entry to read one in full, list_entries to browse a collection, get_audit_checklist for an audit worksheet, and validate_content after editing content files.
Every entry is also a resource at playbook://{collection}/{id}; links inside entries use those URIs.
Prompts: answer_leader_question, run_audit, diagnose, plan_roadmap.`;

type TextResult = { content: Array<{ type: "text"; text: string }>; isError?: boolean };
const text = (body: string, isError = false): TextResult => ({
  content: [{ type: "text", text: body }],
  ...(isError ? { isError: true } : {}),
});

const invalidContent = (issues: string[]) =>
  text(
    `The playbook content has ${issues.length} problem(s), so it can't be read until they're fixed:\n${issues.map((i) => `- ${i}`).join("\n")}`,
    true,
  );

const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;

export function createPlaybookServer({
  contentDir,
  version = "0.1.0",
}: {
  contentDir: string;
  version?: string;
}) {
  const source = createContentSource(contentDir);
  const server = new McpServer(
    { name: "site-signal-playbook", title: "Site Signal Playbook", version },
    { instructions: INSTRUCTIONS },
  );

  /** Runs a handler against valid content, or reports why the content can't be read. */
  const withPlaybook = (handler: (playbook: Playbook) => TextResult): TextResult => {
    const loaded = source.load();
    return loaded.ok ? handler(loaded.playbook) : invalidContent(loaded.issues);
  };

  const requirePlaybook = (): Playbook => {
    const loaded = source.load();
    if (!loaded.ok) throw new Error(invalidContent(loaded.issues).content[0].text);
    return loaded.playbook;
  };

  /** Ids for autocompletion. Invalid content completes to nothing rather than erroring. */
  const idsIn = (collection: CollectionName): string[] => {
    const loaded = source.load();
    return loaded.ok ? (loaded.playbook[collection] as AnyEntry[]).map((e) => e.id) : [];
  };

  const completeIds = (collection: CollectionName) => (value: string | undefined) =>
    idsIn(collection).filter((id) => id.startsWith(value ?? ""));

  // ---------------------------------------------------------------- tools

  server.registerTool(
    "search_playbook",
    {
      title: "Search the playbook",
      description:
        "Keyword search across the playbook: leader questions, plays, audit pillars, diagnostics, signals, phases, layers, principles, offers, glossary terms (including their aliases) and chapter pages. Returns ranked matches with their collection, id and resource URI. Use get_entry to read a match in full.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('Words to look for, e.g. "citation share" or "traffic dropped"'),
        collections: z
          .array(z.enum(COLLECTION_NAMES))
          .optional()
          .describe("Limit the search to these collections"),
        limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 10)"),
      },
      annotations: READ_ONLY,
    },
    ({ query, collections: within, limit = 10 }) =>
      withPlaybook((playbook) => {
        const hits = searchPlaybook(playbook, query, { within, limit });
        if (!hits.length) return text(`No playbook entries match "${query}".`);
        const lines = hits.map(
          (h, i) =>
            `${i + 1}. **${h.title}** (${h.collection}/${h.id})\n   ${uriFor(h.collection, h.id)}\n   ${md(h.summary)}`,
        );
        return text(`${hits.length} match(es) for "${query}":\n\n${lines.join("\n")}`);
      }),
  );

  server.registerTool(
    "get_entry",
    {
      title: "Read a playbook entry",
      description:
        "Returns one playbook entry in full as Markdown, with links to related entries as playbook:// URIs. Collections: " +
        COLLECTION_NAMES.join(", ") +
        ".",
      inputSchema: {
        collection: z.enum(COLLECTION_NAMES).describe("Which collection the entry belongs to"),
        id: z.string().min(1).describe('The entry id, e.g. "trust-the-numbers"'),
      },
      annotations: READ_ONLY,
    },
    ({ collection, id }) =>
      withPlaybook((playbook) => {
        const entry = findEntry(playbook, collection, id);
        if (entry) return text(renderEntry(playbook, collection, entry));
        const ids = (playbook[collection] as AnyEntry[]).map((e) => e.id);
        const suggestions = suggestIds(ids, id);
        return text(
          `No ${collection} entry with id "${id}". ${
            suggestions.length
              ? `Did you mean: ${suggestions.join(", ")}?`
              : `Valid ids: ${ids.join(", ")}.`
          }`,
          true,
        );
      }),
  );

  server.registerTool(
    "list_entries",
    {
      title: "List a collection",
      description:
        "Lists every entry in one collection with its id, title and a one-line summary. For signals, optionally filter by scorecard layer or engagement phase.",
      inputSchema: {
        collection: z.enum(COLLECTION_NAMES),
        layer: z.string().optional().describe('Signals only: a layer id, e.g. "ai-visibility"'),
        phase: z.string().optional().describe('Signals only: a phase id, e.g. "audit"'),
      },
      annotations: READ_ONLY,
    },
    ({ collection, layer, phase }) =>
      withPlaybook((playbook) => {
        if ((layer || phase) && collection !== "signals") {
          return text("The layer and phase filters only apply to the signals collection.", true);
        }
        if (layer && !findEntry(playbook, "layers", layer)) {
          return text(
            `Unknown layer "${layer}". Layers: ${playbook.layers.map((l) => l.id).join(", ")}.`,
            true,
          );
        }
        if (phase && !findEntry(playbook, "phases", phase)) {
          return text(
            `Unknown phase "${phase}". Phases: ${playbook.phases.map((p) => p.id).join(", ")}.`,
            true,
          );
        }
        let entries = playbook[collection] as AnyEntry[];
        if (collection === "signals") {
          entries = playbook.signals.filter(
            (s) => (!layer || s.layer === layer) && (!phase || s.phases.includes(phase)),
          );
        }
        const filters = [layer && `layer ${layer}`, phase && `phase ${phase}`]
          .filter(Boolean)
          .join(", ");
        const lines = entries.map(
          (e) => `- **${titleOf(collection, e)}** (${e.id}): ${md(summaryOf(collection, e))}`,
        );
        return text(
          `${collection}${filters ? ` (${filters})` : ""}: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}\n${COLLECTION_GUIDE[collection]}.\n\n${lines.join("\n")}`,
        );
      }),
  );

  server.registerTool(
    "get_audit_checklist",
    {
      title: "Audit worksheet",
      description:
        "Returns the audit as a worksheet: the scoring guide, then every check (or one pillar's checks) with columns to fill in a Pass/Watch/Fail score and evidence, then how to turn fails into findings.",
      inputSchema: {
        pillar: z
          .string()
          .optional()
          .describe('One audit pillar id, e.g. "technical". Omit for all six.'),
        site: z
          .string()
          .optional()
          .describe("The client site being audited, used in the worksheet title"),
      },
      annotations: READ_ONLY,
    },
    ({ pillar, site }) =>
      withPlaybook((playbook) => {
        const worksheet = renderAuditWorksheet(playbook, { pillar, site });
        return text(worksheet.body, !worksheet.ok);
      }),
  );

  server.registerTool(
    "validate_content",
    {
      title: "Validate playbook content",
      description:
        "Re-reads /content and checks every file against the schemas, cross-references and link rules. Run it after creating or editing content files.",
      annotations: READ_ONLY,
    },
    () => {
      const loaded = source.load({ fresh: true });
      if (!loaded.ok) {
        return text(
          `Content has ${loaded.issues.length} problem(s):\n${loaded.issues.map((i) => `- ${i}`).join("\n")}`,
        );
      }
      const counts = COLLECTION_NAMES.map(
        (name) => `- ${name}: ${loaded.playbook[name].length}`,
      ).join("\n");
      return text(`Playbook content is valid.\n${counts}`);
    },
  );

  // ------------------------------------------------------------ resources

  server.registerResource(
    "playbook-entry",
    new ResourceTemplate("playbook://{collection}/{id}", {
      list: () => {
        const playbook = requirePlaybook();
        return {
          resources: COLLECTION_NAMES.flatMap((collection) =>
            (playbook[collection] as AnyEntry[]).map((entry) => ({
              uri: uriFor(collection, entry.id),
              name: `${collection}/${entry.id}`,
              title: titleOf(collection, entry),
              description: summaryOf(collection, entry),
              mimeType: "text/markdown",
            })),
          ),
        };
      },
      complete: {
        collection: (value) => COLLECTION_NAMES.filter((name) => name.startsWith(value)),
        id: (value, context) => {
          const collection = context?.arguments?.collection as CollectionName | undefined;
          if (!collection || !COLLECTION_NAMES.includes(collection)) return [];
          return idsIn(collection).filter((id) => id.startsWith(value));
        },
      },
    }),
    {
      title: "Playbook entry",
      description: "Any playbook entry as Markdown, addressed as playbook://{collection}/{id}.",
      mimeType: "text/markdown",
    },
    (uri, variables) => {
      const playbook = requirePlaybook();
      const collection = String(variables.collection) as CollectionName;
      const id = String(variables.id);
      const entry = COLLECTION_NAMES.includes(collection)
        ? findEntry(playbook, collection, id)
        : undefined;
      if (!entry) throw new Error(`No playbook entry at ${uri.href}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: renderEntry(playbook, collection, entry),
          },
        ],
      };
    },
  );

  server.registerResource(
    "playbook-schema",
    "playbook://schema",
    {
      title: "Playbook JSON Schema",
      description:
        "JSON Schema for the whole playbook: every collection and field, as validated by the loader.",
      mimeType: "application/schema+json",
    },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/schema+json",
          text: JSON.stringify(z.toJSONSchema(playbookSchema), null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "playbook-guide",
    "playbook://guide",
    {
      title: "How the playbook is organized",
      description: "Collections, entry counts, URI format and link syntax.",
      mimeType: "text/markdown",
    },
    (uri) => {
      const playbook = requirePlaybook();
      const rows = COLLECTION_NAMES.map(
        (name) => `- **${name}** (${playbook[name].length}): ${COLLECTION_GUIDE[name]}`,
      ).join("\n");
      const body = `# Site Signal Playbook\n\n${INSTRUCTIONS}\n\n## Collections\n\n${rows}\n\n## Links\n\nEntries link to each other with playbook://{collection}/{id} URIs. In the source Markdown files, links are written as [text](type:id). Link types and their collections: ${Object.entries(
        linkTypes,
      )
        .map(([type, collection]) => `${type} (${collection})`)
        .join(", ")}.`;
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: body }] };
    },
  );

  // -------------------------------------------------------------- prompts

  server.registerPrompt(
    "answer_leader_question",
    {
      title: "Answer a leader question",
      description:
        "Work through a leader question's procedure for a client and finish with the report sentence.",
      argsSchema: {
        question: completable(z.string().describe("Leader question id"), completeIds("questions")),
        client: z.string().optional().describe("Client name, site and any context"),
      },
    },
    ({ question, client }) => {
      const playbook = requirePlaybook();
      const entry = findEntry(playbook, "questions", question);
      if (!entry) throw new Error(`No leader question with id "${question}"`);
      return userPrompt(
        `You're helping an SEO and AI search agency answer a leadership question for ${client?.trim() || "a client"}.

Follow the playbook procedure below. Work through the steps in order, and use whatever analytics and search tools you have (for example GA4, Search Console or a rank tracker) to get real numbers. Say which steps you couldn't complete and why, and run the "Before you start" check first. Finish with the "Say it like" sentence filled in with real values; leave any placeholder you couldn't fill in brackets.

---

${renderEntry(playbook, "questions", entry)}`,
      );
    },
  );

  server.registerPrompt(
    "run_audit",
    {
      title: "Run the search and AI visibility audit",
      description:
        "Score the audit checks for a site with evidence, then turn the fails into ranked findings.",
      argsSchema: {
        site: z.string().describe("The site to audit, e.g. https://example.com"),
        pillar: completable(
          z.string().optional().describe("One pillar id; omit for all six"),
          completeIds("audit"),
        ),
      },
    },
    ({ site, pillar }) => {
      const playbook = requirePlaybook();
      const worksheet = renderAuditWorksheet(playbook, { pillar, site });
      if (!worksheet.ok) throw new Error(worksheet.body);
      return userPrompt(
        `Run the playbook audit for ${site}.

Score every check Pass, Watch or Fail, and give the evidence for each: a URL, a report, or what you observed. If you can't check something with the tools you have, mark it "Not checked" and say what access is needed. Don't guess a score.

When the checks are done, group the fails into findings, rank them as the worksheet describes, and map each finding to a play from the playbook (use search_playbook or list_entries with collection "plays").

---

${worksheet.body}`,
      );
    },
  );

  server.registerPrompt(
    "diagnose",
    {
      title: "Diagnose a problem",
      description: "Work through a diagnostic flow's checks in order for a specific situation.",
      argsSchema: {
        diagnostic: completable(
          z.string().describe("Diagnostic flow id"),
          completeIds("diagnostics"),
        ),
        situation: z
          .string()
          .optional()
          .describe("What happened, e.g. which metric moved, by how much, and when"),
      },
    },
    ({ diagnostic, situation }) => {
      const playbook = requirePlaybook();
      const entry = findEntry(playbook, "diagnostics", diagnostic);
      if (!entry) throw new Error(`No diagnostic flow with id "${diagnostic}"`);
      return userPrompt(
        `Diagnose this situation using the playbook flow below${situation?.trim() ? `:\n\n${situation.trim()}` : "."}

Work through the checks in order, and record what each one shows before moving on. The early checks are cheap and often end the investigation, so don't skip ahead. Finish by explaining the movement as its components, each with a likely cause, an owner and a next step.

---

${renderEntry(playbook, "diagnostics", entry)}`,
      );
    },
  );

  server.registerPrompt(
    "plan_roadmap",
    {
      title: "Plan a roadmap from findings",
      description:
        "Map findings to plays, score them with the prioritization model, and propose the top three.",
      argsSchema: {
        findings: z.string().describe("Audit findings or problems to address, one per line"),
        client: z.string().optional().describe("Client name and context"),
      },
    },
    ({ findings, client }) => {
      const playbook = requirePlaybook();
      const playsPage = findEntry(playbook, "pages", "plays") as Page | undefined;
      const model = (playsPage?.blocks ?? [])
        .filter((b) => b.type === "thesis" || b.type === "panels")
        .map((b) => renderBlock(playbook, b))
        .join("\n\n");
      const plays = playbook.plays
        .map(
          (p) =>
            `- **${p.title}** (${uriFor("plays", p.id)})\n  Run it when: ${md(p.when)}\n  Effort ${p.effort} · First signal: ${p.firstSignal}`,
        )
        .join("\n");
      return userPrompt(
        `Plan a roadmap for ${client?.trim() || "this client"} from these findings:

${findings.trim()}

Map each finding to one or more plays from the library below. Score each candidate with the prioritization model, putting blockers to crawling, indexing or honest measurement first. Propose the top three, and for each give the expected impact as a range, the leading indicator to watch, the effort, and what the client needs to provide. Read a play in full with get_entry when you need its steps or risks.

## Prioritization model

${model}

## Play library

${plays}`,
      );
    },
  );

  return server;
}

function userPrompt(body: string) {
  return { messages: [{ role: "user" as const, content: { type: "text" as const, text: body } }] };
}

export function renderAuditWorksheet(
  playbook: Playbook,
  { pillar, site }: { pillar?: string; site?: string },
): { ok: boolean; body: string } {
  const pillars = pillar ? playbook.audit.filter((a) => a.id === pillar) : playbook.audit;
  if (pillar && !pillars.length) {
    return {
      ok: false,
      body: `No audit pillar with id "${pillar}". Pillars: ${playbook.audit.map((a) => a.id).join(", ")}.`,
    };
  }
  const auditPage = findEntry(playbook, "pages", "audit") as Page | undefined;
  const scoring = auditPage?.blocks.find((b) => b.type === "table");
  const findings = auditPage?.blocks.find((b) => b.type === "flow");
  const escape = (value: string) => md(value).replace(/\|/g, "\\|");
  const sections = pillars.map((a) =>
    [
      `## ${a.order}. ${a.title}`,
      "",
      md(a.question),
      "",
      "| Check | How to check | Fail looks like | Score | Evidence |",
      "| --- | --- | --- | --- | --- |",
      ...a.checks.map((c) => `| ${escape(c.check)} | ${escape(c.how)} | ${escape(c.fail)} |  |  |`),
    ].join("\n"),
  );
  const body = [
    `# Search and AI visibility audit${site ? `: ${site}` : ""}`,
    scoring ? `## How to score\n\n${renderBlock(playbook, scoring)}` : "",
    ...sections,
    findings ? renderBlock(playbook, findings) : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { ok: true, body };
}
