/**
 * Host-side build (Node ESM) via esbuild.
 *
 * WHY esbuild instead of tsdown: TypeScript standard decorators (used by
 * @deepseek-ai/dsh-typert-protocol's `@Remote`) must be lowered to
 * `__decorateClass` helpers — Node does not support native decorators yet.
 * tsdown/rolldown emits the `@` syntax verbatim, which fails ESM parsing
 * ("Invalid or unexpected token") at loader import time. esbuild lowers
 * decorators whenever the target lacks native support.
 *
 * The entry is BUNDLED so `.ts`-extension relative imports (`./spec.ts`,
 * `./types.ts`) are resolved into one self-contained `lib/index.mjs`; only
 * runtime deps (`@deepseek-ai/*`, `zod`, `node:*`) stay external and resolve
 * from the profile's node_modules at load time. Declaration files come from
 * `tsc -p tsconfig.types.json`.
 */
import { build, context } from 'esbuild'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Shared build options for the Node half. */
const options = {
  entryPoints: [
    resolve(ROOT, 'src/index.ts'),
    resolve(ROOT, 'src/types.ts'),
  ],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  external: ['@deepseek-ai/*', 'zod'],
  outdir: resolve(ROOT, 'lib'),
  outExtension: { '.js': '.mjs' },
  logLevel: 'info',
}

// `--watch`: rebuild the host half on source changes (declarations still
// come from `tsc -p tsconfig.types.json`, run separately).
if (process.argv.includes('--watch')) {
  const ctx = await context(options)
  await ctx.watch()
  console.log('watching for changes… (Ctrl+C to stop)')
  await new Promise(() => {})
  await ctx.dispose()
} else {
  await build(options)
  console.log('built lib/index.mjs + lib/types.mjs (bundled, decorators lowered)')
}
