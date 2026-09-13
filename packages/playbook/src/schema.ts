import { z } from "zod";

/** Stable kebab-case identifier. Each content file is named `<id>.md`. */
export const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a kebab-case id");

/** Inline Markdown. The loader rejects HTML, so every consumer gets clean text. */
const Md = z.string().trim().min(1);
const Text = z.string().trim().min(1);
const Order = z.number().int().positive();
const Ids = z.array(Id);

export const layer = z.strictObject({
  order: Order,
  name: Text,
  northStar: Md,
  leading: Md,
  health: Md,
});

export const phase = z.strictObject({
  order: Order,
  title: Text,
  when: Text,
  checklist: z.array(Md).min(1),
  deliverables: z.array(Md).min(1),
});

export const signal = z.strictObject({
  title: Text,
  layer: Id,
  phases: Ids.min(1),
  question: Md,
  definition: Md,
  source: Md,
  capture: Md,
  read: Md,
});

export const question = z.strictObject({
  order: Order,
  question: Text,
  askedBy: Md,
  timebox: Text,
  expect: Md,
  steps: z.array(Md).min(1),
  read: z.array(Md).min(1),
  beforeYouStart: Md,
  script: Md,
  signals: Ids.optional(),
  diagnostics: Ids.optional(),
  related: Ids.optional(),
  pages: Ids.optional(),
});

export const play = z.strictObject({
  order: Order,
  title: Text,
  when: Md,
  effort: Text,
  firstSignal: Text,
  steps: z.array(Md).min(1),
  moves: Ids.min(1),
  watchOut: Md,
});

export const auditPillar = z.strictObject({
  order: Order,
  title: Text,
  question: Md,
  signals: Ids.min(1),
  checks: z.array(z.strictObject({ check: Text, how: Md, fail: Md })).min(1),
});

export const diagnostic = z.strictObject({
  order: Order,
  title: Text,
  inTheField: Md,
  steps: z.array(z.strictObject({ title: Text, detail: Md })).min(1),
});

export const principle = z.strictObject({
  order: Order,
  title: Text,
});

export const offer = z.strictObject({
  order: Order,
  name: Text,
  /** The client situation this offer fits, in a sentence or two. */
  bestFor: Md,
  includes: Md,
  length: Text,
  leadsInto: Md,
});

export const term = z.strictObject({
  /** The term as people say it, e.g. "CTR". */
  term: Text,
  /** What an acronym stands for, e.g. "click-through rate". */
  expansion: Text.optional(),
  /** Other names people use for the same thing. */
  aliases: z.array(Text).min(1).optional(),
  /** One or two plain sentences, answer first. */
  definition: Md,
  signals: Ids.optional(),
  questions: Ids.optional(),
  related: Ids.optional(),
});

const sectionHeading = { heading: Text.optional(), intro: Md.optional() };
const titledText = z.strictObject({ title: Text, text: Md });

/** Page building blocks. Collection-backed blocks render entries from the named collection. */
export const block = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("markdown"), ...sectionHeading, text: Md }),
  z.strictObject({
    type: z.literal("panels"),
    ...sectionHeading,
    items: z.array(z.strictObject({ eyebrow: Text.optional(), title: Text, text: Md })).min(1),
  }),
  z.strictObject({
    type: z.literal("strip"),
    ...sectionHeading,
    label: Text.optional(),
    items: z.array(titledText).min(1),
    footnote: Md.optional(),
  }),
  z.strictObject({ type: z.literal("thesis"), mark: Text, title: Md, text: Md }),
  z.strictObject({
    type: z.literal("table"),
    ...sectionHeading,
    columns: z.array(Text).min(1),
    rows: z.array(z.array(Md)).min(1),
    after: Md.optional(),
  }),
  z.strictObject({
    type: z.literal("ledger"),
    ...sectionHeading,
    left: z.strictObject({ title: Text, items: z.array(Md).min(1) }),
    right: z.strictObject({ title: Text, items: z.array(Md).min(1) }),
  }),
  z.strictObject({ type: z.literal("flow"), ...sectionHeading, items: z.array(titledText).min(1) }),
  z.strictObject({
    type: z.literal("collection"),
    ...sectionHeading,
    collection: z.enum([
      "questions",
      "audit",
      "plays",
      "diagnostics",
      "principles",
      "offers",
      "glossary",
    ]),
  }),
  z.strictObject({ type: z.literal("scorecard"), ...sectionHeading }),
  z.strictObject({ type: z.literal("phases"), ...sectionHeading }),
  z.strictObject({ type: z.literal("signals"), ...sectionHeading }),
  z.strictObject({ type: z.literal("note"), text: Md }),
]);

