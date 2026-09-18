import {
  effortLabel,
  firstSignalLabel,
  linksTo,
  linkTypes,
  ownerLabel,
  resolveLinks,
  titleOf,
  type AnyEntry,
  type AuditPillar,
  type Block,
  type CollectionName,
  type Diagnostic,
  type Layer,
  type Offer,
  type Page,
  type Phase,
  type Play,
  type Playbook,
  type Principle,
  type Question,
  type Signal,
  type Term,
} from "@site-signal/playbook";
import { findEntry } from "./content.ts";

export const uriFor = (collection: CollectionName, id: string) => `playbook://${collection}/${id}`;

/** Rewrites `[text](type:id)` links to playbook:// resource URIs. */
export const md = (text: string) => resolveLinks(text, (type, id) => uriFor(linkTypes[type], id));

/** One line that tells a reader what the entry is for. */
export function summaryOf(collection: CollectionName, entry: AnyEntry): string {
  switch (collection) {
    case "questions":
      return (entry as Question).askedBy;
    case "plays":
      return `${ownerLabel[(entry as Play).owner]} · effort ${(entry as Play).effort} · run it when: ${(entry as Play).when}`;
    case "audit":
      return (entry as AuditPillar).question;
    case "diagnostics":
      return `Starts with: ${(entry as Diagnostic).steps[0].title}`;
    case "signals":
      return (entry as Signal).question;
    case "phases":
      return `${(entry as Phase).when}. ${firstSentence(entry.body)}`;
    case "layers":
      return `North star: ${(entry as Layer).northStar}`;
    case "principles":
      return firstSentence(entry.body);
    case "offers":
      return `Best for: ${(entry as Offer).bestFor}`;
    case "glossary":
      return (entry as Term).definition;
    case "pages":
      return (entry as Page).lede;
  }
}

const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

function link(playbook: Playbook, collection: CollectionName, id: string) {
  const entry = findEntry(playbook, collection, id);
  return entry ? `[${titleOf(collection, entry)}](${uriFor(collection, id)})` : id;
}

const cell = (text: string) => md(text).replace(/\|/g, "\\|").replace(/\n+/g, " ");

