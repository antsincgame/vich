// Copy the WebR distribution into public/webr so the R engine is served from the
// app's own origin (no cross-origin CDN fetch, works offline and on GitHub Pages).
// public/webr is gitignored and regenerated from node_modules on dev/build.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'node_modules/webr/dist')
const dest = resolve(root, 'public/webr')

if (!existsSync(src)) {
  console.error(`[setup-webr] ${src} not found — run "npm install" first.`)
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
cpSync(src, dest, {
  recursive: true,
  filter: (s) => !s.endsWith('.map') && !/[/\\](tests|repl)([/\\]|$)/.test(s),
})
console.log(`[setup-webr] copied WebR runtime -> ${dest}`)
