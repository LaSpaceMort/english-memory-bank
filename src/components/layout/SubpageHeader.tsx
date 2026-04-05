import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  title: string
  right?: ReactNode
  /** 例如 emb-home-title-slide：与主页 Unit 标题一致的从左入场 */
  titleClassName?: string
  /** 右侧容器 class，如含搜索条时用半宽：flex min-w-0 w-full md:w-1/2 … */
  rightClassName?: string
}

export default function SubpageHeader({ title, right, titleClassName, rightClassName }: Props) {
  return (
    <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-6 pb-4 pt-0 md:px-10">
      <h2 className={['emb-inner-page-title', titleClassName].filter(Boolean).join(' ')}>{title}</h2>
      <div className={rightClassName ?? 'flex items-center gap-3'}>{right}</div>
    </header>
  )
}

/** Unit / Material 共用：轨道底色与侧栏 #475B35 一致，宽度由外层控制（建议主区半宽） */
export function HeaderSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div
      className={`emb-header-search-enter flex w-full max-w-full min-w-0 items-center gap-1 rounded-md border border-[#F5F9E5]/14 bg-[#475B35] p-1 shadow-sm ${className}`.trim()}
    >
      <div className="flex min-w-0 flex-1 items-center rounded-[4px] bg-[#6f7754] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent py-0.5 text-sm text-[#F5F9E5] placeholder:text-[#F5F9E5]/42 focus:outline-none"
        />
      </div>
      <span className="shrink-0 rounded-[5px] bg-[#D4604D] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white [box-shadow:inset_0_1px_0_rgba(255,255,255,0.12)]">
        search
      </span>
    </div>
  )
}

export function TextLinkButton({
  to,
  children,
  variant = 'default',
}: {
  to: string
  children: ReactNode
  variant?: 'default' | 'home'
}) {
  const cls =
    variant === 'home'
      ? 'rounded-full border border-[#620607]/45 bg-white/38 px-3 py-1.5 text-sm font-medium text-[#620607] backdrop-blur-sm hover:bg-white/38'
      : 'rounded-full border border-[#D4604D]/45 bg-white/38 px-3 py-1.5 text-sm font-medium text-[#475B35] backdrop-blur-sm hover:bg-white/38'
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}
