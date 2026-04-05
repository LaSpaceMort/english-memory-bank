import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/schema'
import { newId } from '../lib/id'
import { useLiveQuery } from '../hooks/useLive'
import UnitBoardCard from '../components/unit/UnitBoardCard'
import FrostSparkles from '../components/decorative/FrostSparkles'
import { deleteSourceById } from '../lib/deleteSource'
import { addHighlight, rangesOverlap, removeHighlightsOverlapping } from '../lib/sourceTextHighlights'
import type { Source, SourceTextHighlight, Unit } from '../db/types'
import type { UnitType } from '../models'
import { UNIT_TYPE_LABELS } from '../models'

/** 与「本篇积累」区一致：25% 白磨砂 */
const detailFrost = 'bg-white/25 backdrop-blur-[14px] backdrop-saturate-[1.06]'

const pageShell = 'px-6 md:px-10'

/** 选区相对 root 内纯文本的 UTF-16 偏移（与 fullText / textHighlights 一致） */
function getSelectionOffsetsIn(root: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const range = sel.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null
  const beforeStart = range.cloneRange()
  beforeStart.selectNodeContents(root)
  beforeStart.setEnd(range.startContainer, range.startOffset)
  const start = beforeStart.toString().length
  const beforeEnd = range.cloneRange()
  beforeEnd.selectNodeContents(root)
  beforeEnd.setEnd(range.endContainer, range.endOffset)
  const end = beforeEnd.toString().length
  if (start > end) return null
  return { start, end }
}

/** 按 textHighlights 渲染原文；重叠时只保留先出现的区间 */
function renderHighlightedArticle(fullText: string, highlights: SourceTextHighlight[] | undefined): ReactNode {
  if (!highlights?.length) return fullText
  const len = fullText.length
  const valid = highlights.filter((h) => h.start >= 0 && h.end <= len && h.start < h.end)
  const sorted = [...valid].sort((a, b) => a.start - b.start)
  const nodes: ReactNode[] = []
  let c = 0
  for (const h of sorted) {
    if (h.start < c) continue
    if (h.start > c) nodes.push(fullText.slice(c, h.start))
    nodes.push(
      <mark
        key={h.id}
        className="rounded-[2px] bg-[#ffe082]/95 px-[1px] text-[#620607] [box-decoration-break:clone]"
      >
        {fullText.slice(h.start, h.end)}
      </mark>,
    )
    c = h.end
  }
  if (c < fullText.length) nodes.push(fullText.slice(c))
  return nodes.length ? nodes : fullText
}

