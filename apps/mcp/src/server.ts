import { readFileSync } from "node:fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { defaultContentDir } from "@site-signal/playbook/paths";
import { createPlaybookServer } from "./playbook-server.ts";

// stdout carries the MCP protocol, so anything human-readable goes to stderr.
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as {
  version?: string;
};
const contentDir = process.env.PLAYBOOK_CONTENT_DIR ?? defaultContentDir;

const server = createPlaybookServer({ contentDir, version: version ?? "0.1.0" });
await server.connect(new StdioServerTransport());
console.error(`Site Signal Playbook MCP server running on stdio (content: ${contentDir})`);
