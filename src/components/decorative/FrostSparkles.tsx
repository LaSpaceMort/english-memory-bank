/**
 * 磨砂半透明面上的点缀：四尖星（Lucide Sparkle 形），亮白/银 + 轻微外发光，固定坐标避免 hydration 抖动。
 */
type Density = 'sparse' | 'normal'

type Spec = {
  top: string
  left: string
  size: number
  rotate: number
  opacity: number
}

/** 宽卡片：星点更密、尺寸约 +25～40%（相对旧版） */
const NORMAL: Spec[] = [
  { top: '4%', left: '6%', size: 15, rotate: -8, opacity: 0.4 },
  { top: '7%', left: '32%', size: 12, rotate: 11, opacity: 0.32 },
  { top: '5%', left: '58%', size: 14, rotate: -5, opacity: 0.36 },
  { top: '9%', left: '88%', size: 11, rotate: 16, opacity: 0.3 },
  { top: '16%', left: '14%', size: 13, rotate: -14, opacity: 0.38 },
  { top: '14%', left: '44%', size: 10, rotate: 22, opacity: 0.26 },
  { top: '18%', left: '72%', size: 16, rotate: -9, opacity: 0.42 },
  { top: '24%', left: '92%', size: 12, rotate: 7, opacity: 0.34 },
  { top: '28%', left: '8%', size: 14, rotate: -18, opacity: 0.36 },
  { top: '26%', left: '38%', size: 11, rotate: 13, opacity: 0.28 },
  { top: '30%', left: '62%', size: 13, rotate: -6, opacity: 0.35 },
  { top: '34%', left: '22%', size: 10, rotate: 19, opacity: 0.24 },
  { top: '36%', left: '48%', size: 15, rotate: -11, opacity: 0.4 },
  { top: '32%', left: '82%', size: 12, rotate: 8, opacity: 0.32 },
  { top: '44%', left: '12%', size: 11, rotate: -22, opacity: 0.3 },
  { top: '42%', left: '55%', size: 14, rotate: 5, opacity: 0.38 },
  { top: '46%', left: '78%', size: 10, rotate: 24, opacity: 0.26 },
  { top: '52%', left: '6%', size: 16, rotate: -7, opacity: 0.4 },
  { top: '50%', left: '34%', size: 12, rotate: 14, opacity: 0.32 },
  { top: '54%', left: '66%', size: 13, rotate: -16, opacity: 0.34 },
  { top: '58%', left: '90%', size: 11, rotate: 9, opacity: 0.28 },
  { top: '62%', left: '26%', size: 14, rotate: -12, opacity: 0.36 },
  { top: '60%', left: '50%', size: 10, rotate: 17, opacity: 0.25 },
  { top: '66%', left: '72%', size: 15, rotate: -4, opacity: 0.39 },
  { top: '70%', left: '10%', size: 12, rotate: 11, opacity: 0.33 },
  { top: '74%', left: '42%', size: 13, rotate: -20, opacity: 0.35 },
  { top: '72%', left: '86%', size: 11, rotate: 6, opacity: 0.3 },
  { top: '80%', left: '18%', size: 14, rotate: -15, opacity: 0.37 },
  { top: '78%', left: '56%', size: 12, rotate: 21, opacity: 0.31 },
  { top: '84%', left: '38%', size: 16, rotate: -8, opacity: 0.41 },
  { top: '88%', left: '68%', size: 11, rotate: 12, opacity: 0.29 },
  { top: '92%', left: '8%', size: 13, rotate: -10, opacity: 0.34 },
  { top: '90%', left: '48%', size: 12, rotate: 15, opacity: 0.32 },
  { top: '94%', left: '82%', size: 10, rotate: -19, opacity: 0.27 },
]

/** 窄列：颗数约为 normal 的 55%，仍比旧 sparse 密 */
const SPARSE: Spec[] = [
  { top: '6%', left: '14%', size: 14, rotate: -7, opacity: 0.38 },
  { top: '8%', left: '78%', size: 12, rotate: 12, opacity: 0.32 },
  { top: '16%', left: '48%', size: 13, rotate: -11, opacity: 0.36 },
  { top: '22%', left: '8%', size: 11, rotate: 18, opacity: 0.28 },
  { top: '26%', left: '88%', size: 15, rotate: -6, opacity: 0.4 },
  { top: '34%', left: '32%', size: 12, rotate: 9, opacity: 0.3 },
  { top: '38%', left: '62%', size: 14, rotate: -16, opacity: 0.37 },
  { top: '44%', left: '18%', size: 11, rotate: 14, opacity: 0.27 },
  { top: '50%', left: '52%', size: 13, rotate: -9, opacity: 0.35 },
  { top: '54%', left: '92%', size: 12, rotate: 7, opacity: 0.31 },
  { top: '62%', left: '24%', size: 15, rotate: -14, opacity: 0.39 },
  { top: '66%', left: '72%', size: 11, rotate: 20, opacity: 0.29 },
  { top: '74%', left: '10%', size: 14, rotate: -5, opacity: 0.36 },
  { top: '78%', left: '45%', size: 12, rotate: 11, opacity: 0.33 },
  { top: '84%', left: '82%', size: 13, rotate: -18, opacity: 0.34 },
  { top: '90%', left: '38%', size: 12, rotate: 8, opacity: 0.3 },
  { top: '12%', left: '52%', size: 10, rotate: -21, opacity: 0.24 },
  { top: '56%', left: '40%', size: 12, rotate: -3, opacity: 0.32 },
]

/** Lucide「sparkle」实心形 */
const SPARKLE_PATH =
  'm12 3-1.9 5.8a2 2 0 0 1-1.265 1.265L3 12l5.8 1.9a2 2 0 0 1 1.265 1.265L12 21l1.9-5.8a2 2 0 0 1 1.265-1.265L21 12l-5.8-1.9a2 2 0 0 1-1.265-1.265z'

const silverGlow =
  'drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 9px rgba(248,250,252,0.55))'

/** 在坐标表 size 基础上再放大（改一处即可整体变大） */
const SIZE_MUL = 1.42

type Props = {
  /** sparse：窄列/侧栏；normal：宽卡片 */
  density?: Density
  className?: string
}

export default function FrostSparkles({ density = 'normal', className = '' }: Props) {
  const specs = density === 'sparse' ? SPARSE : NORMAL
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
      aria-hidden
    >
      {specs.map((s, i) => {
        const px = Math.max(10, Math.round(s.size * SIZE_MUL))
        return (
        <svg
          key={i}
          className="absolute text-[#f8fafc]"
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{
            top: s.top,
            left: s.left,
            opacity: s.opacity,
            transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
            filter: silverGlow,
          }}
        >
          <path d={SPARKLE_PATH} />
        </svg>
        )
      })}
    </div>
  )
}
