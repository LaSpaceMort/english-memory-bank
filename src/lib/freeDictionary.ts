/** 使用 dictionaryapi.dev 拉取英英释义（浏览器直连，无需密钥） */

type ApiEntry = {
  meanings?: { definitions?: { definition?: string }[] }[]
}

export async function fetchEnDefinition(query: string, signal?: AbortSignal): Promise<string | null> {
  const q = query.trim()
  if (q.length < 2 || q.length > 80) return null

  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`
  const res = await fetch(url, { signal })
  if (!res.ok) return null

  const data: unknown = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const entry = data[0] as ApiEntry
  const parts: string[] = []
  for (const m of entry.meanings ?? []) {
    for (const d of m.definitions ?? []) {
      const def = d.definition?.trim()
      if (def) parts.push(def)
      if (parts.length >= 2) break
    }
    if (parts.length >= 2) break
  }
  return parts.length ? parts.join(' ') : null
}

/** 从选中片段得到用于查词的 query */
export function lookupQueryForSelection(selected: string, unitType: 'word' | 'phrase' | 'sentence'): string | null {
  const t = selected.trim()
  if (!t) return null
  if (unitType === 'sentence') return null
  if (unitType === 'word') {
    const m = t.match(/[a-zA-Z][a-zA-Z'-]*/)
    return m ? m[0].toLowerCase() : null
  }
  return t.length > 80 ? t.slice(0, 80).trim() : t
}
