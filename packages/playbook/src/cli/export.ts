import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { loadPlaybook, PlaybookError } from "../load.ts";
import { defaultContentDir, defaultDistDir } from "../paths.ts";
import { playbookSchema } from "../schema.ts";

try {
  const playbook = loadPlaybook(defaultContentDir);
  mkdirSync(defaultDistDir, { recursive: true });
  writeFileSync(join(defaultDistDir, "playbook.json"), `${JSON.stringify(playbook, null, 2)}\n`);
  writeFileSync(
    join(defaultDistDir, "playbook.schema.json"),
    `${JSON.stringify(z.toJSONSchema(playbookSchema), null, 2)}\n`,
  );
  console.log(`Wrote dist/playbook.json and dist/playbook.schema.json`);
} catch (error) {
  if (!(error instanceof PlaybookError)) throw error;
  console.error(error.message);
  process.exit(1);
}
