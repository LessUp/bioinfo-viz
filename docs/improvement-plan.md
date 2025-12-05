# Bioinfo Visualizer 改进与修复建议

> 本文档根据当前仓库代码、配置与 ROADMAP 现状整理，主要聚焦于工程结构、依赖管理、测试与 CI、以及各子应用集成的改进建议。

---

## 1. 仓库整体（Root）

### 1.1 工作区与子项目集成

- **问题：`smith-waterman-viz` 未纳入 workspaces 与统一脚本**
  - 现状：
    - 存在 `apps/smith-waterman-viz/` 目录，包含 `index.html`、`app.js`、`core.js`、`styles.css` 以及 `tests/core.test.js`（Vitest 风格测试）。
    - 但缺少 `package.json`，也没有加入根 `package.json` 的 `workspaces`，无法通过 npm 脚本统一管理。
  - 建议：
    - 在 `apps/smith-waterman-viz/` 下新增最小 `package.json`：
      - `name`: `"smith-waterman-viz"`
      - `scripts.dev`: 使用 `npx serve -l <port> .` 或引入 Vite（如需更复杂开发体验）。
      - `scripts.test`: `vitest`，复用根依赖或本地依赖。
    - 将 `"apps/smith-waterman-viz"` 加入根 `package.json` 的 `workspaces` 数组。
    - 在根 `package.json` 中新增类似 `"dev:sw"` 的脚本，方便快速启动：
      - `"dev:sw": "npm run -w smith-waterman-viz dev"`。
    - 在根 `"test:all"` 中加入 `smith-waterman-viz` 的测试脚本（如果后续为该模块配置 Vitest）。

### 1.2 锁文件与包管理规范

- **问题：锁文件分散，容易产生歧义**
  - 现状：
    - 根目录有 `package-lock.json`，每个主要 app（`bioinfo-pipeline-web`、`gatk-run-dashboard`、`genome-align-viz`）目录下也各自存在 `package-lock.json`。
  - 风险：
    - 对于 npm workspaces，一般推荐只保留根锁文件，由根 `npm i` 统一管理所有 workspace 依赖。
    - 子目录多份锁文件可能与根锁不一致，导致“到底以谁为准”的困惑，也增加依赖不一致的风险。
  - 建议：
    - 明确约定：本仓库统一使用 **npm + 根锁文件** 管理依赖。
    - 清理各子 app 下多余的 `package-lock.json`，仅保留根目录的锁文件：
      - 保留：`/package-lock.json`（根）。
      - 删除：`/apps/*/package-lock.json`。
    - 在贡献文档或 README 中说明：
      - 推荐使用的包管理器（npm）。
      - 安装依赖时统一在根目录执行 `npm i`。

### 1.3 CI 与 GitHub Pages 分工

- **问题：当前仅有 Pages 发布流程，缺少独立的质量 CI**
  - 现状：
    - `.github/workflows/pages.yml` 会在 push/main 时：
      - 安装依赖 → 构建 Vite apps → 复制静态文件 → 发布到 GitHub Pages。
    - 根 `package.json` 已提供：
      - `"format:check": "npx prettier . -c"`
      - `"lint:all": "npm run -w bioinfo-pipeline-web lint"`
      - `"test:all": "npm run -w bioinfo-pipeline-web test && npm run -w gatk-run-dashboard test && npm run -w genome-align-viz test"`
      - `"ci": "npm run format:check && npm run lint:all && npm run test:all"`
    - 但目前没有单独的 CI Workflow 调用上述 `ci` 脚本。
  - 建议：
    - 新增 `.github/workflows/ci.yml`，用于 PR / push 的质量检查：
      - 触发条件：
        - `pull_request` 到主分支。
        - `push` 到主分支。
      - 主要步骤：
        - `npm i` 安装依赖（利用 `actions/setup-node` + npm cache）。
        - 执行 `npm run ci`，即格式检查 + lint + 所有 tests。
    - 保持现有 `pages.yml` 专注于发布静态站点，两者职责分离：
      - `ci.yml`：质量保障。
      - `pages.yml`：打包和部署 GitHub Pages。