/** 侧栏橄榄绿 + 白图标，与导航未选中态一致 */
function HighlightPenButton(props: { disabled?: boolean; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      aria-label={props.title}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#F5F9E5]/18 bg-[#6f7754] text-[#F5F9E5] shadow-sm transition-[filter,background-color] hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15.232 5.232l3.536 3.536M4 20h4.5l9.732-9.732a2.5 2.5 0 00-3.536-3.536L5 16.5V20z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

type BodyProps = {
  source: Source
  units: Unit[]
  sourceId: string
}

function SourceDetailBody({ source, units, sourceId }: BodyProps) {
  const navigate = useNavigate()
  const articleRootRef = useRef<HTMLDivElement>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(source.title)

  const [addType, setAddType] = useState<UnitType>('word')
  const [addHeadline, setAddHeadline] = useState('')
  const [addDefinitionEn, setAddDefinitionEn] = useState('')
  const [addExpansion, setAddExpansion] = useState('')
  const [addOriginalSentence, setAddOriginalSentence] = useState('')

  useEffect(() => {
    if (!editingTitle) setTitleInput(source.title)
  }, [source.title, editingTitle])

  async function handleDeleteSource() {
    if (
      !confirm(
        '删除此外刊？关联积累的来源会清空；Upload 篇目上的 Material 关联也会去掉（单元与篇目仍保留）。',
      )
    ) {
      return
    }
    await deleteSourceById(sourceId)
    navigate('/sources')
  }

  async function saveTitle() {
    const next = titleInput.trim() || '未命名外刊'
    await db.sources.put({ ...source, title: next, updatedAt: Date.now() })
    setEditingTitle(false)
  }

  /** 有选区且与已有高亮相交则去掉相交段，否则新增高亮 */
  async function applyTextHighlightToggle() {
    const full = source.fullText ?? ''
    if (!full.trim() || !articleRootRef.current) return
    const off = getSelectionOffsetsIn(articleRootRef.current)
    if (!off || off.start >= off.end) return
    const prev = source.textHighlights ?? []
    const hits = prev.filter((h) => rangesOverlap(h, off))
    const next =
      hits.length > 0
        ? removeHighlightsOverlapping(prev, off)
        : addHighlight(prev, off, newId(), full.length)
    await db.sources.put({
      ...source,
      textHighlights: next.length > 0 ? next : undefined,
      updatedAt: Date.now(),
    })
    window.getSelection()?.removeAllRanges()
  }

  function cancelTitleEdit() {
    setTitleInput(source.title)
    setEditingTitle(false)
  }

  function resetAddForm() {
    setAddType('word')
    setAddHeadline('')
    setAddDefinitionEn('')
    setAddExpansion('')
    setAddOriginalSentence('')
  }

  async function submitAddUnit(e: FormEvent) {
    e.preventDefault()
    const t = Date.now()
    const def = addDefinitionEn.trim()
    const orig = addOriginalSentence.trim()
    const headline = addHeadline.trim() || def.slice(0, 80) || orig.slice(0, 80) || '未命名'
    const content = orig || def || headline
    const snippet = orig || def.slice(0, 200) || headline
    const u: Unit = {
      id: newId(),
      type: addType,
      headline,
      content,
      definitionEn: def,
      expansion: addExpansion.trim(),
      sourceId,
      articleId: null,
      snippet,
      originalSentence: orig || undefined,
      createdAt: t,
      updatedAt: t,
    }
    await db.units.add(u)
    resetAddForm()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={`${pageShell} pb-10 pt-2`}>
        <div className="space-y-6 text-[#620607] [&_.emb-field]:text-[#620607] [&_.emb-textarea]:text-[#620607] [&_.emb-field]:placeholder:text-[#620607]/42 [&_.emb-textarea]:placeholder:text-[#620607]/42">
          {/* 标题卡：宽度与下方两列同宽 */}
          <div className={`relative w-full overflow-hidden rounded-2xl px-5 py-4 ${detailFrost}`}>
            <FrostSparkles density="normal" />
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingTitle ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <input
                      className="emb-field max-w-full sm:min-w-[12rem] sm:flex-1"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      autoFocus
                      aria-label="外刊标题"
                    />
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void saveTitle()}
                        className="rounded-md bg-[#475B35] px-2.5 py-1 text-xs font-medium text-white hover:brightness-110"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={cancelTitleEdit}
                        className="rounded-md border border-[#475B35]/25 px-2.5 py-1 text-xs font-medium hover:bg-white/20"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-end gap-2">
                    <h1 className="emb-inner-page-title emb-home-title-slide min-w-0 max-w-full break-words !text-[#E19184]">
                      {source.title}
                    </h1>
                    <button
                      type="button"
                      onClick={() => {
                        setTitleInput(source.title)
                        setEditingTitle(true)
                      }}
                      className="shrink-0 text-xs font-medium text-[#D4604D] underline-offset-2 hover:underline"
                    >
                      编辑标题
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDeleteSource}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#620607]/35 bg-[#620607]/14 text-lg leading-none text-[#8b2f2f] hover:bg-[#620607]/22"
                aria-label="删除外刊"
                title="删除外刊"
              >
                ×
              </button>
            </div>
            {source.summary?.trim() ? (
              <p className="relative z-[1] mt-3 text-sm leading-relaxed">{source.summary}</p>
            ) : null}
            <Link
              to="/sources"
              className="relative z-[1] mt-3 inline-block text-sm font-medium text-[#D4604D] hover:underline"
            >
              ← Material
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch lg:min-h-[min(88vh,40rem)]">
            {/* 左：原文（标题与正文同一背景） */}
            <div className="emb-source-detail-col-left flex min-w-0 flex-col gap-4">
              <div className="relative overflow-hidden rounded-xl border border-[#475B35]/12 bg-white/25 backdrop-blur-sm">
                <FrostSparkles density="sparse" />
                <div className="relative z-[1] flex flex-wrap items-center justify-between gap-2 border-b border-[#475B35]/10 px-4 py-2.5">
                  <h2 className="text-sm font-semibold tracking-wide">原文</h2>
                  <div className="flex shrink-0 items-center gap-3">
                    <HighlightPenButton
                      disabled={!source.fullText?.trim()}
                      title="先划选正文，再点此添加高亮；选区落在已高亮文字上再点此可取消该段高亮"
                      onClick={() => void applyTextHighlightToggle()}
                    />
                    <Link
                      to={`/sources/${source.id}/edit`}
                      className="text-sm font-medium hover:text-[#D4604D]"
                    >
                      编辑外刊
                    </Link>
                  </div>
                </div>
                <div className="relative z-[1] max-h-[min(78vh,56rem)] overflow-y-auto px-4 py-3 text-[0.92rem] leading-[1.65] emb-col-scroll">
                  {source.fullText?.trim() ? (
                    <div ref={articleRootRef} className="whitespace-pre-wrap select-text">
                      {renderHighlightedArticle(source.fullText, source.textHighlights)}
                    </div>
                  ) : (
                    <p className="text-[#620607]/65">暂无全文。可在「编辑外刊」中粘贴正文。</p>
                  )}
                </div>
              </div>
              {source.url ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#D4604D] underline-offset-2 hover:underline"
                  >
                    原文链接
                  </a>
                </div>
              ) : null}
            </div>

            {/* 右：精简添加单元（与 Unit 展开区字段一致）+ 本篇积累占主要高度 */}
            <div className="emb-source-detail-col-right flex min-h-0 min-w-0 flex-col gap-4 lg:h-full">
              <div className={`relative shrink-0 overflow-hidden rounded-xl ${detailFrost}`}>
                <FrostSparkles density="sparse" />
                <div className="relative z-[1] p-3 sm:p-4">
                  <h3 className="text-sm font-semibold">添加单元</h3>
                  <p className="mt-0.5 text-[0.7rem] leading-snug text-[#620607]/85">与首页卡片展开一致；已关联本篇 Material。</p>
                  <form onSubmit={submitAddUnit} className="mt-2.5 space-y-2.5">
                    <fieldset className="flex flex-wrap gap-x-3 gap-y-1 border-0 p-0">
                      <legend className="mb-0.5 w-full text-[0.7rem] font-medium">类型</legend>
                      {(['word', 'phrase', 'sentence'] as const).map((k) => (
                        <label key={k} className="flex cursor-pointer items-center gap-1.5 text-[0.72rem]">
                          <input type="radio" name="utype" checked={addType === k} onChange={() => setAddType(k)} />
                          {UNIT_TYPE_LABELS[k]}
                        </label>
                      ))}
                    </fieldset>
                    <label className="block text-[0.7rem] font-medium">
                      卡片标题（可选，默认可由释义生成）
                      <input
                        className="emb-field mt-0.5 text-sm"
                        value={addHeadline}
                        onChange={(e) => setAddHeadline(e.target.value)}
                        placeholder="单词 / 短语 / 短句"
                      />
                    </label>
                    <label className="block text-[0.7rem] font-medium">
                      Definition
                      <textarea
                        className="emb-textarea mt-0.5 min-h-[52px] text-sm"
                        value={addDefinitionEn}
                        onChange={(e) => setAddDefinitionEn(e.target.value)}
                        placeholder="英英释义"
                      />
                    </label>
                    <label className="block text-[0.7rem] font-medium">
                      原句
                      <textarea
                        className="emb-textarea mt-0.5 min-h-[48px] text-sm"
                        value={addOriginalSentence}
                        onChange={(e) => setAddOriginalSentence(e.target.value)}
                        placeholder="含该片段的完整句子"
                      />
                    </label>
                    <label className="block text-[0.7rem] font-medium">
                      Level UP
                      <textarea
                        className="emb-textarea mt-0.5 min-h-[48px] text-sm"
                        value={addExpansion}
                        onChange={(e) => setAddExpansion(e.target.value)}
                        placeholder="同词根、搭配拓展、句式仿写等"
                      />
                    </label>
                    <div className="border-t border-[#475B35]/12 pt-2.5 text-center">
                      {source.url?.trim() ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[0.8rem] font-medium text-[#D4604D] underline-offset-2 hover:underline"
                        >
                          原文链接
                        </a>
                      ) : (
                        <Link
                          to={`/sources/${source.id}/edit`}
                          className="text-[0.75rem] font-medium underline-offset-2 hover:text-[#D4604D] hover:underline"
                        >
                          未设外站链接 · 去编辑外刊补充
                        </Link>
                      )}
                    </div>
                    <button type="submit" className="emb-btn-primary w-full text-sm">
                      保存单元
                    </button>
                  </form>
                </div>
              </div>

              <div className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl ${detailFrost}`}>
                <FrostSparkles density="sparse" />
                <div className="relative z-[1] flex min-h-0 flex-1 flex-col p-4">
                  <h2 className="shrink-0 text-lg font-semibold">本篇积累（{units.length}）</h2>
                  {units.length === 0 ? (
                    <p className="mt-2 shrink-0 text-sm text-[#620607]/82">
                      暂无单元。可在上方快速添加，或使用 Upload 从左侧正文划选添加。
                    </p>
                  ) : (
                    <ul className="emb-col-scroll mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
                      {units.map((u) => (
                        <li key={u.id}>
                          <UnitBoardCard unit={u} source={source} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SourceDetailPage() {
  const { sourceId } = useParams<{ sourceId: string }>()

  const data = useLiveQuery(async () => {
    if (!sourceId) return null
    const [source, units] = await Promise.all([
      db.sources.get(sourceId),
      db.units.where('sourceId').equals(sourceId).sortBy('createdAt'),
    ])
    return { source, units: units.reverse() as Unit[] }
  }, [sourceId])

  if (!sourceId) {
    return <div className="p-8 text-[#4a4f3e]">无效链接</div>
  }
  if (!data) {
    return <div className="flex flex-1 items-center justify-center p-8 text-[#4a4f3e]">加载中…</div>
  }
  if (!data.source) {
    return (
      <div className="p-8 text-[#4a4f3e]">
        未找到该外刊。
        <Link to="/sources" className="ml-2 font-medium text-[#D4604D] underline">
          返回列表
        </Link>
      </div>
    )
  }

  return <SourceDetailBody source={data.source} units={data.units} sourceId={sourceId} />
}
