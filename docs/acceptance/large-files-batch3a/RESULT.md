# 大文件第三批 A：固定引用进入独立开发审查

状态：本批验收通过，已完成必要修复、受影响验证和独立复核；提交与推送由主代理记录。

基线：`be9b80cb1da59e6d69a045c881e6a4ac40503ad1`。仅在隔离工作树实施，主目录在途代码、科研数据、主服务和布局保持不动。

## 实际行为

- 新显式 readingProtocol `fixed-obligations-v1` 将完整宿主义务绑定到 review、wrapper、team plan 和批准。科学 profile 1/2 的原规则保持，旧 review/manifest/runtime/helper 不升级或重算新默认值。
- dataset-reference 要求准确固定来源的完整 SHA/size，以及当前独立 task/attempt/session/generation 实际 SDK 送达的非空检查页和逐字引文。其 inspection 与全文 readComplete 分开。候选、协议、brief、required 产物、fixture 与原 required 日志保留全文义务和科学 authority。
- 字节页回执同时绑定原 UTF-8 byteStart/end、readProtocol 与 normalized UTF-16 覆盖位置，不混用旧端点 cursor。pending/error/cache/截断/错误身份均不能补覆盖。512 例外只属于准确批准的新 dataset target，原 task/source/epoch/native/PDF/PMC 等权限及精确 logBytes 保持。
- 新 dataset-aware 开发准备动作使用内部 v2 指纹固定准确 brief/source/fixture，markerless 旧动作保留原算法。新协议在任何 session-action 或 review 产物之前检查现有引用预算：12 个位置需留 1 个 candidate，因此最多 11 份 dataset；旧 32 总输入及 JSON/model 预算不变。
- 当前 authority 与完整性分层：heartbeat、active-task、候选及页授权/ACK 不重复扫描无关大数据，所有当前绑定和权限照常检查；完整性边界 fresh 全源校验，单同步边界内去重复，不使用跨 RPC/持久 verified/stat 缓存。默认旧调用仍完整校验。原 workspace 索引经精确身份及完整性验证后复用原 ID，不复制原件或创建第二份索引。
- argv 路径只在冲突比较时词法归一化，批准命令字节保持。纯历史 semantic basis 与当前执行权限分开；新读取/准入/采用要求当前权限，Owner 可见准确历史并标 stale。

接口与限制见 `docs/api/development-fixed-obligations.md`。

## 实际验证

