# Smith-Waterman / Needleman-Wunsch Visualizer

序列比对算法可视化工具，支持 Smith-Waterman（局部比对）和 Needleman-Wunsch（全局比对）算法的动态规划过程演示。

## 功能特性

- **双算法支持**: Smith-Waterman 局部比对和 Needleman-Wunsch 全局比对
- **动态规划可视化**: 逐步展示 DP 矩阵填充过程
- **回溯路径**: 高亮显示最优比对路径
- **自定义参数**: 支持调整 match、mismatch、gap 分数
- **比对结果**: 显示最终比对序列和得分

## 快速开始

### 直接打开

```bash
# 直接在浏览器中打开
open index.html
```

### 使用开发服务器

```bash
# 在项目根目录
npm run dev:sw

# 或在当前目录
npm run dev
```

访问 http://localhost:5178

## 使用说明

1. **输入序列**: 在两个输入框中分别输入待比对的序列
2. **选择算法**: 选择 Smith-Waterman（局部）或 Needleman-Wunsch（全局）
3. **调整参数**: 设置 match、mismatch、gap 分数
4. **运行比对**: 点击"比对"按钮开始计算
5. **观看动画**: 观察 DP 矩阵的填充过程和回溯路径

## 算法说明

### Smith-Waterman（局部比对）

- 用于寻找两个序列中最相似的子序列
- DP 矩阵中负值被置为 0
- 从最高分位置开始回溯，遇到 0 停止

### Needleman-Wunsch（全局比对）

- 用于比对两个完整序列
- 第一行和第一列初始化为 gap 惩罚累积值
- 从右下角开始回溯到左上角

### 评分矩阵

```
S[i,j] = max(
  S[i-1,j-1] + score(a[i], b[j]),  // 对角线（匹配/错配）
  S[i-1,j] + gap,                   // 上方（序列 A 插入 gap）
  S[i,j-1] + gap,                   // 左方（序列 B 插入 gap）
  0                                  // 仅 SW：重新开始
)
```

## API 文档

### `buildDP(a, b, options)`

构建动态规划矩阵。

**参数:**

- `a` (string): 第一个序列
- `b` (string): 第二个序列
- `options.match` (number): 匹配分数，默认 2
- `options.mismatch` (number): 错配分数，默认 -1
- `options.gap` (number): gap 惩罚，默认 -1
- `options.mode` (string): 'sw' 或 'nw'，默认 'sw'

**返回:**

- `{ a, b, rows, cols, S, T, steps }`: DP 矩阵和计算步骤

### `traceback(dp, mode)`

执行回溯，获取最优比对。

**参数:**

- `dp`: buildDP 返回的结果
- `mode` (string): 'sw' 或 'nw'

**返回:**

- `{ score, path, alignA, alignB }`: 比对得分、路径和对齐序列

### `sanitizeSeq(s)`

清理输入序列，只保留字母字符。

## 运行测试

```bash
npm run test
```

## 技术栈

- 纯 JavaScript (ES6+ Modules)
- HTML5 Canvas
- Vitest 测试框架

## 文件结构

```
smith-waterman-viz/
├── index.html          # 主页面
├── app.js              # UI 逻辑
├── core.js             # 核心算法
├── styles.css          # 样式
├── tests/              # 测试文件
├── vitest.config.ts    # Vitest 配置
├── package.json        # 项目配置
└── README.md           # 本文档
```

## 许可证

MIT License
