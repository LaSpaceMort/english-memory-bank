import { db } from '../db/schema'
import type { Article, Source, Unit } from '../db/types'

/** v1 备份（无 articles 表） */
export type ExportPayloadV1 = {
  version: 1
  exportedAt: number
  sources: Source[]
  units: Unit[]
}

export type ExportPayload = {
  version: 2
  exportedAt: number
  sources: Source[]
  articles: Article[]
  units: Unit[]
}

export async function exportAll(): Promise<ExportPayload> {
  const [sources, articles, units] = await Promise.all([
    db.sources.toArray(),
    db.articles.toArray(),
    db.units.toArray(),
  ])
  return {
    version: 2,
    exportedAt: Date.now(),
    sources,
    articles,
    units,
  }
}

export function downloadJson(payload: ExportPayload, filename = 'wai-kan-backup.json'): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportMode = 'merge' | 'replace'

function isV1(o: object): o is ExportPayloadV1 {
  const x = o as ExportPayloadV1
  return x.version === 1 && Array.isArray(x.sources) && Array.isArray(x.units)
}

function isV2(o: object): o is ExportPayload {
  const x = o as ExportPayload
  return x.version === 2 && Array.isArray(x.sources) && Array.isArray(x.units) && Array.isArray(x.articles)
}

export async function importPayload(json: unknown, mode: ImportMode): Promise<void> {
  if (!json || typeof json !== 'object') throw new Error('无效 JSON')
  const o = json as object

  if (isV2(o)) {
    if (!Array.isArray(o.units)) throw new Error('备份格式不正确')
    await db.transaction('rw', db.sources, db.articles, db.units, async () => {
      if (mode === 'replace') {
        await db.sources.clear()
        await db.articles.clear()
        await db.units.clear()
      }
      await db.sources.bulkPut(o.sources as Source[])
      await db.articles.bulkPut(o.articles as Article[])
      await db.units.bulkPut(o.units as Unit[])
    })
    return
  }

  if (isV1(o)) {
    if (!Array.isArray(o.units)) throw new Error('备份格式不正确')
    await db.transaction('rw', db.sources, db.articles, db.units, async () => {
      if (mode === 'replace') {
        await db.sources.clear()
        await db.articles.clear()
        await db.units.clear()
      }
      await db.sources.bulkPut(o.sources as Source[])
      await db.units.bulkPut(o.units as Unit[])
    })
    return
  }

  throw new Error('备份格式不正确')
}
