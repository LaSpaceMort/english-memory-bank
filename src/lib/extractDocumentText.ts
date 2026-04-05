function isDocx(file: File): boolean {
  const n = file.name.toLowerCase()
  return (
    n.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

function isLegacyDoc(file: File): boolean {
  const n = file.name.toLowerCase()
  return n.endsWith('.doc') && !n.endsWith('.docx')
}

function isPdf(file: File): boolean {
  const n = file.name.toLowerCase()
  return n.endsWith('.pdf') || file.type === 'application/pdf'
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise
  const parts: string[] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const tc = await page.getTextContent()
    const line = tc.items
      .map((item) => {
        if (item && typeof item === 'object' && 'str' in item && typeof (item as { str: string }).str === 'string') {
          return (item as { str: string }).str
        }
        return ''
      })
      .join(' ')
    parts.push(line)
  }
  return parts.join('\n\n').replace(/\s+\n/g, '\n').trim()
}

/** 从上传文件提取纯文本（浏览器端）：.txt / .docx / .pdf（动态加载解析库） */
export async function extractDocumentText(file: File): Promise<string> {
  if (isLegacyDoc(file)) {
    throw new Error('不支持旧版 .doc，请在 Word 中「另存为」.docx 后再上传。')
  }
  if (isDocx(file)) {
    const mammoth = await import('mammoth')
    const ab = await file.arrayBuffer()
    const { value } = await mammoth.default.extractRawText({ arrayBuffer: ab })
    return value.trim()
  }
  if (isPdf(file)) {
    const text = await extractPdfText(await file.arrayBuffer())
    if (!text) throw new Error('未能从 PDF 中识别出文字（可能是扫描版图片 PDF）。')
    return text
  }
  const n = file.name.toLowerCase()
  if (n.endsWith('.txt') || file.type === 'text/plain' || file.type === '') {
    return (await file.text()).replace(/^\uFEFF/, '')
  }
  throw new Error('仅支持 .txt、.docx、.pdf 格式。')
}
