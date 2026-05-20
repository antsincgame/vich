# github-release-mcp

A small [MCP](https://modelcontextprotocol.io) server exposing GitHub
**release/tag** operations that the built-in GitHub MCP server doesn't provide —
most importantly `create_release` (which also creates the tag) and `create_tag`.

Built because the hosted environment couldn't push tags or create releases; run
this locally with your own token to do it.

## Tools

| Tool | What it does |
|---|---|
| `create_release` | Create a release; creates the tag from `target_commitish` if missing. |
| `create_tag` | Create a tag ref (lightweight, or annotated with `message`). |
| `list_releases` | List a repo's releases. |
| `get_release_by_tag` | Fetch a release by tag name. |

## Build & test

```bash
cd tools/github-mcp
npm install
npm run build     # -> dist/index.js
npm run smoke     # spawns the server, lists tools (no token needed to list)
```

## Auth

Set a token with `contents: write` on the target repo:

```bash
export GITHUB_TOKEN=ghp_xxx   # or GH_TOKEN
```

`GITHUB_API_URL` can be set for GitHub Enterprise (default `https://api.github.com`).

## Use from Claude Code

Add it to your MCP config (e.g. project `.mcp.json`) and restart Claude Code:

```json
{
  "mcpServers": {
    "github-release": {
      "command": "node",
      "args": ["tools/github-mcp/dist/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

Or: `claude mcp add github-release --env GITHUB_TOKEN=ghp_xxx -- node tools/github-mcp/dist/index.js`

## Example — finish the v0.1.0 release

Once configured, call:

```
create_release  owner=antsincgame  repo=vich  tag_name=v0.1.0
                target_commitish=main  generate_release_notes=true
```

This creates the `v0.1.0` tag on `main` and publishes the release in one call.

> Not affiliated with GitHub. Uses the public GitHub REST API.