### 1.4 依赖版本统一与简化

- **问题：React / Next / Vite 版本不统一，个别依赖可能冗余**
  - 现状示例：
    - `apps/bioinfo-pipeline-web/package.json`
      - `next: "16.0.0"`
      - `react: "19.2.0"`
      - `react-dom: "19.2.0"`
      - `vite: "7.2.4"`（出现在 `dependencies` 中）。
    - `apps/gatk-run-dashboard/package.json`
      - `react: "^18.2.0"`
      - `react-dom: "^18.2.0"`
      - `vite: "^7.2.4"`。
    - `apps/genome-align-viz/package.json`
      - `react: "^18.3.1"`
      - `react-dom: "^18.3.1"`。
  - 问题点：
    - 不同 app 使用不同版本的 React/ReactDOM，将来抽公共组件或统一 UI 库会增加维护成本。
    - `bioinfo-pipeline-web` 本质上是 Next 应用，Vite 不一定是必需依赖；将 Vite 放在 `dependencies` 中可能是模板残留。
  - 建议：
    - 明确一个统一策略：
      - 以某个 React 主版本为基准（例如 18.x 或 19.x），将各 app 的 React 版本尽可能对齐。
      - 对照 Next 官方兼容性确认 React/ReactDOM 版本区间。
    - 对 `bioinfo-pipeline-web`：
      - 分析代码是否真实使用 Vite；如未使用，可考虑移除 `vite` 依赖，简化依赖树。
      - 至少应将 `vite` 移到 `devDependencies`，避免在生产环境中被错误安装。

---

## 2. 测试与质量保障

### 2.1 测试覆盖情况与增强方向

- **现有测试情况概览：**
  - `apps/bioinfo-pipeline-web`：
    - 使用 Vitest + jsdom。
    - 已有针对 `RealBackendDataSource` 与 `getPipelineDataSource` 的单元测试（`PipelineDataSource.test.ts`），涵盖认证 header、404 处理与错误分支，质量较好。
  - `apps/gatk-run-dashboard`：
    - 使用 Vitest，当前仅有一个非常简单的 `smoke.test.ts`。
  - `apps/genome-align-viz`：
    - 使用 Vitest，亦只有 `smoke.test.ts`，验证框架基本可跑。
  - `apps/smith-waterman-viz`：
    - `tests/core.test.js` 使用 Vitest 风格，覆盖 DP 构建与 traceback（SW/NW、空输入等场景）。
    - 尚未通过 workspace 与统一脚本纳入 CI。
  - 静态应用 `picard-workflow-spa`、`bwa-algorithm-viz`、`arith-compress-viz` 和 `slides/ngs-vs-tgs`：
    - 暂无自动化测试，仅依赖手动验证。

- **改进建议（分阶段推进）：**
  - 第一阶段（快速收益）：
    - 将 `smith-waterman-viz` 纳入 workspace（见 1.1），使其单元测试可由根 `test:all` 统一执行。
    - 在 `gatk-run-dashboard` 与 `genome-align-viz` 中增加针对核心逻辑的单元测试：
      - `gatk-run-dashboard`：
        - 针对 Cromwell/Nextflow/Snakemake 数据适配逻辑（如存在 `normalizeCromwell` 等函数）补充测试。
        - 针对 Zustand store 的核心状态迁移逻辑编写测试用例。
      - `genome-align-viz`：
        - 针对覆盖度计算、时间线状态推进等纯函数逻辑进行测试。
  - 第二阶段（配合 ROADMAP）：
    - 根据 `ROADMAP.md` 中提到的重点模块，为：
      - 算法可视化（BWA/Smith-Waterman/算术编码）。
      - 数据流/适配层（Pipeline、运行监控、流式可视化）。
      - 覆盖度轨/聚合逻辑。
      - 逐步增加更全面的单元测试与少量 E2E 测试。

### 2.2 Lint 与代码风格统一

