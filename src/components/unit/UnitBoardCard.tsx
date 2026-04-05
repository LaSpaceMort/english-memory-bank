import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db/schema'
import type { Source, Unit } from '../../db/types'

type Props = {
  unit: Unit
  source?: Source
  /** 首页：折叠态标题与正文用 #620607 */
  tone?: 'default' | 'home'
}

function previewText(unit: Unit): string {
  const d = unit.definitionEn.trim()
  if (d) return d.length > 120 ? `${d.slice(0, 117)}…` : d
  const c = unit.content.trim()
  if (c && c !== unit.headline) return c.length > 100 ? `${c.slice(0, 97)}…` : c
  return '暂无英英释义。点击展开或去编辑补充。'
}

/** 展开区内色块：#620607 底 + #C63E4E 小圆点 */
function ExpandFieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[12px] bg-[#620607] px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <h4 className="flex items-center gap-2 text-[0.7rem] font-bold tracking-wide text-white">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C63E4E]" aria-hidden />
        {label}
      </h4>
      <div className="mt-2 whitespace-pre-wrap text-[0.82rem] leading-relaxed text-white/95">{children}</div>
    </div>
  )
}

export default function UnitBoardCard({ unit, source, tone = 'default' }: Props) {
  const [open, setOpen] = useState(false)

  async function handleDeleteUnit() {
    if (!confirm('确定删除该积累单元？不可恢复。')) return
    await db.units.delete(unit.id)
    setOpen(false)
  }
  const isHome = tone === 'home'
  const titleC = isHome ? 'text-[#620607]' : 'text-[#475B35]'
  const bodyC = isHome ? 'text-[#620607]/90' : 'text-[#4a4f3e]'
  const accentC = isHome ? 'bg-[#C63E4E]' : 'bg-[#D4604D]'

  const glassExpand = 'backdrop-blur-[14px] backdrop-saturate-[1.06]'

  /** 折叠态：.emb-unit-frost-surface — 叠在列底上的薄磨砂层（见 index.css 注释） */
  const shell = isHome
    ? 'emb-unit-frost-surface relative rounded-[12px] border-0 px-4 pb-3.5 pt-3.5 shadow-none transition-shadow'
    : 'emb-unit-frost-surface relative rounded-[12px] border-0 px-3 pb-3.5 pt-3 shadow-none transition-shadow'

  const expandShell = isHome ? 'mt-3 overflow-hidden rounded-[14px]' : 'mt-3 overflow-hidden rounded-[11px]'

  /** 顶：半透明（非纯白）；过渡带整体上移；底：#C63E4E 系实色感 */
  const expandPanelBg = isHome
    ? 'linear-gradient(to bottom, rgba(198,62,78,0.05) 0%, rgba(255,255,255,0.06) 6%, rgba(198,62,78,0.16) 22%, rgba(232,115,125,0.72) 36%, rgba(198,62,78,0.92) 100%)'
    : 'linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, rgba(198,62,78,0.08) 8%, rgba(198,62,78,0.22) 24%, rgba(210,90,100,0.65) 38%, rgba(198,62,78,0.9) 100%)'

  const expandPanelPad = isHome ? 'p-3.5' : 'p-3'

  const linkClass = isHome
    ? 'text-[0.8rem] font-medium text-white underline decoration-white/80 underline-offset-2 hover:text-white hover:decoration-white'
    : 'text-[0.8rem] font-medium text-[#f5d0c8] underline underline-offset-2 hover:text-white'

  const metaClass = isHome ? 'text-[0.72rem] text-white/85' : 'text-[0.72rem] text-[#e8c8c8]/90'

  return (
    <article className={shell}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-full pb-7 text-left"
      >
        <div className="flex gap-2">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accentC}`} aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold ${titleC}`}>{unit.headline}</h3>
            <p className={`mt-1 line-clamp-2 text-[0.8rem] leading-relaxed ${bodyC}`}>{previewText(unit)}</p>
          </div>
        </div>
        <span
          className={`absolute bottom-2.5 left-4 inline-block text-[0.68rem] leading-none text-[#C63E4E] transition-transform duration-200 ease-out motion-reduce:transition-none [transform-origin:50%_53%] ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {open ? (
        <div className={expandShell}>
          <div
            className={`space-y-3 text-left ${expandPanelPad} ${glassExpand}`}
            style={{ background: expandPanelBg }}
          >
            <ExpandFieldBlock label="Definition">
              {unit.definitionEn.trim() || '暂无英英释义。可点下方「编辑」补充。'}
            </ExpandFieldBlock>
            <ExpandFieldBlock label="原句">
              {unit.originalSentence?.trim() || unit.snippet || '（无）'}
            </ExpandFieldBlock>
            <ExpandFieldBlock label="Level UP">
              {unit.expansion.trim() || '（同词根、搭配拓展、句式仿写等）'}
            </ExpandFieldBlock>

            {/* 仅一条原文入口：优先上传篇目，否则 Material */}
            {unit.articleId ? (
              <div className="pt-0.5 text-center">
                <Link
                  to={`/upload?articleId=${unit.articleId}`}
                  className={`${linkClass} inline-block max-w-full break-words`}
                >
                  {unit.articleTitle?.trim() || '继续为本篇添加单元'}
                </Link>
              </div>
            ) : source ? (
              <div className="pt-0.5 text-center">
                <Link to={`/sources/${source.id}`} className={`${linkClass} inline-block max-w-full break-words`}>
                  {source.title}
                </Link>
              </div>
            ) : (
              <p className={`text-center text-[0.75rem] ${metaClass}`}>未关联上传篇目或 Material 外刊</p>
            )}

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                to={`/units/${unit.id}/edit`}
                className="rounded-md bg-black/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/30"
              >
                编辑
              </Link>
              <button
                type="button"
                onClick={handleDeleteUnit}
                className="rounded-md bg-black/15 px-3 py-1 text-xs font-medium text-[#ffd4d0] backdrop-blur-sm hover:bg-black/25"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}
