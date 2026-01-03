# Requirements Document

## Introduction

本规范文档旨在系统性地修复和完善 Bioinfo Visualizer 项目中发现的问题。该项目是一个面向生物信息学教学与演示的可视化项目集合，包含 8 个应用（7 个活跃 + 1 个不完整）。经过深度排查，发现以下主要问题类别：

1. 项目配置不一致（缺少 package.json、vitest 配置等）
2. CI/CD 覆盖不完整
3. 测试覆盖率低
4. 文档缺失
5. 静态导出配置问题
6. 代码质量工具缺失

## Glossary

- **Monorepo**: 包含多个项目的单一代码仓库
- **Workspace**: npm workspaces 中的子项目
- **Static_Export**: Next.js 静态导出模式，生成纯静态 HTML 文件
- **Vitest**: 基于 Vite 的测试框架
- **ESLint**: JavaScript/TypeScript 代码检查工具
- **CI_Pipeline**: 持续集成流水线
- **GitHub_Pages**: GitHub 提供的静态网站托管服务

## Requirements

### Requirement 1: 修复 debruijn-viz 项目配置

**User Story:** As a developer, I want debruijn-viz to have proper npm package configuration, so that it can be included in the workspace and CI pipeline.

#### Acceptance Criteria

1. THE debruijn-viz project SHALL have a valid package.json file with name, version, and scripts fields
2. WHEN npm install is run at root, THE debruijn-viz project SHALL be recognized as a workspace member
3. THE debruijn-viz project SHALL have a dev script for local development
4. THE debruijn-viz project SHALL have a README.md documenting its purpose and usage

### Requirement 2: 修复 smith-waterman-viz 项目配置

**User Story:** As a developer, I want smith-waterman-viz to have complete configuration, so that tests can run and the project is properly documented.

#### Acceptance Criteria

1. THE smith-waterman-viz project SHALL have a vitest.config.ts file for test configuration
2. THE smith-waterman-viz project SHALL have a README.md documenting its purpose and usage
3. WHEN npm run test is executed, THE Vitest framework SHALL run tests successfully
4. THE smith-waterman-viz project SHALL have a lint script in package.json

### Requirement 3: 添加 Vite 应用的 Vitest 配置

**User Story:** As a developer, I want all Vite applications to have proper Vitest configuration, so that tests can run consistently.

#### Acceptance Criteria

1. THE gatk-run-dashboard project SHALL have a vitest.config.ts file
2. THE genome-align-viz project SHALL have a vitest.config.ts file
3. WHEN npm run test is executed in each project, THE Vitest framework SHALL run tests with proper configuration
4. THE vitest configuration SHALL include jsdom environment for React component testing

### Requirement 4: 配置 bioinfo-pipeline-web 静态导出

**User Story:** As a developer, I want bioinfo-pipeline-web to support static export, so that it can be deployed to GitHub Pages.

#### Acceptance Criteria

1. THE next.config.ts SHALL include output: 'export' configuration
2. THE next.config.ts SHALL include basePath configuration for GitHub Pages
3. THE next.config.ts SHALL include trailingSlash: true for proper static routing
4. IF API routes exist, THEN THE System SHALL remove or relocate them to support static export
5. WHEN dynamic routes exist, THE System SHALL implement generateStaticParams() for pre-rendering

### Requirement 5: 完善 CI/CD 流水线

**User Story:** As a developer, I want all applications to be included in CI/CD pipeline, so that code quality is consistently enforced.

#### Acceptance Criteria

1. THE CI workflow SHALL include all 8 applications in the test matrix
2. THE CI workflow SHALL run lint checks for all applications with lint scripts
3. THE CI workflow SHALL run tests for all applications with test scripts
4. WHEN any check fails, THE CI pipeline SHALL report the failure clearly
5. THE Pages workflow SHALL validate all builds before deployment

### Requirement 6: 添加静态应用的 ESLint 配置

**User Story:** As a developer, I want static HTML/JS applications to have ESLint configuration, so that code quality is enforced.

#### Acceptance Criteria

1. THE picard-workflow-spa project SHALL have an eslint.config.mjs file
2. THE bwa-algorithm-viz project SHALL have an eslint.config.mjs file
3. THE arith-compress-viz project SHALL have an eslint.config.mjs file
4. THE debruijn-viz project SHALL have an eslint.config.mjs file
5. WHEN npm run lint is executed, THE ESLint framework SHALL check JavaScript files
6. THE root lint:all script SHALL include all applications with lint scripts

### Requirement 7: 提升测试覆盖率

**User Story:** As a developer, I want comprehensive test coverage, so that code changes can be validated automatically.

#### Acceptance Criteria

1. THE gatk-run-dashboard project SHALL have tests for adapter functions
2. THE genome-align-viz project SHALL have tests for stream client functions
3. THE smith-waterman-viz project SHALL have tests for core algorithm functions
4. WHEN tests are run, THE coverage report SHALL show at least basic coverage for core modules
5. THE bioinfo-pipeline-web project SHALL have E2E tests for critical user paths

### Requirement 8: 完善项目文档

**User Story:** As a contributor, I want comprehensive documentation, so that I can understand and contribute to the project.

#### Acceptance Criteria

1. THE root directory SHALL have a CONTRIBUTING.md file with contribution guidelines
2. THE root README.md SHALL include links to ROADMAP.md and all sub-applications
3. THE smith-waterman-viz project SHALL have a README.md with usage instructions
4. THE debruijn-viz project SHALL have a README.md with usage instructions
5. WHEN a new contributor reads the documentation, THE contributor SHALL understand how to set up and run the project

### Requirement 9: 统一 package.json 脚本

**User Story:** As a developer, I want consistent npm scripts across all applications, so that development workflow is predictable.

#### Acceptance Criteria

1. THE root package.json SHALL have updated lint:all script including all lintable apps
2. THE root package.json SHALL have updated test:all script including all testable apps
3. THE root package.json SHALL have a typecheck:all script for TypeScript apps
4. WHEN npm run ci is executed at root, THE System SHALL run format check, lint, test, and build for all apps
5. THE static applications SHALL have consistent dev script format using serve

### Requirement 10: 修复 genome-align-viz 流客户端

**User Story:** As a developer, I want the stream client to have complete implementation, so that SSE and WebSocket connections work properly.

#### Acceptance Criteria

1. THE SSE connection handler SHALL have complete implementation with proper cleanup
2. THE WebSocket connection handler SHALL have complete implementation with reconnection logic
3. WHEN a connection error occurs, THE System SHALL attempt reconnection with exponential backoff
4. THE stream client SHALL have proper TypeScript types for all parameters and return values
5. WHEN the stream is stopped, THE System SHALL properly close all connections and clean up resources
