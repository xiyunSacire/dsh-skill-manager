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
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
/** The two `skillManager` Remote endpoints (v2: list + delete skills). */
export declare const skillManagerDescriptors: readonly InvocationDescriptor[];
