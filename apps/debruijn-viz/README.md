# De Bruijn Graph Visualizer

De Bruijn 图可视化工具，用于展示基因组组装中的 k-mer 图构建和欧拉路径遍历过程。

## 功能特性

- **K-mer 分解**: 将 DNA 序列分解为 k-mer 片段
- **De Bruijn 图构建**: 可视化展示节点和边的构建过程
- **欧拉路径**: 动画演示 Hierholzer 算法寻找欧拉路径
- **交互式参数**: 支持自定义序列和 k 值

## 快速开始

### 直接打开

```bash
# 直接在浏览器中打开
open index.html
```

### 使用开发服务器

```bash
# 在项目根目录
npm run dev:debruijn

# 或在当前目录
npm run dev
```

访问 http://localhost:5179

## 使用说明

1. **输入序列**: 在输入框中输入 DNA 序列（仅支持 A、C、G、T）
2. **设置 K 值**: 选择 k-mer 的长度（2-10）
3. **构建图**: 点击"构建"按钮生成 De Bruijn 图
4. **播放动画**: 点击"播放"观看欧拉路径遍历动画
5. **重置**: 点击"重置"回到初始状态

## 算法说明

### De Bruijn 图

De Bruijn 图是基因组组装的核心数据结构：

- **节点**: 每个 (k-1)-mer 作为一个节点
- **边**: 每个 k-mer 连接其前缀和后缀节点
- **欧拉路径**: 遍历所有边恰好一次，重建原始序列

### Hierholzer 算法

用于寻找欧拉路径的经典算法：

1. 从起点开始，沿未访问的边前进
2. 当无法继续时，回溯并将节点加入路径
3. 重复直到所有边都被访问

## 技术栈

- 纯 JavaScript (ES6+)
- HTML5 Canvas
- 无外部依赖

## 文件结构

```
debruijn-viz/
├── index.html      # 主页面
├── app.js          # 应用逻辑
├── styles.css      # 样式
├── package.json    # 项目配置
└── README.md       # 本文档
```

## 许可证

MIT License
