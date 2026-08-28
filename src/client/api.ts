/**
 * Client-side API wrapper over the mounted `memoryManager` Remote namespace.
 *
 * The namespace service (`remote.skillManager`) is created by
 * `ctx.remote.$mount(...)` inside the plugin's apply; components reach it
 * through this module-level facade (there is exactly one plugin instance per
 * page, so a module singleton is safe and keeps React components free of
 * Cordis context plumbing).
 * @module dsh-skill-manager/src/client/api
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { SkillDeleteRequest, SkillDeleteValue, SkillListValue } from '../types.ts'

/** The mounted `memoryManager` namespace surface. */
export interface SkillManagerNamespace {
  list(signal?: AbortSignal): Promise<RemoteResult<SkillListValue>>
  delete(request: SkillDeleteRequest, signal?: AbortSignal): Promise<RemoteResult<SkillDeleteValue>>
}

let bound: ClientContext | undefined

/** Bind the plugin context once, inside apply(). */
export function bindMemoryManagerApi(ctx: ClientContext): void {
  bound = ctx
}

function namespace(): SkillManagerNamespace {
  if (bound === undefined) {
    throw new Error('skill-manager: client api is not bound (plugin apply did not run)')
  }
  // Resolve through the registry's `get()` rather than property access:
  // `ctx.remote.skillManager` (dotted property) requires the namespace to be
  // injected into the fiber, but this plugin mounts its own namespace inside
  // apply() — injecting it would deadlock. `ctx.get('remote.skillManager')`
  // reads the root registry directly and works without injection.
  const ns = bound.get('remote.skillManager') as SkillManagerNamespace | undefined
  if (ns === undefined) {
    throw new Error('skill-manager: memoryManager Remote namespace is not mounted')
  }
  return ns
}

/** Component-facing facade (business failures arrive as `{ ok: false, error }`). */
export const memoryApi: {
  list(): Promise<RemoteResult<SkillListValue>>
  delete(request: SkillDeleteRequest): Promise<RemoteResult<SkillDeleteValue>>
} = {
  list: () => namespace().list(),
  delete: request => namespace().delete(request),
}
