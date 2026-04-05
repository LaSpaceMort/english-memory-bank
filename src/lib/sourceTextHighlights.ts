import type { SourceTextHighlight } from '../db/types'

/** 两区间是否相交（半开区间 [start, end) 与闭区间存储的 highlights 用 start inclusive, end exclusive） */
export function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end
}

/** 合并相交或相邻的高亮，保留左侧 id */
export function mergeTouchingHighlights(ranges: SourceTextHighlight[]): SourceTextHighlight[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((x, y) => x.start - y.start)
  const out: SourceTextHighlight[] = [{ ...sorted[0] }]
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]
    const last = out[out.length - 1]
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end)
    else out.push({ ...cur })
  }
  return out
}

/** 去掉与选区相交的高亮 */
export function removeHighlightsOverlapping(
  ranges: SourceTextHighlight[],
  sel: { start: number; end: number },
): SourceTextHighlight[] {
  return ranges.filter((h) => !rangesOverlap(h, sel))
}

/** 在合法范围内追加一段高亮并合并 */
export function addHighlight(
  ranges: SourceTextHighlight[],
  sel: { start: number; end: number },
  id: string,
  textLen: number,
): SourceTextHighlight[] {
  const start = Math.max(0, Math.min(sel.start, textLen))
  const end = Math.max(0, Math.min(sel.end, textLen))
  if (start >= end) return ranges
  return mergeTouchingHighlights([...ranges, { id, start, end }])
}
