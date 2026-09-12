import { loadPlaybook, PlaybookError } from "../load.ts";
import { defaultContentDir } from "../paths.ts";

const contentDir = process.argv[2] ?? defaultContentDir;

try {
  const playbook = loadPlaybook(contentDir);
  console.log("Playbook content is valid.");
  for (const [name, entries] of Object.entries(playbook)) {
    console.log(`  ${name.padEnd(12)} ${entries.length}`);
  }
} catch (error) {
  if (!(error instanceof PlaybookError)) throw error;
  console.error(error.message);
  process.exit(1);
}
