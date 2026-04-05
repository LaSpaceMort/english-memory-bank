import { useCallback, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import BotanicalBackdrop from './BotanicalBackdrop'
import SidebarSparkleField, { SIDEBAR_SPARKLE_PATH } from './SidebarSparkleField'

function SideNavLink({
  to,
  end,
  label,
  onNavInteract,
  tapPulse,
}: {
  to: string
  end?: boolean
  label: string
  onNavInteract: (to: string) => void
  tapPulse: number
}) {
  return (
    <NavLink to={to} end={end} className="block w-full" onClick={() => onNavInteract(to)}>
      {({ isActive }) => (
        <span
          key={tapPulse}
          className={`flex w-full origin-center items-center justify-between rounded-md px-4 py-2.5 text-[0.95rem] font-medium tracking-wide transition-[filter,background-color] ${
            tapPulse > 0 ? 'emb-sidebar-nav-tap-bump' : ''
          } ${
            isActive
              ? 'bg-[#D4604D] text-white hover:brightness-110'
              : 'text-[#F5F9E5] hover:brightness-110 [background-color:var(--emb-nav-inactive-bg)]'
          }`}
        >
          {label}
          {isActive ? (
            <svg
              className="ml-2 h-[0.72rem] w-[0.72rem] shrink-0 text-white opacity-95 drop-shadow-[0_0_3px_rgba(255,255,255,0.75)] md:h-3 md:w-3"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d={SIDEBAR_SPARKLE_PATH} />
            </svg>
          ) : (
            <span className="w-3 shrink-0" />
          )}
        </span>
      )}
    </NavLink>
  )
}

const sidebarTitleClass = 'font-bold leading-[1.12] tracking-tight drop-shadow-sm'
const sidebarLine1 = 'block text-[3.1rem] font-black md:text-[3.6rem]'
const sidebarLine2 = 'mt-0.5 block text-[1.65rem] md:text-[1.9rem]'

/** 与扇形重叠处标题副本（裁剪为第一象限圆），字色 #F5F9E5 */
function SidebarTitleOverlap({ r }: { r: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[3]"
      style={{
        width: r,
        height: r,
        clipPath: `circle(${r}px at 0 0)`,
      }}
      aria-hidden
    >
      <h1 className={`${sidebarTitleClass} absolute left-6 top-8 text-[#F5F9E5]`}>
        <span className={sidebarLine1}>English</span>
        <span className={sidebarLine2}>Memory Bank</span>
      </h1>
    </div>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const [navSparkleBurst, setNavSparkleBurst] = useState(0)
  const [navTapPulse, setNavTapPulse] = useState<Record<string, number>>({})

  const onMainNavClick = useCallback((to: string) => {
    setNavSparkleBurst((k) => k + 1)
    setNavTapPulse((p) => ({ ...p, [to]: (p[to] ?? 0) + 1 }))
  }, [])

  return (
    <div className="flex h-svh max-h-svh min-h-0 overflow-hidden">
      <aside className="emb-sidebar-scroll relative flex h-full min-h-0 w-[220px] shrink-0 flex-col overflow-x-visible overflow-y-auto bg-[#475B35] text-[#eef2df] md:w-[248px]">
        {/* 半径 = 侧栏宽度的一半：220/2=110，248/2=124 */}
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[1] h-[110px] w-[110px] md:hidden"
          viewBox="0 0 110 110"
          aria-hidden
        >
          <path d="M 0 0 L 110 0 A 110 110 0 0 1 0 110 Z" fill="#620607" />
        </svg>
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[1] hidden h-[124px] w-[124px] md:block"
          viewBox="0 0 124 124"
          aria-hidden
        >
          <path d="M 0 0 L 124 0 A 124 124 0 0 1 0 124 Z" fill="#620607" />
        </svg>
        <div className="md:hidden">
          <SidebarTitleOverlap r={110} />
        </div>
        <div className="hidden md:contents">
          <SidebarTitleOverlap r={124} />
        </div>

        <div className="relative z-[2] flex min-h-0 flex-1 flex-col px-4 py-8">
          <div className="px-2">
            <h1 className={`${sidebarTitleClass} text-[#E19184]`}>
              <span className={sidebarLine1}>English</span>
              <span className={sidebarLine2}>Memory Bank</span>
            </h1>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            <SideNavLink
              to="/"
              end
              label="Unit"
              onNavInteract={onMainNavClick}
              tapPulse={navTapPulse['/'] ?? 0}
            />
            <SideNavLink
              to="/sources"
              label="Material"
              onNavInteract={onMainNavClick}
              tapPulse={navTapPulse['/sources'] ?? 0}
            />
            <SideNavLink
              to="/upload"
              label="Upload"
              onNavInteract={onMainNavClick}
              tapPulse={navTapPulse['/upload'] ?? 0}
            />
          </nav>

          <div className="relative mt-4 min-h-[10.5rem] min-w-0 flex-1 overflow-visible">
            <SidebarSparkleField burstKey={navSparkleBurst} />
          </div>

          <div className="relative z-[3] mt-auto flex flex-col gap-3 pt-6">
            <NavLink
              to="/backup"
              className="block w-full rounded-lg bg-[#D4604D] px-4 py-2.5 text-center text-[0.95rem] font-medium tracking-wide text-white transition-colors hover:bg-[#c55545]"
            >
              BACK UP
            </NavLink>
            <p className="px-1 text-center text-[0.65rem] leading-snug text-[#b8c9a0]">
              数据仅保存在本机浏览器
            </p>
          </div>
        </div>
      </aside>

      <main className="emb-main-bg relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <BotanicalBackdrop />
        <div className="emb-main-scroll relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain emb-col-scroll">
          <div
            key={location.pathname}
            className="emb-outlet-route flex min-h-full min-w-0 w-full flex-col"
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
