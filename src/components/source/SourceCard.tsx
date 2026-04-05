import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Source } from '../../db/types'
import FrostSparkles from '../decorative/FrostSparkles'
import { deleteSourceById } from '../../lib/deleteSource'

const DELETE_ICON_SRC = '/icons/source-delete.svg'

type Props = {
  source: Source
}

export default function SourceCard({ source }: Props) {
  async function handleDelete(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (
      !confirm(
        `删除「${source.title}」？关联积累的来源会清空；Upload 篇目上的 Material 关联也会去掉（单元与篇目仍保留）。`,
      )
    ) {
      return
    }
    await deleteSourceById(source.id)
  }

  return (
    <article className="emb-material-tile group relative flex h-full min-h-[8.5rem] flex-col overflow-hidden p-4 transition-transform duration-200 ease-out will-change-transform hover:z-[1] hover:scale-[1.03] active:scale-[0.98] motion-reduce:transform-none">
      <FrostSparkles density="sparse" className="z-[1]" />
      <Link
        to={`/sources/${source.id}`}
        className="absolute inset-0 z-[2] rounded-[inherit] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4604D]"
        aria-label={`进入 ${source.title}`}
      />
      <h2 className="relative z-10 line-clamp-2 text-lg font-semibold leading-snug text-[#E19184] md:text-xl pointer-events-none">
        {source.title}
      </h2>
      {source.summary ? (
        <p className="relative z-10 mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-[#5a6248] pointer-events-none">
          {source.summary}
        </p>
      ) : (
        <div className="relative z-10 flex-1 pointer-events-none" />
      )}
      <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#D4604D] underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              链接
            </a>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0 transition-transform duration-150 hover:scale-110 active:scale-95 motion-reduce:hover:scale-100"
          aria-label={`删除 ${source.title}`}
        >
          <img src={DELETE_ICON_SRC} alt="" width={32} height={32} className="h-8 w-8 select-none" draggable={false} />
        </button>
      </div>
    </article>
  )
}
