import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/schema'
import { newId } from '../lib/id'
import type { Source } from '../db/types'
import SubpageHeader, { TextLinkButton } from '../components/layout/SubpageHeader'

type Mode = 'new' | 'edit'

export default function SourceFormPage({ mode }: { mode: Mode }) {
  const { sourceId } = useParams<{ sourceId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [fullText, setFullText] = useState('')
  const [loading, setLoading] = useState(mode === 'edit')

  useEffect(() => {
    if (mode !== 'edit' || !sourceId) return
    let cancelled = false
    ;(async () => {
      const s = await db.sources.get(sourceId)
      if (cancelled || !s) {
        setLoading(false)
        return
      }
      setTitle(s.title)
      setUrl(s.url)
      setSummary(s.summary)
      setFullText(s.fullText ?? '')
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [mode, sourceId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const t = Date.now()
    if (mode === 'new') {
      const s: Source = {
        id: newId(),
        title: title.trim() || '未命名外刊',
        url: url.trim(),
        summary: summary.trim(),
        fullText: fullText.trim() || undefined,
        createdAt: t,
        updatedAt: t,
      }
      await db.sources.add(s)
      navigate(`/sources/${s.id}`)
      return
    }
    if (!sourceId) return
    const prev = await db.sources.get(sourceId)
    if (!prev) return
    const nextBody = fullText.trim() || undefined
    const prevBody = (prev.fullText ?? '').trim()
    const bodyUnchanged = (nextBody ?? '') === prevBody
    const s: Source = {
      ...prev,
      title: title.trim() || '未命名外刊',
      url: url.trim(),
      summary: summary.trim(),
      fullText: nextBody,
      updatedAt: t,
    }
    if (!bodyUnchanged) delete s.textHighlights
    await db.sources.put(s)
    navigate(`/sources/${sourceId}`)
  }

  async function onDelete() {
    if (mode !== 'edit' || !sourceId) return
    if (!confirm('删除此外刊？其下积累单元的来源关联将被清空（单元本身保留）。')) return
    await db.transaction('rw', db.sources, db.units, async () => {
      const units = await db.units.where('sourceId').equals(sourceId).toArray()
      for (const u of units) {
        await db.units.put({ ...u, sourceId: null, updatedAt: Date.now() })
      }
      await db.sources.delete(sourceId)
    })
    navigate('/sources')
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-8 text-[#5c4a3a]">加载中…</div>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SubpageHeader
        title={mode === 'new' ? 'New source' : 'Edit source'}
        titleClassName="emb-home-title-slide"
        right={
          <TextLinkButton to={mode === 'edit' && sourceId ? `/sources/${sourceId}` : '/sources'}>
            ← Material
          </TextLinkButton>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 pb-10 md:px-10">
        <div className="emb-glass mx-auto max-w-xl rounded-2xl p-6 md:p-8">
          <p className="mb-6 text-sm text-[#5c4a3a]">{mode === 'new' ? '新增外刊来源' : '编辑外刊来源'}</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-[#4a3d32]">
              标题
              <input className="emb-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              链接
              <input
                className="emb-field"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              摘要
              <textarea className="emb-textarea min-h-[80px]" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-[#4a3d32]">
              全文（可选，用于上传向导匹配）
              <textarea
                className="emb-textarea min-h-[160px]"
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                placeholder="粘贴正文可显著提高自动匹配准确率"
              />
            </label>
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="emb-btn-primary">
                保存
              </button>
              {mode === 'edit' ? (
                <button type="button" onClick={onDelete} className="emb-btn-danger">
                  删除外刊
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
