/**
 * Wire model for the Memory Manager Remote service (v2: manages the REAL DSH
 * skill directory `~/.dsh/skills`).
 *
 * The plugin now reads and deletes actual skills (SKILL.md entries the DSH
 * skill system loads into every session), instead of a private store. There is
 * no scope/tags/content concept — skills are identified by their kebab-case
 * name; creation is delegated to the agent (see the dsh-memory-guide skill).
 * @module dsh-memory-manager/types
 */

/** One visible skill (what `ctx.skills.list()` returns — what the model sees). */
export interface SkillItem {
  /** Kebab-case skill name (addresses the skill in every session). */
  readonly name: string
  /** Short routing description. */
  readonly description: string
  /** Optional extra routing guidance. */
  readonly whenToUse?: string
  /** Whether the skill lives in the user skills directory and can be deleted by this plugin. */
  readonly deletable: boolean
}

/** @remote memoryManager.list result value */
export interface SkillListValue {
  readonly skills: readonly SkillItem[]
}

/** @remote memoryManager.delete */
export interface SkillDeleteRequest {
  /** Kebab-case skill name to delete (user skills directory only). */
  readonly name: string
}

/** @remote memoryManager.delete result value */
export interface SkillDeleteValue {
  readonly deleted: boolean
}
