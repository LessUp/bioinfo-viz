# NGS 分析流程与工具指南（人类基因组）

本文档包含两幅 Mermaid 图与关键工具说明，覆盖从湿实验、测序、FASTQ 生成到比对、排序/去重、BQSR、胚系与体细胞变异分析，以及交付与资源准备。将以下 Mermaid 代码粘贴到支持 Mermaid 的渲染环境（如 Markdown 预览、Mermaid Live Editor）即可查看图示。

---

## 一、全流程总览（NGS 全景）

```mermaid
flowchart LR
  %% 全流程主方向
  %% 湿实验 → 测序 → 一级分析（FASTQ） → 二级分析（DNA/RNA/宏基因组） → 三级分析/交付

  subgraph A[湿实验]
    A1[样本收集与登记]
    A2[DNA/RNA 提取]
    A3[建库: 片段化/末端修复/加A/接头连接/加索引/PCR]
    A4[文库质控: Qubit/NanoDrop/Bioanalyzer]
    A5{QC 通过?}
    A1-->A2-->A3-->A4-->A5
    A5 -- 否 --> A3
  end

  subgraph B[测序平台]
    B1[上机: 上样/成簇/测序运行]
    B2[原始信号/BCL]
  end

  A5 -- 是 --> B1 --> B2

  subgraph C[一级分析]
    C1[碱基识别与去噪（Basecalling）]
    C2[样本拆分(去多重)与 FASTQ 生成]
    C3[原始质控 FastQC/MultiQC]
    C4[接头/低质读段修剪 TrimGalore/Cutadapt]
    C5[修剪后质控]
  end
  B2 --> C1 --> C2 --> C3 --> C4 --> C5

  C6{测序类型?}
  C5 --> C6

  %% DNA-Seq 分支
  subgraph D[二级分析: DNA-Seq]
    D1[比对至参考基因组 BWA-MEM/Bowtie2 → SAM/BAM]
    D2[排序/索引 samtools sort/index]
    D3[重复标记 Picard MarkDuplicates]
    D4[碱基质量重校正 BQSR]
    D5{分析目的?}
    D6[胚系变异: GATK HaplotypeCaller → gVCF/VCF]
    D7[体细胞变异: Mutect2 → VCF]
    D8[结构变异: Manta/DELLY]
    D9[拷贝数变异: CNVkit/Control-FREEC]
    D10[变异过滤/合并 VQSR/硬过滤]
    D11[注释 VEP/ANNOVAR]
    D12[致病性判读与报告]
  end

  C6 -- DNA-Seq --> D1 --> D2 --> D3 --> D4 --> D5
  D5 -- 胚系 --> D6 --> D10
  D5 -- 体细胞 --> D7 --> D10
  D5 -- 结构变异(SV) --> D8
  D5 -- 拷贝数(CNV) --> D9
  D10 --> D11 --> D12

  %% RNA-Seq 分支
  subgraph E[二级分析: RNA-Seq]
    E1{流程选择?}
    E2[比对型: STAR/HISAT2 → BAM]
    E3[定量: featureCounts/RSEM]
    E4[伪比对: Salmon/Kallisto → TPM/Counts]
    E5[差异表达: DESeq2/edgeR]
    E6[融合基因: STAR-Fusion]
    E7[功能富集: GO/KEGG/GSEA]
    E8[结果汇总与报告]
  end

  C6 -- RNA-Seq --> E1
  E1 -- 比对型 --> E2 --> E3 --> E5 --> E7 --> E8
  E1 -- 伪比对型 --> E4 --> E5 --> E7 --> E8
  E2 --> E6

  %% 宏基因组/微生物 分支
  subgraph G[二级分析: 宏基因组/微生物]
    G1[去宿主/去污染: KneadData]
    G2[分类与丰度: Kraken2/Bracken/MetaPhlAn]
    G3[功能注释: HUMAnN]
    G4[报告]
  end

  C6 -- 宏基因组 --> G1 --> G2 --> G3 --> G4

  %% 三级分析与交付
  subgraph F[三级分析与交付]
    F1[整合多组学/临床信息]
    F2[可视化与质控面板]
    F3[交付物: FASTQ/BAM(或CRAM)/VCF/表达矩阵/质控与医学报告]
  end

  D12 --> F2 --> F3
  E8 --> F2
  G4 --> F2
  C2 -. 原始数据 .-> F3
```

