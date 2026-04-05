import type { Source } from '../db/types'

export type MatchCandidate = {
  sourceId: string
  score: number
  matchedSnippet: string
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** 在本机 Source 列表中匹配选中片段（全文 > 摘要 > 词重叠） */
export function matchSources(snippet: string, sources: Source[]): MatchCandidate[] {
  const sn = norm(snippet)
  if (!sn) return []

  const results: MatchCandidate[] = []

  for (const s of sources) {
    const text = norm(s.fullText ?? '')
    const sum = norm(s.summary ?? '')
    const haystack = `${text} ${sum}`

    if (text.includes(sn)) {
      results.push({
        sourceId: s.id,
        score: sn.length + 200,
        matchedSnippet: snippet,
      })
    } else if (sum.includes(sn)) {
      results.push({
        sourceId: s.id,
        score: sn.length + 50,
        matchedSnippet: snippet,
      })
    } else {
      const words = sn.split(' ').filter((w) => w.length > 2)
      if (words.length === 0) continue
      let hits = 0
      for (const w of words) {
        if (haystack.includes(w)) hits++
      }
      const ratio = hits / words.length
      if (ratio >= 0.45) {
        results.push({
          sourceId: s.id,
          score: Math.floor(ratio * sn.length),
          matchedSnippet: snippet,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
