import { db } from '../db/schema'

/** 删除 Material 外刊：清空 units.sourceId、去掉 articles.materialSourceId，再删 source */
export async function deleteSourceById(sourceId: string): Promise<void> {
  await db.transaction('rw', db.sources, db.units, db.articles, async () => {
    const units = await db.units.where('sourceId').equals(sourceId).toArray()
    for (const u of units) {
      await db.units.put({ ...u, sourceId: null, updatedAt: Date.now() })
    }
    const articles = await db.articles.toArray()
    for (const a of articles) {
      if (a.materialSourceId !== sourceId) continue
      const next = { ...a }
      delete next.materialSourceId
      await db.articles.put(next)
    }
    await db.sources.delete(sourceId)
  })
}
