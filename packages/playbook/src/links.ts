import { linkTypes, type LinkType } from "./schema.ts";

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
