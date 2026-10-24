import type {JsonSchema} from '../contracts/operations/schema.js';
import {LOCAL_ENTRY_HINT} from '../runners/local-entry.js';

const recoveryHints = {
    NOT_FOUND:'未找到指定资源。先读取当前会话或任务的索引，使用实际返回的 ID，不猜测 ID。',
    ARTIFACT_TEXT_REQUIRED:'产物不是有效文本或超过读取范围。当前独立开发审查可按原日志 artifactId 分页；其他文本上限 2 MiB，二进制产物使用对应类型入口，不重复尝试相同请求。',
    BRIEF_REQUIRED:'先读取当前研究计划，并等待用户确认后再准备运行或文稿。',
    BRIEF_NOT_CONFIRMED:'当前最新研究计划尚未确认。先读取计划并等待用户确认，再继续运行或制稿。',
    BRIEF_REFERENCE_MISMATCH:'重新读取当前已确认研究计划；文稿引用只能选用该计划列出的证据。',
    VERSION_CONFLICT:'重新读取最新版本，比较修改后再提交新请求，不覆盖其他操作的修改。',
    FILE_VERSION_CONFLICT:'重新读取文件及摘要，比较修改后再保存，不覆盖其他操作的修改。',
    LOCAL_ENTRY_INVALID:LOCAL_ENTRY_HINT,
    TASK_SCOPE_DENIED:'资源不在任务批准范围内。只使用当前任务的固定输入与已授权上游成果。',
    PERMISSION_DENIED:'当前身份没有此操作所需授权。只使用当前会话或宿主派发任务的可用工具，不伪造身份或重复尝试；需要额外授权时交回用户处理。',
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
    EVIDENCE_EXACT_QUOTE_REQUIRED:'从实际正文逐字复制 exactQuote，不传自由 description，不猜 start/end；解释与研究断言另行提出。',
    EVIDENCE_QUOTE_NOT_FOUND:'exactQuote 不在原文中。重新读取正文并保留原空格与换行，不改写、归一化或用省略号替代。',
    EVIDENCE_QUOTE_AMBIGUOUS:'exactQuote 在原文重复。扩展引文至唯一上下文，或提供已核对的准确 UTF-16 start/end；不能猜第一个匹配。',
    EVIDENCE_QUOTE_MISMATCH:'引文与指定 start/end 不一致。重新核对原文或使用唯一 exactQuote 自动定位，不估算位置。',
    TEXT_EVIDENCE_DISABLED:'本地原文检索尚未启用。等待用户选择来源并明确启用，不自行授权。',
    SOURCE_DISABLED:'所选来源尚未启用。等待用户启用来源，不自行修改来源设置。',
    CONNECTOR_CANCELLED:'文献读取超时或已取消，未完成的论文结果没有保存。先回读当前状态；仍需读取时由用户决定是否重新发起，不自动重试。',
    CONNECTOR_UNAVAILABLE:'暂时无法连接文献来源，不能据此判断论文不存在。核对网络与来源状态，待恢复后由用户决定是否重新发起。',
    CONNECTOR_RATE_LIMITED:'文献来源限制了请求频率。停止连续请求，等待限流解除后由用户决定是否重新发起。',
    CONNECTOR_HTTP_ERROR:'文献来源返回失败状态。核对来源服务状态与论文标识，不把失败响应当作原文，不自动重试。',
    CONNECTOR_RESPONSE_TOO_LARGE:'文献响应超过允许大小，未保存为论文。使用已授权的其他来源或导入入口，不拆分请求绕过大小限制。',
    CONNECTOR_HOST_DENIED:'文献地址不在固定 HTTPS 来源内。使用工具支持的论文标识与来源，不改用任意地址绕过限制。',
    CONNECTOR_BUDGET_EXCEEDED:'连接器 HTTP 请求额度已用尽。停止新请求，交回用户核对额度与已有结果，不自行提高额度。',
    CONNECTOR_SETTINGS_CHANGED:'读取期间来源设置已改变，本次结果未采纳。回读当前设置并等待用户决定，不绕过来源撤回。',
    CONNECTOR_SECRET_IN_RESPONSE:'来源响应含配置凭据或联系信息，已拒绝保存。交回用户核对来源与配置，不转述响应正文或敏感信息。',
    CONNECTOR_CREDENTIAL_REQUIRED:'该文献入口需要用户配置来源凭据。等待用户配置，不猜测凭据或改用未授权入口。',
    CONNECTOR_FAILED:'文献读取失败，不能据此判断论文不存在。回读当前状态并核对本机诊断，效果不明时不自动重试。',
    PAPER_NOT_FOUND:'来源没有返回指定论文。核对实际论文标识、来源与版本，不猜测替代标识或声称已读取原文。',
    FULL_TEXT_UNAVAILABLE:'来源没有返回可用原文。使用已授权的其他原文来源或导入入口，不用 HTML、生成报告或摘要代替全文。',
    PAPER_ID_MISMATCH:'来源返回的论文与请求标识不一致，结果未采纳。核对论文标识与来源，不把其他论文登记为本篇原文。',
    PAPER_ID_INVALID:'论文标识格式无效或不受支持。使用来源实际返回的 DOI、arXiv ID、OpenAlex ID 或 PMID，不传任意网址或猜测标识。',
    PAPER_SOURCE_MISMATCH:'论文标识与所选来源不匹配。核对标识类型与来源，使用工具支持的对应来源，不改写标识绕过限制。',
    PROVIDER_SCHEMA_INVALID:'来源响应格式或文本编码无效，结果未采纳。核对来源状态与本机诊断，不把异常响应当作论文内容。',
    SESSION_ACTION_CONSUMED:'该固定批准已消费或效果待核对。回读真实状态，不自动重放操作。',
    SESSION_ACTION_NOTICE_REQUIRED:'当前调用没有有效的宿主批准通知绑定。停止恢复，不猜 ID 或自行建立通知。',
    SESSION_ACTION_RESUME_DENIED:'此操作不支持固定恢复入口。通过 session_action_inspect 回读准确批准参数，再调用原工具；不要重试 resume。',
    SESSION_ACTION_NOT_APPROVED:'固定操作未获批准、已消费、失败或状态未知。停止恢复，核对真实状态，不自动重试副作用。',
    SESSION_ACTION_STALE:'固定操作的权限或来源已变化。停止恢复，不改参数绕过原批准。',
    SESSION_ACTION_EXECUTION_DENIED:'此入口只执行已批准的固定文本保存。使用对应操作的原有批准流程。',
    INTERNAL_ERROR:'内部异常。按诊断ID核对本机记录；未给出ID表示诊断未保存。效果不明时不自动重试。',
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
export function toolFailureMessage(tool:string,diagnostic?:ToolDiagnostic,diagnosticId?:string):string {
    if(diagnostic?.code==='INVALID_INPUT')return `工具 ${tool} 调用失败（INVALID_INPUT${diagnostic.path?` — ${diagnostic.path}: ${diagnostic.reason}`:'：输入不符合工具要求'}）。请按完整调用示例核对参数；无参数工具也必须传 {"input":{}}。`;
    if(diagnostic&&Object.hasOwn(recoveryHints,diagnostic.code))return `工具 ${tool} 调用失败（${diagnostic.code}）。${recoveryHints[diagnostic.code as keyof typeof recoveryHints]}${diagnosticId&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(diagnosticId)?` 诊断ID：${diagnosticId}`:''}`;
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
