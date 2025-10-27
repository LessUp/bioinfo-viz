# Bioinfo Visualizer

一个面向生物信息学教学与演示的可视化项目集合，包含工作流面板、算法可视化与全流程示例应用。已统一为 apps/docs/slides 的目录布局并适配开源发布。

## 目录结构

```
.
├─ apps/                         # 可运行的前端应用
│  ├─ picard-workflow-spa/       # Picard 分析流程可视化（纯静态单页）
│  ├─ bioinfo-pipeline-web/      # 基因分析全流程示例（Next.js）
│  ├─ bwa-algorithm-viz/         # BWA 算法教学可视化（静态站点）
│  ├─ gatk-run-dashboard/        # GATK/Cromwell 运行监控仪表板（Vite+React）
│  ├─ genome-align-viz/          # 基因比对动态可视化（Vite+React）
│  └─ arith-compress-viz/        # 算术编码演示（静态站点）
├─ docs/
│  └─ ngs-analysis-guide.md      # NGS 分析指南（迁移自 NGS-gene/docs）
├─ slides/
│  └─ ngs-vs-tgs/                # NGS vs TGS 讲稿（静态页面）
├─ .gitignore
├─ .gitattributes
├─ LICENSE
└─ README.md
```

## 快速开始

- 静态应用（可直接打开 index.html）：
  - `apps/picard-workflow-spa`
  - `apps/bwa-algorithm-viz`
  - `apps/arith-compress-viz`
  - `slides/ngs-vs-tgs`
  - 可选：本地静态服务 `npx serve .` 或 `python -m http.server 8000`

- Next.js 应用：
  - `apps/bioinfo-pipeline-web`
  - ```bash
    cd apps/bioinfo-pipeline-web
    npm i
    npm run dev   # http://localhost:3000
    ```

- Vite + React 应用：
  - `apps/gatk-run-dashboard`
  - `apps/genome-align-viz`
  - ```bash
    cd apps/gatk-run-dashboard # 或 genome-align-viz
    npm i
    npm run dev   # 默认 5173/5174 端口
    ```

## 模块简介

- picard-workflow-spa：Mermaid 流程图 + 步骤详情 + 参数占位符 + 一键导出脚本
- bioinfo-pipeline-web：全流程可视化与 Mock API，适合作为产品化原型
- bwa-algorithm-viz：FM-index/SMEM/Chaining/SW+Z-drop/MAPQ 的交互式演示
- gatk-run-dashboard：DAG/时间轴/详情抽屉/代理与鉴权/报告导出
- genome-align-viz：时间线、对齐画布、覆盖度轨、变异面板、教学提示
- arith-compress-viz：算术编码的区间缩放与编码过程演示

## 开发建议

- Node 版本：建议 >= 18
- 代码风格：推荐使用 VS Code + Prettier（未强制）
- 行尾与文本：已通过 `.gitattributes` 统一（脚本类按平台设定 eol）
- 提交规范：建议遵循 Conventional Commits（可在后续引入）

## 贡献

欢迎提交 Issue/PR。请在对应子模块目录阅读其 `README.md` 获取更多使用说明与脚本。

## 许可证

本仓库默认使用 MIT 许可证（见根目录 LICENSE）。如某些子模块另有许可证或第三方依赖限制，请以其目录下说明为准。
