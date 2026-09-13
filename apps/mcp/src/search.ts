import {
  collections,
  titleOf,
  type AnyEntry,
  type CollectionName,
  type Playbook,
} from "@site-signal/playbook";
import { summaryOf } from "./render.ts";

export type SearchHit = {
  collection: CollectionName;
  id: string;
  title: string;
  summary: string;
  score: number;
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);

/**
 * A crude stem: longer words are matched by their first few letters, so "dropped" finds "drop"
 * and "indexed" finds "index". Short words like "ai" or "seo" must match whole.
 */
const stem = (token: string) =>
  token.length > 4 ? token.slice(0, Math.max(4, token.length - 3)) : token;

/**
 * Keyword search across entries. Every query word must appear somewhere in an entry;
 * if nothing matches that strictly, any word will do. Title matches rank highest.
 */
export function searchPlaybook(
  playbook: Playbook,
  query: string,
  { within, limit }: { within?: CollectionName[]; limit: number },
): SearchHit[] {
  const tokens = tokenize(query).map(stem);
  // A query with no searchable words ("?", "a") would otherwise match almost everything.
  if (!tokens.length) return [];
  const phrase = query.trim().toLowerCase();

  const candidates = (
    within?.length ? within : (Object.keys(collections) as CollectionName[])
  ).flatMap((collection) =>
    (playbook[collection] as AnyEntry[]).map((entry) => {
      const title = titleOf(collection, entry);
      const summary = summaryOf(collection, entry);
      return {
        collection,
        entry,
        title,
        summary,
        titleText: title.toLowerCase(),
        summaryText: summary.toLowerCase(),
        fullText: `${entry.id} ${JSON.stringify(entry)}`.toLowerCase(),
      };
    }),
  );

  const score = (c: (typeof candidates)[number], requireAll: boolean) => {
    const present = tokens.filter((t) => c.fullText.includes(t));
    if (requireAll ? present.length < tokens.length : present.length === 0) return 0;
    let total = 0;
    for (const t of present) {
      if (c.titleText.includes(t)) total += 5;
      if (c.summaryText.includes(t)) total += 2;
      total += 1;
    }
    if (phrase && c.titleText.includes(phrase)) total += 10;
    else if (phrase && c.fullText.includes(phrase)) total += 3;
    return total;
  };

  const rank = (requireAll: boolean) =>
    candidates
      .map((c) => ({ c, s: score(c, requireAll) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s || a.c.title.localeCompare(b.c.title));

  const strict = rank(true);
  const ranked = strict.length ? strict : rank(false);
  return ranked.slice(0, limit).map(({ c, s }) => ({
    collection: c.collection,
    id: c.entry.id,
    title: c.title,
    summary: c.summary,
    score: s,
  }));
}

/** Ids that look like what the caller meant, for "not found" errors. */
export function suggestIds(ids: string[], wanted: string, max = 5): string[] {
  const parts = tokenize(wanted.replace(/-/g, " "));
  return ids
    .map((id) => ({
      id,
      hits:
        parts.filter((p) => id.includes(p)).length + (id.startsWith(wanted.slice(0, 3)) ? 1 : 0),
    }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.id.localeCompare(b.id))
    .slice(0, max)
    .map((x) => x.id);
}
