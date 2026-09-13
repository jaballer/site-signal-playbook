# Playbook MCP server

Gives Claude Desktop, Claude Code and any other MCP client read access to the playbook in `/content`. It reads the files on each request, so edits show up without a restart.

## What it offers

**Tools**, all read-only:

| Tool                  | What it does                                                                     |
| --------------------- | -------------------------------------------------------------------------------- |
| `search_playbook`     | Keyword search across every collection, optionally limited to some               |
| `get_entry`           | One entry in full as Markdown, with related entries linked                       |
| `list_entries`        | Every entry in a collection; signals can be filtered by layer or phase           |
| `get_audit_checklist` | The audit as a worksheet with Score and Evidence columns, for all pillars or one |
| `validate_content`    | Re-checks `/content` against the schemas; run it after editing content files     |

**Resources:**

- Every entry at `playbook://{collection}/{id}`, for example `playbook://plays/win-cited-sources`
- `playbook://guide`: how the playbook is organized
- `playbook://schema`: the JSON Schema

**Prompts:**

- `answer_leader_question`: work through a leader question for a client and fill in the report sentence
- `run_audit`: score the audit for a site, with evidence, and turn fails into ranked findings
- `diagnose`: work through a diagnostic flow for a specific situation
- `plan_roadmap`: map findings to plays, prioritize them, and propose the top three

Prompt arguments autocomplete ids in clients that support it.

## Requirements

Node 22.18 or newer; the server runs TypeScript directly with no build step. Run `npm install` at the repo root first.

## Connect it

### Claude Code

The repo's `.mcp.json` registers the server as `playbook` for anyone working in this project. Start `claude` from the repo root and approve the server when asked. Then:

- the prompts appear as `/mcp__playbook__answer_leader_question` and similar
- resources can be referenced with `@`

### Claude Desktop

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`, then restart Claude Desktop:

```json
{
  "mcpServers": {
    "site-signal-playbook": {
      "command": "/absolute/path/to/node",
      "args": [
        "--disable-warning=ExperimentalWarning",
        "/absolute/path/to/site-signal-playbook/apps/mcp/src/server.ts"
      ]
    }
  }
}
```

Use absolute paths for both. Claude Desktop doesn't load your shell, so a bare `node` may not be found, or may resolve to an older version. `command -v node` prints the path to use. If you use nvm, update the path when you switch Node versions.

### Other clients and debugging

Any MCP client that can launch a stdio server works with the same command. To try the server interactively in the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node --disable-warning=ExperimentalWarning apps/mcp/src/server.ts
```

## Configuration

`PLAYBOOK_CONTENT_DIR` points the server at a different content folder. By default it reads the repo's `/content`.

## Development

```bash
npm test          # from the repo root: tools, resources, prompts, invalid content, stdio startup
npm run check     # type checks, including this package
```

The server writes only MCP protocol messages to stdout, so logging must go to stderr (`console.error`).
