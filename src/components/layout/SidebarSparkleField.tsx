/**
 * 侧栏导航与底栏之间：与例图一致的 8 颗四尖星、颜色顺序与走位；白 / 酒红均带柔光晕。
 */
type Variant = 'light' | 'burgundy'

type StarSpec = {
  top: string
  left: string
  size: number
  variant: Variant
  delayMs: number
}

export const SIDEBAR_SPARKLE_PATH =
  'm12 3-1.9 5.8a2 2 0 0 1-1.265 1.265L3 12l5.8 1.9a2 2 0 0 1 1.265 1.265L12 21l1.9-5.8a2 2 0 0 1 1.265-1.265L21 12l-5.8-1.9a2 2 0 0 1-1.265-1.265z'

/**
 * 自上而下严格按例图（右缘松散纵波）：
 * 1 酒红最上贴右 → 2 白略下偏左 → 3 白再下回右 → 4 白更下贴右缘 → 5 白在 4 左侧靠中
 * → 6 酒红在 5 下略右 → 7 白靠右下 → 8 酒红最低、相对居中
 */
const STARS: StarSpec[] = [
  { top: '12%', left: '86%', size: 34, variant: 'burgundy', delayMs: 0 },
  { top: '22%', left: '58%', size: 36, variant: 'light', delayMs: 35 },
  { top: '32%', left: '82%', size: 33, variant: 'light', delayMs: 70 },
  { top: '43%', left: '90%', size: 35, variant: 'light', delayMs: 20 },
  /** 右下四颗：略大 */
  { top: '45%', left: '52%', size: 41, variant: 'light', delayMs: 105 },
  { top: '57%', left: '71%', size: 40, variant: 'burgundy', delayMs: 50 },
  { top: '71%', left: '84%', size: 43, variant: 'light', delayMs: 85 },
  { top: '87%', left: '68%', size: 40, variant: 'burgundy', delayMs: 120 },
]

/** 更散、更柔，避免硬边被误认为「截断」 */
const FILTER_LIGHT =
  'drop-shadow(0 0 5px rgba(255,255,255,0.45)) drop-shadow(0 0 14px rgba(255,250,245,0.28))'

/** 酒红：深色芯 + 白色柔光晕（与白星同系光色） */
const FILTER_BURGUNDY =
  'drop-shadow(0 0 5px rgba(255,255,255,0.42)) drop-shadow(0 0 14px rgba(255,250,245,0.26))'

type Props = { burstKey: number }

export default function SidebarSparkleField({ burstKey }: Props) {
  return (
    <div
      key={burstKey}
      className="pointer-events-none absolute inset-y-0 left-0 overflow-visible"
      style={{ width: 'calc(100% + 18px)' }}
      aria-hidden
    >
      {STARS.map((s, i) => (
        <div
          key={`${burstKey}-${i}`}
          className="absolute"
          style={{
            top: s.top,
            left: s.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="emb-sidebar-star-fade" style={{ animationDelay: `${s.delayMs}ms` }}>
            <svg
              width={s.size}
              height={s.size}
              viewBox="0 0 24 24"
              fill="currentColor"
              className={s.variant === 'light' ? 'text-[#f5f5f4]' : 'text-[#620607]'}
              style={{
                filter: s.variant === 'light' ? FILTER_LIGHT : FILTER_BURGUNDY,
              }}
            >
              <path d={SIDEBAR_SPARKLE_PATH} />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
