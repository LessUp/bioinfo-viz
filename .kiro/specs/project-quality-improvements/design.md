# Design Document: Project Quality Improvements

## Overview

本设计文档描述了 Bioinfo Visualizer 项目质量改进的技术方案。该项目是一个 monorepo，包含 8 个前端应用（7 个活跃 + 1 个不完整），使用 npm workspaces 管理。改进工作涵盖项目配置、CI/CD、测试覆盖、文档和代码质量等方面。

### 项目现状分析

| 应用                 | 类型       | package.json | vitest.config | eslint.config | README | 测试 |
| -------------------- | ---------- | ------------ | ------------- | ------------- | ------ | ---- |
| bioinfo-pipeline-web | Next.js    | ✅           | ✅            | ✅            | ✅     | ✅   |
| gatk-run-dashboard   | Vite+React | ✅           | ❌            | ✅            | ✅     | 部分 |
| genome-align-viz     | Vite+React | ✅           | ❌            | ✅            | ✅     | 部分 |
| smith-waterman-viz   | 静态       | ✅           | ❌            | ❌            | ❌     | 部分 |
| picard-workflow-spa  | 静态       | ✅           | N/A           | ❌            | ✅     | N/A  |
| bwa-algorithm-viz    | 静态       | ✅           | N/A           | ❌            | ✅     | N/A  |
| arith-compress-viz   | 静态       | ✅           | N/A           | ❌            | ✅     | N/A  |
| debruijn-viz         | 静态       | ❌           | N/A           | ❌            | ❌     | N/A  |

## Architecture

### Monorepo 结构

```
bioinfo-visualizer/
├── .github/workflows/
│   ├── ci.yml              # 质量检查流水线
│   └── pages.yml           # GitHub Pages 部署
├── apps/
│   ├── bioinfo-pipeline-web/   # Next.js 应用
│   ├── gatk-run-dashboard/     # Vite+React 应用
│   ├── genome-align-viz/       # Vite+React 应用
│   ├── smith-waterman-viz/     # 静态应用 + Vitest
│   ├── picard-workflow-spa/    # 纯静态应用
│   ├── bwa-algorithm-viz/      # 纯静态应用
│   ├── arith-compress-viz/     # 纯静态应用
│   └── debruijn-viz/           # 纯静态应用 (待修复)
├── docs/
├── slides/
└── package.json            # 根 workspace 配置
```

### 技术栈

- **包管理**: npm workspaces
- **构建工具**: Vite (React 应用), Next.js (全流程示例)
- **测试框架**: Vitest (单元测试), Playwright (E2E)
- **代码检查**: ESLint 9.x (flat config)
- **格式化**: Prettier
- **CI/CD**: GitHub Actions

## Components and Interfaces

### 1. 项目配置组件

#### 1.1 debruijn-viz package.json

```json
{
  "name": "debruijn-viz",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "serve -l 5179 .",
    "lint": "eslint ."
  }
}
```

#### 1.2 Vitest 配置模板 (Vite 应用)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test/**'],
    },
  },
})
```

#### 1.3 ESLint 配置模板 (静态应用)

```javascript
// eslint.config.mjs
import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
]
```

### 2. CI/CD 组件

#### 2.1 CI Workflow 结构

```yaml
# .github/workflows/ci.yml
jobs:
  quality:
    # 格式检查、lint、测试
    steps:
      - npm run format:check
      - npm run lint:all
      - npm run test:all

  build:
    # 矩阵构建所有应用
    strategy:
      matrix:
        workspace: [所有 8 个应用]
```

### 3. Stream Client 组件

#### 3.1 StreamClient 接口

```typescript
// apps/genome-align-viz/src/streams/streamClient.ts

export type SourceType = 'mock' | 'sse' | 'ws'

export interface ConnectOptions {
  sourceType: SourceType
  url?: string
  jobId: string
  region?: Region
  /** 最大重连次数，默认 10 */
  maxRetries?: number
  /** 初始重连延迟（毫秒），默认 1000 */
  initialDelay?: number
  /** 最大重连延迟（毫秒），默认 30000 */
  maxDelay?: number
}

export interface StreamController {
  /** 停止流并清理资源 */
  stop: () => void
  /** 当前连接状态 */
  getStatus: () => 'connecting' | 'connected' | 'reconnecting' | 'stopped'
}

