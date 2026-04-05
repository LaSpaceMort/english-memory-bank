import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { db } from '../db/schema'
import { newId } from '../lib/id'
import type { Article, Source, Unit } from '../db/types'
import type { UnitType } from '../models'
import { UNIT_TYPE_LABELS } from '../models'
import SubpageHeader, { TextLinkButton } from '../components/layout/SubpageHeader'

type Mode = 'new' | 'edit'

export default function UnitFormPage({ mode }: { mode: Mode }) {
  const { unitId } = useParams<{ unitId: string }>()
  const [searchParams] = useSearchParams()
  const presetSourceId = searchParams.get('sourceId') ?? ''
  const presetArticleId = searchParams.get('articleId') ?? ''
  const navigate = useNavigate()

  const [type, setType] = useState<UnitType>('word')
  const [headline, setHeadline] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [content, setContent] = useState('')
  const [definitionEn, setDefinitionEn] = useState('')
  const [definitionSourceNote, setDefinitionSourceNote] = useState('')
  const [expansion, setExpansion] = useState('')
  const [sourceId, setSourceId] = useState<string>('')
  const [snippet, setSnippet] = useState('')
  const [originalSentence, setOriginalSentence] = useState('')
  const [articleId, setArticleId] = useState('')
  const [sources, setSources] = useState<Source[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(mode === 'edit')

  useEffect(() => {
    db.sources.orderBy('title').toArray().then(setSources)
    db.articles.orderBy('updatedAt').reverse().toArray().then(setArticles)
  }, [])

  useEffect(() => {
    if (mode === 'new' && presetSourceId) setSourceId(presetSourceId)
    if (mode === 'new' && presetArticleId) setArticleId(presetArticleId)
  }, [mode, presetSourceId, presetArticleId])

  useEffect(() => {
    if (mode !== 'edit' || !unitId) return
    let cancelled = false
    ;(async () => {
      const u = await db.units.get(unitId)
      if (cancelled || !u) {
        setLoading(false)
        return
      }
      setType(u.type)
      setHeadline(u.headline)
      setArticleTitle(u.articleTitle ?? '')
      setContent(u.content)
      setDefinitionEn(u.definitionEn)
      setDefinitionSourceNote(u.definitionSourceNote ?? '')
      setExpansion(u.expansion)
      setSourceId(u.sourceId ?? '')
      setArticleId(u.articleId ?? '')
      setSnippet(u.snippet)
      setOriginalSentence(u.originalSentence ?? '')
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [mode, unitId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const t = Date.now()
    const sid = sourceId.trim() || null
    const aid = articleId.trim() || null
    if (mode === 'new') {
      const u: Unit = {
        id: newId(),
        type,
        headline: headline.trim() || content.trim().slice(0, 80) || '未命名',
        content: content.trim() || headline.trim(),
        articleTitle: articleTitle.trim() || undefined,
        definitionEn: definitionEn.trim(),
        definitionSourceNote: definitionSourceNote.trim() || undefined,
        expansion: expansion.trim(),
        sourceId: sid,
        articleId: aid,
        snippet: snippet.trim(),
        originalSentence: originalSentence.trim() || undefined,
        createdAt: t,
        updatedAt: t,
      }
      await db.units.add(u)
      navigate('/')
      return
    }
    if (!unitId) return
    const prev = await db.units.get(unitId)
    if (!prev) return
    const u: Unit = {
      ...prev,
      type,
      headline: headline.trim() || content.trim().slice(0, 80) || '未命名',
      content: content.trim() || headline.trim(),
      articleTitle: articleTitle.trim() || undefined,
      definitionEn: definitionEn.trim(),
      definitionSourceNote: definitionSourceNote.trim() || undefined,
      expansion: expansion.trim(),
      sourceId: sid,
      articleId: aid,
      snippet: snippet.trim(),
      originalSentence: originalSentence.trim() || undefined,
      updatedAt: t,
    }
    await db.units.put(u)
    navigate('/')
  }

  async function onDelete() {
    if (mode !== 'edit' || !unitId) return
    if (!confirm('确定删除该积累单元？')) return
    await db.units.delete(unitId)
    navigate('/')
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-8 text-[#5c4a3a]">加载中…</div>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SubpageHeader
        title={mode === 'new' ? 'New unit' : 'Edit unit'}
        titleClassName="emb-home-title-slide"
        right={<TextLinkButton to="/">← Unit</TextLinkButton>}
      />
      <div className="flex-1 overflow-y-auto px-6 pb-10 md:px-10">
        <div className="emb-glass mx-auto max-w-xl rounded-2xl p-6 md:p-8">
          <p className="mb-6 text-sm text-[#5c4a3a]">{mode === 'new' ? '新增积累单元' : '编辑积累单元'}</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <fieldset className="flex flex-wrap gap-3">
              <legend className="mb-2 w-full text-sm font-medium text-[#4a3d32]">类型</legend>
              {(['word', 'phrase', 'sentence'] as const).map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-[#4a3d32]">
                  <input type="radio" name="utype" checked={type === k} onChange={() => setType(k)} />
                  {UNIT_TYPE_LABELS[k]}
                </label>
              ))}
            </fieldset>
            <label className="block text-sm font-medium text-[#4a3d32]">
              标题（卡片显示）
              <input
                className="emb-field"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="如单词、短语、短句标题"
              />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              Title（文章标题，可选）
              <input
                className="emb-field"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                placeholder="本篇外刊/文章标题"
              />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              完整内容
              <textarea className="emb-textarea min-h-[72px]" value={content} onChange={(e) => setContent(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              英英释义
              <textarea className="emb-textarea min-h-[80px]" value={definitionEn} onChange={(e) => setDefinitionEn(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              释义来源说明（可选）
              <input
                className="emb-field"
                value={definitionSourceNote}
                onChange={(e) => setDefinitionSourceNote(e.target.value)}
                placeholder="如：OALD / 手动粘贴"
              />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              拓展（同词根 / 搭配 / 仿写）
              <textarea className="emb-textarea min-h-[72px]" value={expansion} onChange={(e) => setExpansion(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              关联 Material 外刊
              <select className="emb-field" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                <option value="">不关联</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              关联上传篇目（Upload 解析的正文）
              <select className="emb-field" value={articleId} onChange={(e) => setArticleId(e.target.value)}>
                <option value="">不关联</option>
                {articles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              积累片段
              <textarea className="emb-textarea min-h-[72px]" value={snippet} onChange={(e) => setSnippet(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              原句
              <textarea
                className="emb-textarea min-h-[72px]"
                value={originalSentence}
                onChange={(e) => setOriginalSentence(e.target.value)}
                placeholder="完整句子上下文（可选）"
              />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="emb-btn-primary">
                保存
              </button>
              {mode === 'edit' ? (
                <button type="button" onClick={onDelete} className="emb-btn-danger">
                  删除
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
