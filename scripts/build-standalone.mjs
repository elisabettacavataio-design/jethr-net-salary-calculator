/**
 * Produces `dist/standalone.html`: the whole app in a single file.
 *
 * Why this exists: a normal Vite build loads its JavaScript as an ES module.
 * Browsers refuse to load ES modules — and stylesheets marked `crossorigin` —
 * over the `file://` protocol, so opening `dist/index.html` by double-clicking
 * it shows a blank page. That is a browser security rule, not a build error:
 * the usual answer is to serve `dist/` over HTTP (`npm run preview`).
 *
 * Inlining the script and the stylesheet removes the network requests
 * altogether, so the single file opens straight from the filesystem.
 *
 * No dependencies: plain Node, reading the files Vite has just written.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

const SCRIPT_TAG = /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/
const STYLE_TAG = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/

/** Reads an asset referenced by the built index.html. */
async function readAsset(reference) {
  const relativePath = reference.replace(/^\.?\//, '')
  return readFile(join(distDirectory, relativePath), 'utf8')
}

/** Prevents an embedded "</script>" from closing the tag early. */
function escapeForInlineScript(source) {
  return source.replace(/<\/script/gi, '<\\/script')
}

async function buildStandalone() {
  const indexPath = join(distDirectory, 'index.html')
  let html = await readFile(indexPath, 'utf8')

  const scriptMatch = html.match(SCRIPT_TAG)
  const styleMatch = html.match(STYLE_TAG)

  if (!scriptMatch || !styleMatch) {
    throw new Error(
      'Could not find the built script and stylesheet in dist/index.html. ' +
        'Run "npm run build" first.',
    )
  }

  const [scriptTag, scriptHref] = scriptMatch
  const [styleTag, styleHref] = styleMatch

  const script = escapeForInlineScript(await readAsset(scriptHref))
  const style = await readAsset(styleHref)

  // Function replacers, not strings: bundled code contains "$&" and similar
  // sequences, which String.replace would interpret as substitution patterns.
  html = html
    .replace(styleTag, () => `<style>\n${style}\n</style>`)
    .replace(scriptTag, () => `<script type="module">\n${script}\n</script>`)

  if (html.includes('assets/')) {
    throw new Error('An asset reference survived inlining; the output would not be self-contained.')
  }

  const outputPath = join(distDirectory, 'standalone.html')
  await writeFile(outputPath, html, 'utf8')

  const sizeInKb = Math.round(Buffer.byteLength(html) / 1024)
  console.log(`dist/standalone.html  ${sizeInKb} kB  — apribile con un doppio clic`)
}

await buildStandalone()
