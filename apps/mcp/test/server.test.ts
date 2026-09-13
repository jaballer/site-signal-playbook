import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { linkTypes, loadPlaybook } from "@site-signal/playbook";
import { defaultContentDir } from "@site-signal/playbook/paths";
import { createPlaybookServer } from "../src/playbook-server.ts";

const TOOL_NAMES = [
  "get_audit_checklist",
  "get_entry",
  "list_entries",
  "search_playbook",
  "validate_content",
];
const UNRESOLVED_LINK = new RegExp(`\\]\\((${Object.keys(linkTypes).join("|")}):`);

async function connect(contentDir: string) {
  const server = createPlaybookServer({ contentDir });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return {
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

type ToolResult = { content?: unknown; isError?: boolean };
const textOf = (result: ToolResult) =>
  (result.content as Array<{ type: string; text: string }>).map((c) => c.text).join("\n");

const call = (client: Client, name: string, args: Record<string, unknown> = {}) =>
  client.callTool({ name, arguments: args }) as Promise<ToolResult>;

describe("playbook MCP server", () => {
  let client: Client;
  let close: () => Promise<void>;

  before(async () => {
    ({ client, close } = await connect(defaultContentDir));
  });
  after(() => close());

  it("lists five read-only tools", async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), TOOL_NAMES);
    for (const tool of tools) assert.equal(tool.annotations?.readOnlyHint, true, tool.name);
  });

  it("searches across collections", async () => {
    const result = await call(client, "search_playbook", { query: "citation share" });
    assert.ok(!result.isError);
    assert.match(textOf(result), /playbook:\/\/signals\/citation-share/);
  });

  it("returns nothing for a query with no searchable words", async () => {
    assert.match(
      textOf(await call(client, "search_playbook", { query: "?" })),
      /No playbook entries match/,
    );
  });

  it("matches word forms, not just exact words", async () => {
    const text = textOf(await call(client, "search_playbook", { query: "traffic dropped" }));
    assert.match(text, /questions\/traffic-drop/);
    assert.match(text, /diagnostics\/organic-traffic-drop/);
  });

  it("limits search to chosen collections", async () => {
    const text = textOf(
      await call(client, "search_playbook", { query: "index", collections: ["diagnostics"] }),
    );
    assert.match(text, /diagnostics\/deindexed-pages/);
    assert.doesNotMatch(text, /\((signals|plays|questions)\//);
  });

  it("returns a full entry with links as playbook URIs", async () => {
    const text = textOf(
      await call(client, "get_entry", { collection: "questions", id: "search-value" }),
    );
    assert.match(text, /^# What is search worth to us/);
    assert.match(text, /## Steps/);
    assert.match(text, /\(playbook:\/\/questions\/trust-the-numbers\)/);
    assert.doesNotMatch(text, UNRESOLVED_LINK);
  });

  it("suggests ids when an entry isn't found", async () => {
    const result = await call(client, "get_entry", { collection: "plays", id: "cited-sources" });
    assert.equal(result.isError, true);
    assert.match(textOf(result), /win-cited-sources/);
  });

  it("filters signals by layer and phase", async () => {
    assert.match(
      textOf(await call(client, "list_entries", { collection: "signals", layer: "ai-visibility" })),
      /: 5 entries/,
    );
    const text = textOf(
      await call(client, "list_entries", {
        collection: "signals",
        layer: "foundations",
        phase: "execute",
      }),
    );
    assert.match(text, /structured-data/);
    assert.doesNotMatch(text, /js-rendering/);
  });

  it("rejects signal filters on other collections and unknown filter ids", async () => {
    assert.equal(
      (await call(client, "list_entries", { collection: "plays", layer: "traffic" })).isError,
      true,
    );
    assert.equal(
      (await call(client, "list_entries", { collection: "signals", layer: "nope" })).isError,
      true,
    );
  });

  it("builds an audit worksheet", async () => {
    const text = textOf(
      await call(client, "get_audit_checklist", { pillar: "technical", site: "example.com" }),
    );
    assert.match(text, /^# Search and AI visibility audit: example\.com/);
    assert.match(text, /\| Check \| How to check \| Fail looks like \| Score \| Evidence \|/);
    assert.match(text, /From checks to findings/);
    assert.doesNotMatch(text, /## 2\. /, "only the requested pillar");
    assert.equal((await call(client, "get_audit_checklist", { pillar: "nope" })).isError, true);
  });

  it("validates content", async () => {
    assert.match(textOf(await call(client, "validate_content")), /Playbook content is valid/);
  });

  it("exposes every entry as a readable resource", async () => {
    const { resources } = await client.listResources();
    const entries = resources.filter((r) => /^playbook:\/\/[a-z]+\/[a-z0-9-]+$/.test(r.uri));
    const expected = Object.values(loadPlaybook(defaultContentDir)).reduce(
      (sum, list) => sum + list.length,
      0,
    );
    assert.equal(entries.length, expected);
    for (const resource of entries) {
      const { contents } = await client.readResource({ uri: resource.uri });
      const text = String((contents[0] as { text: string }).text);
      assert.ok(text.startsWith("# "), resource.uri);
      assert.doesNotMatch(text, UNRESOLVED_LINK, resource.uri);
      assert.doesNotMatch(text, /undefined|\[object Object\]/, resource.uri);
    }
    assert.ok(resources.some((r) => r.uri === "playbook://guide"));
    assert.ok(resources.some((r) => r.uri === "playbook://schema"));
  });

  it("serves the JSON Schema and the guide", async () => {
    const schema = await client.readResource({ uri: "playbook://schema" });
    const parsed = JSON.parse(String((schema.contents[0] as { text: string }).text));
    assert.ok(parsed.properties.questions);
    const guide = await client.readResource({ uri: "playbook://guide" });
    assert.match(String((guide.contents[0] as { text: string }).text), /\*\*signals\*\* \(\d+\)/);
  });

  it("renders the four prompts with playbook content", async () => {
    const { prompts } = await client.listPrompts();
    assert.deepEqual(prompts.map((p) => p.name).sort(), [
      "answer_leader_question",
      "diagnose",
      "plan_roadmap",
      "run_audit",
    ]);

    const promptText = async (name: string, args: Record<string, string>) => {
      const { messages } = await client.getPrompt({ name, arguments: args });
      return String((messages[0].content as { text: string }).text);
    };
    const answer = await promptText("answer_leader_question", {
      question: "ai-answers",
      client: "Acme Corp",
    });
    assert.match(answer, /Acme Corp/);
    assert.match(answer, /# What do AI assistants say about us\?/);
    const audit = await promptText("run_audit", {
      site: "https://example.com",
      pillar: "ai-visibility",
    });
    assert.match(audit, /AI answer visibility/);
    assert.match(
      await promptText("diagnose", {
        diagnostic: "organic-traffic-drop",
        situation: "Clicks down 20%",
      }),
      /Clicks down 20%/,
    );
    const roadmap = await promptText("plan_roadmap", { findings: "Pricing page isn't indexed" });
    assert.match(roadmap, /## Prioritization model/);
    assert.match(roadmap, /playbook:\/\/plays\/unblock-crawling/);
  });

  it("autocompletes prompt arguments and resource ids", async () => {
    const questions = await client.complete({
      ref: { type: "ref/prompt", name: "answer_leader_question" },
      argument: { name: "question", value: "ai" },
    });
    assert.deepEqual(questions.completion.values.sort(), ["ai-answers", "ai-traffic"]);

    const ids = await client.complete({
      ref: { type: "ref/resource", uri: "playbook://{collection}/{id}" },
      argument: { name: "id", value: "win" },
      context: { arguments: { collection: "plays" } },
    });
    assert.deepEqual(ids.completion.values, ["win-cited-sources"]);
  });

  it("reads a glossary term with its aliases and related entries", async () => {
    const text = textOf(await call(client, "get_entry", { collection: "glossary", id: "geo" }));
    assert.match(text, /^# Term: GEO \(generative engine optimization\)/);
    assert.match(text, /\*\*Also called:\*\* AEO/);
    assert.match(text, /## How we measure it[\s\S]*playbook:\/\/signals\/citation-share/);
    assert.match(text, /## Related questions[\s\S]*playbook:\/\/questions\/ai-answers/);
  });

  it("finds glossary terms by alias", async () => {
    assert.match(textOf(await call(client, "search_playbook", { query: "AEO" })), /glossary\/geo/);
  });

  it("lists glossary terms on the signals they point at", async () => {
    const text = textOf(
      await call(client, "get_entry", { collection: "signals", id: "ctr-by-position" }),
    );
    assert.match(text, /## Used in[\s\S]*playbook:\/\/glossary\/ctr/);
  });
});

describe("with links to glossary terms", () => {
  let dir: string;
  let client: Client;
  let close: () => Promise<void>;

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), "playbook-content-"));
    cpSync(defaultContentDir, dir, { recursive: true });
    const file = join(dir, "questions", "traffic-drop.md");
    const source = readFileSync(file, "utf8");
    assert.ok(source.includes("new results-page features"), "fixture text is missing");
    writeFileSync(
      file,
      source.replace("new results-page features", "new [SERP](term:serp) features"),
    );
    ({ client, close } = await connect(dir));
  });
  after(async () => {
    await close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves term links and lists where each term is used", async () => {
    const question = textOf(
      await call(client, "get_entry", { collection: "questions", id: "traffic-drop" }),
    );
    assert.match(question, /\[SERP\]\(playbook:\/\/glossary\/serp\)/);
    const term = textOf(await call(client, "get_entry", { collection: "glossary", id: "serp" }));
    assert.match(
      term,
      /## Used in\n\n- \[Why did organic traffic drop\?\]\(playbook:\/\/questions\/traffic-drop\)/,
    );
  });
});

describe("with invalid content", () => {
  let dir: string;
  let client: Client;
  let close: () => Promise<void>;

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), "playbook-content-"));
    cpSync(defaultContentDir, dir, { recursive: true });
    const file = join(dir, "plays", "topic-cluster.md");
    writeFileSync(
      file,
      readFileSync(file, "utf8").replace("  - topic-coverage", "  - not-a-signal"),
    );
    writeFileSync(
      join(dir, "glossary", "aeo.md"),
      "---\nterm: AEO\ndefinition: Answer engine optimization.\n---\n\nDuplicates an alias of GEO.\n",
    );
    const kpi = join(dir, "glossary", "kpi.md");
    writeFileSync(kpi, `${readFileSync(kpi, "utf8").trimEnd()} See [ROI](term:not-a-term).\n`);
    ({ client, close } = await connect(dir));
  });
  after(async () => {
    await close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("reports the problems from validate_content", async () => {
    const result = await call(client, "validate_content");
    assert.ok(!result.isError);
    const text = textOf(result);
    assert.match(text, /plays\/topic-cluster\.md: moves "not-a-signal" isn't a signals id/);
    assert.match(text, /"AEO" is already used by glossary\//);
    assert.match(text, /glossary\/kpi\.md: link "term:not-a-term" doesn't match a glossary id/);
  });

  it("returns an error from reading tools instead of stale content", async () => {
    const result = await call(client, "get_entry", { collection: "plays", id: "topic-cluster" });
    assert.equal(result.isError, true);
    assert.match(textOf(result), /can't be read until they're fixed/);
  });
});

describe("stdio entrypoint", () => {
  it("starts and answers over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        "--disable-warning=ExperimentalWarning",
        fileURLToPath(new URL("../src/server.ts", import.meta.url)),
      ],
      stderr: "pipe",
    });
    const client = new Client({ name: "stdio-test", version: "0.0.0" });
    await client.connect(transport);
    try {
      const { tools } = await client.listTools();
      assert.equal(tools.length, TOOL_NAMES.length);
      assert.equal(client.getServerVersion()?.name, "site-signal-playbook");
    } finally {
      await client.close();
    }
  });
});
