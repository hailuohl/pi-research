const reasons = new Set(['需要有限、无循环的 JSON 值', '需要 JSON 对象', 'JSON 不支持 Symbol 字段', '不符合允许的结构', '不符合固定值', '不在允许的取值内', '类型不正确', '文本长度超出范围', '文本格式不正确', '需要有效 YYYY-MM-DD 日期', '数值超出范围', '数组长度超出范围', '数组不允许重复项', '对象字段数量超出范围', '缺少必需字段', '未知字段']);
/** Only static schema properties and array indices may become public diagnostic paths. */
function knownPath(schema, path) {
    if (path.length > 256 || !/^\$(?:\.[^.[\]\s:]+|\[(?:0|[1-9][0-9]*)\])*$/.test(path))
        return false;
    const tokens = path.slice(1).match(/\.[^.[\]\s:]+|\[[0-9]+\]/g) ?? [];
    const walk = (rule, index) => {
        if (index === tokens.length)
            return true;
        if (rule.anyOf?.some(branch => walk(branch, index)))
            return true;
        const token = tokens[index];
        if (token.startsWith('['))
            return !!rule.items && Number(token.slice(1, -1)) < Math.min(rule.maxItems ?? 10000, 10000) && walk(rule.items, index + 1);
        const key = token.slice(1);
        return !!rule.properties && Object.hasOwn(rule.properties, key) && walk(rule.properties[key], index + 1);
    };
    return walk(schema, 0);
}
export function safeToolDiagnostic(schema, code, message) {
    if (code === 'APPROVAL_REQUIRED')
        return { code };
    if (code !== 'INVALID_INPUT')
        return undefined;
    if (typeof message === 'string') {
        const separator = message.indexOf(': '), path = message.slice(0, separator), reason = message.slice(separator + 2);
        if (separator >= 0 && reasons.has(reason) && knownPath(schema, path))
            return { code, path, reason };
    }
    return { code };
}
/** Pinned Pi wraps a thrown error in exactly one text block; never forward that result. */
export function toolResultDiagnostic(schema, result) {
    const content = result?.content;
    if (!Array.isArray(content) || content.length !== 1 || content[0]?.type !== 'text' || typeof content[0].text !== 'string')
        return undefined;
    const text = content[0].text, separator = text.indexOf(': ');
    if (separator < 0)
        return undefined;
    return safeToolDiagnostic(schema, text.slice(0, separator), text.slice(separator + 2));
}
//# sourceMappingURL=tool-diagnostic.js.map