# 2025-12-15 bioinfo-pipeline-web fixes

## 变更摘要

- 修复学习路径进度在空步骤列表时可能出现 `NaN/Infinity` 的问题。
- 修复 Mermaid 图渲染在空输入与渲染 ID 含特殊字符时可能失败的问题，并统一错误提示为中文且包含具体原因。

## 影响范围

- apps/bioinfo-pipeline-web/src/components/learning/LearningPathPlanner.tsx
- apps/bioinfo-pipeline-web/src/components/ui/MermaidDiagram.tsx

## 兼容性说明

- 仅为运行时防护与展示层修复，不改变现有数据结构与 API。
