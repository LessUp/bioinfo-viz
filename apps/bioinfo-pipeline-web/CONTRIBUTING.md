# 贡献指南

感谢你对本项目的关注与贡献！

## 开发环境
- Node.js 18+/20+（建议 20）
- npm 9+

```bash
npm i
npm run dev
# 打开 http://localhost:3000
```

## 提交规范
- 分支：`feat/*`、`fix/*`、`docs/*`、`chore/*`
- 提交信息（建议）：`<type>(scope): message`
  - type：feat | fix | docs | chore | refactor | test | style | ci

## 代码质量
- Lint：`npm run lint`
- 自动修复：`npm run lint:fix`
- 类型检查：`npm run typecheck`
- 构建：`npm run build`

## 提交流程
1. Fork 仓库并创建分支
2. 完成修改与自测（含 lint、typecheck）
3. 提交 PR，关联 Issue，填写变更说明与截图/动图（如有）
4. 通过 CI 检查与代码评审

## 行为准则
请遵循 CODE_OF_CONDUCT 中的约定。
