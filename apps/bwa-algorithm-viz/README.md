# BWA Algorithm Visualization

一个纯前端的教学型可视化项目，通过交互式动画和图形解释 BWA 系列算法（FM-index、SMEM、Chaining、SW+Z-drop、MAPQ 等）中的关键过程。项目基于原生 HTML/CSS/JavaScript，可以直接本地打开使用，适合作为研读 BWA/MEM 工作流程的辅助材料。

## 功能特性

- **FM-index 基础流程**：展示参考序列、后缀数组、BWT、C 表、Occ 表，以及回溯搜索步骤。
- **SMEM 种子演示**：动态高亮模式串上的 SMEM 区间，支持反向互补（RC）与再播种（Reseed）策略。
- **Chaining 可视化**：绘制候选种子、最佳链与次优链，可查看链式评分的窗口、对角松弛与重叠惩罚效果，并支持导出 PNG。
- **带状 Smith-Waterman**：根据参数绘制带状 SW DP 矩阵、Z-drop 触发点及最优路径，可导出 PNG。
- **MAPQ 示意**：提供分差、重复惩罚、配对一致性的权重滑条，并通过柱状图展示各项贡献及最终 MAPQ 估计。
- **日志与步骤控制**：逐步播放/暂停/单步执行回溯流程，实时记录关键事件。

## 快速开始

方式一：直接打开 `index.html`（建议使用 Chrome/Edge）。

方式二：本地静态服务器（推荐）

```bash
npm run dev   # 使用 npx serve 在本目录启动，默认 http://localhost:5171
```

打开页面后，在左上角输入参考序列与读段，点击“生成步骤”即可查看各类可视化。

> 本项目为静态站点，不需要构建/打包或额外依赖。若需部署到 GitHub Pages，可直接推送到 `gh-pages` 分支或启用主分支静态托管。

## 参数面板说明

左侧“高级参数”面板可调整以下选项（应用后会联动所有可视化）：

- `minSeed`, `maxOcc`: SMEM 播种与出现次数阈值。
- `chainWin`, `diagSlack`, `overlapPenalty`: 链式窗口、对角松弛与重叠惩罚。
- `gapOpen`, `gapExtend`: 链式评分中的 gap 开销。
- `swBand`, `zdrop`: 带状 SW 的带宽以及 Z-drop 阈值。
- `反向互补(RC)`, `再播种`: 是否引入 RC 种子以及对高重复长种子的再播种切分。

## 目录结构

```
apps/bwa-algorithm-viz/
├── index.html       # 页面结构与静态文案
├── styles.css       # 主题样式与布局
├── app.js           # 核心逻辑、可视化绘制与交互控制
├── README.md        # 当前文档
├── .gitignore
└── .gitattributes
```

## 开发与贡献

- 若需调试，可使用任意静态服务器（如 `npx serve`、VS Code Live Server）。
- 所有文件使用 LF 换行，推荐在提交前运行格式化工具（例如 Prettier）。
- 欢迎通过 Issue/PR 提交建议或改进，包括：
  - 更精细的 Chaining 评分展示与交互。
  - SMEM 动画、RC 标识细化。
  - MAPQ 计算示意的扩展曲线。
  - 性能优化（大规模序列下的虚拟滚动/抽样）。

## 许可证

本项目遵循仓库根目录的 LICENSE（MIT）。如含第三方依赖，请同时遵循其许可证要求。
