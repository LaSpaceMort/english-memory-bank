import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'

/** 订阅 Dexie liveQuery，列表随本地库变化刷新 */
export function useLiveQuery<T>(factory: () => Promise<T>, deps: unknown[] = []): T | undefined {
  const [data, setData] = useState<T | undefined>(undefined)

  useEffect(() => {
    const sub = liveQuery(factory).subscribe({
      next: (v) => setData(v),
      error: () => setData(undefined),
    })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Dexie deps
  }, deps)

  return data
}
