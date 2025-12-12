# 工作流说明（WORKFLOWS）

## 通用说明

- 灰色虚线“比对（外部）”步骤通常由 BWA（WGS/WES）或 STAR（RNA）完成，不属于 Picard
- 右侧“步骤选择”控制导出脚本是否包含对应步骤

## WGS（全基因组测序）

- CreateSequenceDictionary：为参考基因组生成 .dict
- AddOrReplaceReadGroups：补充/规范 Read Group
- SortSam：按坐标排序 BAM
- MarkDuplicates：标记重复并输出指标
- BuildBamIndex：生成 BAM 索引
- ValidateSamFile：一致性检查
- CollectAlignmentSummaryMetrics：对齐统计
- CollectWgsMetrics：WGS 覆盖度等
- CollectGcBiasMetrics：GC 偏好性
- CollectInsertSizeMetrics：插入片段

## WES（外显子测序）

- 同 WGS 预处理
- CollectHsMetrics：外显子捕获效率，需要 BAIT/TARGET interval list

## RNA-Seq

- 同 WGS 预处理
- CollectRnaSeqMetrics：RNA-Seq 专用指标，需要 REF_FLAT 与 rRNA interval list
