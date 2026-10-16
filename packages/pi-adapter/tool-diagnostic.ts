import type {JsonSchema} from '../contracts/operations/schema.js';

const recoveryHints = {
    NOT_FOUND:'未找到指定资源。先读取当前会话或任务的索引，使用实际返回的 ID，不猜测 ID。',
    ARTIFACT_TEXT_REQUIRED:'该产物不支持文本读取。改用对应类型的读取入口，不重复按文本读取。',
    BRIEF_REQUIRED:'先读取当前研究计划，并等待用户确认后再准备运行或文稿。',
    BRIEF_NOT_CONFIRMED:'当前最新研究计划尚未确认。先读取计划并等待用户确认，再继续运行或制稿。',
    BRIEF_REFERENCE_MISMATCH:'重新读取当前已确认研究计划；文稿引用只能选用该计划列出的证据。',
    VERSION_CONFLICT:'重新读取最新版本，比较修改后再提交新请求，不覆盖其他操作的修改。',
    FILE_VERSION_CONFLICT:'重新读取文件及摘要，比较修改后再保存，不覆盖其他操作的修改。',
    TASK_SCOPE_DENIED:'资源不在任务批准范围内。只使用当前任务的固定输入与已授权上游成果。',
    SCOPE_DENIED:'当前身份不能访问该资源。使用本会话获准来源，不更换 ID 绕过限制。',
    AUTOMATION_SCOPE_DENIED:'资源不在本次自动分析的固定来源内。停止此操作，交回用户交互主会话处理。',
    SESSION_AUTOMATION_ACTION_UNAPPROVED:'自动唤醒不能执行此写入。交回用户交互主会话处理，不自动扩大授权。',
    PUBLICATION_REVIEW_INPUT_SCOPE:'论文审查只能引用同主会话或固定归档中的获准证据。重新核对实际来源。',
    LOG_RESET:'日志身份或游标已变化。使用 cursor=0、identity=null 从头重新读取。',
    MODEL_IMAGE_UNSUPPORTED:'当前模型目录未声明图片能力。需要图片时由用户选择已配置支持图片的模型。',
    REVIEW_REQUIRED:'关键任务需要独立审查。使用已有独立审查流程，不自行批准结果。',
    REVIEW_DEADLOCK:'审查通过 reviewOf 读取待验收成果，不设置等待该成果已验收的循环依赖。',
    REVIEW_VERDICT_REQUIRED:'审查结果需要明确 verdict；按当前工具契约提交意见。',
    TASK_OUTPUT_MISSING:'任务缺少声明的必需产物。核对当前角色可用工具与输出契约，不用上游产物替代。',
    EVIDENCE_REQUIRED:'结论引用必须出现在结果证据清单中。重新核对实际获准证据。',
    TEXT_EVIDENCE_DISABLED:'本地原文检索尚未启用。等待用户选择来源并明确启用，不自行授权。',
    SOURCE_DISABLED:'所选来源尚未启用。等待用户启用来源，不自行修改来源设置。',
    SESSION_ACTION_CONSUMED:'该固定批准已消费或效果待核对。回读真实状态，不自动重放操作。',
    SESSION_ACTION_EXECUTION_DENIED:'此入口只执行已批准的固定文本保存。使用对应操作的原有批准流程。',
    INTERNAL_ERROR:'内部异常。保留本次操作记录并核对本地诊断；效果不明时不自动重试。',
} as const;
export type ToolDiagnostic = {code:'APPROVAL_REQUIRED'} | {code:'INVALID_INPUT';path?:string;reason?:string} | {code:keyof typeof recoveryHints};
const reasons=new Set(['需要有限、无循环的 JSON 值','需要 JSON 对象','JSON 不支持 Symbol 字段','不符合允许的结构','不符合固定值','不在允许的取值内','类型不正确','文本长度超出范围','文本格式不正确','需要有效 YYYY-MM-DD 日期','数值超出范围','数组长度超出范围','数组不允许重复项','对象字段数量超出范围','缺少必需字段','未知字段']);

/** Only static schema properties and array indices may become public diagnostic paths. */
function knownPath(schema:JsonSchema,path:string):boolean {
    if(path.length>256||!/^\$(?:\.[^.[\]\s:]+|\[(?:0|[1-9][0-9]*)\])*$/.test(path))return false;
    const tokens=path.slice(1).match(/\.[^.[\]\s:]+|\[[0-9]+\]/g)??[];
    const walk=(rule:JsonSchema,index:number):boolean=>{
        if(index===tokens.length)return true;
        if(rule.anyOf?.some(branch=>walk(branch,index)))return true;
        const token=tokens[index];
        if(token.startsWith('['))return !!rule.items&&Number(token.slice(1,-1))<Math.min(rule.maxItems??10000,10000)&&walk(rule.items,index+1);
        const key=token.slice(1);
        return !!rule.properties&&Object.hasOwn(rule.properties,key)&&walk(rule.properties[key],index+1);
    };
    return walk(schema,0);
}

export function safeToolDiagnostic(schema:JsonSchema,code:unknown,message:unknown):ToolDiagnostic|undefined {
    if(code==='APPROVAL_REQUIRED')return {code};
    if(typeof code==='string'&&Object.hasOwn(recoveryHints,code))return {code:code as keyof typeof recoveryHints};
    if(code!=='INVALID_INPUT')return undefined;
    if(typeof message==='string'){
        const separator=message.indexOf(': '),path=message.slice(0,separator),reason=message.slice(separator+2);
        if(separator>=0&&reasons.has(reason)&&knownPath(schema,path))return {code,path,reason};
    }
    return {code};
}

/** Recovery text is fixed; raw errors can contain paths, credentials, or private input. */
export function toolFailureMessage(tool:string,diagnostic?:ToolDiagnostic):string {
    if(diagnostic?.code==='INVALID_INPUT')return `工具 ${tool} 调用失败（INVALID_INPUT${diagnostic.path?` — ${diagnostic.path}: ${diagnostic.reason}`:'：输入不符合工具要求'}）。请按完整调用示例核对参数；无参数工具也必须传 {"input":{}}。`;
    if(diagnostic&&Object.hasOwn(recoveryHints,diagnostic.code))return `工具 ${tool} 调用失败（${diagnostic.code}）。${recoveryHints[diagnostic.code as keyof typeof recoveryHints]}`;
    return `工具 ${tool} 调用失败。请查看智能体说明或对应任务的诊断。`;
}

/** Pinned Pi wraps a thrown error in exactly one text block; never forward that result. */
export function toolResultDiagnostic(schema:JsonSchema,result:unknown):ToolDiagnostic|undefined {
    const content=(result as {content?:Array<{type?:unknown;text?:unknown}>}|null)?.content;
    if(!Array.isArray(content)||content.length!==1||content[0]?.type!=='text'||typeof content[0].text!=='string')return undefined;
    const text=content[0].text,separator=text.indexOf(': ');
    if(separator<0)return undefined;
    return safeToolDiagnostic(schema,text.slice(0,separator),text.slice(separator+2));
}
