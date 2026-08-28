/**
 * Client bundle builder for dsh-memory-manager.
 *
 * DSH browser client plugins must emit a closure-factory artifact:
 *
 *   window.__ModuleLoader__.load({
 *     id: "<package name>",
 *     factory: (require) => { ... return module.exports }
 *   })
 *
 * The loader's injected `require` resolves externals from the module table
 * (react family + @deepseek-ai platform/plugin modules), so every
 * `@deepseek-ai/*` and react import stays external. CSS Modules are compiled
 * to hashed class maps; the css text is inlined and auto-injected as a
 * `<style data-plugin>` tag when the factory materializes (the loader removes
 * plugin-owned tags on unload).
 *
 * This mirrors the behavior of the repo-internal tsdown preset
 * (packages/client/tsdown.client.ts) without importing it, so the plugin can
 * live outside the harness repository.
 */
import { build } from 'esbuild'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN_ID = 'dsh-skill-manager'
const CSS_TAG_ID = `${PLUGIN_ID}/MemoryManager.module.css`

/** Deterministic short hash for one CSS class name. */
function hashClass(name) {
  const digest = createHash('sha1').update(`dsh-memory-manager:${name}`).digest('hex').slice(0, 6)
  return `mm_${digest}`
}

/** CSS-modules virtual loader: rename classes, inline the stylesheet, export the map. */
const cssModulesPlugin = {
  name: 'css-modules',
  setup(build) {
    build.onResolve({ filter: /\.module\.css$/ }, (args) => ({
      path: args.path,
      namespace: 'dsh-css',
      pluginData: { resolveDir: args.resolveDir },
    }))
    build.onLoad({ filter: /.*/, namespace: 'dsh-css' }, (args) => {
      const full = resolve(args.pluginData.resolveDir, args.path)
      const css = readFileSync(full, 'utf8')
      const classMap = {}
      // Rename every `.name` class selector (greedy token stops at ':' so
      // pseudo-classes like :hover stay untouched; keyframes are not used).
      const renamed = css.replace(/\.([_a-zA-Z][\w-]*)/g, (_match, name) => {
        if (name in classMap) return `.${classMap[name]}`
        const hashed = hashClass(name)
        classMap[name] = hashed
        return `.${hashed}`
      })
      const cssJson = JSON.stringify(renamed)
      const mapJson = JSON.stringify(classMap)
      const contents = [
        `const css = ${cssJson};`,
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(' + JSON.stringify(CSS_TAG_ID) + ') + "]") === null) {',
        '  const tag = document.createElement("style");',
        `  tag.dataset.plugin = ${JSON.stringify(PLUGIN_ID)};`,
        `  tag.dataset.pluginCss = ${JSON.stringify(CSS_TAG_ID)};`,
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${mapJson};`,
        '',
      ].join('\n')
      return { contents, loader: 'js' }
    })
  },
}

const result = await build({
  entryPoints: [resolve(ROOT, 'src/client/index.tsx')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', '@deepseek-ai/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [cssModulesPlugin],
  write: false,
  metafile: false,
  logLevel: 'info',
})

const body = result.outputFiles[0].text
const wrapped = [
  'window.__ModuleLoader__.load({',
  `\tid: ${JSON.stringify(PLUGIN_ID)},`,
  '\tfactory: (require) => {',
  '\t\tvar module = { exports: {} };',
  '\t\tvar exports = module.exports;',
  '\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });',
  body,
  '\t\treturn module.exports;',
  '\t}',
  '});',
  '',
].join('\n')

const outDir = resolve(ROOT, 'lib')
mkdirSync(outDir, { recursive: true })
const outFile = resolve(outDir, 'client.js')
writeFileSync(outFile, wrapped)
console.log(`built ${outFile} (${wrapped.length} bytes)`)
