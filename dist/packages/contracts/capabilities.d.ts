/** Saved verification scope; current model and compute readiness are reported separately. */
export declare const CAPABILITIES: readonly [{
    readonly id: "local-text-evidence";
    readonly name: "可选本地原文检索";
    readonly stage: "M4";
    readonly status: "partial";
    readonly verification: "固定文档语料、授权、原文定位与来源撤销已验";
    readonly notes: "默认关闭，显式获准文本才进入语料；固定分块、TF-IDF与可选MMR，无自动科学回答。不是完整PaperQA SDK。";
}, {
    readonly id: "reviewed-skills";
    readonly name: "OpenResearch适配技能";
    readonly stage: "M2/M4";
    readonly status: "partial";
    readonly verification: "导入审阅、固定bundle、升级/回滚、真实Pi写作与图表/diagram产物已验";
    readonly notes: "12个主题模块与总览；按角色/摘要固定，资源审阅不授权脚本执行。新模板与领域写作按实际任务需要验收。";
}, {
    readonly id: "projects";
    readonly name: "本地项目 / 文件导入";
    readonly stage: "M1";
    readonly status: "implemented";
    readonly verification: "项目副本导入、受管Git工作区及离线备份/异址恢复已验";
    readonly notes: "输入原目录保留；备份限离线、同平台、单活动副本，目标必须不存在。";
}, {
    readonly id: "sessions";
    readonly name: "会话 / 排队 / 中止 / 分支";
    readonly stage: "M2";
    readonly status: "partial";
    readonly verification: "真实Pi工具调用、正常收尾、中止及原生ID异址续接已验";
    readonly notes: "会话/长消息稳定分页；原失败和中止历史保留。恢复沿原固定来源和技能，不替换成最新版。";
}, {
    readonly id: "pi";
    readonly name: "Pi SDK 执行内核";
    readonly stage: "M2";
    readonly status: "verified";
    readonly verification: "智谱真实Pi实现、文献/分析Task及独立审查已验";
    readonly notes: "固定0.87.1；仅证明记录中的供应商/模型路径。启动仍需本地依赖与凭据，其他供应商按目标环境验收；无模拟AI回退。";
}, {
    readonly id: "snapshots";
    readonly name: "固定运行契约 / 快照 / 审批";
    readonly stage: "M3";
    readonly status: "verified";
    readonly verification: "Git/CAS源码、测试/审查、批准整合、正式Run及来源撤销已验";
    readonly notes: "整合形成新子实验，冻结历史保留。WorkingGrant、RunGrant、DiscoveryGrant各自有界；外部发布另行授权。";
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
    readonly status: "verified";
    readonly verification: "本机Linux CPU正式Run、开发测试、取消及同容器恢复已验";
    readonly notes: "固定镜像摘要、只读源/数据、禁网与有限资源。CPU证据不证明GPU或其他主机；当前可用性另看目标探测与队列。";
}, {
    readonly id: "literature";
    readonly name: "文献检索与原文版本";
    readonly stage: "M4";
    readonly status: "partial";
    readonly verification: "五源元数据/摘要、指定arXiv PDF、PMC OA JATS和文档报告已有实网证据";
    readonly notes: "原始DocumentVersion与派生文本分开，PDF页段可回查；阅读顺序/表图结构有限。bioRxiv PDF 429、OpenAlex原件缺凭据保留环境待验，启用来源不保证网络或全文。";
}, {
    readonly id: "collaboration";
    readonly name: "多智能体开关 / DAG / 审查";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "真实独立Pi审查、Task Crossref发现/精确DOI及analyst Task RunGrant已验";
    readonly notes: "Task授权只覆盖已验角色与范围；WorkingGrant仍限主协调会话。固定输入、租约与成果验收保留；多Agent科学收益未证明，团队产品扩展暂缓。";
}, {
    readonly id: "budget";
    readonly name: "团队与活动尝试额度";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "原子预留、模型HTTP共享限流、计算预留及Grant永久计次已验";
    readonly notes: "HTTP、Worker和CPU/RAM分别管理，unknown继续占位。尝试/请求/Run上限不等于token或账单硬上限；无真实账单时不推算费用。";
}, {
    readonly id: "autonomous";
    readonly name: "Campaign / 轮次 / 四类决定";
    readonly stage: "M5";
    readonly status: "partial";
    readonly verification: "固定方案、有界修复、Wine/Anscombe比较和停止已有证据";
    readonly notes: "Repair/Refill/Promote/Stop与实测观测持久保存；决定、整合与Run遵循原批准。负结果保留，示例比较与模型建议不证明普遍科学优势。";
}, {
    readonly id: "root-wakeup";
    readonly name: "结果队列 / 主Pi唤醒综合";
    readonly stage: "M5";
    readonly status: "integration_unverified";
    readonly verification: "持久化/权限/实际子进程IPC测试；缺真实Pi自动唤醒证据";
    readonly notes: "有界分析、用户消息优先与未知用量保留；由实际任务触发目标验收，不以开发/审查会话代替自动综合实测。";
}, {
    readonly id: "workbench";
    readonly name: "科研工作台";
    readonly stage: "M6";
    readonly status: "partial";
    readonly verification: "React构建及既有浏览器科研流程已有历史证据";
    readonly notes: "前端布局与完整重构当前暂缓；固定原版逐屏对齐未完成。项目总览仍读取多类完整历史，Run/报告/会话另有有界入口。";
}, {
    readonly id: "evidence";
    readonly name: "类型化证据 / Claim / 固定报告";
    readonly stage: "M6";
    readonly status: "verified";
    readonly verification: "运行/文档原文、固定引用、报告与成果包实测；撤销阻断新交付";
    readonly notes: "固定ID、源码/测试、原始产物和页段可回查，旧正文/包字节保留。审查accept、退出码和文件存在不证明科学结论。";
}, {
    readonly id: "latex";
    readonly name: "LaTeX / PDF 编译预览";
    readonly stage: "M6";
    readonly status: "partial";
    readonly verification: "隔离三引擎/Bib、真实PDF、固定图形来源及论文审查/导出已验";
    readonly notes: "需已配置固定Docker镜像及单独批准，禁shell escape和网络。编译成功不等于排版或科学审查通过；缺包/错误/超限明确失败，新模板按需。";
}, {
    readonly id: "remote";
    readonly name: "SSH";
    readonly stage: "M7";
    readonly status: "partial";
    readonly verification: "SSH→Linux Docker隔离回环及嵌套源码修复已实测";
    readonly notes: "限用户配置并探测的SSH目标与受信Linux Docker监管器；外部SSH主机仍需目标验收，GPU资源分配尚未接入。回环不代替真实远端目标，当前可用性另看目标探测与队列。";
}, {
    readonly id: "code-handoff";
    readonly name: "受控代码产物交接";
    readonly stage: "M3/M5";
    readonly status: "verified";
    readonly verification: "真实Pi私有实现、Docker测试、独立审查及批准差异整合已验";
    readonly notes: "父来源、测试/审查与CAS绑定进入新子实验，受管Git历史已接入。产品不自动推送成果，其他恢复/并发组合按实际阻断补验。";
}, {
    readonly id: "publish";
    readonly name: "GitHub源码同步 / 成果发布 / Overleaf";
    readonly stage: "M8";
    readonly status: "partial";
    readonly verification: "本地TeX/PDF/成果包及GitHub隔离同步检查通过；CLI与账号只读状态已实测，真实远端创建/推送未验证";
    readonly notes: "项目默认本地；创建时明确选择后向固定个人私密仓库同步已提交源码及Git历史。科研成果发布和Overleaf仍未实现。";
}, {
    readonly id: "desktop";
    readonly name: "桌面安装 / 团队协作";
    readonly stage: "M8";
    readonly status: "not_implemented";
    readonly verification: "当前阶段暂缓";
    readonly notes: "桌面/更新/应用回滚及团队协作暂缓。当前本地服务为单用户回环鉴权。";
}, {
    readonly id: "parity";
    readonly name: "完整对齐与科研能力评测";
    readonly stage: "M0/M9";
    readonly status: "not_implemented";
    readonly verification: "固定上游与历史能力矩阵保留；完整对齐未证明";
    readonly notes: "PR01–14长期范围保留，当前按后端收口和指定真实任务试用完成；完整前端、多Agent收益与扩展矩阵按需求验收。";
}];
