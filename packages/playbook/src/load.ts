import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  Id,
  collections,
  linkTypes,
  references,
  type CollectionName,
  type Playbook,
} from "./schema.ts";

export class PlaybookError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Playbook content has ${issues.length} problem(s):\n- ${issues.join("\n- ")}`);
    this.name = "PlaybookError";
    this.issues = issues;
  }
}

type RawEntry = Record<string, unknown> & { id: string; body: string };

function splitFrontmatter(source: string): { data: unknown; body: string } | null {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return null;
  return { data: parseYaml(match[1]) ?? {}, body: match[2].trim() };
}

// `[text](type:id)` links, skipping ordinary web and mail links.
const INLINE_LINK = /\]\((?!https?:|mailto:)([a-z]+):([^)\s]+)\)/g;
const HTML_TAG = /<\/?[a-z][a-z0-9]*[\s>/]/i;
// Markdown autolinks (`<scheme:...>`) other than web and mail. Renderers turn these into live
// links, so `<javascript:...>` in content would become a script URL on the site.
const UNSAFE_AUTOLINK = /<(?!https?:|mailto:)[a-z][a-z0-9+.-]*:[^>\s]*>/i;

/**
 * Reads every collection under `contentDir`, validates frontmatter against its schema,
 * and checks that references and inline links point at real entries.
 * Throws a PlaybookError listing every problem found.
 */
export function loadPlaybook(contentDir: string): Playbook {
  const issues: string[] = [];
  const entries = {} as Record<CollectionName, RawEntry[]>;

  for (const name of Object.keys(collections) as CollectionName[]) {
    const def = collections[name];
    const dir = join(contentDir, name);
    entries[name] = [];
    if (!existsSync(dir)) {
      issues.push(`${name}/: folder is missing`);
      continue;
    }
    for (const file of readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()) {
      const where = `${name}/${file}`;
      const id = basename(file, ".md");
      if (!Id.safeParse(id).success) {
        issues.push(`${where}: file name must be a kebab-case id`);
        continue;
      }
      let parsed: ReturnType<typeof splitFrontmatter>;
      try {
        parsed = splitFrontmatter(readFileSync(join(dir, file), "utf8"));
      } catch (error) {
        issues.push(`${where}: invalid YAML (${(error as Error).message.split("\n")[0]})`);
        continue;
      }
      if (!parsed) {
        issues.push(`${where}: missing frontmatter`);
        continue;
      }
      const result = def.schema.safeParse(parsed.data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push(`${where}: ${issue.path.join(".") || "(frontmatter)"}: ${issue.message}`);
        }
        continue;
      }
      if (def.body === "required" && !parsed.body) {
        issues.push(`${where}: body text is required (${def.bodyMeaning})`);
      }
      if (def.body === "none" && parsed.body) {
        issues.push(`${where}: ${name} don't use body text; move it into frontmatter`);
      }
      entries[name].push({ id, ...(result.data as object), body: parsed.body });
    }
    const sortBy = "sortBy" in def ? def.sortBy : undefined;
    entries[name].sort((a, b) => {
      if (typeof a.order === "number" && typeof b.order === "number") return a.order - b.order;
      if (sortBy) {
        return String(a[sortBy]).localeCompare(String(b[sortBy]), "en", { sensitivity: "base" });
      }
      return a.id.localeCompare(b.id);
    });
  }

  const ids = Object.fromEntries(
    Object.entries(entries).map(([name, list]) => [name, new Set(list.map((e) => e.id))]),
  ) as Record<CollectionName, Set<string>>;

  for (const [from, field, to] of references) {
    for (const entry of entries[from]) {
      const value = entry[field];
      const refs = value === undefined ? [] : Array.isArray(value) ? value : [value];
      for (const ref of refs) {
        if (!ids[to].has(String(ref))) {
          issues.push(`${from}/${entry.id}.md: ${field} "${ref}" isn't a ${to} id`);
        }
      }
    }
  }

  // People look terms up by name, so a term, expansion or alias can belong to only one entry.
  const glossaryNames = new Map<string, string>();
  for (const entry of entries.glossary) {
    const names = [
      entry.term,
      entry.expansion,
      ...((entry.aliases as unknown[] | undefined) ?? []),
    ];
    for (const name of names) {
      if (typeof name !== "string") continue;
      const owner = glossaryNames.get(name.toLowerCase());
      if (owner === undefined) glossaryNames.set(name.toLowerCase(), entry.id);
      else if (owner !== entry.id) {
        issues.push(`glossary/${entry.id}.md: "${name}" is already used by glossary/${owner}.md`);
      }
    }
  }

  for (const [name, list] of Object.entries(entries)) {
    for (const entry of list) {
      const text = JSON.stringify(entry);
      for (const [, type, ref] of text.matchAll(INLINE_LINK)) {
        const target = linkTypes[type as keyof typeof linkTypes];
        if (!target) {
          issues.push(
            `${name}/${entry.id}.md: unknown link type "${type}:" (use ${Object.keys(linkTypes).join(", ")})`,
          );
        } else if (!ids[target].has(ref)) {
          issues.push(`${name}/${entry.id}.md: link "${type}:${ref}" doesn't match a ${target} id`);
        }
      }
      if (HTML_TAG.test(text)) {
        issues.push(`${name}/${entry.id}.md: contains HTML; use Markdown instead`);
      }
      if (UNSAFE_AUTOLINK.test(text)) {
        issues.push(`${name}/${entry.id}.md: autolinks must use http, https or mailto`);
      }
    }
  }

  for (const page of entries.pages) {
    for (const [i, block] of (page.blocks as Array<Record<string, unknown>>).entries()) {
      if (block.type !== "table") continue;
      const width = (block.columns as unknown[]).length;
      (block.rows as unknown[][]).forEach((row, r) => {
        if (row.length !== width) {
          issues.push(
            `pages/${page.id}.md: blocks.${i}.rows.${r} has ${row.length} cells; the table has ${width} columns`,
          );
        }
      });
    }
  }

  if (issues.length) throw new PlaybookError(issues);
  return entries as unknown as Playbook;
}
