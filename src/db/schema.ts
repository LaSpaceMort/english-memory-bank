import Dexie, { type Table } from 'dexie'
import type { Article, Source, Unit } from './types'

export class AppDB extends Dexie {
  sources!: Table<Source>
  articles!: Table<Article>
  units!: Table<Unit>

  constructor() {
    super('wai-kan-accumulation')
    this.version(1).stores({
      sources: 'id, title, createdAt',
      units: 'id, sourceId, type, createdAt',
    })
    this.version(2).stores({
      sources: 'id, title, createdAt',
      articles: 'id, title, createdAt',
      units: 'id, sourceId, articleId, type, createdAt',
    })
  }
}

export const db = new AppDB()