- 首次 512 MiB 实跑完成 root SDK 固定输入和真实 Docker 宿主小夹具；独立审查首候选页耗时 27.256 秒、offer 另 3.068 秒，触发 LEASE_EXPIRED，未被标记通过。
- 一个 3 MiB direct-app 模拟归档探针定位每次 assertTaskCurrent 有 6 次整数据 SHA：候选调用 36 次、offer/ACK 各 6 次、数据页 156 次、generic index miss 601 次。修复后这些热路径为 0，prepare/index 各 1 次且事务内计数为 0；复用原索引，无 source 重建。旧 scratch JSON 被探针覆写，before 证据以原 stdout 和诊断表保存，after JSON 单独命名。
- 修复后相关检查 107/107，科学 profile/原权限兼容 91/91，小型真实 SDK 8/8；固定数据引文嵌入 brief 1/1，完成 task-result 同键重放 2/2，均无跳过。此前通过结果按实际未变路径复用，不累加为唯一测试数。
- 主代理最终实际 Docker＋固定 Pi SDK、本地模拟 provider、192 MiB 堆：512 MiB 固定引用 → 唯一宿主 fixture 开发测试 → 小结果归档 → 独立 reviewer 18 条实际送达回执 → 重开，通过。data mount 只有宿主 fixture，真实 dataset 不进入容器或候选源码。
- 最终最大页 16000 bytes、最大读块 1048576 bytes、最大 provider 请求 310631 bytes、总请求 6584700 bytes、峰值 RSS 281571328 bytes（约 269 MiB）。`inspectionSatisfied=true`、`datasetReadComplete=false`、`formalExecuted=false`、`scientificJudgment=false`。确定性 provider 验证传输和机械准入，不冒称独立科学判断。
- 原独立 Astra/xhigh 会话完成必要修复复核，初始 argv 别名与容量两阻断均关闭，无新增确定问题；前后 122 文件哈希匹配。伪造/失效 context、远块损坏、源/方法/档案/epoch/身份负例按报告记录，夹具纠正及 partial 探针不冒称全绿。
- 干净安装、构建、类型检查通过，797 个产物一致；manifest SHA-256 `c4049bf9afe2231dc7355c1fa3f7577392424d66f86bc039ef0f061a5a12f6b2`。
- 原 `npm test` 在恢复会话时已无进程、无终态汇总，日志停在 `audit-composer-draft`；原因未核实，不能标记通过。排序前 116 文件已有日志，其中 HTTP/CLI 合约 1 项失败；从中断边界补完其余 237 文件：2233 项、2205 通过、3 失败、25 跳过，exit 1。两段覆盖原全部 353 文件，边界文件为确认完整性补验一次；没有重跑已完成的大容量/Docker。
- 四项失败均为新增全局 schema 预检先于旧 tool 门的生产回归；同一修复还恢复原 scope/lifecycle/session 门顺序；原断言保留，修复只让原入口检查被三个完整性操作复用，完整 SHA 保持 writer 外，SHA 后再检查。修复后原四文件、完整 development-obligations 与 development-review 合并检查 94/94 通过，0 失败/跳过。新拒绝矩阵在修复前 31 项中 22 失败（含父测试），修复后全部通过；原四文件断言逐字不变。

原日志、源/补丁哈希、失败现场、探针及实际执行身份在 `D:\项目\pi research\tmp\large-file-512mib-20261025\batch3`；不复制大原件、原生会话或大份日志进 Git。实施 Astra/high、独立复核 Astra/xhigh 均已请求，实际运行时配置未回显。性能数字为本机一次测量。

## 尚未完成

本批的大 dataset 是计划/审查引用，计算仅使用原宿主 synthetic fixture；没有完成真实 512 MiB 正式运算或全数据科学 QA。后续仍需正式 code/data Run manifest、流式 staging、精确有界 formal facts/正式审查、大输出/local/SSH、文档/模型预算和必要上传接线。未验证外部模型 provider 或浏览器，主服务未切换。

## 最终必要修复的复核

只抽取原 13 行公共入口并让三个完整性操作在 SHA 前后复用，其余操作走原单次入口。没有改 SourceIntegrityContext、源/索引/ACK、Docker、预算、lease/RPC 或旧历史语义。新的独立 Astra/xhigh 会话确认 123 文件前后哈希一致、无阻断/非阻断产品发现；实际验证 SHA 后 generation/lifecycle/root permission 变化均拒绝，且 legacy/fixed finished 同键回放不需有效租约、无新的送达/接受。

最终隔离空输出构建与类型检查通过，797 文件相同，manifest `7f388a59e57a9ec9b29c8fcc112166f13e1186cdc19908f50ee676df227cf5c8`；依赖安装复用本批原 fresh npm ci，lock 未变。原 512 MiB 实跑发生于入口修复前快照；独立复核确认容量/reader/ACK/夹具实现哈希相同、额外入口工作与数据大小无关，因此复用该证据，未声称最终入口快照重跑了 512 MiB。原中断/失败日志均保留，没有声称重跑全量零失败。

两处复核合成临时目录的清理被自动批准检查以 `blocked by policy` 拒绝且无具体原因；已留存，未绕过，不影响代码或验收。探针自身的路径/权限夹具修正及部分命令失败均在独立报告中单独记录。精简机器记录见 `verification.json`，原证据仍在父 tmp，不复制进 Git。
