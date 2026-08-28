/**
 * Sidebar foot entry: opens the Memory Manager panel.
 *
 * Registered into the `sidebar.footer.action` list slot (declared by
 * dsh-client-ui-sidebar, rendered above the Settings row in both sidebar
 * widths). Text-only entry per user preference (no icon); the owner `wide`
 * flag only affects layout, both widths render the label.
 * @module dsh-memory-manager/src/client/FooterAction
 */

import { useState } from 'react'
import type { SidebarFooterActionOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MemoryManagerTranslator } from './locales.ts'
import { MemoryManagerPanel } from './MemoryManagerPanel.tsx'
import styles from './MemoryManager.module.css'

/** Props composed by the slot registry: shell owner share + the locale `t` seat. */
export interface FooterActionProps extends SidebarFooterActionOwnerProps {
  /** Translate a key of the plugin dictionary (injected via the `locale` share). */
  readonly t: MemoryManagerTranslator
}

/** One-click entry to the memory management panel. */
export function FooterAction(props: FooterActionProps): JSX.Element {
  const { t } = props
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={styles.footerAction}
        title={t('entry')}
        aria-label={t('entry')}
        onClick={() => setOpen(true)}
      >
        <span className={styles.footerLabel}>{t('entry')}</span>
      </button>
      {open ? (
        <MemoryManagerPanel t={t} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}
