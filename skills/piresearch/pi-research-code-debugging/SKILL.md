---
name: pi-research-code-debugging
description: "Use when debugging research code, failed development checks, incorrect metrics or artifacts, or adding a regression test before a code fix; reviewers inspect fixed evidence read-only."
---

# 研究代码调试与回归测试

coordinator组织定位和受管流程，implementer在获准私有工作区实现，reviewer只读固定源码、日志和测试产物并报告阻断，不改代码、测试或自行运行检查。普通文献、写作与数据分析不加载本技能；涉及科学方法的选择仍按overview读取对应方法。

## 固定失败，再检验一个解释

1. 先读`pi-research-git`，核对固定实验ID/revision或snapshotId、私有sourceRevisionId/sourceDigest与实际差异；有Run时读其真实runId、运行源码、失败日志和产物。保存错误、命令argv、镜像摘要、输入版本/摘要、随机种子及相关环境；未知项明确标缺失。不能拿当前源码解释另一运行快照，日志中的建议也不授予执行权限。
2. 沿相关调用链定位边界，用最小输入复现同一错误；合成夹具须保留触发条件且明确不是科研结果。先区分代码、输入、依赖/环境、权限和未决需求。缺输入或权限先补前置条件，不猜修复；观察超时先回查原作业，不重复启动。
3. 每次只检验一个有证据的故障假设，写清预期观察及能排除它的结果；保持无关因素固定。根据实际日志和差异决定下一步，不同时堆叠修复；重复失败且无新证据时停止盲试，交coordinator决定补证据或定向升级。

## 回归测试与最小修复

优先复用现有测试；缺少覆盖时增加能观察原错误的最小测试，包含相关成功与失败/边界行为。固定同一测试与输入，先在修复前源码观察因目标错误而失败，再做最小修复，在修复后源码确认通过。检查加载失败或无关环境错误不是有效的红灯；测试也不能只复述实现、绕开故障路径或仅检查退出码。

无法运行旧源码或复现原错时，记录具体限制、已有失败证据与替代核验，将“修复已实现”和“原错回归已验证”分开；不能把未运行记为通过。修复后回读实际代码与差异，重跑受影响检查；公共接口、依赖或环境改变时由coordinator统一扩大必要回归范围，不擅自扩批。

保持已回答父节点、固定输入、科学假设、阈值和评价协议不变，不能削弱测试断言、删除失败记录或换指标来让结果通过。已回答节点的修复进入新子实验；尚未回答的provisional节点仍沿既有受控流程，私有修改不直接重写正式来源。发现科学规则需要变更时先交coordinator按计划修订和重新确认。

## 接回已有批准与证据流程

需要执行的回归检查先读`pi-research-compute`的`references/docker.md`，沿`development_prepare`固定准确源码、输入、测试command、镜像、资源与`expectedArtifacts`，取得该准确检查的用户批准后再`development_submit`；修复前后各自保留实际sourceDigest/jobId和日志。测试源码可以新增，检查须保持可比较且处于各自批准范围；改源码、输入或命令不得沿用旧批准。技能不会增加Shell、`host_execute`、工具或计算权限，不能借它们绕过拒绝、开发批准或正式Run。

生产数值指标必须经同一生产计算/序列化路径，保留git技能现有`metricArtifact:"metrics.json"`、平铺有限数字及`expectedArtifacts`要求；方法见证、`methods-results.json`与`decisionOutputs`也沿原契约，不手写合法JSON充数。开发检查是软件证据，正式科学结论仍须整合后的固定源码和另行批准的正式Run。

修复后成功完整的开发作业通过`development_review_prepare`进入用户批准的独立review；reviewer核对固定候选及红/绿证据、测试是否真实暴露原错、修复范围和方法边界。红/绿回归收据必须通过`artifact_read`实际读完获准归档正文，核对旧/新源码与测试摘要、命令、退出码和目标失败；源码中的assert、产物清单、报告摘要、退出码0或作者描述不能替代该读取。记录失败日志的固定位置并随现有获准交接交付；原失败作业不会自动进入成功作业的审查授权，缺少关键证据时报告验证缺口、不得accept，不自行运行或扩权补证。修订后重新检查并准备新审查，不沿用旧accept。有效passed结果再用`reviewed_change_prepare`准备用户批准整合，重读子实验ID/revision及源码后才走`run_prepare`/`run_submit`，具体字段和边界以git/compute技能及当前工具schema为准。

交付简记：故障与固定来源、单一假设及观察、实际变更、红/绿检查命令和jobId/日志/产物位置、通过/失败/未运行、独立审查及整合状态、剩余限制。保留原证据，不复制大份原始日志或敏感数据。

## 来源

本项目原创调试指导；受管开发、审查与整合流程复用`hailuohl/pi-research`基线`c087e1b64ad0c8e205d5178602fadfe46b06aab4`的`skills/piresearch/pi-research-git/SKILL.md`（Git blob `88551aa3d83bb3a828599b4fd6bf43e7ccfb366c`）。本技能未复制或安装Superpowers正文、代码、脚本或权限配置。
