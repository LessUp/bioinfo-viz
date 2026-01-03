# Implementation Plan: Project Quality Improvements

## Overview

本实现计划将设计文档中的改进方案转化为可执行的编码任务。任务按照依赖关系排序，确保每个任务都建立在前一个任务的基础上。使用 TypeScript 作为主要开发语言，Vitest 作为测试框架。

## Tasks

- [x] 1. 修复 debruijn-viz 项目配置
  - [x] 1.1 创建 debruijn-viz/package.json
    - 添加 name, version, private, scripts 字段
    - dev 脚本使用 `serve -l 5179 .`
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 创建 debruijn-viz/README.md
    - 包含项目简介、使用说明、本地开发指南
    - _Requirements: 1.4, 8.4_
  - [x] 1.3 创建 debruijn-viz/eslint.config.mjs
    - 使用 flat config 格式
    - 配置 browser globals
    - _Requirements: 6.4_

- [x] 2. 修复 smith-waterman-viz 项目配置
  - [x] 2.1 创建 smith-waterman-viz/vitest.config.ts
    - 配置 jsdom 环境
    - 配置测试文件匹配模式
    - _Requirements: 2.1, 3.4_
  - [x] 2.2 创建 smith-waterman-viz/README.md
    - 包含算法说明、使用指南、API 文档
    - _Requirements: 2.2, 8.3_
  - [x] 2.3 更新 smith-waterman-viz/package.json
    - 添加 lint 脚本
    - 添加 devDependencies (vitest, eslint)
    - _Requirements: 2.4_
  - [x] 2.4 创建 smith-waterman-viz/eslint.config.mjs
    - 使用 flat config 格式
    - _Requirements: 6.1 (类似静态应用)_

- [x] 3. Checkpoint - 验证基础配置
  - 运行 `npm install` 确认 workspace 识别
  - 运行 `npm run -w debruijn-viz dev` 确认开发服务器
  - 运行 `npm run -w smith-waterman-viz lint` 确认 lint 配置
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 添加 Vite 应用的 Vitest 配置
  - [x] 4.1 创建 gatk-run-dashboard/vitest.config.ts
    - 配置 jsdom 环境
    - 配置 React 插件
    - 配置覆盖率报告
    - _Requirements: 3.1, 3.3, 3.4_
  - [x] 4.2 创建 genome-align-viz/vitest.config.ts
    - 配置 jsdom 环境
    - 配置 React 插件
    - 配置覆盖率报告
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 5. 添加静态应用的 ESLint 配置
  - [x] 5.1 创建 picard-workflow-spa/eslint.config.mjs
    - 使用 flat config 格式
    - 配置 browser globals
    - _Requirements: 6.1_
  - [x] 5.2 创建 bwa-algorithm-viz/eslint.config.mjs
    - 使用 flat config 格式
    - 配置 browser globals
    - _Requirements: 6.2_
  - [x] 5.3 创建 arith-compress-viz/eslint.config.mjs
    - 使用 flat config 格式
    - 配置 browser globals
    - _Requirements: 6.3_
  - [x] 5.4 更新静态应用 package.json 添加 lint 脚本
    - picard-workflow-spa, bwa-algorithm-viz, arith-compress-viz, debruijn-viz
    - _Requirements: 6.5_

- [x] 6. Checkpoint - 验证 lint 配置
  - 运行各应用的 lint 脚本确认配置正确
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 更新根目录脚本
  - [x] 7.1 更新 package.json lint:all 脚本
    - 包含所有 8 个应用的 lint 命令
    - _Requirements: 6.6, 9.1_
  - [x] 7.2 更新 package.json test:all 脚本
    - 包含所有可测试应用
    - _Requirements: 9.2_
  - [x] 7.3 添加 package.json typecheck:all 脚本
    - 包含所有 TypeScript 应用
    - _Requirements: 9.3_
  - [x] 7.4 更新 package.json ci 脚本
    - 运行 format:check, lint:all, test:all, build:all
    - _Requirements: 9.4_

- [x] 8. 完善 CI/CD 流水线
  - [x] 8.1 更新 .github/workflows/ci.yml
    - 在 build 矩阵中包含所有 8 个应用
    - 添加 lint 步骤
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 8.2 更新 .github/workflows/pages.yml
    - 添加构建前验证步骤
    - _Requirements: 5.5_

- [x] 9. Checkpoint - 验证 CI 配置
  - 本地运行 `npm run ci` 确认所有检查通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. 修复 genome-align-viz 流客户端
  - [x] 10.1 重构 streamClient.ts 接口
    - 添加 StreamController 返回类型
    - 添加 maxRetries, initialDelay, maxDelay 配置选项
    - 添加 getStatus 方法
    - _Requirements: 10.4_
  - [x] 10.2 完善 SSE 连接处理
    - 实现完整的错误处理
    - 实现资源清理
    - _Requirements: 10.1_
  - [x] 10.3 完善 WebSocket 连接处理
    - 实现完整的重连逻辑
    - 实现资源清理
    - _Requirements: 10.2, 10.5_
  - [x] 10.4 实现指数退避重连
    - 提取 calculateDelay 函数
    - 添加最大重连次数限制
    - _Requirements: 10.3_
  - [x] 10.5 编写 streamClient 属性测试
    - **Property 2: Stream Client Connection Lifecycle**
    - **Property 3: Exponential Backoff Reconnection**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.5**

- [x] 11. 提升测试覆盖率 - gatk-run-dashboard
  - [x] 11.1 创建 adapters 单元测试
    - 测试 cromwell.ts 适配器
    - 测试 nextflow.ts 适配器
    - 测试 snakemake.ts 适配器
    - _Requirements: 7.1_

- [x] 12. 提升测试覆盖率 - genome-align-viz
  - [x] 12.1 创建 streamClient 单元测试
    - 测试 mock 模式
    - 测试 SSE 模式
    - 测试 WebSocket 模式
    - _Requirements: 7.2_

- [x] 13. 提升测试覆盖率 - smith-waterman-viz
  - [x] 13.1 创建 core.js 单元测试
    - 测试 Smith-Waterman 算法
    - 测试 Needleman-Wunsch 算法
    - 测试边界情况
    - _Requirements: 7.3_

- [x] 14. Checkpoint - 验证测试覆盖
  - 运行 `npm run test:all` 确认所有测试通过
  - 检查覆盖率报告
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. 完善项目文档
  - [x] 15.1 创建根目录 CONTRIBUTING.md
    - 包含贡献指南、代码规范、PR 流程
    - _Requirements: 8.1_
  - [x] 15.2 更新根目录 README.md
    - 添加 ROADMAP.md 链接
    - 添加所有子应用链接
    - 更新快速开始指南
    - _Requirements: 8.2_

- [x] 16. Final Checkpoint - 完整验证
  - 运行 `npm run ci` 确认所有检查通过
  - 验证所有文档完整性
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
