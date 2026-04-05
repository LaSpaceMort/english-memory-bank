import { db } from './schema'
import type { Source, Unit } from './types'
import { newId } from '../lib/id'

export async function seedIfEmpty(): Promise<void> {
  const n = await db.sources.count()
  if (n > 0) return

  const now = Date.now()
  const sourceId = newId()
  const demoSource: Source = {
    id: sourceId,
    title: '示例：The Economist 风格短文',
    url: 'https://example.com/article',
    summary: '一篇用于演示匹配与列表的示例摘要。',
    fullText:
      'The government faced a formidable challenge in restoring fiscal credibility. ' +
      'Policymakers opted for a pragmatic compromise rather than ideological purity.',
    createdAt: now,
    updatedAt: now,
  }

  const units: Unit[] = [
    {
      id: newId(),
      type: 'word',
      headline: 'formidable',
      content: 'formidable',
      definitionEn: 'difficult to deal with and needing a lot of effort or skill',
      expansion: '同根：formidably, formidability',
      sourceId,
      snippet: 'a formidable challenge in restoring fiscal credibility',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      type: 'phrase',
      headline: 'opt for',
      content: 'opt for',
      definitionEn: 'to choose one thing instead of something else',
      expansion: '同介词：vote for, argue for',
      sourceId,
      snippet: 'Policymakers opted for a pragmatic compromise',
      createdAt: now,
      updatedAt: now,
    },
  ]

  await db.transaction('rw', db.sources, db.units, async () => {
    await db.sources.add(demoSource)
    await db.units.bulkAdd(units)
  })
}

export const sourcesRepo = {
  list: () => db.sources.orderBy('createdAt').reverse().toArray(),
  get: (id: string) => db.sources.get(id),
  put: (s: Source) => db.sources.put(s),
  delete: (id: string) => db.sources.delete(id),
}

export const unitsRepo = {
  list: () => db.units.orderBy('createdAt').reverse().toArray(),
  listBySource: (sourceId: string) =>
    db.units.where('sourceId').equals(sourceId).sortBy('createdAt'),
  get: (id: string) => db.units.get(id),
  put: (u: Unit) => db.units.put(u),
  delete: (id: string) => db.units.delete(id),
}

export function now(): number {
  return Date.now()
}
