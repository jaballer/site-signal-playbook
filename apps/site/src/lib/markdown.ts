import { resolveLinks } from "@site-signal/playbook";
import { marked } from "marked";
import { hrefFor } from "./links.ts";

/** Renders a short Markdown string (no wrapping paragraph). */
export const inline = (text: string) =>
  marked.parseInline(resolveLinks(text, hrefFor), { async: false });

/** Renders Markdown that may contain paragraphs and lists. */
export const blockMarkdown = (text: string) =>
  marked.parse(resolveLinks(text, hrefFor), { async: false });

/** Renders a "say it like" script with its [placeholders] highlighted. */
export const script = (text: string) =>
  inline(text).replace(/\[[^\]]+\]/g, (placeholder) => `<span class="ph">${placeholder}</span>`);
