# 题名、正文与选定上下文的严格修订

本入口扩展修订对象，不放宽旧 `check_revision.py`。旧核对器继续要求 context 全字节不变。新入口同时固定原稿 receipt、正文和 context 的 SHA256，以精确 old/new 清单生成新稿，源码之外的排版另做第二阶段。

```text
python scripts/revise_paper.py --workspace 工作区 --task T1 --baseline-kind manuscript --baseline V1 --spec inputs/revision-v2.json --id V2
python scripts/revise_paper.py --workspace 工作区 --task T1 --baseline-kind formatted --baseline F1 --spec inputs/revision-v2.json --id V2
python scripts/document_workflow.py --workspace 工作区 --task T1 --paper V2 --id F2
```

formatted 基线必须通过 receipt 和 layout-manifest 双重绑定回原 manuscript。修订 `draft-source.md` 与 `paper_context.json`，不编辑 PDF、DOCX、发布副本或已生成参考文献。原稿、旧格式稿、旧范围检查、旧模板和失败目录保留。

清单严格格式：

```json
{
  "schema": "yan-zhou-revision-2",
  "baseline_receipt_sha256": "原manuscript的receipt原始SHA256",
  "body": {
    "baseline_sha256": "原draft-source.md原始SHA256",
    "edits": [{"start": 0, "old": "精确原文", "new": "精确替换"}]
  },
  "context": {
    "baseline_sha256": "原paper_context.json原始SHA256",
    "edits": [{"start": 15, "old": "原题名", "new": "新题名"}]
  }
}
```

所有 start 都是原 UTF-8 文件解码后的 0 起始 Unicode 码点位置，包含 BOM 和 CRLF，不是 UTF-16 或字节偏移；两个文件各自计算。old 必须非空且逐字符匹配，new 可以为空表示删除。不能重叠，不能 noop，不能对已经变过的位置重新计数。正文或 context 单独不变时 edits 可以为空，但整体必须有真实字节变化。最终只采用从该清单生成的精确字节；未知 spec 字段、重复 JSON 键和非有限数拒绝。

允许更改题名，以及明确选择的 evidence_ids、claim_ids、analysis_ids、figure_ids。新选择必须是当前任务已有、依赖与扩展代码摘要均有效的记录，其全部来源仍落在原 selected_sources 中。不启动任何新分析，不扩研究方向。selected_sources 的内容和顺序固定，来源 receipt 摘要固定；其它未知 context 字段的值保持。添加/删除来源、替换来源记录或新研究范围必须另行明确建立，不能伪装成限定修订。

第一阶段 `manuscript/V2` 原子保存精确源稿、context、清单副本、两份 diff、同源 AST、引用/结果映射及 scope-report。complete 表示源码修订和机械范围完成，`document_export=not_run`，不声称新 DOCX/PDF 已导出。科学检查 pending，视觉 not_run，独立审阅 not_performed。

第二阶段 `formatted/F2` 根据 V2 和保留的版式另存同源 DOCX/PDF/TeX/MD。用户可以明确选择新的已注册模板，新的选择记录在新格式 receipt；旧模板绑定仍留在修订链。阶段二失败不回滚或覆盖 V2，也不拿 F1 或旧简版 PDF 冒充新格式。重开验证原 receipt、清单、代码、依赖和参数后，只继续尚未完成的阶段。

`scope-report.json` 的 pass 不能证明新主张科学正确，不能覆盖旧稿的科学或视觉意见，也不授予分享权限。重新实际阅读新稿及选定证据，并检查新 DOCX/PDF。锁/pending 未查清先查原进程，不能通过删除锁、改 receipt、改旧稿或降低断言恢复。
