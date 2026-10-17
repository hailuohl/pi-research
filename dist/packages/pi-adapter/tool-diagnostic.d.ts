import type { JsonSchema } from '../contracts/operations/schema.js';
declare const recoveryHints: {
    readonly NOT_FOUND: "未找到指定资源。先读取当前会话或任务的索引，使用实际返回的 ID，不猜测 ID。";
    readonly ARTIFACT_TEXT_REQUIRED: "产物不是有效文本或超过读取范围。当前独立开发审查可按原日志 artifactId 分页；其他文本上限 2 MiB，二进制产物使用对应类型入口，不重复尝试相同请求。";
    readonly BRIEF_REQUIRED: "先读取当前研究计划，并等待用户确认后再准备运行或文稿。";
    readonly BRIEF_NOT_CONFIRMED: "当前最新研究计划尚未确认。先读取计划并等待用户确认，再继续运行或制稿。";
    readonly BRIEF_REFERENCE_MISMATCH: "重新读取当前已确认研究计划；文稿引用只能选用该计划列出的证据。";
    readonly VERSION_CONFLICT: "重新读取最新版本，比较修改后再提交新请求，不覆盖其他操作的修改。";
    readonly FILE_VERSION_CONFLICT: "重新读取文件及摘要，比较修改后再保存，不覆盖其他操作的修改。";
    readonly TASK_SCOPE_DENIED: "资源不在任务批准范围内。只使用当前任务的固定输入与已授权上游成果。";
    readonly PERMISSION_DENIED: "当前身份没有此操作所需授权。只使用当前会话或宿主派发任务的可用工具，不伪造身份或重复尝试；需要额外授权时交回用户处理。";
    readonly SCOPE_DENIED: "当前身份不能访问该资源。使用本会话获准来源，不更换 ID 绕过限制。";
    readonly AUTOMATION_SCOPE_DENIED: "资源不在本次自动分析的固定来源内。停止此操作，交回用户交互主会话处理。";
    readonly SESSION_AUTOMATION_ACTION_UNAPPROVED: "自动唤醒不能执行此写入。交回用户交互主会话处理，不自动扩大授权。";
    readonly PUBLICATION_REVIEW_INPUT_SCOPE: "论文审查只能引用同主会话或固定归档中的获准证据。重新核对实际来源。";
    readonly LOG_RESET: "日志身份或游标已变化。使用 cursor=0、identity=null 从头重新读取。";
    readonly MODEL_IMAGE_UNSUPPORTED: "当前模型目录未声明图片能力。需要图片时由用户选择已配置支持图片的模型。";
    readonly REVIEW_REQUIRED: "关键任务需要独立审查。使用已有独立审查流程，不自行批准结果。";
    readonly REVIEW_DEADLOCK: "审查通过 reviewOf 读取待验收成果，不设置等待该成果已验收的循环依赖。";
    readonly REVIEW_VERDICT_REQUIRED: "审查结果需要明确 verdict；按当前工具契约提交意见。";
    readonly TASK_OUTPUT_MISSING: "任务缺少声明的必需产物。核对当前角色可用工具与输出契约，不用上游产物替代。";
    readonly EVIDENCE_REQUIRED: "结论引用必须出现在结果证据清单中。重新核对实际获准证据。";
    readonly EVIDENCE_EXACT_QUOTE_REQUIRED: "从实际正文逐字复制 exactQuote，不传自由 description，不猜 start/end；解释与研究断言另行提出。";
    readonly EVIDENCE_QUOTE_NOT_FOUND: "exactQuote 不在原文中。重新读取正文并保留原空格与换行，不改写、归一化或用省略号替代。";
    readonly EVIDENCE_QUOTE_AMBIGUOUS: "exactQuote 在原文重复。扩展引文至唯一上下文，或提供已核对的准确 UTF-16 start/end；不能猜第一个匹配。";
    readonly EVIDENCE_QUOTE_MISMATCH: "引文与指定 start/end 不一致。重新核对原文或使用唯一 exactQuote 自动定位，不估算位置。";
    readonly TEXT_EVIDENCE_DISABLED: "本地原文检索尚未启用。等待用户选择来源并明确启用，不自行授权。";
    readonly SOURCE_DISABLED: "所选来源尚未启用。等待用户启用来源，不自行修改来源设置。";
    readonly SESSION_ACTION_CONSUMED: "该固定批准已消费或效果待核对。回读真实状态，不自动重放操作。";
    readonly SESSION_ACTION_NOTICE_REQUIRED: "当前调用没有有效的宿主批准通知绑定。停止恢复，不猜 ID 或自行建立通知。";
    readonly SESSION_ACTION_RESUME_DENIED: "此操作不支持固定恢复入口。通过 session_action_inspect 回读准确批准参数，再调用原工具；不要重试 resume。";
    readonly SESSION_ACTION_NOT_APPROVED: "固定操作未获批准、已消费、失败或状态未知。停止恢复，核对真实状态，不自动重试副作用。";
    readonly SESSION_ACTION_STALE: "固定操作的权限或来源已变化。停止恢复，不改参数绕过原批准。";
    readonly SESSION_ACTION_EXECUTION_DENIED: "此入口只执行已批准的固定文本保存。使用对应操作的原有批准流程。";
    readonly INTERNAL_ERROR: "内部异常。按诊断ID核对本机记录；未给出ID表示诊断未保存。效果不明时不自动重试。";
};
export type ToolDiagnostic = {
    code: 'APPROVAL_REQUIRED';
} | {
    code: 'INVALID_INPUT';
    path?: string;
    reason?: string;
} | {
    code: keyof typeof recoveryHints;
};
export declare function safeToolDiagnostic(schema: JsonSchema, code: unknown, message: unknown): ToolDiagnostic | undefined;
/** Recovery text is fixed; raw errors can contain paths, credentials, or private input. */
export declare function toolFailureMessage(tool: string, diagnostic?: ToolDiagnostic, diagnosticId?: string): string;
/** Pinned Pi wraps a thrown error in exactly one text block; never forward that result. */
export declare function toolResultDiagnostic(schema: JsonSchema, result: unknown): ToolDiagnostic | undefined;
export {};
