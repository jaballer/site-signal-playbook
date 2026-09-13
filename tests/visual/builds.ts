import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Runs a command to completion and returns its stdout. Output is only shown when it fails. */
function run(command: string, args: string[], cwd: string): string {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const line = `${command} ${args.join(" ")}`;
  if (result.signal) throw new Error(`\`${line}\` was interrupted.`);
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    const tail = output.split("\n").slice(-30).join("\n") || result.error?.message;
    throw new Error(`\`${line}\` failed in ${cwd}:\n${tail}`);
  }
  return result.stdout.trim();
}

export const git = (cwd: string, ...args: string[]) => run("git", args, cwd);

/** Builds the working tree the usual way (content validation, then the site). */
export function buildWorkingTree(repo: string): string {
  run("npm", ["run", "build"], repo);
  return join(repo, "apps", "site", "dist");
}

/**
 * Builds the site as of `ref` in a temporary git worktree with a clean install, and keeps the built
 * site under `cacheRoot`, keyed by commit. A ref is only rebuilt after it moves.
 */
export function buildRef(
  repo: string,
  ref: string,
  cacheRoot: string,
  log: (message: string) => void,
): { label: string; dist: string } {
  let sha: string;
  try {
    sha = git(repo, "rev-parse", "--verify", `${ref}^{commit}`);
  } catch {
    throw new Error(`"${ref}" isn't a commit in this repository.`);
  }
  // "main (83fa912)", or just "83fa912" when the ref is already a commit hash.
  const label = sha.startsWith(ref) ? sha.slice(0, 7) : `${ref} (${sha.slice(0, 7)})`;
  const dist = join(cacheRoot, sha);
  if (existsSync(join(dist, "index.html"))) {
    log(`Using the saved build of ${label}.`);
    return { label, dist };
  }

  log(`Building ${label} in a temporary worktree. This takes a minute the first time…`);
  git(repo, "worktree", "prune");
  const worktree = mkdtempSync(join(tmpdir(), "site-signal-visual-"));
  git(repo, "worktree", "add", "--detach", worktree, sha);
  // Ctrl+C also stops npm. Listening for it keeps this process alive long enough to remove the worktree.
  const onInterrupt = () => {};
  process.on("SIGINT", onInterrupt);
  try {
    if (!existsSync(join(worktree, "apps", "site", "package.json"))) {
      throw new Error(
        `${ref} has no apps/site to build. Compare against a commit made after the Astro migration.`,
      );
    }
    run("npm", ["ci", "--no-audit", "--no-fund"], worktree);
    run("npm", ["run", "build"], worktree);
    // Copy under a temporary name first, so an interrupted copy never looks like a saved build.
    const partial = `${dist}.partial`;
    rmSync(partial, { recursive: true, force: true });
    rmSync(dist, { recursive: true, force: true });
    mkdirSync(cacheRoot, { recursive: true });
    cpSync(join(worktree, "apps", "site", "dist"), partial, { recursive: true });
    renameSync(partial, dist);
  } finally {
    try {
      git(repo, "worktree", "remove", "--force", worktree);
    } catch {
      rmSync(worktree, { recursive: true, force: true });
      git(repo, "worktree", "prune");
    }
    process.off("SIGINT", onInterrupt);
  }
  return { label, dist };
}