---

## 二、人类基因组：FASTQ → 比对 → 排序去重 → 变异分析（细化）

```mermaid
flowchart TB
  %% 从 FASTQ 起步，到比对、排序、去重、BQSR、变异分析（胚系/体细胞）及注释
  %% 主要面向人类基因组（hg38/GRCh38）

  subgraph FQ[输入与预处理（FASTQ）]
    F0[输入: FASTQ R1/R2]
    F1[原始质控: FastQC → MultiQC]
    F2{是否需要修剪/去接头?}
    F3[修剪: fastp 或 TrimGalore/Cutadapt]
    F4[修剪后质控: FastQC → MultiQC]
    F0 --> F1 --> F2
    F2 -- 是 --> F3 --> F4
    F2 -- 否 --> F4
  end

  subgraph REF[参考准备（一次性）]
    R1[参考: GRCh38/hg38\n含 decoy/补丁/alt]
    R2[BWA 索引: bwa index]
    R3[字典与索引: samtools faidx\nPicard CreateSequenceDictionary]
    R4[已知位点: dbSNP、Mills、1000G indels]
    R1 --> R2
    R1 --> R3
    R1 --> R4
  end

  subgraph ALN[比对与对齐后处理]
    A1[比对: BWA-MEM2 → SAM\n(可选 Bowtie2/DRAGEN)]
    A2[转换/排序: samtools view/sort → BAM]
    A3[标记重复: Picard MarkDuplicates\n或 GATK MarkDuplicatesSpark]
    A4[碱基质量重校正: GATK BaseRecalibrator\n+ ApplyBQSR (使用 dbSNP/Mills/1000G)]
    A5[索引: samtools index → BAM.bai]
    A6[对齐质控: Picard Collect*Metrics\nsamtools flagstat, mosdepth, Qualimap]
    F4 --> A1 --> A2 --> A3 --> A4 --> A5 --> A6
    REF --> A1
    REF --> A4
  end

  decision{分析类型?}
  A5 --> decision

  %% 胚系分支
  subgraph GERMLINE[变异分析：胚系（WGS/WES/Panel）]
    G1[单样本调用: GATK HaplotypeCaller\n-ERC GVCF → .g.vcf.gz]
    G2[队列联合定型: GATK GenotypeGVCFs\n或 GLnexus]
    G3[变异过滤: GATK VQSR（推荐多样本）\n或硬过滤（单样本/小队列）]
    G4[注释: VEP / ANNOVAR / SnpEff\n(可用 gnomAD/ClinVar/OMIM)]
    G5[产出: VCF/BCF + 注释表 + 质控统计]
    A5 --> G1 --> G2 --> G3 --> G4 --> G5
  end

  %% 体细胞分支（肿瘤-正常/肿瘤-only）
  subgraph SOMATIC[变异分析：体细胞（肿瘤）]
    S1{模式?}
    S2[肿瘤-正常: GATK Mutect2 TN]
    S3[肿瘤-only: Mutect2 TO\n+ Panel of Normals(PON)]
    S4[偏倚模型: LearnReadOrientationModel]
    S5[污染估计: GetPileupSummaries\n+ CalculateContamination]
    S6[过滤: FilterMutectCalls]
    S7[备选二次调用: Strelka2 / VarDict]
    S8[SV/CNV: Manta（SV）\nGATK gCNV / CNVkit（CNV）]
    S9[注释: VEP / SnpEff / ANNOVAR\n(可连 ClinVar/COSMIC/OncoKB)]
    S10[产出: somatic PASS VCF + 注释 + 汇总]
    A5 --> S1
    S1 -- 肿瘤-正常 --> S2 --> S4
    S1 -- 肿瘤-only --> S3 --> S4
    S4 --> S5 --> S6 --> S7 --> S8 --> S9 --> S10
  end

  %% 可选：UMI 工作流（如 ctDNA/超低频）
  subgraph UMI[可选：UMI 工作流]
    U1[UMI 提取: fgbio/umi_tools extract]
    U2[比对后 UMI 分组/一致性: fgbio GroupReadsByUmi\n+ CallMolecularConsensusReads]
  end
  F4 -. UMI 文库可选 .-> U1 -.-> A1

  %% 交付与报告
  subgraph OUT[交付与报告]
    O1[交付物: FASTQ/BAM(CRAM)/VCF\nMultiQC/指标与覆盖度/注释表]
    O2[面向临床/科研的可视化与摘要]
    G5 --> O1 --> O2
    S10 --> O1
    A6 -. 对齐层面指标 .-> O1
  end

  decision -- 胚系 --> GERMLINE
  decision -- 体细胞 --> SOMATIC
```

