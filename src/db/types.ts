import type { UnitType } from '../models'

/** Material 原文划选高亮：下标为相对 fullText 的 UTF-16 偏移 */
export type SourceTextHighlight = {
  id: string
  start: number
  end: number
}

export type Source = {
  id: string
  title: string
  url: string
  summary: string
  fullText?: string
  /** 详情页「原文」内高亮范围，编辑正文并保存后会清空 */
  textHighlights?: SourceTextHighlight[]
  createdAt: number
  updatedAt: number
}

/** 上传向导里的一篇正文（多篇 unit 共用同一 articleId）；同步对应一条 Material 外刊 */
export type Article = {
  id: string
  title: string
  body: string
  /** 与 Material 中外刊条目 1:1，Upload 建篇时自动创建 */
  materialSourceId?: string
  createdAt: number
  updatedAt: number
}

export type Unit = {
  id: string
  type: UnitType
  headline: string
  content: string
  /** 上传/记录时的文章标题（与 headline 积累项标题不同） */
  articleTitle?: string
  definitionEn: string
  definitionSourceNote?: string
  expansion: string
  /** Material 外刊；Upload 建篇时与篇目同步，可与 articleId 同时存在 */
  sourceId: string | null
  /** Upload 篇目 id */
  articleId?: string | null
  /** 积累目标片段（如词/短语） */
  snippet: string
  /** 该片段所在完整原句（可与 snippet 不同） */
  originalSentence?: string
  createdAt: number
  updatedAt: number
}
