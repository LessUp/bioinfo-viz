# Genome Alignment Visualization

一个基因比对动态可视化的教学示例，基于 React + Vite + Tailwind。支持展示处理流水线进度、对齐画布、覆盖度轨、变异面板与日志信息，适合课堂演示与交互式讲解。

## 功能特性

- 流水线时间线：`qc → index → align → sort → dedup → variant → annotate` 状态与进度
- 对齐画布：按区域绘制 reads，比对错配高亮，支持简单过滤
- 覆盖度轨：Web Worker 聚合分箱，显示平均覆盖度与柱状轨
- 变异面板：实时显示最近检测到的变异（示例数据）
- 指标卡片：QPS、已处理读段数量、平均覆盖度、错配率
- 日志面板：事件、错误等流式日志

## 快速开始

```bash
npm i
npm run dev       # http://localhost:5173 （vite --port 5173）
# 生产构建
npm run build
npm run preview   # http://localhost:5174
```

## 目录结构

```
apps/genome-align-viz/
├─ src/
│  ├─ components/        # Timeline, AlignmentCanvas, CoverageTrack, MetricCards, VariantPanel, LogPanel, ControlPanel, TeachingPanel
│  ├─ streams/           # 示例流式事件客户端（startStream）
│  ├─ workers/           # 覆盖度聚合的 Web Worker
│  ├─ store/             # Zustand 全局状态
│  └─ types/             # 事件与数据类型
├─ index.html
├─ vite.config.ts
├─ tailwind.config.js
├─ package.json
└─ README.md
```

## 开发提示

- Node.js >= 18
- 如需接入真实后端流，请在 `src/streams/` 中替换示例实现，或添加环境变量配置
- 浏览器性能优化：对齐画布读段数量已设定上限（约 800），可按需调整

## 许可证

依赖本仓库根目录的 LICENSE（MIT）。
