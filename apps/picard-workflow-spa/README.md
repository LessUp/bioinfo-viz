# Picard 分析流程可视化

一个零依赖、可直接打开的前端单页，用于可视化与操作 Picard 的基因测序分析流程（WGS/WES/RNA）。内置 Mermaid 流程图、步骤详情与命令示例、参数占位符面板、步骤选择、一键复制/导出脚本（.sh/.cmd/.ps1）、配置导入导出，以及导出流程图 SVG/PNG。

## 亮点功能
- 流程切换：WGS / WES / RNA
- 流程图交互：点击节点联动右侧步骤详情
- 参数占位符：在面板中配置 `${REFERENCE}` 等，实时替换示例命令
- 命令前缀：切换 `picard` / `java -jar picard.jar` / `gatk`
- 为值加引号：含空格/特殊字符的值自动加引号
- 步骤选择：全选/全不选/计数，导出脚本仅包含勾选步骤
- 一键复制/导出脚本：.sh（Linux/Mac）、.cmd（Windows CMD）、.ps1（PowerShell）
- 配置导入/导出：保存/恢复 workflow 与参数
- 导出流程图：SVG 与 PNG
- 本地持久化：自动保存参数/步骤/流程/前缀/引号设置

## 快速开始
- 方式一：双击打开 `index.html`（建议使用 Chrome/Edge）
- 方式二：本地静态服务（任选其一）
  - Python: `python -m http.server 8000`
  - Node: `npx serve .` 或 `npx http-server .`
  - 打开浏览器访问 `http://localhost:8000`（或命令输出地址）

## 使用指南
- 顶部切换 WGS/WES/RNA
- 左侧流程图点击任一节点，右侧显示步骤说明与命令
- 右侧“参数配置”：
  - 编辑占位符值，如 `REFERENCE`、`DEDUP_BAM` 等
  - 选择命令前缀（picard/java/gatk）与“为值加引号”开关
  - 重置参数恢复默认
- 右侧“步骤选择”：勾选要导出的步骤（支持全选/全不选/计数）
- 顶部工具：复制全流程/导出脚本（.sh/.cmd/.ps1）/导出 SVG/PNG/导入导出配置

## 参数占位符（示例）
- REFERENCE, DICT_OUT
- ALIGNED_BAM, RG_BAM, SORTED_BAM, DEDUP_BAM, DEDUP_METRICS
- ALIGN_SUMMARY, WGS_METRICS, GC_BIAS_TXT, GC_BIAS_PDF, GC_SUMMARY
- INSERT_METRICS, INSERT_HIST, HS_METRICS, BAIT_INTERVALS, TARGET_INTERVALS
- RNA_METRICS, REF_FLAT, RRNA_INTERVALS
- RGID, RGLB, RGPL, RGPU, RGSM

以上占位符将替换命令中的 `${PLACEHOLDER}`。可在右侧面板修改并实时生效。

## 导出说明
- .sh：自动添加 `#!/usr/bin/env bash` 与 `set -euo pipefail`
- .cmd：自动合并 bash 续行符（`\`）为同一行，使用 Windows 换行
- .ps1：PowerShell 脚本，每行一条命令
- 复制全流程/导出脚本会：
  - 仅包含被勾选的步骤
  - 校验所有被选步骤参数是否齐备（未填则禁用导出/复制）

## 配置导入导出
- 导出配置：生成包含 `workflow`、`params`、`included`、`runner`、`quoteValues` 的 JSON
- 导入配置：从 JSON 恢复同上内容
- 本地持久化：自动写入浏览器 localStorage，无需手动保存

## 工作流与步骤（概览）
- WGS：CreateSequenceDictionary → AddOrReplaceReadGroups → SortSam → MarkDuplicates → BuildBamIndex → ValidateSamFile → 统计（CollectAlignmentSummaryMetrics / CollectWgsMetrics / CollectGcBiasMetrics / CollectInsertSizeMetrics）
- WES：在 WGS 基础上使用 CollectHsMetrics
- RNA：在 WGS 基础上使用 CollectRnaSeqMetrics（比对通常由 STAR 等完成）

详细说明见 `docs/WORKFLOWS.md`。

## 目录结构
```
.
├─ index.html                  # 单页应用（可直接打开）
├─ README.md                   # 项目说明
├─ LICENSE                     # 许可证（MIT）
├─ .gitignore                  # Git 忽略配置
├─ .editorconfig               # 编辑器一致性配置
├─ CHANGELOG.md                # 变更日志
├─ CONTRIBUTING.md             # 贡献指南
├─ CODE_OF_CONDUCT.md          # 行为准则
├─ SECURITY.md                 # 安全策略
├─ docs/                       # 文档
│  ├─ USAGE.md
│  ├─ CONFIGURATION.md
│  ├─ WORKFLOWS.md
│  └─ DEPLOY.md
├─ examples/
│  └─ picard-config.json       # 配置示例
└─ .github/
   ├─ ISSUE_TEMPLATE/
   │  ├─ bug_report.md
   │  └─ feature_request.md
   └─ pull_request_template.md
```

## 部署到 GitHub Pages
1. 新建 GitHub 仓库并推送此项目文件
2. 打开仓库 Settings → Pages
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，目录 `/(root)`，保存
5. 几分钟后即可通过 Pages URL 访问（首页即 `index.html`）

可选：也可部署到 Netlify、Vercel 或任意静态站点托管平台。

## 浏览器兼容
- 现代浏览器（Chrome/Edge/Firefox/Safari 最新版）
- 若 file:// 下复制剪贴板受限，可手动复制命令，或使用本地静态服务器方式预览

## 许可证
本项目采用 MIT 许可证，详见 `LICENSE`。

## 致谢
- Picard 工具与 GATK 生态
- Mermaid、TailwindCSS、Alpine.js、highlight.js