- **现状：**
  - `bioinfo-pipeline-web`：
    - 使用 `eslint` + `eslint-config-next`，并在根脚本中作为 `lint:all` 的主要目标。
  - `gatk-run-dashboard`、`genome-align-viz`：
    - 尚未看到独立的 ESLint 配置与 `lint` 脚本，可能仅依赖编辑器提示或手动检查。

- **建议：**
  - 为 Vite+React 项目补充最小 ESLint 配置：
    - 使用 `@vitejs/plugin-react` + 推荐的 React/TypeScript ESLint 规则集。
    - 在各自 `package.json` 中增加：
      - `"lint": "eslint src --ext .ts,.tsx"`
  - 更新根 `lint:all`：
    - 由仅 lint Next 项目扩展为串行或并行 lint 所有 React/TS 项目：
      - `bioinfo-pipeline-web`
      - `gatk-run-dashboard`
      - `genome-align-viz`
    - 如有需要，可以为静态应用中的 JS 也增加轻量 lint（可选）。

---

## 3. 子应用与导航一致性

### 3.1 导航与 README 的完整性

- **问题：`smith-waterman-viz` 未出现在 README 与根入口页**
  - 虽然 `apps/smith-waterman-viz` 已实现核心算法与可视化，但当前：
    - `README.md` 中的模块列表未包含该应用。
    - `.github/workflows/pages.yml` 生成的根 `pages/index.html` 也未展示 `smith-waterman-viz` 的入口卡片。

- **建议：**
  - README 更新：
    - 在「目录结构」和「模块简介」中增加 `smith-waterman-viz` 项：
      - 说明其用于 Smith-Waterman / Needleman-Wunsch 等比对算法的教学可视化。
  - Pages 入口更新：
    - 在 `pages/index.html` 生成逻辑中，新增一个卡片：
      - 标题：例如 "Smith-Waterman Viz" 或 "Alignment Algorithm Viz"。
      - 链接指向 `./apps/smith-waterman-viz/index.html`。
  - 可选：
    - 在 `bioinfo-pipeline-web` 的学习路径或相关页面中，加入跳转到 `smith-waterman-viz` 的链接，实现教学路线的联动。

### 3.2 文档与 Slides 的统一体验

- **现状：**
  - `docs/ngs-analysis-guide.md` 为 Markdown 文档，适合作为分析流程文本说明。
  - `slides/ngs-vs-tgs` 为静态页面（讲稿），在 Pages 中以静态站方式提供。

- **可选优化方向：**
  - 如果希望统一为一个文档站：
    - 可以考虑在后续引入轻量文档框架（如 Docusaurus/VitePress 等），将 `docs/` 与 `slides/` 纳入统一导航。
  - 若保持当前轻量模式：
    - 建议在根 README 增加一小节 "文档与 Slides 导航"：
      - 指向 `docs/ngs-analysis-guide.md`（GitHub 原生查看）。
      - 指向 `slides/ngs-vs-tgs` 对应的 Pages URL。

---

## 4. 推荐的实施优先级

综合当前代码与 Roadmap，建议按以下顺序推进：

1. **工程与 CI 基础**
   - 将 `smith-waterman-viz` 纳入 workspaces 与测试体系。
   - 统一锁文件管理（只保留根锁）。
   - 新增 `.github/workflows/ci.yml`，利用现有 `npm run ci` 完成格式 + lint + 测试。

2. **依赖与 Lint 统一**
   - 统一 React/ReactDOM 版本策略（根据 Next 支持范围选择主版本）。
   - 清理 `bioinfo-pipeline-web` 中不必要的依赖（如未用到的 Vite）。
   - 为 Vite 项目增加 ESLint 脚本，并扩展根 `lint:all`。

3. **测试覆盖与教学体验**
   - 扩充 `gatk-run-dashboard`、`genome-align-viz`、`smith-waterman-viz` 的核心逻辑测试。
   - 在 README、Pages 入口页以及 `bioinfo-pipeline-web` 中，补全各模块的导航与教学路径链接。

> 后续如果你确定了具体的优先顺序，可以在对应子模块目录添加更细致的 TODO 列表或 ISSUE，我也可以基于本文件继续细化为更具体的实现步骤（包括 `package.json`、workflow、测试用例示例等）。
