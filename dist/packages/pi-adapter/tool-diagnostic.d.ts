import type { JsonSchema } from '../contracts/operations/schema.js';
declare const recoveryHints: {
    readonly NOT_FOUND: "未找到指定资源。先读取当前会话或任务的索引，使用实际返回的 ID，不猜测 ID。";
    readonly ARTIFACT_TEXT_REQUIRED: "该产物不支持文本读取。改用对应类型的读取入口，不重复按文本读取。";
    readonly BRIEF_REQUIRED: "先读取当前研究计划，并等待用户确认后再准备运行或文稿。";
    readonly BRIEF_NOT_CONFIRMED: "当前最新研究计划尚未确认。先读取计划并等待用户确认，再继续运行或制稿。";
    readonly BRIEF_REFERENCE_MISMATCH: "重新读取当前已确认研究计划；文稿引用只能选用该计划列出的证据。";
    readonly VERSION_CONFLICT: "重新读取最新版本，比较修改后再提交新请求，不覆盖其他操作的修改。";
    readonly FILE_VERSION_CONFLICT: "重新读取文件及摘要，比较修改后再保存，不覆盖其他操作的修改。";
    readonly TASK_SCOPE_DENIED: "资源不在任务批准范围内。只使用当前任务的固定输入与已授权上游成果。";
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
    readonly TEXT_EVIDENCE_DISABLED: "本地原文检索尚未启用。等待用户选择来源并明确启用，不自行授权。";
    readonly SOURCE_DISABLED: "所选来源尚未启用。等待用户启用来源，不自行修改来源设置。";
    readonly SESSION_ACTION_CONSUMED: "该固定批准已消费或效果待核对。回读真实状态，不自动重放操作。";
    readonly SESSION_ACTION_EXECUTION_DENIED: "此入口只执行已批准的固定文本保存。使用对应操作的原有批准流程。";
    readonly INTERNAL_ERROR: "内部异常。保留本次操作记录并核对本地诊断；效果不明时不自动重试。";
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
export declare function toolFailureMessage(tool: string, diagnostic?: ToolDiagnostic): string;
/** Pinned Pi wraps a thrown error in exactly one text block; never forward that result. */
export declare function toolResultDiagnostic(schema: JsonSchema, result: unknown): ToolDiagnostic | undefined;
export {};
