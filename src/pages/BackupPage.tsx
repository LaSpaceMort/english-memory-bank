import { useRef, useState } from 'react'
import { downloadJson, exportAll, importPayload, type ImportMode } from '../lib/exportImport'
import SubpageHeader, { TextLinkButton } from '../components/layout/SubpageHeader'

export default function BackupPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function onExport() {
    const payload = await exportAll()
    downloadJson(payload)
    setMsg(
      `已导出 ${payload.sources.length} 条 Material 外刊、${payload.articles.length} 篇上传正文、${payload.units.length} 条积累。`,
    )
  }

  async function onImportFile(mode: ImportMode) {
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setMsg('请先选择 JSON 文件。')
      return
    }
    const text = await file.text()
    try {
      const json = JSON.parse(text) as unknown
      await importPayload(json, mode)
      setMsg(mode === 'replace' ? '已覆盖导入。' : '已合并导入。')
      inputRef.current!.value = ''
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '导入失败')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SubpageHeader
        title="Backup"
        titleClassName="emb-home-title-slide"
        right={<TextLinkButton to="/">← Unit</TextLinkButton>}
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-10 md:px-10">
        <p className="max-w-xl text-sm text-[#5c4a3a]">
          数据只存在本机浏览器。换电脑、清缓存前请导出 JSON；需要时可再导入。
        </p>
        <div className="emb-glass max-w-xl rounded-2xl p-6">
          <h2 className="font-semibold text-[#475B35]">导出</h2>
          <button type="button" onClick={onExport} className="emb-btn-primary mt-4">
            下载备份 JSON
          </button>
        </div>
        <div className="emb-glass max-w-xl rounded-2xl p-6">
          <h2 className="font-semibold text-[#475B35]">导入</h2>
          <input ref={inputRef} type="file" accept="application/json,.json" className="mt-4 block text-sm text-[#5c4a3a]" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void onImportFile('merge')} className="emb-btn-secondary">
              合并导入
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('覆盖导入将清空当前库再写入备份，确定？')) void onImportFile('replace')
              }}
              className="emb-btn-danger"
            >
              覆盖导入
            </button>
          </div>
        </div>
        {msg ? <p className="text-sm text-[#5c4a3a]">{msg}</p> : null}
      </div>
    </div>
  )
}
