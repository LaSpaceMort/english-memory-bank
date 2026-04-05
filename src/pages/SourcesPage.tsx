import { useMemo, useState } from 'react'
import { db } from '../db/schema'
import { useLiveQuery } from '../hooks/useLive'
import SourceCard from '../components/source/SourceCard'
import FrostSparkles from '../components/decorative/FrostSparkles'
import SubpageHeader, { HeaderSearch } from '../components/layout/SubpageHeader'
import type { Source } from '../db/types'

export default function SourcesPage() {
  const [search, setSearch] = useState('')
  const data = useLiveQuery(async () => {
    const sources = await db.sources.orderBy('createdAt').reverse().toArray()
    return { sources }
  }, [])

  const sources = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.sources as Source[]
    return (data.sources as Source[]).filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q),
    )
  }, [data, search])

  if (!data) {
    return <div className="flex flex-1 items-center justify-center p-8 text-[#4a4f3e]">加载中…</div>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SubpageHeader
        title="Material"
        titleClassName="emb-home-title-slide"
        rightClassName="flex min-w-0 w-full items-center gap-3 md:w-1/2"
        right={<HeaderSearch value={search} onChange={setSearch} placeholder="Search sources…" />}
      />
      <div className="flex-1 overflow-y-auto px-6 pb-10 pt-8 md:px-10 md:pt-10">
        <div className="emb-pg-content-fade">
          {sources.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-[#D4604D]/35 bg-white/38 backdrop-blur-md">
              <FrostSparkles density="sparse" />
              <p className="relative z-[1] px-6 py-10 text-center text-[#4a4f3e]">
                {data.sources.length === 0
                  ? '还没有外刊。在 Upload 上传或粘贴正文后，本篇会自动出现在此列表。'
                  : '没有匹配的外刊。'}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((s) => (
                <li key={s.id} className="min-w-0">
                  <SourceCard source={s} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
