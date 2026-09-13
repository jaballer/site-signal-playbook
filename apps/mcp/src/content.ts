import {
  loadPlaybook,
  PlaybookError,
  type CollectionName,
  type Playbook,
} from "@site-signal/playbook";

export type Loaded = { ok: true; playbook: Playbook } | { ok: false; issues: string[] };

export type ContentSource = {
  contentDir: string;
  /** Loads /content, reusing the last result for up to a second unless `fresh` is set. */
  load(options?: { fresh?: boolean }): Loaded;
};

/**
 * Content is re-read on demand, so edits show up without restarting the server.
 * The short reuse window keeps a burst of requests (list, then read) from re-reading every file.
 */
export function createContentSource(contentDir: string): ContentSource {
  let cached: { at: number; result: Loaded } | undefined;
  return {
    contentDir,
    load({ fresh = false } = {}) {
      if (!fresh && cached && Date.now() - cached.at < 1000) return cached.result;
      let result: Loaded;
      try {
        result = { ok: true, playbook: loadPlaybook(contentDir) };
      } catch (error) {
        if (!(error instanceof PlaybookError)) throw error;
        result = { ok: false, issues: error.issues };
      }
      cached = { at: Date.now(), result };
      return result;
    },
  };
}

export type AnyEntry = Playbook[CollectionName][number];

export function findEntry(
  playbook: Playbook,
  collection: CollectionName,
  id: string,
): AnyEntry | undefined {
  return (playbook[collection] as AnyEntry[]).find((entry) => entry.id === id);
}
