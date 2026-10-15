# 论文科学核对与限定修订验证

日期：2026-10-13。初始代码基线 `d4bab493a6f4e8226c692a320633f4fe27c638d6`。本批按上次真实Pi暴露的问题修改论文技能、writer/reviewer/coordinator提示词及固定论文审稿任务objective；不改权限、证据schema、审核状态或前端。

## 实际规则

- 新增 `references/scientific-review.md`：逐主张核对A−B方向、指标优劣、条件范围、p值精度、检验与校正族、CI/效应方向、量纲、单程/往返效率、优化目标与事后评价及机制推断，并核对摘要至结论的一致性。
- 限定修订固定baseline和获准old/new清单，保存后完整回读并比较实际字节；非目标内容、旧产物保留。缺少比较工具时交协调者核对，不能凭模型自述或语义相同声称逐字通过。
- 论文reviewer明确读当前技能和适用参考，给出具体位置、来源依据及reject/disputed/blocked。developmentReview继续优先；旧技能包没声明新资源时不强制读取或自动升级。
- 真实验证使用包 `5f4e3bf3539b3a197bd5a2d71e43d1f8152fc2884afcaaf9a316c5b3f6ac7ac2`，保留中间及历史发行。随后另一已完成的文字清理批次提交为`a4fdeec63ba0a2e2b3777cd1af1f4fb775ceb45e`。最终合并发行`5f147a56da6ba9ad7e665a7dfb5bcbe08ab9818a2c1645c6c5be325f0703df04`，paper元数据及全部资源与真实验证包逐字一致；相对该提交只变更paper技能。原验证会话保持5f4e绑定，新会话默认包已通过API升级为合并版。

## 真实 Pi 结果

4794服务在全目录无在途作业条件下由PID239904重启为246276；最终整合后再次空闲重载为PID147968，使用原`zai-coding-cn / glm-5.3 / low`。新协调会话和四个独立任务绑定新包，31次真实供应商HTTP全部200；没有本地固定回复、模型切换或重跑实验。

| 检查 | 结果与边界 |
|---|---|
| 历史科学错误初稿 | 真实publication reviewer实际读取新规范及8份必需证据，6次请求后reject；检出成本比较方向、All DP/UC范围、显著性与校正族等关键错误。没有列尽旧稿所有错误，不称全面科学正确性评测 |
| 历史漏句候选 | 另一真实reviewer读取baseline、候选、许可清单及主代理的实际机械diff，4次请求后reject，指出未授权删除负荷句及新增首行空行。通用task acceptance=accepted仅为结果合同满足，稿件verdict仍为reject |
| 新writer的模型原稿 | 10次请求，完整分页回读baseline和新稿，保留了前次漏句及原首行；但在非目标Limitations中多写了`the `（4字节），严格逐字检查failed。模型的“仅五项修改/限制未变”自述不准确；它也明确表示没有机械diff能力、范围保持待协调者验证。原稿及失败记录未改 |
| 受控修正版 | 主代理按同一baseline和现有五项许可清单机械构造新的独立产物，每个old唯一匹配，SHA `d2735df70c7fba2fa89524a311512b5e3e423f649aca6087696c32a48e79300f`与期望全文精确相等。这不是未经编辑的模型输出，也不追认raw writer通过 |
| 最终真实审稿 | 新publication reviewer实际读取17份必需证据、完整固定稿及固定源码，11次请求后在明确有限范围内accept；只对应受控产物和新构建。claims为空，未独立核验外部原文或查看页图 |

受控稿实际编译5页，succeeded/complete/current、converged=true、hadErrors=false、diagnostics为空。PDF SHA `9cbd7d8580d96d647e963cb184618f39a6a5495efb1daadc1eb039948d607e92`及5页PNG与上轮已检查版本逐字节相同，复用该五页视觉证据，不冒称本轮重看。原始新writer的TeX及受控稿TeX/PDF全文均未检出UUID、长哈希、内部字段或工具名，正常科学符号保留。

## 保留与证据

9532条原records无删除；41个旧session、11个旧manuscript及426个原文件（57,476,226字节）全字段/字节保持。预期改变只有本项目技能configuration的bundleId/version/updatedAt和Docker连接探测的时间/次数/版本。3条历史unknown尝试与原失败保持；没有恢复旧宿主访问授权、覆盖旧稿或接续旧原生会话。原默认模型保持，收尾活动Worker为0。

原始数据、原生对话、稿件、数据库备份和日志留在`.validation/paper-accuracy-guidance-20261013/`，不提交Git。关键文件为before.json、各stage-capture.json、lossy-comparison.json、writer-comparison.json、controlled-record.json、controlled-build.json、history-check.json及最终整合快照。数据库副本只读用于对比，不能用全库文件哈希要求新增记录后仍不变。

当前Pi工具没有机械diff/patch能力。本次机械比较和构造由主代理在用户授权内完成，并作为固定证据提供；没有新增自动编辑工具或扩大模型权限。真实验证证明本流程能发现、拦截并受控修复，而不是证明仅靠提示词已根治模型越界。

## 验证状态

初始冻结代码的全量回归1948项：1923通过、0失败、25跳过；干净安装/build/typecheck通过，661份产物一致。技能格式检查通过。开发阶段新增测试有两项修复前预期失败；首次定向26项中一项fixture错误读取尚未物化的绑定字段，改为既有sessionSkillBundle解析后单项通过，最终全量覆盖。

私有采集脚本曾误把原生user字符串当内容块数组、误把API推导字段builtinBundleId当原始存储字段，分别修正后继续只读采集，没有重跑模型或修改应用数据。收尾哈希guard准确拦截另一并行工作对共享注册表的更新；等待另一批正式提交后才整合本批明确文件，没有覆盖或混入对方未完成工作。合并后主代理再验技能/审稿26项全通过，干净安装/build/typecheck成功，661产物一致；另一个批次对合并工作树的全量日志亦为1923通过、25跳过、0失败，作为补充证据保留原处。

实施请求Sol/high；独立关键复核请求Astra/xhigh，均为已请求、运行时未回显。独立复核已验证冻结实现、两负例、新writer失败、受控稿有限accept和历史保留；最终154文件整合快照、对应检查和空闲重载后的保留证据已通过独立复核：实现无阻断，受控修订流程在已述范围内通过；原始writer的严格编辑失败仍保留。没有全面科研审稿、外部文献全文核验或新增领域实验。

精简机器证据见 [evidence.json](2026-10-13-paper-accuracy-guidance.evidence.json)。当前交付TeX/PDF位于本机`output-controlled/`，未经编辑的writer候选位于`output/`。两者作者/生成方式和验收结论不同，不相互覆盖。