export function startStream(
  opts: ConnectOptions,
  onEvent: (e: StreamEvent) => void,
  onStatusChange?: (status: string) => void
): StreamController
```

#### 3.2 重连策略

```typescript
// 指数退避重连
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  return Math.min(maxDelay, initialDelay * Math.pow(2, attempt))
}
```

## Data Models

### 1. 项目配置模型

```typescript
interface PackageJson {
  name: string
  version: string
  private: boolean
  scripts: {
    dev: string
    lint?: string
    test?: string
    build?: string
    typecheck?: string
  }
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
```

### 2. CI 矩阵模型

```typescript
interface CIMatrix {
  workspace: string[]
  include?: Array<{
    workspace: string
    hasLint: boolean
    hasTest: boolean
    hasBuild: boolean
  }>
}
```

### 3. Stream Event 模型

```typescript
// 已存在于 apps/genome-align-viz/src/types/events.ts
interface StreamEvent {
  type: 'phase' | 'read' | 'coverage' | 'variant' | 'log' | 'complete'
  payload: unknown
  timestamp: number
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

基于需求分析，大多数验收标准是关于文件存在性和配置内容的示例测试。以下是可以作为属性测试的正确性属性：

### Property 1: Static App Dev Script Consistency

_For any_ static application (picard-workflow-spa, bwa-algorithm-viz, arith-compress-viz, debruijn-viz, smith-waterman-viz), the dev script SHALL use the `serve` command with a unique port number.

**Validates: Requirements 9.5**

### Property 2: Stream Client Connection Lifecycle

_For any_ stream connection (SSE or WebSocket), when the connection is started and then stopped, all resources SHALL be properly cleaned up and no further events SHALL be emitted.

**Validates: Requirements 10.1, 10.2, 10.5**

### Property 3: Exponential Backoff Reconnection

_For any_ sequence of connection failures, the reconnection delay SHALL follow exponential backoff pattern where delay(n) = min(maxDelay, initialDelay \* 2^n).

**Validates: Requirements 10.3**

### Property 4: Stream Client Type Safety

_For any_ valid ConnectOptions input, the startStream function SHALL return a StreamController with properly typed stop function and getStatus method.

**Validates: Requirements 10.4**

## Error Handling

### 1. Stream Client 错误处理

| 错误类型         | 处理策略                     |
| ---------------- | ---------------------------- |
| 网络断开         | 指数退避重连，最多 10 次     |
| 解析错误         | 记录日志，继续处理下一条消息 |
| 超时             | 关闭连接，触发重连           |
| 达到最大重连次数 | 停止重连，通知状态变更       |

### 2. CI/CD 错误处理

| 错误类型  | 处理策略               |
| --------- | ---------------------- |
| Lint 失败 | 阻止合并，显示详细错误 |
| 测试失败  | 阻止合并，显示失败用例 |
| 构建失败  | 阻止部署，显示构建日志 |

### 3. 配置错误处理

| 错误类型           | 处理策略                 |
| ------------------ | ------------------------ |
| package.json 缺失  | npm workspace 忽略该目录 |
| vitest.config 缺失 | 使用默认配置或跳过测试   |
| eslint.config 缺失 | lint:all 跳过该应用      |

## Testing Strategy

### 测试类型

本项目采用双重测试策略：

1. **单元测试 (Vitest)**: 验证具体示例和边界情况
2. **属性测试 (Vitest + fast-check)**: 验证通用属性在所有输入上成立
3. **E2E 测试 (Playwright)**: 验证关键用户路径

### 测试配置

- 属性测试最少运行 100 次迭代
- 每个属性测试必须引用设计文档中的属性
- 标签格式: `**Feature: project-quality-improvements, Property {number}: {property_text}**`

### 测试覆盖目标

| 模块                 | 单元测试 | 属性测试           | E2E 测试 |
| -------------------- | -------- | ------------------ | -------- |
| stream client        | ✅       | ✅ (Property 2, 3) | -        |
| gatk adapters        | ✅       | -                  | -        |
| smith-waterman core  | ✅       | -                  | -        |
| bioinfo-pipeline-web | ✅       | -                  | ✅       |

### 属性测试实现

```typescript
// 示例：Property 3 - Exponential Backoff
import { fc } from '@fast-check/vitest'
import { test } from 'vitest'

/**
 * Feature: project-quality-improvements, Property 3: Exponential Backoff Reconnection
 * Validates: Requirements 10.3
 */
test.prop([fc.integer({ min: 0, max: 10 })])('exponential backoff delay', (attempt) => {
  const initialDelay = 1000
  const maxDelay = 30000
  const delay = calculateDelay(attempt, initialDelay, maxDelay)

  // 验证延迟在有效范围内
  expect(delay).toBeGreaterThanOrEqual(initialDelay)
  expect(delay).toBeLessThanOrEqual(maxDelay)

  // 验证指数增长（在未达到最大值时）
  if (attempt > 0) {
    const prevDelay = calculateDelay(attempt - 1, initialDelay, maxDelay)
    expect(delay).toBeGreaterThanOrEqual(prevDelay)
  }
})
```

### 单元测试示例

```typescript
// 示例：Stream Client 单元测试
describe('streamClient', () => {
  it('should return stop function', () => {
    const controller = startStream({ sourceType: 'mock', jobId: 'test' }, () => {})
    expect(typeof controller.stop).toBe('function')
  })

  it('should stop emitting events after stop is called', async () => {
    const events: StreamEvent[] = []
    const controller = startStream({ sourceType: 'mock', jobId: 'test' }, (e) => events.push(e))

    controller.stop()
    const countAfterStop = events.length

    await new Promise((r) => setTimeout(r, 100))
    expect(events.length).toBe(countAfterStop)
  })
})
```
