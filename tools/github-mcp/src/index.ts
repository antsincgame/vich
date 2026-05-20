#!/usr/bin/env node
/**
 * github-release-mcp — a small MCP server for GitHub release/tag operations that
 * the built-in GitHub MCP server does not provide (create_release, create_tag).
 *
 * Auth: set GITHUB_TOKEN (or GH_TOKEN) in the server's environment — a token with
 * `contents: write` on the target repo. Talks to the GitHub REST API over stdio.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API = (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/+$/, '')

function token(): string {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
}

async function gh(path: string, init: RequestInit = {}): Promise<any> {
  const t = token()
  if (!t) throw new Error('No GitHub token. Set GITHUB_TOKEN (or GH_TOKEN) in the server environment.')
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${t}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'github-release-mcp',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  const text = await res.text()
  let body: any = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} ${init.method ?? 'GET'} ${path}: ${body.message ?? text}`)
  }
  return body
}

const ok = (text: string) => ({ content: [{ type: 'text' as const, text }] })
const fail = (e: unknown) => ({
  content: [{ type: 'text' as const, text: `Error: ${e instanceof Error ? e.message : String(e)}` }],
  isError: true,
})

const server = new McpServer({ name: 'github-release-mcp', version: '0.1.0' })

server.registerTool(
  'create_release',
  {
    title: 'Create a GitHub release',
    description:
      'Create a release. Creates the tag from target_commitish if it does not exist yet. Returns the release URL.',
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      tag_name: z.string(),
      target_commitish: z
        .string()
        .optional()
        .describe('Branch or commit SHA to tag if the tag does not exist (default: repo default branch)'),
      name: z.string().optional(),
      body: z.string().optional(),
      draft: z.boolean().optional(),
      prerelease: z.boolean().optional(),
      generate_release_notes: z.boolean().optional(),
    },
  },
  async (a) => {
    try {
      const r = await gh(`/repos/${a.owner}/${a.repo}/releases`, {
        method: 'POST',
        body: JSON.stringify({
          tag_name: a.tag_name,
          target_commitish: a.target_commitish,
          name: a.name ?? a.tag_name,
          body: a.body,
          draft: a.draft ?? false,
          prerelease: a.prerelease ?? false,
          generate_release_notes: a.generate_release_notes ?? false,
        }),
      })
      return ok(`Created release ${r.tag_name} (id ${r.id}): ${r.html_url}`)
    } catch (e) {
      return fail(e)
    }
  },
)

server.registerTool(
  'create_tag',
  {
    title: 'Create a git tag',
    description:
      'Create a tag ref. If sha is omitted, resolves the head of from_branch. With message, creates an annotated tag.',
    inputSchema: {
      owner: z.string(),
      repo: z.string(),
      tag: z.string(),
      sha: z.string().optional(),
      from_branch: z.string().optional().describe('Branch to tag when sha is omitted (default: main)'),
      message: z.string().optional().describe('Annotated-tag message; lightweight tag if omitted'),
    },
  },
  async (a) => {
    try {
      let sha = a.sha
      if (!sha) {
        const ref = await gh(
          `/repos/${a.owner}/${a.repo}/git/ref/heads/${encodeURIComponent(a.from_branch ?? 'main')}`,
        )
        sha = ref.object.sha as string
      }
      let target = sha
      if (a.message) {
        const tagObj = await gh(`/repos/${a.owner}/${a.repo}/git/tags`, {
          method: 'POST',
          body: JSON.stringify({ tag: a.tag, message: a.message, object: sha, type: 'commit' }),
        })
        target = tagObj.sha as string
      }
      const r = await gh(`/repos/${a.owner}/${a.repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/tags/${a.tag}`, sha: target }),
      })
      return ok(`Created tag ${a.tag} -> ${sha} (ref ${r.ref})`)
    } catch (e) {
      return fail(e)
    }
  },
)

server.registerTool(
  'list_releases',
  {
    title: 'List releases',
    description: 'List releases for a repository.',
    inputSchema: { owner: z.string(), repo: z.string(), per_page: z.number().optional() },
  },
  async (a) => {
    try {
      const r = (await gh(`/repos/${a.owner}/${a.repo}/releases?per_page=${a.per_page ?? 30}`)) as any[]
      const lines = r.map(
        (x) => `- ${x.tag_name}${x.draft ? ' (draft)' : ''}${x.prerelease ? ' (prerelease)' : ''}: ${x.html_url}`,
      )
      return ok(lines.length ? lines.join('\n') : '(no releases)')
    } catch (e) {
      return fail(e)
    }
  },
)

server.registerTool(
  'get_release_by_tag',
  {
    title: 'Get release by tag',
    description: 'Get a release by its tag name.',
    inputSchema: { owner: z.string(), repo: z.string(), tag: z.string() },
  },
  async (a) => {
    try {
      const r = await gh(`/repos/${a.owner}/${a.repo}/releases/tags/${encodeURIComponent(a.tag)}`)
      return ok(
        JSON.stringify(
          { tag: r.tag_name, name: r.name, url: r.html_url, draft: r.draft, prerelease: r.prerelease, created_at: r.created_at },
          null,
          2,
        ),
      )
    } catch (e) {
      return fail(e)
    }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`github-release-mcp ready${token() ? '' : ' (no token set — calls will error until GITHUB_TOKEN is provided)'}`)
