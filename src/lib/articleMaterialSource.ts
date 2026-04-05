import { db } from '../db/schema'
import { newId } from './id'

/** 新建 Article 并同步创建对应的 Material（Source），全文写入 fullText */
export async function insertArticleLinkedSource(title: string, body: string): Promise<{ articleId: string; sourceId: string }> {
  const now = Date.now()
  const articleId = newId()
  const sourceId = newId()
  const t = title.trim() || '未命名篇目'
  await db.transaction('rw', db.sources, db.articles, async () => {
    await db.sources.add({
      id: sourceId,
      title: t,
      url: '',
      summary: '',
      fullText: body,
      createdAt: now,
      updatedAt: now,
    })
    await db.articles.add({
      id: articleId,
      title: t,
      body,
      materialSourceId: sourceId,
      createdAt: now,
      updatedAt: now,
    })
  })
  return { articleId, sourceId }
}

/** 旧数据：Article 无 materialSourceId 时补一条 Source 并写回 */
export async function ensureArticleHasLinkedSource(articleId: string): Promise<void> {
  const a = await db.articles.get(articleId)
  if (!a || a.materialSourceId) return
  const now = Date.now()
  const sourceId = newId()
  await db.transaction('rw', db.sources, db.articles, async () => {
    await db.sources.add({
      id: sourceId,
      title: a.title.trim() || '未命名篇目',
      url: '',
      summary: '',
      fullText: a.body,
      createdAt: now,
      updatedAt: now,
    })
    await db.articles.update(articleId, { materialSourceId: sourceId, updatedAt: now })
  })
}

/** 篇名/正文变更时同步更新 Material 条目 */
export async function syncLinkedSourceFromArticle(articleId: string, title: string, body: string): Promise<void> {
  const a = await db.articles.get(articleId)
  if (!a?.materialSourceId) return
  const now = Date.now()
  const t = title.trim() || '未命名篇目'
  await db.transaction('rw', db.sources, db.articles, async () => {
    await db.articles.update(articleId, { title: t, body, updatedAt: now })
    await db.sources.update(a.materialSourceId!, { title: t, fullText: body, updatedAt: now })
  })
}
