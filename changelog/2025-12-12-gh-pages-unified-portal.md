# 2025-12-12 GitHub Pages 统一门户（方案 A）

- 新增：输出全新设计文档 `docs/unified-portal-gh-pages-design.md`，用于指导将仓库整合为 GitHub Pages 单站点统一门户。
- 删除：移除旧/错误的设计类文档 `docs/improvement-plan.md`，后续以新的统一门户设计为准。

- 变更：删除 `apps/bioinfo-pipeline-web/src/app/api/`（Route Handlers），以兼容 GitHub Pages 静态托管。
- 新增：`apps/bioinfo-pipeline-web/src/lib/base-path.ts`，统一处理 `NEXT_PUBLIC_BASE_PATH` 并提供 `withBasePath()`。
- 变更：`apps/bioinfo-pipeline-web/next.config.ts` 启用静态导出（`output: 'export'`）并配置 `basePath/assetPrefix`。
- 变更：为 `pipelines/[id]`、`apps/[slug]` 增加 `generateStaticParams()`，保证静态导出可预渲染。
- 变更：`PipelineClient` 不再请求 `/api/pipelines/*`，改为使用 `pipeline-data-source`（本地 presets 或远端直连）。
- 变更：`apps/[slug]` 与 `slides/ngs-vs-tgs` 页面改为 iframe 嵌入 `/static/...` 静态资源，并提供新标签打开。
- 变更：`ResourceCard`、`LearningPathPlanner` 统一对站内链接使用 `withBasePath()`，避免 GH Pages 子路径下链接失效。
- 变更：修正演示数据中的占位产出物链接，避免生成无效的 `/files/*` 路径。

- 变更：更新 `.github/workflows/pages.yml`：以 Next.js 导出产物作为站点根目录，并把各 apps/slides/Vite dist 合并到 `pages/static/**` 后部署。