function table(columns: string[], rows: string[][]) {
  return [
    `| ${columns.map(cell).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n");
}

const numbered = (items: string[]) => items.map((item, i) => `${i + 1}. ${md(item)}`).join("\n");
const bullets = (items: string[]) => items.map((item) => `- ${md(item)}`).join("\n");

function section(title: string, body: string | undefined) {
  return body ? `## ${title}\n\n${body}` : "";
}

const join = (parts: Array<string | false | undefined>) => parts.filter(Boolean).join("\n\n");

export function renderEntry(
  playbook: Playbook,
  collection: CollectionName,
  entry: AnyEntry,
): string {
  switch (collection) {
    case "questions":
      return renderQuestion(playbook, entry as Question);
    case "plays":
      return renderPlay(playbook, entry as Play);
    case "audit":
      return renderAudit(playbook, entry as AuditPillar);
    case "diagnostics":
      return renderDiagnostic(playbook, entry as Diagnostic);
    case "signals":
      return renderSignal(playbook, entry as Signal);
    case "phases":
      return renderPhase(entry as Phase);
    case "layers":
      return renderLayer(playbook, entry as Layer);
    case "principles":
      return join([`# Principle: ${(entry as Principle).title}`, md(entry.body)]);
    case "offers":
      return renderOffer(playbook, entry as Offer);
    case "glossary":
      return renderTerm(playbook, entry as Term);
    case "pages":
      return renderPage(playbook, entry as Page);
  }
}

function renderQuestion(playbook: Playbook, q: Question) {
  const related = [
    q.signals?.length &&
      `- Signals: ${q.signals.map((id) => link(playbook, "signals", id)).join(", ")}`,
    q.diagnostics?.length &&
      `- Diagnostics: ${q.diagnostics.map((id) => link(playbook, "diagnostics", id)).join(", ")}`,
    q.plays?.length && `- Plays: ${q.plays.map((id) => link(playbook, "plays", id)).join(", ")}`,
    q.related?.length &&
      `- Related questions: ${q.related.map((id) => link(playbook, "questions", id)).join(", ")}`,
    q.pages?.length && `- Chapters: ${q.pages.map((id) => link(playbook, "pages", id)).join(", ")}`,
  ].filter(Boolean);
  return join([
    `# ${q.question}`,
    `Leader question · Timebox: ${q.timebox}\n**Asked by:** ${md(q.askedBy)}`,
    section("What they expect to see", md(q.expect)),
    section("Steps", numbered(q.steps)),
    section("How to read it", bullets(q.read)),
    section("Before you start", md(q.beforeYouStart)),
    section("Say it like", `> ${md(q.script)}`),
    related.length > 0 && section("Related", related.join("\n")),
  ]);
}

function renderPlay(playbook: Playbook, p: Play) {
  const moves = p.moves.map((id) => {
    const signal = findEntry(playbook, "signals", id) as Signal | undefined;
    return `- ${link(playbook, "signals", id)}${signal ? `: ${md(signal.question)}` : ""}`;
  });
  const sequence = [
    p.dependsOn?.length &&
      `- Ship first: ${p.dependsOn.map((id) => link(playbook, "plays", id)).join(", ")}`,
    p.related?.length &&
      `- Runs well with: ${p.related.map((id) => link(playbook, "plays", id)).join(", ")}`,
  ].filter(Boolean);
  return join([
    `# Play: ${p.title}`,
    [
      `- **Effort:** ${effortLabel[p.effort]}`,
      `- **First signal:** ${firstSignalLabel[p.firstSignal]}`,
      `- **Led by:** ${ownerLabel[p.owner]}`,
      p.timing && `- **Timing:** ${md(p.timing)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    section("Run it when", md(p.when)),
    section("What we do", numbered(p.steps)),
    section("What it should move", moves.join("\n")),
    sequence.length > 0 && section("Sequence", sequence.join("\n")),
    section("Watch out", md(p.watchOut)),
  ]);
}

function renderAudit(playbook: Playbook, a: AuditPillar) {
  return join([
    `# Audit pillar ${a.order}: ${a.title}`,
    md(a.question),
    table(
      ["Check", "How to check", "Fail looks like", "Fixed by"],
      a.checks.map((c) => [
        c.check,
        c.how,
        c.fail,
        c.plays.map((id) => link(playbook, "plays", id)).join(", "),
      ]),
    ),
    section("Signals", a.signals.map((id) => `- ${link(playbook, "signals", id)}`).join("\n")),
  ]);
}

function renderDiagnostic(playbook: Playbook, d: Diagnostic) {
  const related = [
    d.plays?.length &&
      `- Once you know the cause: ${d.plays.map((id) => link(playbook, "plays", id)).join(", ")}`,
    d.signals?.length &&
      `- Signals: ${d.signals.map((id) => link(playbook, "signals", id)).join(", ")}`,
    d.questions?.length &&
      `- Leader questions: ${d.questions.map((id) => link(playbook, "questions", id)).join(", ")}`,
  ].filter(Boolean);
  return join([
    `# Diagnostic: ${d.title}`,
    section("What this looks like in the field", md(d.inTheField)),
    section(
      "Checks, in order",
      d.steps.map((s, i) => `${i + 1}. **${s.title}**: ${md(s.detail)}`).join("\n"),
    ),
    related.length > 0 && section("Related", related.join("\n")),
  ]);
}

function renderSignal(playbook: Playbook, s: Signal) {
  const usedIn = [
    ...playbook.questions
      .filter((q) => q.signals?.includes(s.id))
      .map((q) => link(playbook, "questions", q.id)),
    ...playbook.plays
      .filter((p) => p.moves.includes(s.id))
      .map((p) => link(playbook, "plays", p.id)),
    ...playbook.diagnostics
      .filter((d) => d.signals?.includes(s.id))
      .map((d) => link(playbook, "diagnostics", d.id)),
    ...playbook.audit
      .filter((a) => a.signals.includes(s.id))
      .map((a) => link(playbook, "audit", a.id)),
    ...playbook.glossary
      .filter((t) => t.signals?.includes(s.id))
      .map((t) => link(playbook, "glossary", t.id)),
  ];
  return join([
    `# Signal: ${s.title}`,
    `Layer: ${link(playbook, "layers", s.layer)} · Phases: ${s.phases.map((id) => link(playbook, "phases", id)).join(", ")}`,
    `**Question it answers:** ${md(s.question)}`,
    section("Definition", md(s.definition)),
    section("Source", md(s.source)),
    section("How to capture", md(s.capture)),
    section("How to read it", md(s.read)),
    section("Field note", md(s.body)),
    usedIn.length > 0 && section("Used in", usedIn.map((l) => `- ${l}`).join("\n")),
  ]);
}

function renderPhase(p: Phase) {
  return join([
    `# Phase ${p.order}: ${p.title} (${p.when})`,
    md(p.body),
    section("Checklist", p.checklist.map((item) => `- [ ] ${md(item)}`).join("\n")),
    section("Deliverables", bullets(p.deliverables)),
  ]);
}

function renderLayer(playbook: Playbook, l: Layer) {
  const signals = playbook.signals.filter((s) => s.layer === l.id);
  return join([
    `# Layer: ${l.name}`,
    [
      `- **North-star metric:** ${md(l.northStar)}`,
      `- **Leading indicators:** ${md(l.leading)}`,
      `- **Health checks:** ${md(l.health)}`,
    ].join("\n"),
    section(
      "Signals in this layer",
      signals.map((s) => `- ${link(playbook, "signals", s.id)}`).join("\n"),
    ),
  ]);
}

function renderOffer(playbook: Playbook, o: Offer) {
  return join([
    `# Offer: ${o.name}`,
    [
      `- **Best for:** ${md(o.bestFor)}`,
      `- **What the client gets:** ${md(o.includes)}`,
      `- **Pricing:** ${md(o.pricing)}`,
      `- **Length:** ${o.length}`,
      `- **Leads into:** ${md(o.leadsInto)}`,
    ].join("\n"),
    o.services &&
      section(
        "What it covers",
        o.services.map((s) => `- **${s.title}**: ${md(s.text)}`).join("\n"),
      ),
    section(
      "How it runs",
      o.steps.map((s, i) => `${i + 1}. **${s.title}**: ${md(s.text)}`).join("\n"),
    ),
    section("What the client provides", bullets(o.clientProvides)),
    o.pages &&
      section("Chapters", o.pages.map((id) => `- ${link(playbook, "pages", id)}`).join("\n")),
  ]);
}

function renderTerm(playbook: Playbook, t: Term) {
  const listOf = (collection: CollectionName, ids: string[] | undefined) =>
    (ids ?? []).map((id) => `- ${link(playbook, collection, id)}`).join("\n");
  const measures = (t.signals ?? []).map((id) => {
    const signal = findEntry(playbook, "signals", id) as Signal | undefined;
    return `- ${link(playbook, "signals", id)}${signal ? `: ${md(signal.question)}` : ""}`;
  });
  const usedIn = linksTo(playbook, "term", t.id).map(
    (ref) => `- ${link(playbook, ref.collection, ref.id)}`,
  );
  return join([
    `# Term: ${titleOf("glossary", t)}`,
    t.aliases && `**Also called:** ${t.aliases.join(", ")}`,
    `**Definition:** ${md(t.definition)}`,
    section("Why it matters here", md(t.body)),
    section("How we measure it", measures.join("\n")),
    section("Related questions", listOf("questions", t.questions)),
    section("Related terms", listOf("glossary", t.related)),
    section("Used in", usedIn.join("\n")),
  ]);
}

function renderPage(playbook: Playbook, page: Page) {
  return join([
    `# ${page.heading}`,
    `${page.eyebrow} · ${md(page.lede)}`,
    ...page.blocks.map((block) => renderBlock(playbook, block)),
  ]);
}

const listCollections = [
  "questions",
  "audit",
  "plays",
  "diagnostics",
  "principles",
  "offers",
  "glossary",
] as const;

export function renderBlock(playbook: Playbook, block: Block): string {
  const head =
    "heading" in block && block.heading
      ? `## ${block.heading}${"intro" in block && block.intro ? `\n\n${md(block.intro)}` : ""}`
      : "intro" in block && block.intro
        ? md(block.intro)
        : "";
  switch (block.type) {
    case "markdown":
      return join([head, md(block.text)]);
    case "panels":
      return join([
        head,
        ...block.items.map((item) =>
          join([`### ${item.title}${item.eyebrow ? ` (${item.eyebrow})` : ""}`, md(item.text)]),
        ),
      ]);
    case "strip":
      return join([
        head,
        block.label && `**${block.label}**`,
        block.items.map((item, i) => `${i + 1}. **${item.title}**: ${md(item.text)}`).join("\n"),
        block.footnote && md(block.footnote),
      ]);
    case "thesis":
      return `> **${md(block.title)}** ${md(block.text)}`;
    case "table":
      return join([head, table(block.columns, block.rows), block.after && md(block.after)]);
    case "ledger":
      return join([
        head,
        `### ${block.left.title}\n\n${bullets(block.left.items)}`,
        `### ${block.right.title}\n\n${bullets(block.right.items)}`,
      ]);
    case "flow":
      return join([
        head,
        block.items.map((item, i) => `${i + 1}. **${item.title}**: ${md(item.text)}`).join("\n"),
      ]);
    case "collection": {
      const name: (typeof listCollections)[number] = block.collection;
      const entries = playbook[name] as AnyEntry[];
      return join([
        head,
        entries.map((e) => `- ${link(playbook, name, e.id)}: ${md(summaryOf(name, e))}`).join("\n"),
      ]);
    }
    case "scorecard":
      return join([
        head,
        table(
          ["Layer", "North-star metric", "Leading indicators", "Health checks"],
          playbook.layers.map((l) => [l.name, l.northStar, l.leading, l.health]),
        ),
      ]);
    case "signals":
      return join([
        head,
        ...playbook.layers.map((l) =>
          join([
            `### ${l.name}`,
            playbook.signals
              .filter((s) => s.layer === l.id)
              .map((s) => `- ${link(playbook, "signals", s.id)}: ${md(s.question)}`)
              .join("\n"),
          ]),
        ),
      ]);
    case "note":
      return `_${md(block.text)}_`;
  }
}
