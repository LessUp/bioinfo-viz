# 使用说明（USAGE）

## 打开页面
- 双击 `index.html` 或使用本地静态服务器（推荐）

## 基本操作
- 顶部切换流程 WGS/WES/RNA
- 左侧流程图点击节点，右侧显示步骤详情与命令
- 右侧“参数配置”编辑占位符；可选择命令前缀与为值加引号
- 右侧“步骤选择”勾选要包含在脚本里的步骤
- 顶部工具区：
  - 复制全流程/导出脚本（.sh/.cmd/.ps1）
  - 导出 SVG/PNG
  - 导出/导入配置（JSON）

## 复制/导出规则
- 仅包含被勾选的步骤
- 若任一被选步骤存在缺失参数，则禁用复制/导出
- .cmd/.ps1 会自动规范续行符

## 本地持久化
- 自动保存：workflow、params、included、runner、quoteValues
- 清理方法：清空浏览器 localStorage 中的 `picardFlowState`
