import type {
  CollectionName,
  Layer,
  Offer,
  Page,
  Play,
  Playbook,
  Question,
  Term,
} from "./schema.ts";

export type AnyEntry = Playbook[CollectionName][number];

/** A readable title for any entry, for link text and listings. */
export function titleOf(collection: CollectionName, entry: AnyEntry): string {
  switch (collection) {
    case "questions":
      return (entry as Question).question;
    case "layers":
      return (entry as Layer).name;
    case "offers":
      return (entry as Offer).name;
    case "pages":
      return (entry as Page).navLabel;
    case "glossary": {
      const { term, expansion } = entry as Term;
      return expansion ? `${term} (${expansion})` : term;
    }
    default:
      return (entry as { title: string }).title;
  }
}

/**
 * Labels for the play enums. Both the site and the MCP server read them from here,
 * so a play reads the same way wherever it's shown.
 */
export const effortLabel = {
  S: "S, under a week",
  M: "M, one to four weeks",
  L: "L, over a month",
} as const satisfies Record<Play["effort"], string>;

export const firstSignalLabel = {
  immediate: "Immediately",
  days: "Days to weeks",
  weeks: "Weeks",
  months: "Months",
} as const satisfies Record<Play["firstSignal"], string>;

export const ownerLabel = {
  strategy: "Strategy",
  content: "Content",
  technical: "Technical",
  "off-site": "Off-site",
  analytics: "Analytics",
} as const satisfies Record<Play["owner"], string>;
