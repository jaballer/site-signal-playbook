import { loadPlaybook, type CollectionName, type Playbook } from "@site-signal/playbook";

let cached: { playbook: Playbook; at: number } | undefined;

/**
 * Loads and validates /content. A production build loads it once. In dev, the result is reused
 * for a moment so a single page render doesn't re-read every file, then reloaded to pick up edits.
 */
export function getPlaybook(): Playbook {
  const fresh = cached && (!import.meta.env.DEV || Date.now() - cached.at < 500);
  if (!fresh) cached = { playbook: loadPlaybook(__PLAYBOOK_CONTENT_DIR__), at: Date.now() };
  return cached!.playbook;
}

/** Looks up one entry, failing loudly if a route or reference points at nothing. */
export function getEntry<N extends CollectionName>(collection: N, id: string): Playbook[N][number] {
  const entry = (getPlaybook()[collection] as Array<{ id: string }>).find((e) => e.id === id);
  if (!entry) throw new Error(`No ${collection} entry with id "${id}"`);
  return entry as Playbook[N][number];
}
