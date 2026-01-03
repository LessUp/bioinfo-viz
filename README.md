# Bioinfo Visualizer

一个面向生物信息学教学与演示的可视化项目集合，包含工作流面板、算法可视化与全流程示例应用。已统一为 apps/docs/slides 的目录布局并适配开源发布。

## 📚 文档导航

- [ROADMAP.md](./ROADMAP.md) - 项目路线图与规划
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [docs/ngs-analysis-guide.md](./docs/ngs-analysis-guide.md) - NGS 分析指南

## 🚀 应用列表

| 应用                                                 | 类型       | 描述                           | 文档                                            |
| ---------------------------------------------------- | ---------- | ------------------------------ | ----------------------------------------------- |
| [bioinfo-pipeline-web](./apps/bioinfo-pipeline-web/) | Next.js    | 基因分析全流程示例             | [README](./apps/bioinfo-pipeline-web/README.md) |
| [gatk-run-dashboard](./apps/gatk-run-dashboard/)     | Vite+React | GATK/Cromwell 运行监控仪表板   | [README](./apps/gatk-run-dashboard/README.md)   |
| [genome-align-viz](./apps/genome-align-viz/)         | Vite+React | 基因比对动态可视化             | [README](./apps/genome-align-viz/README.md)     |
| [smith-waterman-viz](./apps/smith-waterman-viz/)     | 静态       | Smith-Waterman/NW 比对算法演示 | [README](./apps/smith-waterman-viz/README.md)   |
| [picard-workflow-spa](./apps/picard-workflow-spa/)   | 静态       | Picard 分析流程可视化          | [README](./apps/picard-workflow-spa/README.md)  |
| [bwa-algorithm-viz](./apps/bwa-algorithm-viz/)       | 静态       | BWA 算法教学可视化             | [README](./apps/bwa-algorithm-viz/README.md)    |
| [arith-compress-viz](./apps/arith-compress-viz/)     | 静态       | 算术编码演示                   | [README](./apps/arith-compress-viz/README.md)   |
| [debruijn-viz](./apps/debruijn-viz/)                 | 静态       | De Bruijn 图可视化             | [README](./apps/debruijn-viz/README.md)         |

## 目录结构

```
.
├─ apps/                         # 可运行的前端应用
│  ├─ picard-workflow-spa/       # Picard 分析流程可视化（纯静态单页）
│  ├─ bioinfo-pipeline-web/      # 基因分析全流程示例（Next.js）
│  ├─ bwa-algorithm-viz/         # BWA 算法教学可视化（静态站点）
│  ├─ gatk-run-dashboard/        # GATK/Cromwell 运行监控仪表板（Vite+React）
│  ├─ genome-align-viz/          # 基因比对动态可视化（Vite+React）
│  ├─ arith-compress-viz/        # 算术编码演示（静态站点）
│  ├─ smith-waterman-viz/        # Smith-Waterman/NW 比对算法演示（静态站点）
│  └─ debruijn-viz/              # De Bruijn 图可视化（静态站点）
├─ docs/
│  └─ ngs-analysis-guide.md      # NGS 分析指南（迁移自 NGS-gene/docs）
├─ slides/
│  └─ ngs-vs-tgs/                # NGS vs TGS 讲稿（静态页面）
├─ .gitignore
├─ .gitattributes
├─ LICENSE
├─ ROADMAP.md                    # 项目路线图
├─ CONTRIBUTING.md               # 贡献指南
└─ README.md
```

## 快速开始

- 静态应用（可直接打开 index.html）：
  - `apps/picard-workflow-spa`
  - `apps/bwa-algorithm-viz`
  - `apps/arith-compress-viz`
  - `apps/smith-waterman-viz`
  - `slides/ngs-vs-tgs`
  - 可选：本地静态服务 `serve .` 或 `python -m http.server 8000`

- Next.js 应用：
  - `apps/bioinfo-pipeline-web`
  - ```bash
    npm ci
    npm run dev:bioinfo   # http://localhost:3000
    ```

- Vite + React 应用：
  - `apps/gatk-run-dashboard`
  - `apps/genome-align-viz`
  - ```bash
    npm ci
    npm run dev:gatk   # 5176 (预览 5177)
    npm run dev:align  # 5173 (预览 5174)
    ```

## 工作区脚本（根目录）

使用 npm workspaces 可以在根目录快速启动各模块的开发服务器：

- `npm run dev:picard` → apps/picard-workflow-spa（静态，端口 5170）
- `npm run dev:bwa` → apps/bwa-algorithm-viz（静态，端口 5171）
- `npm run dev:arith` → apps/arith-compress-viz（静态，端口 5172）
- `npm run dev:sw` → apps/smith-waterman-viz（静态，端口 5178）
- `npm run dev:slides` → slides/ngs-vs-tgs（静态，端口 5175）
- `npm run dev:align` → apps/genome-align-viz（Vite，端口 5173/预览 5174）
- `npm run dev:gatk` → apps/gatk-run-dashboard（Vite，端口 5176/预览 5177）
- `npm run dev:bioinfo` → apps/bioinfo-pipeline-web（Next.js，端口 3000）

## 模块简介

- picard-workflow-spa：Mermaid 流程图 + 步骤详情 + 参数占位符 + 一键导出脚本
- bioinfo-pipeline-web：全流程可视化与 Mock API，适合作为产品化原型
- bwa-algorithm-viz：FM-index/SMEM/Chaining/SW+Z-drop/MAPQ 的交互式演示
- gatk-run-dashboard：DAG/时间轴/详情抽屉/代理与鉴权/报告导出
- genome-align-viz：时间线、对齐画布、覆盖度轨、变异面板、教学提示
- arith-compress-viz：算术编码的区间缩放与编码过程演示
- smith-waterman-viz：Smith-Waterman / Needleman-Wunsch 动态规划比对过程可视化

## 开发建议

- Node 版本：建议 >= 20
- 代码风格：推荐使用 VS Code + Prettier（未强制）
- 行尾与文本：已通过 `.gitattributes` 统一（脚本类按平台设定 eol）
- 提交规范：建议遵循 Conventional Commits（可在后续引入）

## 贡献

欢迎提交 Issue/PR。详细的贡献指南请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

请在对应子模块目录阅读其 `README.md` 获取更多使用说明与脚本。

## 许可证

本仓库默认使用 MIT 许可证（见根目录 LICENSE）。如某些子模块另有许可证或第三方依赖限制，请以其目录下说明为准。

## 部署（GitHub Pages）

- 已添加工作流 `.github/workflows/pages.yml`，默认在 `main/master` 推送时打包并发布到 Pages。
- 首次启用：在 GitHub 仓库 Settings → Pages，Source 选择 GitHub Actions。
- 构建内容：
  - 静态模块与 slides 直接复制至 `pages/` 子路径。
  - Vite 模块（`gatk-run-dashboard`、`genome-align-viz`）构建后拷贝 `dist/`。
  - 根 `pages/index.html` 汇总入口，访问地址形如 `https://<user>.github.io/<repo>/`。
- 注意：如某些页面需跨域数据访问，请在本地开发模式下通过代理运行或在生产环境配置同源网关。

## 开发容器（Dev Container）

- 已提供 `.devcontainer/`（Node 20），推荐在 VS Code 中使用 Dev Containers 扩展一键打开。
- 端口已预开放：3000、5170-5177。
- 首次进入容器会自动执行 `npm i` 以安装工作区依赖。
