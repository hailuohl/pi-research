# 当前新稿/格式稿的检查记录

旧research.verify只懂旧manuscript导出。复杂稿、formatted及新图名用review_workflow，不把旧检查迁成新pass。

1.1.1起，冻结1.0.2格式稿读取其receipt声明的layout-manifest.json，不要求补写export.json。新版稿读取receipt声明的export.json。清单及实际输出摘要必须匹配，旧layout_gaps原样保留；存在未登记的export.json会拒绝。审查记录明确保存所用生成清单路径、摘要和类别。禁止为通过审查而补写导出清单或改写已有receipt；不兼容尝试留存，使用新版本重验。

```text
python scripts/review_workflow.py --workspace 工作区 --task T1 --id O1 --kind manuscript --paper V1 --spec inputs/current-checks.json
python scripts/review_workflow.py --workspace 工作区 --task T1 --id O2 --kind formatted --paper F1 --spec inputs/current-checks.json
```

严格修订的revised_source阶段没有DOCX/PDF，先完成新的document_workflow格式版本，才能记录交付检查。检查spec只允许scientific、figure_visual、pdf_visual、independent_review；不提供的科学/视觉为not_run，独立为not_performed。

```json
{"scientific":{"status":"pending","notes":"实际主张位置、来源和值、核对范围、发现和未覆盖内容","reviewed_sha256":{"tasks/T1/formatted/F1/manuscript.md":"实际摘要","tasks/T1/formatted/F1/paper_context.json":"实际摘要"},"actor":"实际执行会话ID或阅读者","review_mode":"self_check"}}
```

执行过的状态为pass/fail/pending，必须有真实actor、模式、notes和已看文件摘要。scientific pass覆盖当前MD/context，还应在notes及额外reviewed_sha256中列实际核读的承重来源/结果。figure_visual pass覆盖该稿所有实际PNG，pdf_visual pass覆盖当前实际PDF，并提供view_evidence的真实查看出处。无图时notes明确无选定图，view_evidence可记录not_applicable及原因，不谎称看过图。实际页图可用pdf_pages生成并追加对应摘要。

独立检查另用review_mode:independent_review，至少覆盖当前MD/PDF，actor不能等于自查者。独立会话必须实际读当前稿、来源和页面；脚本只验证身份字段和摘要覆盖，不能验证人的判断或图像送达。未得到真实独立结果就not_performed，不以脚本、并行shell或同会话第二次自查替代。

所有生成警告/gaps保留，科学/视觉未pass则partial，任一fail为failed_checks；即使检查三项pass，独立状态仍单列，不暗中升级为完成。review.json及receipt绑定实际导出文件，旧checks不覆盖新稿；改检查用新ID。检查不授予外发许可，发布副本与平台导出后摘要按manuscript方法另核。
