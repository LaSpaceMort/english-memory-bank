# 外刊英文积累库（Web）

纯前端 SPA：数据存在浏览器 **IndexedDB**，无后端。适合 **GitHub + Vercel** 部署，得到固定网址分享页面（每位访客数据仍各自本地）。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`。

## 部署到 Vercel

1. 把本目录（或包含 `web` 的仓库）推送到 GitHub。
2. Vercel 新建项目，导入该仓库。
3. 若仓库根目录不是 `web`：在 Vercel 里把 **Root Directory** 设为 `web`。
4. Build Command：`npm run build`，Output Directory：`dist`。
5. 仓库已含 `vercel.json`，子路由刷新会回退到 `index.html`。

## 上传向导（Upload）

- 支持 **.txt**、**.docx**、**.pdf**（浏览器内解析为纯文本）。
- 旧版 Word **.doc** 不支持，请另存为 **.docx**。
- 扫描版 PDF（整页图片）通常无法提取文字。

## 数据说明

- 本站不收集服务器端数据；积累与外刊仅保存在用户本机。
- 使用 **备份** 页导出 JSON，可换浏览器或电脑后 **合并/覆盖导入**。

## 需求文档

仓库内 `memory-bank/product-requirement.md` 与 `memory-bank/implementation-plan.md`。
