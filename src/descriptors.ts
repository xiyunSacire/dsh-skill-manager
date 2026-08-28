/**
 * Typert invocation descriptors shared by the host and client halves.
 *
 * The host registers these into `ctx.typert` (the LOCAL registry) so the
 * Gateway dispatches through its STRICT path (`typert.local.get(endpoint)`),
 * which never touches the `@Remote` marker table. This is essential for
 * out-of-tree plugins: the marker table is module-private state in
 * dsh-typert-protocol, and the profile's copy of that package is a different
 * module instance than the app's, so the app's Gateway cannot see markers
 * registered through the profile's copy. Strict descriptors are plain data
 * and cross instances safely.
 *
 * Codecs are strict zod pass-throughs (`z.any()`): the host methods validate
 * their own inputs, and strict mode is what the registry/Gateway require.
 * @module dsh-skill-manager/src/descriptors
 */

import { z } from 'zod'
import type { InvocationDescriptor, TypertCodec } from '@deepseek-ai/dsh-typert-protocol'

/** Strict pass-through codec (schema.parse accepts anything). */
function strictCodec(typeSymbol: string): TypertCodec {
  return { mode: 'strict', typeSymbol, schema: z.any() }
}

/** One JSON request parameter (wire name `request`, matching the host method signature). */
function requestParameter(typeSymbol: string): InvocationDescriptor['parameters'][number] {
  return {
    name: 'request',
    wire: 'request',
    source: 'json',
    codec: strictCodec(typeSymbol),
  }
}

/** The two `skillManager` Remote endpoints (v2: list + delete skills). */
export const skillManagerDescriptors: readonly InvocationDescriptor[] = [
  {
    id: 'dsh-skill-manager#skillManager/list',
    service: 'skillManager',
    namespace: 'skillManager',
    method: 'list',
    invocation: { kind: 'direct' },
    parameters: [],
    result: strictCodec('dsh-skill-manager/types#SkillListValue'),
  },
  {
    id: 'dsh-skill-manager#skillManager/delete',
    service: 'skillManager',
    namespace: 'skillManager',
    method: 'delete',
    invocation: { kind: 'direct' },
    parameters: [requestParameter('dsh-skill-manager/types#SkillDeleteRequest')],
    result: strictCodec('dsh-skill-manager/types#SkillDeleteValue'),
  },
]
