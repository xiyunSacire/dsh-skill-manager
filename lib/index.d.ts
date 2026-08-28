/**
 * Memory Manager — Host half (v2: manages the REAL DSH skill directory).
 *
 * A Typert Remote service (`skillManager` namespace) exposing two endpoints
 * over the user skill directory `~/.dsh/skills`:
 *
 * - `list` — authoritative view of every visible skill via `ctx.skills`
 *   (the registry the DSH skill system loads into every session), plus a
 *   `deletable` flag for entries living in the user skills directory.
 * - `delete` — remove a skill from the user skills directory (directory
 *   bundle `<name>/SKILL.md` or flat `<name>.md`). Bundled/project skills are
 *   never touched.
 *
 * Creating skills is intentionally NOT exposed: new memories go through the
 * agent flow documented in the `dsh-memory-guide` skill (write a SKILL.md
 * into `~/.dsh/skills`), which is exactly what makes them load in every
 * session.
 *
 * Dispatch model: the service keeps its `typertRemote` binding (via
 * TypertRemoteService) AND registers STRICT invocation descriptors into the
 * Typert local registry (`ctx.typert.register(...)`). The Gateway prefers the
 * strict path over SRC reflection, which is essential for an out-of-tree
 * plugin: the `@Remote` marker table is module-private state in
 * dsh-typert-protocol, and the profile's copy of that package is a different
 * module instance than the app's, so the app's Gateway cannot see markers
 * registered through the profile's copy (that would yield HTTP 404 on every
 * call). Strict descriptors are plain data and cross module instances safely.
 * @module dsh-skill-manager
 */
import { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { SkillDeleteRequest, SkillDeleteValue, SkillListValue } from './types.ts';
export type * from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** The skill-manager Remote service (registered on the Typert Gateway). */
        skillManager: SkillManagerService;
    }
}
/**
 * The skill-manager Remote service: reads the DSH skill registry and manages
 * entries in the user skills directory.
 */
export declare class SkillManagerService extends TypertRemoteService {
    static inject: string[];
    /**
     * Register the service (binding the `skillManager` Gateway namespace) and
     * register the strict invocation descriptors so the Gateway can claim and
     * dispatch the endpoints across module instances.
     * @param ctx - Host context with the skill registry and typert registry mounted.
     */
    constructor(ctx: Context);
    /**
     * List every user skill in `~/.dsh/skills` (the same directory DSH loads
     * into every session), with a minimal frontmatter description.
     *
     * Remote methods return the BARE business value — the Gateway wraps it in
     * the `{ ok, value }` envelope.
     * @returns immutable skill summaries.
     */
    list(): Promise<SkillListValue>;
    /**
     * Delete one skill from the user skills directory (`~/.dsh/skills`).
     * Only entries physically present there are removed — bundled or project
     * skills are rejected, never touched.
     * @param request - kebab-case skill name.
     * @returns deletion result.
     * @throws on invalid names, missing entries, or non-user skills.
     */
    delete(request: SkillDeleteRequest): SkillDeleteValue;
}
export default SkillManagerService;
