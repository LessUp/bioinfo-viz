# Contributing to Bioinfo Visualizer

感谢你对 Bioinfo Visualizer 项目的关注！我们欢迎各种形式的贡献。

## 开发环境设置

### 前置要求

- Node.js >= 20
- npm >= 10

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/bioinfo-visualizer.git
cd bioinfo-visualizer

# 安装依赖
npm ci

# 启动开发服务器（选择一个应用）
npm run dev:bioinfo   # Next.js 应用
npm run dev:gatk      # GATK Dashboard
npm run dev:align     # Genome Align Viz
npm run dev:sw        # Smith-Waterman Viz
```

## 项目结构

```
bioinfo-visualizer/
├── apps/                    # 前端应用
│   ├── bioinfo-pipeline-web/   # Next.js 全流程示例
│   ├── gatk-run-dashboard/     # Vite+React 仪表板
│   ├── genome-align-viz/       # Vite+React 比对可视化
│   ├── smith-waterman-viz/     # 静态 SW/NW 算法演示
│   ├── picard-workflow-spa/    # 静态 Picard 流程
│   ├── bwa-algorithm-viz/      # 静态 BWA 算法演示
│   ├── arith-compress-viz/     # 静态算术编码演示
│   └── debruijn-viz/           # 静态 De Bruijn 图演示
├── docs/                    # 文档
├── slides/                  # 讲稿
└── package.json             # 根 workspace 配置
```

## 开发工作流

### 代码风格

- 使用 Prettier 格式化代码
- 使用 ESLint 检查代码质量
- TypeScript 应用需要通过类型检查

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check

# 运行 lint
npm run lint:all

# 类型检查
npm run typecheck:all
```

### 测试

```bash
# 运行所有测试
npm run test:all

# 运行特定应用的测试
npm run -w gatk-run-dashboard test
npm run -w genome-align-viz test
npm run -w smith-waterman-viz test
npm run -w bioinfo-pipeline-web test
```

### CI 检查

在提交 PR 之前，请确保本地 CI 检查通过：

```bash
npm run ci
```

这将运行：

1. 格式检查
2. Lint 检查
3. 类型检查
4. 单元测试
5. 构建验证

## 提交规范

我们建议使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```
feat(gatk-dashboard): add timeline zoom controls

fix(genome-align-viz): fix SSE reconnection logic

docs(readme): update quick start guide
```

## Pull Request 流程

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### PR 检查清单

- [ ] 代码通过 `npm run ci`
- [ ] 新功能有对应的测试
- [ ] 文档已更新（如需要）
- [ ] PR 描述清晰说明了更改内容

## 报告问题

如果你发现 bug 或有功能建议，请创建 Issue：

1. 检查是否已有相关 Issue
2. 使用清晰的标题描述问题
3. 提供复现步骤（如果是 bug）
4. 说明期望行为和实际行为

## 应用开发指南

### 静态应用 (picard-workflow-spa, bwa-algorithm-viz, etc.)

- 纯 HTML/CSS/JavaScript
- 使用 `serve` 作为开发服务器
- ESLint 配置在 `eslint.config.mjs`

### Vite+React 应用 (gatk-run-dashboard, genome-align-viz)

- TypeScript + React
- Vitest 测试框架
- Tailwind CSS 样式

### Next.js 应用 (bioinfo-pipeline-web)

- TypeScript + React
- App Router
- 静态导出模式
- Playwright E2E 测试

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。
