// Smoke test: spawn the built server over stdio, list tools, and exercise a call.
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({ command: 'node', args: ['dist/index.js'] })
const client = new Client({ name: 'smoke', version: '0.0.0' })
await client.connect(transport)

const { tools } = await client.listTools()
console.log('TOOLS:')
for (const t of tools) {
  console.log(`  ${t.name}(${Object.keys(t.inputSchema?.properties ?? {}).join(', ')})`)
}

const res = await client.callTool({
  name: 'list_releases',
  arguments: { owner: 'antsincgame', repo: 'vich' },
})
console.log('CALL list_releases -> isError:', res.isError, '|', res.content?.[0]?.text)

await client.close()
