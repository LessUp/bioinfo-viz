# Arithmetic Compression Visualization

一个用于演示算术编码（Arithmetic Coding）的交互式静态页面，展示区间缩放、符号概率与编码/解码过程。适合教学与直观理解压缩原理。

## 功能特性
- 交互式区间缩放与当前码值展示
- 可视化符号累积概率与区间映射
- 编码与解码过程逐步播放
- 支持截图/导出（浏览器内置）

## 快速开始
- 直接双击 `index.html` 打开
- 或使用本地静态服务器（可选）：
  ```bash
  npx serve .
  # 或
  python -m http.server 8000
  ```

## 目录结构
```
apps/arith-compress-viz/
├─ index.html
├─ styles.css
├─ app.js
└─ README.md
```

## 许可证
依赖本仓库根目录的 LICENSE（MIT）。
