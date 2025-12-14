# BioInfoViz GitHub Pages 统一门户（方案 A）设计与实施

## 1. 目标

在 **GitHub Pages（纯静态托管）** 上发布一个“统一门户站点”，由 `apps/bioinfo-pipeline-web`（Next.js）输出站点根入口，并把仓库内其它静态/Vite 子应用与 slides 统一纳入同一站点路径下。

- 门户提供统一首页、流程演示、资料入口与导航。
- 其它子应用以静态资源形式挂载到门户站点下（同域）。

## 2. 关键约束（Pages + Next Static Export）

- GitHub Pages **不支持服务器端能力**：无 Node/Edge runtime、无 Next Route Handlers（`app/api/*`）。
- 需要使用 Next.js **静态导出**（`output: 'export'`）。
- 需要处理 GitHub Pages **项目站点 basePath**：访问路径通常为 `https://<owner>.github.io/<repo>/`。
- 静态托管环境通常更适合 `trailingSlash: true`（目录 + `index.html`）。

## 3. 发布产物（最终站点目录结构）

以 Next 导出目录（`out/`）为基础，合并其它模块后上传到 Pages。

- 站点根：Next 导出产物
- 子应用/幻灯片静态资源：统一放在 `static/` 下，避免与门户路由冲突

## 4. 路由与文件映射（避免冲突的核心设计）

> 关键点：**门户路由**（Next 生成的 HTML）与 **真实静态站**（子应用构建产物）必须放在不同路径层级，避免 `/apps/<name>/index.html` 文件名冲突。

- 门户路由：
  - `/`：门户首页
  - `/pipelines/<id>/`：流程演示页面（静态生成）
  - `/apps/<slug>/`：子应用入口页（门户 wrapper：说明 + iframe/跳转）
  - `/slides/ngs-vs-tgs/`：幻灯片入口页（门户 wrapper：说明 + iframe/跳转）

- 真实静态站资源：
  - `/static/apps/<app>/...`：各 apps 的静态资源与入口（`index.html`）
  - `/static/slides/ngs-vs-tgs/...`：slides 静态站

建议映射表：

| 用户访问路径 | 类型 | 实际承载内容 |
|---|---|---|
| `/` | Next 页面 | 门户首页 |
| `/pipelines/wes-germline/` 等 | Next 页面 | 流程演示 |
| `/apps/bwa-algorithm-viz/` | Next 页面 | wrapper（iframe/跳转到 static） |
| `/static/apps/bwa-algorithm-viz/index.html` | 静态文件 | 真实子应用 |
| `/slides/ngs-vs-tgs/` | Next 页面 | wrapper（iframe/跳转到 static） |
| `/static/slides/ngs-vs-tgs/index.html` | 静态文件 | 真实 slides |

## 5. Next.js 配置设计（`apps/bioinfo-pipeline-web`）

### 5.1 必须项

- `output: 'export'`
- `trailingSlash: true`
- `images: { unoptimized: true }`（静态环境不做图片优化）
- `basePath` / `assetPrefix`：由环境变量注入（仅生产构建启用）

### 5.2 禁止项

- 禁止 `src/app/api/**`（静态导出不支持 Route Handlers）

### 5.3 动态路由静态化

为以下动态路由提供 `generateStaticParams()`：

- `src/app/pipelines/[id]/page.tsx`：从 `pipelineTemplates` 生成固定 params
- `src/app/apps/[slug]/page.tsx`：从已知子应用 slug 列表生成固定 params

## 6. 数据层设计（去 API 化）

### 6.1 目标

让流程演示页面在静态站点中 **不依赖** `/api/pipelines/*`。

### 6.2 策略

- 默认：直接使用本地 `pipeline-presets`（`buildPipelineRun(id)`）在浏览器端构造演示数据。
- 可选：若设置 `NEXT_PUBLIC_PIPELINE_API_BASE_URL`，则在浏览器端直接请求远端真实后端（同样是静态可行）。

## 7. 子应用与 Slides 的集成方式

- 门户页面 `/apps/<slug>/`：
  - 推荐 iframe 内嵌 `/static/apps/<slug>/index.html`
  - 同时提供“新标签打开”链接

- 门户页面 `/slides/ngs-vs-tgs/`：
  - 推荐 iframe 内嵌 `/static/slides/ngs-vs-tgs/index.html`

## 8. GitHub Actions Pages 工作流设计

核心目标：把 `apps/bioinfo-pipeline-web/out` 作为站点根目录，并在其下合并其它模块产物。

建议流程：

1. `npm ci`
2. 构建 Vite apps：
   - `gatk-run-dashboard` → `dist/`
   - `genome-align-viz` → `dist/`
3. 构建 Next 门户（静态导出）：
   - 在 Actions 中计算 `NEXT_PUBLIC_BASE_PATH=/<repo>`
   - `npm run -w bioinfo-pipeline-web build`
4. 组装最终发布目录 `pages/`：
   - `pages/` ← `apps/bioinfo-pipeline-web/out/*`
   - `pages/static/apps/*` ← 各静态 apps 源目录
   - `pages/static/apps/gatk-run-dashboard/*` ← `apps/gatk-run-dashboard/dist/*`
   - `pages/static/apps/genome-align-viz/*` ← `apps/genome-align-viz/dist/*`
   - `pages/static/slides/ngs-vs-tgs/*` ← `slides/ngs-vs-tgs/*`
   - `pages/.nojekyll`

## 9. 实施顺序（强约束依赖）

1. 移除/迁移 `src/app/api/**`
2. Next 配置切换到 `output: 'export'` + `basePath`
3. 动态路由补齐 `generateStaticParams()`
4. 流程数据获取去 `/api`（改为本地 presets / 远端直连）
5. 路由冲突修复（apps/slides 采用 wrapper + `/static/...`）
6. 更新 Pages workflow 产物组装
7. 本地验证：build/export + 资源路径

## 10. 验收标准

- Pages 上访问 `/<basePath>/` 正常显示门户首页。
- `/<basePath>/pipelines/wes-germline/` 等页面可打开，且不请求 `/<basePath>/api/*`。
- `/<basePath>/apps/<slug>/` 可加载对应 `/static/apps/<slug>/index.html`。
- `/<basePath>/slides/ngs-vs-tgs/` 可加载对应 `/static/slides/ngs-vs-tgs/index.html`。
