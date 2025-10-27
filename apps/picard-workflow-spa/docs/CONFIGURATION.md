# 配置说明（CONFIGURATION）

## 占位符参数
当前页面支持以下占位符（可在右侧面板修改）：
- REFERENCE, DICT_OUT
- ALIGNED_BAM, RG_BAM, SORTED_BAM, DEDUP_BAM, DEDUP_METRICS
- ALIGN_SUMMARY, WGS_METRICS, GC_BIAS_TXT, GC_BIAS_PDF, GC_SUMMARY
- INSERT_METRICS, INSERT_HIST, HS_METRICS, BAIT_INTERVALS, TARGET_INTERVALS
- RNA_METRICS, REF_FLAT, RRNA_INTERVALS
- RGID, RGLB, RGPL, RGPU, RGSM

## 命令前缀（Runner）
- picard（默认）
- java -jar picard.jar
- gatk

## 为值加引号
- 对包含空格/特殊字符的值自动加引号，避免 shell 解析错误

## 导入/导出配置
- 导出：生成 JSON，包含 workflow、params、included、runner、quoteValues
- 导入：从 JSON 恢复同上内容

## 示例配置
见 `examples/picard-config.json`
