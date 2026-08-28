/**
 * Locale dictionaries for the Memory Manager UI (v2: view + delete skills).
 * @module dsh-memory-manager/src/client/locales
 */

/** Locale key union for the Memory Manager namespace (declared in the slots LocaleNamespaceMap). */
export type MemoryManagerKey =
  | 'entry'
  | 'panelTitle'
  | 'panelSubtitle'
  | 'tip'
  | 'close'
  | 'searchPlaceholder'
  | 'refresh'
  | 'empty'
  | 'loadError'
  | 'delete'
  | 'whenToUse'
  | 'confirmDeleteTitle'
  | 'confirmDeleteBody'
  | 'confirm'
  | 'cancel'
  | 'notDeletable'

/** Dictionary shape: exactly the namespace keys, each a string. */
export type MemoryManagerLocale = Record<MemoryManagerKey, string>

export const zh: MemoryManagerLocale = {
  entry: '记忆管理',
  panelTitle: '记忆管理',
  panelSubtitle: '本机长期记忆（技能）查看与删除：~/.dsh/skills，每次会话自动加载',
  tip: '💡 小贴士：要新增记忆，请使用 Agent 添加；新增记忆的流程已记录在长期技能（dsh-memory-guide）中。',
  close: '关闭',
  searchPlaceholder: '搜索技能名称或描述…',
  refresh: '刷新',
  empty: '暂无技能。要新增记忆，请让 Agent 按 dsh-memory-guide 技能中的流程创建。',
  loadError: '加载失败',
  delete: '删除',
  whenToUse: '适用场景',
  confirmDeleteTitle: '删除技能',
  confirmDeleteBody: '确定删除技能「{name}」吗？删除后它将不再在会话中加载。',
  confirm: '确定',
  cancel: '取消',
  notDeletable: '该技能不在用户技能目录，无法通过插件删除',
}

export const en: MemoryManagerLocale = {
  entry: 'Memory',
  panelTitle: 'Memory Manager',
  panelSubtitle: 'View and delete your long-term memories (skills) in ~/.dsh/skills — loaded into every session',
  tip: '💡 Tip: to add a new memory, ask an Agent to create it; the flow is documented in the dsh-memory-guide skill.',
  close: 'Close',
  searchPlaceholder: 'Search skill name or description…',
  refresh: 'Refresh',
  empty: 'No skills yet. Ask an Agent to create one following the dsh-memory-guide skill.',
  loadError: 'Failed to load',
  delete: 'Delete',
  whenToUse: 'When to use',
  confirmDeleteTitle: 'Delete skill',
  confirmDeleteBody: 'Delete skill "{name}"? It will no longer load in any session.',
  confirm: 'Confirm',
  cancel: 'Cancel',
  notDeletable: 'This skill is not in the user skills directory and cannot be deleted here',
}

export type MemoryManagerTranslator = (key: MemoryManagerKey, params?: Record<string, string | number>) => string

/** Format a template with named params (`{name}` placeholders). */
export function format(template: string, params?: Record<string, string | number>): string {
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = params[key]
    return value === undefined ? _match : String(value)
  })
}

export const NS = 'skillManager'
