import { linkTypes, type CollectionName, type LinkType, type Playbook } from "./schema.ts";

const INLINE_LINK = /\]\((?!https?:|mailto:)([a-z]+):([^)\s]+)\)/g;

/**
 * Rewrites `[text](type:id)` links using the consumer's resolver,
 * e.g. to site URLs or MCP resource URIs.
 */
export function resolveLinks(markdown: string, toHref: (type: LinkType, id: string) => string) {
  return markdown.replace(INLINE_LINK, (match, type: string, id: string) =>
    type in linkTypes ? `](${toHref(type as LinkType, id)})` : match,
  );
}

/** Every other entry whose text links to `type:id`, e.g. each entry that mentions `[SERP](term:serp)`. */
export function linksTo(
  playbook: Playbook,
  type: LinkType,
  id: string,
): Array<{ collection: CollectionName; id: string }> {
  const needle = `](${type}:${id})`;
  const target = linkTypes[type];
  return (Object.keys(playbook) as CollectionName[]).flatMap((collection) =>
    (playbook[collection] as Array<{ id: string }>)
      .filter((entry) => !(collection === target && entry.id === id))
      .filter((entry) => JSON.stringify(entry).includes(needle))
      .map((entry) => ({ collection, id: entry.id })),
  );
}