export const page = z.strictObject({
  order: Order,
  navLabel: Text,
  eyebrow: Text,
  heading: Text,
  lede: Md,
  blocks: z.array(block),
});

type BodyRule = { body: "none" } | { body: "required"; bodyMeaning: string };
/** Entries sort by `order` when they have one, otherwise by `sortBy`, otherwise by id. */
type CollectionDef = { schema: z.ZodType; sortBy?: string } & BodyRule;

/**
 * Every collection is a folder in /content with one Markdown file per entry.
 * Frontmatter holds the structured fields; the body is used only where noted.
 */
export const collections = {
  layers: { schema: layer, body: "none" },
  phases: { schema: phase, body: "required", bodyMeaning: "why the phase matters" },
  signals: { schema: signal, body: "required", bodyMeaning: "the field note" },
  questions: { schema: question, body: "none" },
  plays: { schema: play, body: "none" },
  audit: { schema: auditPillar, body: "none" },
  diagnostics: { schema: diagnostic, body: "none" },
  principles: { schema: principle, body: "required", bodyMeaning: "the principle itself" },
  offers: { schema: offer, body: "none" },
  glossary: {
    schema: term,
    body: "required",
    bodyMeaning: "why the term matters here",
    sortBy: "term",
  },
  pages: { schema: page, body: "none" },
} as const satisfies Record<string, CollectionDef>;

export type CollectionName = keyof typeof collections;

/** Frontmatter fields that must name an existing entry in another collection. */
export const references: ReadonlyArray<readonly [CollectionName, string, CollectionName]> = [
  ["signals", "layer", "layers"],
  ["signals", "phases", "phases"],
  ["questions", "signals", "signals"],
  ["questions", "diagnostics", "diagnostics"],
  ["questions", "related", "questions"],
  ["questions", "pages", "pages"],
  ["plays", "moves", "signals"],
  ["audit", "signals", "signals"],
  ["glossary", "signals", "signals"],
  ["glossary", "questions", "questions"],
  ["glossary", "related", "glossary"],
];

/** Inline links in Markdown use `[text](type:id)`. Each consumer resolves them its own way. */
export const linkTypes = {
  question: "questions",
  play: "plays",
  signal: "signals",
  audit: "audit",
  diagnostic: "diagnostics",
  page: "pages",
  phase: "phases",
  layer: "layers",
  offer: "offers",
  principle: "principles",
  term: "glossary",
} as const satisfies Record<string, CollectionName>;

export type LinkType = keyof typeof linkTypes;

/** The link type for each collection, e.g. `glossary` → `term`. */
export const linkTypeFor = Object.fromEntries(
  Object.entries(linkTypes).map(([type, collection]) => [collection, type]),
) as Record<CollectionName, LinkType>;

type EntryOf<N extends CollectionName> = z.infer<(typeof collections)[N]["schema"]> & {
  id: string;
  body: string;
};

export type Playbook = { [N in CollectionName]: EntryOf<N>[] };
export type Layer = EntryOf<"layers">;
export type Phase = EntryOf<"phases">;
export type Signal = EntryOf<"signals">;
export type Question = EntryOf<"questions">;
export type Play = EntryOf<"plays">;
export type AuditPillar = EntryOf<"audit">;
export type Diagnostic = EntryOf<"diagnostics">;
export type Principle = EntryOf<"principles">;
export type Offer = EntryOf<"offers">;
export type Term = EntryOf<"glossary">;
export type Page = EntryOf<"pages">;
export type Block = z.infer<typeof block>;

const entryFields = { id: Id, body: z.string() };

/** The whole playbook as one object, for the JSON export and its JSON Schema. */
export const playbookSchema = z.strictObject({
  layers: z.array(layer.extend(entryFields)),
  phases: z.array(phase.extend(entryFields)),
  signals: z.array(signal.extend(entryFields)),
  questions: z.array(question.extend(entryFields)),
  plays: z.array(play.extend(entryFields)),
  audit: z.array(auditPillar.extend(entryFields)),
  diagnostics: z.array(diagnostic.extend(entryFields)),
  principles: z.array(principle.extend(entryFields)),
  offers: z.array(offer.extend(entryFields)),
  glossary: z.array(term.extend(entryFields)),
  pages: z.array(page.extend(entryFields)),
});
