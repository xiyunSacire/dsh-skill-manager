/**
 * Client-facing type surface for `dsh-skill-manager/client`.
 *
 * Re-exports the wire model so browser consumers (and the module-table
 * consumer of this bundle) can name the request/result shapes without
 * importing a Host package.
 */

export type {
  MemoryCreateRequest,
  MemoryCreateResult,
  MemoryDeleteRequest,
  MemoryDeleteResult,
  MemoryDeleteValue,
  MemoryEntry,
  MemoryExportFormat,
  MemoryExportRequest,
  MemoryExportResult,
  MemoryExportValue,
  MemoryImportRequest,
  MemoryImportResult,
  MemoryImportValue,
  MemoryListRequest,
  MemoryListResult,
  MemoryListValue,
  MemoryOk,
  MemoryFail,
  MemoryScope,
  MemoryScopeFilter,
  MemoryUpdateRequest,
  MemoryUpdateResult,
} from '../../lib/types.d.ts'
