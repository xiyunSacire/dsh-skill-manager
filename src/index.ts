/**
 * Skill Manager — Host half (v2: manages the REAL DSH skill directory).
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
 * Creating skills is intentionally NOT exposed: new skills go through the
 * agent flow documented in the `dsh-skill-management` skill (write a SKILL.md
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

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import { skillManagerDescriptors } from './descriptors.ts'
import type {
  SkillDeleteRequest,
  SkillDeleteValue,
  SkillItem,
  SkillListValue,
} from './types.ts'

export type * from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** The skill-manager Remote service (registered on the Typert Gateway). */
    skillManager: SkillManagerService
  }
}

/** Throw a business failure; the Gateway turns it into `{ ok: false, error }` on the wire. */
function businessError(code: string, message: string): never {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  throw error
}

/** Resolve the user skills directory (`$DSH_HOME/skills`, default `~/.dsh/skills`). */
function userSkillsDir(): string {
  const env = process.env.DSH_HOME?.trim()
  const home = env !== undefined && env.length > 0 ? env : join(homedir(), '.dsh')
  return join(home, 'skills')
}

/** Extract the `description:` line from a SKILL.md frontmatter block (minimal parser). */
function frontmatterDescription(file: string): string {
  try {
    const text = readFileSync(file, 'utf8')
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
    if (match === null) return ''
    const desc = /^description:\s*(.+)$/m.exec(match[1])
    if (desc === null) return ''
    return desc[1].trim().replace(/^['"]|['"]$/g, '')
  } catch {
    return ''
  }
}

/** Enumerate user skills, mirroring the skill-filesystem provider's layout. */
function listUserSkills(): SkillItem[] {
  const root = userSkillsDir()
  const items: SkillItem[] = []
  if (!existsSync(root)) return items
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sk = join(root, entry.name, 'SKILL.md')
      if (existsSync(sk)) {
        items.push({ name: entry.name, description: frontmatterDescription(sk), deletable: true })
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const name = entry.name.slice(0, -'.md'.length)
      if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        items.push({ name, description: frontmatterDescription(join(root, entry.name)), deletable: true })
      }
    }
  }
  return items.sort((left, right) => left.name.localeCompare(right.name))
}

/** Locate a skill in the user skills directory; returns its filesystem path or undefined. */
function resolveUserSkill(name: string): string | undefined {
  const root = userSkillsDir()
  // Directory bundle form: <name>/SKILL.md
  const dirForm = join(root, name, 'SKILL.md')
  if (existsSync(dirForm)) return dirname(dirForm)
  // Flat form: <name>.md
  const flatForm = join(root, `${name}.md`)
  if (existsSync(flatForm)) return flatForm
  return undefined
}

/**
 * The skill-manager Remote service: reads the DSH skill registry and manages
 * entries in the user skills directory.
 */
export class SkillManagerService extends TypertRemoteService {
  static inject = ['typert']

  /**
   * Register the service (binding the `skillManager` Gateway namespace) and
   * register the strict invocation descriptors so the Gateway can claim and
   * dispatch the endpoints across module instances.
   * @param ctx - Host context with the skill registry and typert registry mounted.
   */
  constructor(ctx: Context) {
    super(ctx, 'skillManager')
    // Strict descriptors drive Gateway claims + dispatch; `ctx.effect` inside
    // the registry ties disposal to this fiber. The `register` member is
    // added to the contract by @deepseek-ai/dsh-typert-registry's declaration
    // merge, so narrow the view locally (runtime shape is stable).
    const typert = ctx.typert as unknown as {
      register(contribution: {
        readonly package: string
        readonly face: 'host'
        readonly schemas: readonly unknown[]
        readonly model: unknown
        readonly invocations: readonly unknown[]
      }): () => Promise<void>
    }
    typert.register({
      package: 'dsh-skill-manager',
      face: 'host',
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: skillManagerDescriptors,
    })
  }

  /**
   * List every user skill in `~/.dsh/skills` (the same directory DSH loads
   * into every session), with a minimal frontmatter description.
   *
   * Remote methods return the BARE business value — the Gateway wraps it in
   * the `{ ok, value }` envelope.
   * @returns immutable skill summaries.
   */
  @Remote('list')
  async list(): Promise<SkillListValue> {
    return { skills: listUserSkills() }
  }

  /**
   * Delete one skill from the user skills directory (`~/.dsh/skills`).
   * Only entries physically present there are removed — bundled or project
   * skills are rejected, never touched.
   * @param request - kebab-case skill name.
   * @returns deletion result.
   * @throws on invalid names, missing entries, or non-user skills.
   */
  @Remote('delete')
  delete(request: SkillDeleteRequest): SkillDeleteValue {
    const name = request.name
    if (typeof name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      businessError('invalid', `invalid skill name '${String(name)}' — expected kebab-case`)
    }
    const path = resolveUserSkill(name)
    if (path === undefined) {
      businessError('not-found', `skill '${name}' is not in the user skills directory (~/.dsh/skills) — only user-level skills can be deleted here`)
    }
    rmSync(path, { recursive: true, force: true })
    mkdirSync(userSkillsDir(), { recursive: true })
    return { deleted: true }
  }
}

export default SkillManagerService
