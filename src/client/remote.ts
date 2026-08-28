/**
 * Client-side Typert Remote contribution for the `skillManager` namespace.
 *
 * Mounted with `ctx.remote.$mount(contribution)`, after which the
 * `skillManager` namespace service exists and
 * `ctx.get('remote.skillManager').<method>(request, signal?)` resolves to a
 * `RemoteResult` (`{ ok, value } | { ok: false, error }`).
 *
 * The descriptors are shared with the host half (`../descriptors.ts`): the
 * host registers the same shapes into the Typert LOCAL registry so the
 * Gateway dispatches through the strict path across module instances. The
 * `implementation` field on `export`/`import` is host-only and ignored by the
 * client runtime.
 * @module dsh-skill-manager/src/client/remote
 */

import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { skillManagerDescriptors } from '../descriptors.ts'

/** The `skillManager` Remote contribution for this plugin. */
export const skillManagerRemote: TypertRemoteContribution = {
  package: 'dsh-skill-manager',
  descriptors: skillManagerDescriptors,
}
