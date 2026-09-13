import type { CollectionName, Layer, Offer, Page, Playbook, Question, Term } from "./schema.ts";

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
