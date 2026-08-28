/**
 * Memory Manager — Client half (browser plugin entry).
 *
 * Registers the `skillManager` Remote namespace (Host RPC), a locale
 * dictionary, and the sidebar foot entry that opens the management panel.
 * The bundle is built by `scripts/build-client.mjs` into the
 * `window.__ModuleLoader__.load({ id, factory })` handoff the browser loader
 * consumes; `dsh.client` in package.json makes client-modules serve it at
 * `/plugins/dsh-memory-manager/client.js`.
 * @module dsh-memory-manager/src/client
 */

// Type-only: service contracts and the locale plugin's Context merge.
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import { bindMemoryManagerApi } from './api.ts'
import { FooterAction } from './FooterAction.tsx'
import { en, format, NS, zh, type MemoryManagerKey, type MemoryManagerLocale } from './locales.ts'
import { skillManagerRemote } from './remote.ts'

export type { MemoryManagerKey, MemoryManagerLocale } from './locales.ts'
export type { FooterActionProps } from './FooterAction.tsx'
export { FooterAction, NS }

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Memory Manager UI copy. */
    skillManager: MemoryManagerKey
  }
}

/** Services required by this plugin. */
export const inject = ['slots', 'locale', 'remote']

/**
 * Client plugin body: mount the Remote namespace, register dictionaries and
 * the sidebar entry.
 * @param ctx - client root context.
 * @returns disposer that unmounts the Remote namespace.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'memory-manager: dictionaries')

  // Bind the api facade to this context before mounting (components call it).
  bindMemoryManagerApi(ctx)

  // Mount our Host Remote contribution; the namespace then answers
  // ctx.remote.skillManager.<method>. A failure keeps the UI alive (the
  // panel reports it) rather than failing the fiber.
  let disposeRemote: (() => Promise<void>) | undefined
  try {
    disposeRemote = await ctx.remote.$mount(skillManagerRemote)
  } catch (error) {
    console.error('[memory-manager] failed to mount Remote namespace:', error)
  }
  ctx.effect(() => () => { void disposeRemote?.() }, 'memory-manager: remote mount')

  const bound = ctx.locale.bind(NS)
  const t = (key: MemoryManagerKey, params?: Record<string, string | number>): string => {
    return format(bound(key), params)
  }

  // The sidebar shell renders every `sidebar.footer.action` occupant with the
  // `wide` owner flag; defer registration until the shell actually renders.
  // The component's `t` seat arrives via the registration's `locale` share.
  //
  // Registration is IDEMPOTENT: slots.inject re-runs the callback whenever the
  // slot declaration's epoch changes (collapse + re-declaration), and a second
  // register() for the same id would throw. slots.inject re-throws setup
  // failures as UNHANDLED microtask errors, which take the whole plugin fiber
  // down (the sidebar entry and any open panel vanish together). The guard
  // skips re-registration, and a first-run failure is logged instead of
  // escalated.
  let entryRegistered = false
  ctx.slots.inject('sidebar.footer.action', () => {
    // Idempotent re-run: a re-declaration must not register twice (duplicate
    // registration throws, and slots.inject escalates setup failures as
    // unhandled microtask errors that take the whole fiber down).
    if (entryRegistered) return () => {}
    try {
      const dispose = ctx.slots.register({
        name: 'sidebar.footer.action',
        id: 'memory-manager',
        order: 10,
        label: () => t('entry'),
        locale: NS,
      }, FooterAction)
      entryRegistered = true
      return dispose
    } catch (error) {
      console.error('[memory-manager] sidebar entry registration failed:', error)
      return () => {}
    }
  })

  return async () => { await disposeRemote?.() }
}
