export declare const CAPABILITIES: readonly [{
    readonly id: "local-text-evidence";
    readonly name: "可选本地原文检索";
    readonly stage: "M4";
    readonly status: "partial";
    readonly verification: "离线服务、权限、引用定位、API与组件测试；不是完整PaperQA SDK验证";
    readonly notes: "默认关闭；获准用户UTF-8文本、固定分块、TF-IDF和PaperQA MMR选择流程移植、原文证据；无模型/联网/全文PDF/自动回答。";
}, {
    readonly id: "reviewed-skills";
    readonly name: "OpenResearch适配技能";
    readonly stage: "M2/M4";
    readonly status: "partial";
    readonly verification: "目录/哈希/角色/工具和Worker IPC契约；真实Pi行为未测";
    readonly notes: "13个模块与总览，按需读取并绑定bundle摘要。无ORX执行器；不可用能力显式标记。";
}, {
    readonly id: "projects";
    readonly name: "本地项目 / 文件导入";
    readonly stage: "M1";
    readonly status: "implemented";
    readonly verification: "本地自动化测试";
    readonly notes: "本地目录副本导入（API/CLI）、项目与文件管理；不修改原目录。未实现Git历史导入或远程完整工作台。";
}, {
    readonly id: "sessions";
    readonly name: "会话 / 排队 / 中止 / 分支";
    readonly stage: "M2";
    readonly status: "partial";
    readonly verification: "状态与接口测试";
    readonly notes: "应用层分支保存历史；Pi 原生 Session 恢复接口已接入但未实网验证。";
}, {
    readonly id: "pi";
    readonly name: "Pi SDK 执行内核";
    readonly stage: "M2";
    readonly status: "integration_unverified";
    readonly verification: "适配器契约测试；无真实供应商调用";
    readonly notes: "固定0.87.1；无模拟AI回退；需要本地安装并提供模型凭据。";
}, {
    readonly id: "snapshots";
    readonly name: "固定运行契约 / 快照 / 审批";
    readonly stage: "M3";
    readonly status: "implemented";
    readonly verification: "真实本地运行测试";
    readonly notes: "内容寻址快照，不伪造 Git commit。Git分支整合未实现。";
}, {
    readonly id: "runner-local";
    readonly name: "本地受信数值示例 Runner";
    readonly stage: "M3";
    readonly status: "verified";
    readonly verification: "独立监管进程实测";
    readonly notes: "仅允许随包审计的固定示例代码；不是任意代码沙箱。";
}, {
    readonly id: "runner-docker";
    readonly name: "Docker 任意代码 Runner";
    readonly stage: "M3";
    readonly status: "integration_unverified";
    readonly verification: "参数构建与失败关闭；本环境无Docker";
    readonly notes: "固定镜像摘要、只读挂载、禁网；真实容器验收未完成。";
}, {
    readonly id: "literature";
    readonly name: "文献检索与全文";
    readonly stage: "M4";
    readonly status: "partial";
    readonly verification: "多源协议/错误/授权夹具测试；实网尚未验收";
    readonly notes: "alphaXiv关键词/语义与文本提取，OpenAlex/bioRxiv/PubMed摘要，Crossref元数据；返回来源和原始响应。无PDF页/图提取。";
}, {
    readonly id: "collaboration";
    readonly name: "多智能体开关 / DAG / 审查";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "确定性服务测试";
    readonly notes: "独立会话、尝试、输入范围、租约、关闭收尾；已增加显式产物合同、提交/验收两阶段依赖校验、冲突审查聚合与部分结果重试；真实多Pi对照未完成。";
}, {
    readonly id: "budget";
    readonly name: "团队与活动尝试额度";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "原子预留测试";
    readonly notes: "为自动综合保留额度；硬限制是Agent执行尝试次数，不是供应商账单硬上限；实际token/cost单独记录。";
}, {
    readonly id: "autonomous";
    readonly name: "Campaign / 轮次 / 四类决定";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "真实4次计算、两轮血缘、审批与恢复测试";
    readonly notes: "已实现持久化观测与Repair/Refill/Promote/Stop；决定和Run各自批准。不是全无人干预科研，真实Pi决策质量未验证。";
}, {
    readonly id: "root-wakeup";
    readonly name: "结果队列 / 主Pi唤醒综合";
    readonly stage: "M5";
    readonly status: "integration_unverified";
    readonly verification: "持久化/权限/实际子进程IPC测试；不含真实Pi";
    readonly notes: "团队完成和Run观测可触发有界分析；用户消息优先、自动工具权限收窄、暂停取消、预留与未知用量。Pi供应商调用仍需目标环境验收。";
}, {
    readonly id: "workbench";
    readonly name: "科研工作台";
    readonly stage: "M6";
    readonly status: "implemented";
    readonly verification: "构建、HTTP与纯组件契约；浏览器E2E受策略阻止";
    readonly notes: "独立UI，尚未完成原版逐屏对标。";
}, {
    readonly id: "evidence";
    readonly name: "类型化证据 / Claim / Markdown报告";
    readonly stage: "M6";
    readonly status: "implemented";
    readonly verification: "引用校验与真实指标测试";
    readonly notes: "文本与运行证据；科研审查不等同于科学正确性的证明。";
}, {
    readonly id: "latex";
    readonly name: "LaTeX / PDF 编译预览";
    readonly stage: "M6";
    readonly status: "not_implemented";
    readonly verification: "无";
    readonly notes: "仅输出Markdown报告；无LaTeX执行器。";
}, {
    readonly id: "remote";
    readonly name: "SSH / Slurm / K8s / Ray / HF / Modal / Tinker";
    readonly stage: "M7";
    readonly status: "not_implemented";
    readonly verification: "无";
    readonly notes: "未宣称支持；无假提交或假取消。";
}, {
    readonly id: "code-handoff";
    readonly name: "受控代码产物交接";
    readonly stage: "M3/M5";
    readonly status: "partial";
    readonly verification: "文件摘要、审批、真实数值运行、HTTP与组件测试";
    readonly notes: "支持已验收文本产物映射到固定父快照，经用户批准创建新子实验；无自动Git合并或开发测试。";
}, {
    readonly id: "publish";
    readonly name: "Git发布 / Overleaf";
    readonly stage: "M8";
    readonly status: "not_implemented";
    readonly verification: "无";
    readonly notes: "无自动提交、推送、远程发布或双向同步。";
}, {
    readonly id: "desktop";
    readonly name: "桌面安装 / 托管计算 / 团队账户";
    readonly stage: "M8";
    readonly status: "not_implemented";
    readonly verification: "无";
    readonly notes: "当前是单用户、回环地址Web应用。";
}, {
    readonly id: "parity";
    readonly name: "完整对齐与科研能力评测";
    readonly stage: "M0/M9";
    readonly status: "not_implemented";
    readonly verification: "功能矩阵保留所有缺口";
    readonly notes: "已静态对照固定提交的实验树、委派、证据规则及agent.rs；未运行固定原版逐屏验收，不声称完成完整复刻。";
}];
