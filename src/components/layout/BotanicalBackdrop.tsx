const BOTANICAL_BG = '/home-botanical-bg.png'

/** 向右渐隐 */
const BOTANICAL_MASK =
  'linear-gradient(to right, black 0%, black 28%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.12) 78%, transparent 100%)'

/** 主内容区底图：三列平铺 + 模糊 + 向右淡出（全局） */
export default function BotanicalBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 flex opacity-[0.43]"
        style={{
          maskImage: BOTANICAL_MASK,
          WebkitMaskImage: BOTANICAL_MASK,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      >
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className="h-full min-h-full flex-1 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BOTANICAL_BG})`,
              filter: 'blur(14px)',
              transform: 'scale(1.06)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
