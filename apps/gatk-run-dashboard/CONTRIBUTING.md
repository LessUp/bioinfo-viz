# 贡献指南

感谢参与本项目！以下约定有助于我们保持一致的开发流程与高质量代码。

开发流程
- 建议使用 Git 分支开发：`feature/<topic>`、`fix/<topic>`、`docs/<topic>`
- 提交信息遵循 Conventional Commits：
  - feat: 新功能
  - fix: 修复缺陷
  - docs: 文档更新
  - refactor: 重构（无功能变动）
  - perf: 性能优化
  - chore: 其它杂项
- 提交前请本地自测：
  - `npm run typecheck`
  - `npm run build`

代码风格
- TypeScript 严格模式（参考 tsconfig）
- 组件：函数式组件 + hooks，避免类组件
- 状态：使用 Zustand，避免在多个无关组件中重复拉取数据
- 样式：TailwindCSS 优先，避免内联 style（除非图表或布局需要）
- 文档：必要处添加注释与类型定义；公共模块需在 docs/ 中有简述

提交与合并
- 单次提交粒度宜小，确保可测试与可回滚
- PR 描述需要包含：改动目的、主要变更点、测试要点、相关截图（如 UI）

安全与隐私
- 不要提交任何真实密钥、令牌、账号密码
- `.env*` 文件默认被忽略；使用 `.env.example` 提供示例

发布与版本
- 遵循 semver；标签格式 `vX.Y.Z`
- 变更需在 PR 或 Release Note 中列明 Breaking Changes
