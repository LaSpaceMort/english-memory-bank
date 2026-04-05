import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SubpageHeader, { TextLinkButton } from '../components/layout/SubpageHeader'
import FrostSparkles from '../components/decorative/FrostSparkles'
import { useLiveQuery } from '../hooks/useLive'
import { db } from '../db/schema'
import { newId } from '../lib/id'
import type { Unit } from '../db/types'
import type { UnitType } from '../models'
import { UNIT_TYPE_LABELS } from '../models'
import {
  ensureArticleHasLinkedSource,
  insertArticleLinkedSource,
  syncLinkedSourceFromArticle,
} from '../lib/articleMaterialSource'
import { extractDocumentText } from '../lib/extractDocumentText'
import { fetchEnDefinition, lookupQueryForSelection } from '../lib/freeDictionary'

const FILE_ACCEPT = '.txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export default function UploadWizardPage() {
  const [searchParams] = useSearchParams()
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docText, setDocText] = useState('')
  const [fileBusy, setFileBusy] = useState(false)
  const [fileErr, setFileErr] = useState<string | null>(null)
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null)
  const [articleTitle, setArticleTitle] = useState('')
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null)
  /** 本条 unit 的积累内容：可「捕获选中」填入，也可直接在框内手打 */
  const [unitContent, setUnitContent] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('word')
  const [definitionEn, setDefinitionEn] = useState('')
  const [definitionFetching, setDefinitionFetching] = useState(false)
  const [expansion, setExpansion] = useState('')
  const [originalSentence, setOriginalSentence] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const lastDefinitionLookupKey = useRef<string>('')

  const captureSelection = useCallback(() => {
    const el = taRef.current
    if (!el) return
    const { selectionStart, selectionEnd, value } = el
    const t = value.slice(selectionStart, selectionEnd).trim()
    setUnitContent(t)
  }, [])

  useEffect(() => {
    const query = lookupQueryForSelection(unitContent, unitType)
    if (!query) {
      lastDefinitionLookupKey.current = ''
      setDefinitionEn('')
      setDefinitionFetching(false)
      return
    }
    const key = `${unitType}:${unitContent.trim()}:${query}`
    if (lastDefinitionLookupKey.current === key) return
    lastDefinitionLookupKey.current = key

    const ac = new AbortController()
    setDefinitionFetching(true)
    fetchEnDefinition(query, ac.signal)
      .then((text) => {
        if (text) setDefinitionEn(text)
        else setDefinitionEn('')
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setDefinitionEn('')
      })
      .finally(() => {
        if (!ac.signal.aborted) setDefinitionFetching(false)
      })
    return () => ac.abort()
  }, [unitContent, unitType])

  const aidFromUrl = searchParams.get('articleId')
  useEffect(() => {
    if (!aidFromUrl) return
    let cancelled = false
    ;(async () => {
      const a = await db.articles.get(aidFromUrl)
      if (cancelled || !a) return
      await ensureArticleHasLinkedSource(a.id)
      setCurrentArticleId(a.id)
      setDocText(a.body)
      setArticleTitle(a.title)
      setLoadedFileName(null)
      setUnitContent('')
      setExpansion('')
      setOriginalSentence('')
      setDefinitionEn('')
      lastDefinitionLookupKey.current = ''
    })()
    return () => {
      cancelled = true
    }
  }, [aidFromUrl])

  useEffect(() => {
    if (!currentArticleId || !docText.trim()) return
    const id = window.setTimeout(() => {
      void (async () => {
        await ensureArticleHasLinkedSource(currentArticleId)
        await syncLinkedSourceFromArticle(
          currentArticleId,
          articleTitle.trim() || '未命名篇目',
          docText,
        )
      })()
    }, 450)
    return () => window.clearTimeout(id)
  }, [currentArticleId, docText, articleTitle])

  async function ensureArticleFromDoc(): Promise<string | null> {
    if (currentArticleId) return currentArticleId
    const body = docText.trim()
    const title = articleTitle.trim()
    if (!body || !title) return null
    const { articleId } = await insertArticleLinkedSource(title, body)
    setCurrentArticleId(articleId)
    return articleId
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileErr(null)
    setFileBusy(true)
    try {
      const text = await extractDocumentText(f)
      const base = f.name.replace(/\.[^.]+$/i, '').trim()
      const { articleId: aid } = await insertArticleLinkedSource(base || '未命名篇目', text)
      setCurrentArticleId(aid)
      setDocText(text)
      setLoadedFileName(f.name)
      setArticleTitle((prev) => (prev.trim() ? prev : base || '未命名篇目'))
      setDefinitionEn('')
      lastDefinitionLookupKey.current = ''
      setUnitContent('')
      setExpansion('')
      setOriginalSentence('')
      setSaveMsg(null)
    } catch (err) {
      setFileErr(err instanceof Error ? err.message : '读取文件失败')
    } finally {
      setFileBusy(false)
      e.target.value = ''
    }
  }

  async function saveUnit() {
    const aid = (await ensureArticleFromDoc()) ?? null
    if (!aid) return
    await ensureArticleHasLinkedSource(aid)
    const row = await db.articles.get(aid)
    const materialSid = row?.materialSourceId ?? null
    const t = Date.now()
    const content = unitContent.trim()
    const headline = content.length > 80 ? `${content.slice(0, 77)}…` : content || '未命名'
    const u: Unit = {
      id: newId(),
      type: unitType,
      headline,
      content: content || headline,
      articleTitle: articleTitle.trim() || undefined,
      definitionEn: definitionEn.trim(),
      expansion: expansion.trim(),
      sourceId: materialSid,
      articleId: aid,
      snippet: content,
      originalSentence: originalSentence.trim() || undefined,
      createdAt: t,
      updatedAt: t,
    }
    await db.units.add(u)
    setSaveMsg('已保存，可继续捕获下一条。')
    window.setTimeout(() => setSaveMsg(null), 3200)
    setUnitContent('')
    setExpansion('')
    setOriginalSentence('')
    setDefinitionEn('')
    lastDefinitionLookupKey.current = ''
  }

  const docLoaded = docText.trim().length > 0
  const needArticleTitle = docLoaded
  const articleReady = !!currentArticleId || (docText.trim().length > 0 && articleTitle.trim().length > 0)
  const canSave =
    unitContent.trim().length > 0 && articleReady && (!needArticleTitle || articleTitle.trim().length > 0) && !fileBusy

  const savedUnits = useLiveQuery(
    async () => {
      if (!currentArticleId) return []
      const list = await db.units.where('articleId').equals(currentArticleId).sortBy('createdAt')
      return list.reverse()
    },
    [currentArticleId],
  )

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SubpageHeader
        title="Upload"
        titleClassName="emb-home-title-slide"
        right={
          <>
            <TextLinkButton to="/units/new">新增积累</TextLinkButton>
            <TextLinkButton to="/">← Unit</TextLinkButton>
          </>
        }
      />
      <div className="emb-pg-content-fade mx-auto flex w-full max-w-[min(100%,112rem)] flex-col gap-8 px-6 pb-12 pt-10 text-[#620607] md:px-10 md:pt-12 [&_.emb-field]:text-[#620607] [&_.emb-textarea]:text-[#620607] [&_.emb-field]:placeholder:text-[#620607]/42 [&_.emb-textarea]:placeholder:text-[#620607]/42">
        <section className="emb-glass relative overflow-hidden rounded-2xl px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6 lg:pt-4">
          <FrostSparkles density="normal" />
          <div className="relative z-[1]">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">外刊正文</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_ACCEPT}
              disabled={fileBusy}
              className="sr-only"
              id="upload-waikan-file"
              onChange={onFile}
            />
            <label
              htmlFor="upload-waikan-file"
              className={`emb-btn-primary inline-flex w-full cursor-pointer items-center justify-center sm:w-auto ${
                fileBusy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {fileBusy ? '正在解析…' : '上传外刊'}
            </label>
          </div>
          <p className="mt-2 text-xs">
            支持 <strong>.txt / .docx / .pdf</strong>；每次上传会新建一篇（与当前篇独立）。旧版 .doc 请先另存为 .docx。
          </p>
          <div className="mt-4 space-y-4">
            {loadedFileName ? (
              <p className="text-xs">
                已载入：<span className="font-medium">{loadedFileName}</span>
              </p>
            ) : null}
            {fileErr ? <p className="text-xs text-red-700">{fileErr}</p> : null}
            {docLoaded ? (
              <label className="block text-sm font-medium">
                篇名（整篇文章标题）
                <input
                  type="text"
                  className="emb-field"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="如本期外刊文章标题"
                />
              </label>
            ) : null}
            <label className="block text-base font-medium">
              正文（可修改）
              <textarea
                ref={taRef}
                className="emb-textarea mt-1 min-h-[min(52vh,30rem)] max-h-[min(68vh,44rem)] resize-y overflow-y-auto text-base leading-relaxed sm:text-[1.0625rem]"
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="上传文件后内容会出现在这里，也可直接粘贴…"
              />
            </label>
          </div>
          </div>
        </section>

        <section className="emb-glass relative overflow-hidden rounded-2xl p-6 sm:p-8 lg:p-10">
          <FrostSparkles density="normal" />
          <div className="relative z-[1]">
          <h2 className="text-base font-semibold">捕获、类型与释义</h2>
          <p className="mt-1 max-w-4xl text-xs">
            积累内容可<strong>手打</strong>，或在上方外刊正文里拖选后点「捕获选中」填入；选好类型后词典会尝试拉取释义。右侧为本篇已保存的单元（最新在上）。
          </p>
          <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_min(28rem,34%)] xl:items-start xl:gap-10">
            <div className="min-w-0 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={captureSelection} className="emb-btn-secondary" disabled={!docLoaded}>
                  捕获选中
                </button>
                <fieldset className="flex flex-wrap gap-3 border-0 p-0">
                  {(['word', 'phrase', 'sentence'] as const).map((k) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" checked={unitType === k} onChange={() => setUnitType(k)} />
                      {UNIT_TYPE_LABELS[k]}
                    </label>
                  ))}
                </fieldset>
              </div>
              <label className="block text-sm font-medium">
                积累内容（手打或捕获）
                <textarea
                  className="emb-textarea min-h-[min(7rem,14vh)]"
                  value={unitContent}
                  onChange={(e) => setUnitContent(e.target.value)}
                  placeholder="在此输入词 / 短语 / 句子；或从上方正文选中后点「捕获选中」"
                />
              </label>
              <label className="block text-sm font-medium">
                英英释义（自动拉取，可改）
                {definitionFetching ? (
                  <span className="ml-2 text-xs font-normal text-[#620607]/72">拉取中…</span>
                ) : unitContent.trim() && unitType !== 'sentence' && !definitionEn.trim() ? (
                  <span className="ml-2 text-xs font-normal text-[#620607]/72">未查到时可手写</span>
                ) : null}
                <textarea
                  className="emb-textarea min-h-[min(12rem,22vh)]"
                  value={definitionEn}
                  onChange={(e) => setDefinitionEn(e.target.value)}
                  placeholder="词典结果会出现在这里…"
                />
              </label>
              <label className="block text-sm font-medium">
                原句（含该片段的完整句子，可空）
                <textarea
                  className="emb-textarea min-h-[min(8rem,16vh)]"
                  value={originalSentence}
                  onChange={(e) => setOriginalSentence(e.target.value)}
                  placeholder="从正文复制整句上下文，便于日后复习"
                />
              </label>
              <label className="block text-sm font-medium">
                拓展（可空）
                <textarea
                  className="emb-textarea min-h-[min(8rem,16vh)]"
                  value={expansion}
                  onChange={(e) => setExpansion(e.target.value)}
                />
              </label>
              {needArticleTitle && !articleTitle.trim() ? (
                <p className="text-xs text-amber-800">有正文时请填写篇名后再保存。</p>
              ) : null}
              {!unitContent.trim() ? <p className="text-xs text-[#620607]/72">请填写积累内容（手打或捕获）。</p> : null}
              {!articleReady && unitContent.trim() ? (
                <p className="text-xs text-amber-800">需要先有正文与篇名（或先上传文件）以关联本篇。</p>
              ) : null}
              {saveMsg ? <p className="text-sm font-medium">{saveMsg}</p> : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={saveUnit} disabled={!canSave} className="emb-btn-primary">
                  保存本条积累
                </button>
                <TextLinkButton to="/">回首页</TextLinkButton>
              </div>
            </div>

            <aside className="min-h-[12rem] min-w-0 rounded-xl border border-[#475B35]/14 bg-white/38 p-4 backdrop-blur-md sm:p-5">
              <h3 className="text-sm font-semibold">本篇已保存的单元</h3>
              <p className="mt-1 text-xs text-[#620607]/75">
                {currentArticleId ? `共 ${savedUnits?.length ?? 0} 条` : '上传文件或保存第一条后，会按篇目聚合显示。'}
              </p>
              <ul className="mt-4 space-y-3">
                {!currentArticleId ? (
                  <li className="text-sm text-[#620607]/65">—</li>
                ) : !savedUnits?.length ? (
                  <li className="text-sm text-[#620607]/65">暂无，保存后出现在此。</li>
                ) : (
                  savedUnits.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-lg border border-[#475B35]/12 bg-white/38 px-4 py-3 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{u.headline}</span>
                        <span className="shrink-0 rounded-full bg-[#D4604D]/12 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-[#620607]">
                          {UNIT_TYPE_LABELS[u.type]}
                        </span>
                      </div>
                      {u.definitionEn.trim() ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#620607]/88">{u.definitionEn}</p>
                      ) : (
                        <p className="mt-2 text-xs text-[#620607]/55">（无释义）</p>
                      )}
                      <Link
                        to={`/units/${u.id}/edit`}
                        className="mt-2 inline-block text-xs font-medium text-[#620607] underline underline-offset-2 hover:text-[#D4604D]"
                      >
                        编辑
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </aside>
          </div>
          </div>
        </section>
      </div>
    </div>
  )
}
