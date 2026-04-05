import { useCallback, useEffect, useMemo, useState } from 'react'
import { db } from '../db/schema'
import { useLiveQuery } from '../hooks/useLive'
import UnitBoardCard from '../components/unit/UnitBoardCard'
import FrostSparkles from '../components/decorative/FrostSparkles'
import { HeaderSearch } from '../components/layout/SubpageHeader'
import type { Source, Unit } from '../db/types'
import type { UnitType } from '../models'

const COLS: { type: UnitType; title: string }[] = [
  { type: 'word', title: 'WORD' },
  { type: 'phrase', title: 'COLLOCATION' },
  { type: 'sentence', title: 'SENTENCE' },
]

const UNITS_PER_PAGE = 5

function matchesQuery(u: Unit, q: string): boolean {
  if (!q.trim()) return true
  const s = q.toLowerCase()
  return [u.headline, u.content, u.snippet, u.originalSentence, u.definitionEn, u.expansion].some((f) =>
    (f ?? '').toLowerCase().includes(s),
  )
}

function UnitColumn({
  title,
  colType,
  units,
  sourceMap,
  enterClass,
  page,
  onPageChange,
}: {
  title: string
  colType: UnitType
  units: Unit[]
  sourceMap: Map<string, Source>
  enterClass: string
  page: number
  onPageChange: (type: UnitType, p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(units.length / UNITS_PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * UNITS_PER_PAGE
  const pageUnits = units.slice(start, start + UNITS_PER_PAGE)

  useEffect(() => {
    if (page > totalPages) onPageChange(colType, totalPages)
    else if (page < 1) onPageChange(colType, 1)
  }, [page, totalPages, colType, onPageChange])

  return (
    <div
      className={`emb-unit-column relative flex h-[min(500px,calc(100svh-11.5rem))] w-full flex-col overflow-hidden md:h-[min(580px,calc(100svh-13rem))] ${enterClass}`}
    >
      <FrostSparkles density="sparse" />
      <div className="emb-unit-column-head relative z-[1]">
        <div className="emb-unit-column-title-stack">
          <span className="emb-unit-column-title-layer emb-unit-frost-surface" aria-hidden />
          <h2>{title}</h2>
        </div>
      </div>
      <div className="emb-col-scroll--unit relative z-[1] min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 pb-2 pt-3.5">
        {units.length === 0 ? (
          <p className="px-1 text-center text-sm text-[#620607]/85">暂无条目</p>
        ) : (
          pageUnits.map((u) => (
            <UnitBoardCard
              key={u.id}
              unit={u}
              source={u.sourceId ? sourceMap.get(u.sourceId) : undefined}
              tone="home"
            />
          ))
        )}
      </div>
      {units.length > 0 && totalPages > 1 ? (
        <nav
          aria-label={`${title} 分页`}
          className="relative z-[1] flex shrink-0 flex-wrap items-center justify-center gap-x-0.5 gap-y-1 border-t border-[#620607]/14 px-2 py-2"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(colType, safePage - 1)}
            className="rounded px-2 py-0.5 text-sm font-medium text-[#C63E4E] disabled:pointer-events-none disabled:opacity-35"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => {
            const n = i + 1
            return (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(colType, n)}
                className={`min-w-[1.625rem] rounded px-1.5 py-0.5 text-sm font-semibold text-[#C63E4E] ${
                  n === safePage ? 'bg-[#C63E4E]/12 underline decoration-2 underline-offset-2' : 'opacity-85 hover:opacity-100'
                }`}
              >
                {n}
              </button>
            )
          })}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(colType, safePage + 1)}
            className="rounded px-2 py-0.5 text-sm font-medium text-[#C63E4E] disabled:pointer-events-none disabled:opacity-35"
          >
            ›
          </button>
        </nav>
      ) : null}
    </div>
  )
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [pageByCol, setPageByCol] = useState<Record<UnitType, number>>({
    word: 1,
    phrase: 1,
    sentence: 1,
  })
  const data = useLiveQuery(async () => {
    const [units, sources] = await Promise.all([
      db.units.orderBy('createdAt').reverse().toArray(),
      db.sources.toArray(),
    ])
    const sourceMap = new Map<string, Source>(sources.map((s) => [s.id, s]))
    return { units, sourceMap }
  }, [])

  const filtered = useMemo(() => {
    if (!data) return null
    const q = search
    return data.units.filter((u) => matchesQuery(u, q))
  }, [data, search])

  useEffect(() => {
    setPageByCol({ word: 1, phrase: 1, sentence: 1 })
  }, [search])

  const handleColPage = useCallback((type: UnitType, p: number) => {
    setPageByCol((s) => ({ ...s, [type]: p }))
  }, [])

  if (!data || !filtered) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-8 text-[#620607]">加载中…</div>
      </div>
    )
  }

  const { sourceMap } = data

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-6 pb-4 pt-0 md:px-10">
        <h2 className="emb-inner-page-title emb-home-title-slide">Unit</h2>
        <div className="flex min-w-0 w-full flex-wrap items-center gap-3 md:w-1/2">
          <HeaderSearch value={search} onChange={setSearch} placeholder="Search units…" />
        </div>
      </header>

      {data.units.length === 0 ? (
        <div className="relative mx-6 mb-8 mt-8 overflow-hidden rounded-2xl border border-dashed border-[#620607]/35 bg-white/38 backdrop-blur-md md:mx-10 md:mt-12">
          <FrostSparkles density="sparse" />
          <p className="relative z-[1] px-6 py-12 text-center text-[#620607]">
            还没有积累单元。请使用侧栏 Upload，从外刊正文中添加积累。
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 px-5 pb-8 md:mt-12 md:grid-cols-3 md:gap-8 md:px-10 md:items-start">
          {COLS.map(({ type, title }, i) => (
            <UnitColumn
              key={type}
              title={title}
              colType={type}
              units={filtered.filter((u) => u.type === type)}
              sourceMap={sourceMap}
              page={pageByCol[type]}
              onPageChange={handleColPage}
              enterClass={
                i === 0 ? 'emb-unit-col-from-left' : i === 2 ? 'emb-unit-col-from-right' : 'emb-unit-col-from-center'
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
