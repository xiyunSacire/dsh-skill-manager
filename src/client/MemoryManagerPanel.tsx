/**
 * Memory Manager panel (v2): view + search + delete REAL DSH skills.
 *
 * Full-screen overlay listing the skills DSH loads into every session
 * (`ctx.skills` — the registry view), with a tip that new memories are added
 * through the Agent flow (dsh-memory-guide skill). Rendered through a portal
 * into document.body. Styling uses DSH design tokens (`--dsw-alias-*`), so
 * the panel adapts to the active dark/light theme.
 * @module dsh-memory-manager/src/client/MemoryManagerPanel
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { memoryApi } from './api.ts'
import type { SkillItem } from '../types.ts'
import type { MemoryManagerTranslator } from './locales.ts'
import styles from './MemoryManager.module.css'

/** Props for the panel. */
export interface MemoryManagerPanelProps {
  /** Bound translator. */
  readonly t: MemoryManagerTranslator
  /** Close the overlay. */
  readonly onClose: () => void
}

/** Full memory (skill) management panel: view + delete only. */
export function MemoryManagerPanel(props: MemoryManagerPanelProps): JSX.Element {
  const { t, onClose } = props
  const [skills, setSkills] = useState<readonly SkillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [query, setQuery] = useState('')

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(undefined)
    try {
      const result = await memoryApi.list()
      if (!result.ok) {
        setError(`${t('loadError')}: ${result.error.message}`)
        return
      }
      const loaded = result.value.skills
      setSkills(Array.isArray(loaded) ? loaded : [])
    } catch (cause) {
      setError(`${t('loadError')}: ${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (needle.length === 0) return skills
    return skills.filter(skill =>
      skill.name.toLocaleLowerCase().includes(needle)
      || skill.description.toLocaleLowerCase().includes(needle))
  }, [skills, query])

  const deleteSkill = async (skill: SkillItem): Promise<void> => {
    if (!window.confirm(t('confirmDeleteBody', { name: skill.name }))) return
    const result = await memoryApi.delete({ name: skill.name })
    if (!result.ok) {
      setError(result.error.message)
      return
    }
    await load()
  }

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t('panelTitle')}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <div className={styles.title}>{t('panelTitle')}</div>
            <div className={styles.subtitle}>{t('panelSubtitle')}</div>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <div className={styles.tip}>{t('tip')}</div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="search"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </div>

        {error !== undefined ? <div className={styles.error}>{error}</div> : null}

        <div className={styles.list}>
          {loading ? <div className={styles.empty}>{t('refresh')}…</div>
            : filtered.length === 0 ? <div className={styles.empty}>{t('empty')}</div>
              : filtered.map(skill => (
                <div key={skill.name} className={styles.row}>
                  <div className={styles.rowBody}>
                    <span className={styles.rowName}>{skill.name}</span>
                    <span className={styles.rowSummary}>
                      <span className={styles.rowMeta}>{skill.description}</span>
                      {skill.whenToUse !== undefined ? <span className={styles.tag}>{t('whenToUse')}: {skill.whenToUse}</span> : null}
                    </span>
                  </div>
                  <span className={styles.rowActions}>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      title={skill.deletable ? t('delete') : t('notDeletable')}
                      disabled={!skill.deletable}
                      onClick={() => void deleteSkill(skill)}
                    >🗑</button>
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
