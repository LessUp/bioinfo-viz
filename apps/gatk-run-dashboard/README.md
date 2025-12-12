# GATK Workflow Dashboard

基于 React + Vite + Tailwind + React Flow + ECharts + Zustand 的工作流可视化与运行监控面板。

功能特性

- DAG 视图：自动布局（Dagre）、阶段分列、节点/上下游高亮、MiniMap/Controls、过滤后悬空边隐藏
- 分组折叠：Scatter 分组折叠、子工作流（Cromwell fqname 前缀）分组折叠
- 时间轴视图：Tooltip、数据缩放、渐进渲染、大规模行窗口、点击跳转详情
- 详情抽屉：步骤参数/输入/输出、日志在线查看、工件链接自动提取
- 数据源：Cromwell（支持鉴权与代理）、Nextflow（trace.tsv 导入）、Snakemake（JSON 导入）
- 导出：时间轴 PNG、运行 JSON、报告 PDF（整合 DAG 与时间轴截图）

技术栈

- React 18 + TypeScript + Vite
- TailwindCSS 3
- React Flow 11（DAG）
- ECharts 5（时间轴）
- Zustand（状态）
- Dagre（DAG 自动布局）
- html-to-image + jsPDF（报告导出）

快速开始

- 环境准备：Node.js >= 18
- 安装依赖：
  ```bash
  npm i
  ```
- 开发启动（默认端口 5176）：
  ```bash
  npm run dev
  ```
- 生产构建与预览（预览默认端口 5177）：
  ```bash
  npm run build
  npm run preview
  ```

开发代理与环境变量

- 开发时通过 Vite 代理解决 Cromwell CORS：`/cromwell -> VITE_CROMWELL_PROXY_TARGET`
- 配置文件：`.env.development`
  ```env
  VITE_CROMWELL_PROXY_TARGET=http://localhost:8000
  ```
- 生产环境请自行配置网关或反向代理。

使用说明

1. 页头输入 Cromwell 基地址与 `workflowId`，勾选“使用开发代理”时可直接填 `/cromwell`。
2. 如需鉴权，开启“鉴权”，填入 Header Key/Value（例如 `Authorization: Bearer <token>`）。
3. 选择视图（DAG/时间轴），Filters 面板可按状态筛选，并可开关 Scatter/子工作流分组折叠。
4. 详情抽屉可查看参数/输入/输出/日志，工件列表会从 outputs 自动提取 URL/常见文件后缀。
5. 导出：
   - 时间轴 PNG：页头按钮
   - 运行 JSON：页头按钮
   - 报告 PDF：页头按钮，自动包含 DAG 与时间轴截图
6. 导入其它引擎：
   - Nextflow：选择 trace.tsv 导入
   - Snakemake：选择元数据 JSON 导入

代码结构

- `src/components`：视图与 UI 组件（RunHeader、Filters、DAGView、TimelineView、StepDrawer）
- `src/store`：Zustand 全局状态（运行数据、筛选、刷新、鉴权等）
- `src/adapters`：不同引擎的元数据解析/归一化（Cromwell/Nextflow/Snakemake）
- `src/utils`：辅助工具（报告导出等）
- `src/mock`：示例数据

约定与数据模型

- 统一模型 `Run/Step/Edge`（参见 `src/store/runStore.ts`）
- Cromwell 正常化（`normalizeCromwell`）会尽可能映射 `inputs/outputs/runtimeAttributes`、`fqname`、`attempt`、`scatterIndex` 等

常见问题

- 代理 502 或 CORS：检查 `.env.development` 中 `VITE_CROMWELL_PROXY_TARGET`，确认 Cromwell 可访问
- 无法导出 PDF：确保在浏览器环境下使用；如跨域图片资源会被拒绝，建议走同源代理
- 大数据量卡顿：时间轴已窗口化；DAG 建议开启分组折叠，减少节点/边数量

许可证

- 本项目遵循仓库根目录的 LICENSE（MIT）。如含第三方依赖，请同时遵循其许可证要求。