---

## 三、常用软件与环节说明

- **质控**
  - **FastQC / MultiQC**：单样本与批量质控汇总，读长、Q 分布、接头/过度表示等。
- **修剪/去接头**
  - **fastp**：集成接头识别、质量裁剪、过度表示过滤与报告，速度快。
  - **TrimGalore / Cutadapt**：经典接头与低质碱基修剪组合。
- **比对与处理**
  - **BWA-MEM2**：人类短读长主流比对器，比 BWA-MEM 更快；适用 WGS/WES/Panel。
  - **Bowtie2**：另一短读比对器，偏快但人类变异分析常首选 BWA-MEM2。
  - **samtools**：SAM/BAM/CRAM 转换、排序、索引、基本指标。
  - **Picard MarkDuplicates / GATK MarkDuplicatesSpark**：PCR/光学重复标记；Spark 版并行更快。
  - **GATK BaseRecalibrator / ApplyBQSR**：利用 `dbSNP`、`Mills`、`1000G indels` 对系统性质量偏差建模与重校正。
  - **mosdepth / Qualimap / Picard Collect\*Metrics**：覆盖度、插入片段、比对/靶向捕获指标。
- **胚系变异**
  - **GATK HaplotypeCaller**：局部组装的 SNP/Indel 调用；`-ERC GVCF` 适合后续联合定型。
  - **GATK GenotypeGVCFs / GLnexus**：多样本联合定型生成队列 VCF。
  - **GATK VQSR**：需要较大样本量以训练；小样本建议硬过滤。
- **体细胞变异**
  - **GATK Mutect2（TN/TO）**：肿瘤-正常优先；肿瘤-only 需 `PON` 与更严格过滤。
  - **FilterMutectCalls / LearnReadOrientationModel / CalculateContamination**：体细胞过滤关键组件。
  - **Strelka2 / VarDict**：可与 Mutect2 互补提升召回。
  - **Manta（SV）/ GATK gCNV / CNVkit（CNV）**：结构变异与拷贝数检测。
- **注释**
  - **VEP / ANNOVAR / SnpEff**：功能效应注释；可接入 ClinVar、gnomAD、dbNSFP、COSMIC、OncoKB 等资源。
- **UMI 流程（可选）**
  - **fgbio / umi_tools**：UMI 提取、分组与一致性序列生成，适合超低等位基因频率检测。

---

## 四、关键资源与数据准备

- **参考基因组**：GRCh38/hg38（建议含 decoy/alt；准备 `fasta`、`fasta.fai`、`dict`、BWA 索引）。
- **BQSR 已知位点**：dbSNP、Mills_and_1000G_gold_standard.indels、1000G_phase1.indels（与参考版本匹配）。
- **靶向区域 BED**：WES/Panel 必备，用于覆盖度统计与调用限制。
- **体细胞 PON**：肿瘤-only 模式建议使用；来自同一平台/流程的正常样本集合。
- **注释数据库**：gnomAD（群体频率）、ClinVar（临床意义）、dbNSFP（功能预测）、COSMIC（肿瘤体细胞）。

---

## 五、输出交付清单

- **原始与中间文件**：FASTQ、BAM/CRAM + 索引（.bai/.crai）。
- **变异结果**：gVCF/VCF + 索引，SV/CNV 结果（如适用）。
- **质控与统计**：MultiQC 报告、对齐与覆盖指标、召回/过滤统计。
- **注释与汇总**：注释表（CSV/TSV）、关键变异摘要与可视化。

---

如需按您的具体项目（WGS/WES/Panel、胚系或肿瘤-正常/肿瘤-only）生成命令级模板（bwa/samtools/GATK4）或 Nextflow/Snakemake 最小工作流骨架，请告知测序类型、读长、是否有配对正常样本，以及参考/数据库版本。
