# Bioinfo Web

基于 Next.js + Tailwind + ECharts 的生物信息“基因分析全流程”前端示例。

- 模块：数据导入、质控(QC)、比对、去重/重校正、变异检测、注释、富集/通路、汇总报告
- 可视化：GC 含量曲线、覆盖深度分布、变异类型柱状图、Ti/Tv 仪表盘、富集气泡图
- 数据源：提供 Mock API（`/api/pipelines/[id]`），便于后续与后端联调

## 快速开始

```bash
npm i
npm run dev
# 浏览器访问 http://localhost:3000，然后点击“全流程演示”
```

## 主要脚本

- 开发：`npm run dev`
- 构建：`npm run build`
- 启动：`npm run start`
- Lint：`npm run lint` / `npm run lint:fix`
- 类型检查：`npm run typecheck`
- CI 任务：`npm run ci`

## 目录结构

```
src/
  app/
    api/pipelines/[id]/route.ts   # Mock API
    pipelines/[id]/               # 全流程页面
  components/
    charts/                       # 图表组件（ECharts）
    stage/                        # 阶段区块与概览卡
    timeline/                     # 流程时间线
    common/                       # 通用组件
  lib/                            # 工具（请求、seed）
  types/                          # 数据类型定义
```

## 数据契约

- `GET /api/pipelines/:id` → 返回 `Pipeline` 对象（样本、阶段、指标、产出物、日志）。详见 `src/types/pipeline.ts` 与 Mock 实现。

## 贡献

欢迎 Issue/PR！请先阅读：`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`。

## 许可协议

MIT，详见 `LICENSE`。

---
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
