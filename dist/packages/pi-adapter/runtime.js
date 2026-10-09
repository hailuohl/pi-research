import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
export const PI_VERSION = '0.87.1';
export const MODEL_HTTP_TIMEOUT_MS = 600000;
export const PROVIDER_TIMEOUT_FAILURE = 'PROVIDER_TIMEOUT: 模型请求等待超时；已完成的工具操作和历史保留，请在原会话核对后继续，避免重复已完成操作。';
export function isProviderTimeout(error) {
    const value = error && typeof error === 'object' ? error : undefined;
    const message = typeof error === 'string' ? error : value?.message;
    return ['APIConnectionTimeoutError', 'TimeoutError'].includes(String(value?.name))
        || [value?.code, value?.cause?.code].some(code => ['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'].includes(String(code)))
        || typeof message === 'string' && (/^Request timed out\.?$/.test(message) || /^PROVIDER_TIMEOUT(?:$|:)/.test(message));
}
export function locatePi(repoRoot) {
    for (const base of [repoRoot, join(repoRoot, '.pi-runtime')]) {
        const pkg = join(base, 'node_modules', '@earendil-works', 'pi-coding-agent', 'package.json');
        if (existsSync(pkg)) {
            try {
                const aiPackage = join(base, 'node_modules', '@earendil-works', 'pi-ai', 'package.json');
                const sdk = JSON.parse(readFileSync(pkg, 'utf8')), ai = JSON.parse(readFileSync(aiPackage, 'utf8'));
                // Pinned packages export ESM only; require.resolve rejects import-only exports.
                const sdkPath = join(base, 'node_modules', '@earendil-works', 'pi-coding-agent', sdk.exports?.['.']?.import ?? sdk.main);
                const aiPath = join(base, 'node_modules', '@earendil-works', 'pi-ai', ai.exports?.['.']?.import ?? ai.main);
                if (!existsSync(sdkPath) || !existsSync(aiPath))
                    throw new Error('missing entrypoint');
                return { base, version: sdk.version, aiVersion: ai.version, sdkPath, aiPath };
            }
            catch {
                throw new Error('PI_INSTALL_INCOMPLETE: Pi SDK 或 pi-ai 安装不完整，请重新运行 setup:pi');
            }
        }
    }
    return null;
}
export function piFailure(error) {
    if (isProviderTimeout(error))
        return PROVIDER_TIMEOUT_FAILURE;
    const raw = error instanceof Error ? error.message : String(error);
    const message = process.env.PI_API_KEY ? raw.replaceAll(process.env.PI_API_KEY, '[REDACTED]') : raw;
    if (/^(PI_|MODEL_|SDK_|TOOL_|AUTH_|PROVIDER_|PERMISSION_|REQUEST_ABORTED)/.test(message))
        return message;
    if (/SCOPE_DENIED|PERMISSION_DENIED|LEASE_EXPIRED|FORBIDDEN/.test(message))
        return `PERMISSION_DENIED: ${message}`;
    if (/\b401\b|unauthori[sz]ed|invalid.api.key|authentication|no.api.key|missing.api.key/i.test(message))
        return `AUTH_FAILED: ${message}`;
    if (/\b403\b|permission denied|access denied/i.test(message))
        return `PERMISSION_DENIED: ${message}`;
    return `PROVIDER_FAILED: ${message}`;
}
export function inspectPi(repoRoot, model) {
    let found = null, failure;
    try {
        found = locatePi(repoRoot);
    }
    catch (error) {
        failure = piFailure(error);
    }
    const base = { expectedVersion: PI_VERSION, installedVersion: found?.version ?? null, node: process.versions.node, requiredNode: '>=22.19.0', liveVerified: false };
    if (failure)
        return { ...base, ready: false, code: 'PI_INSTALL_INCOMPLETE', message: failure };
    if (!found)
        return { ...base, ready: false, code: 'PI_NOT_INSTALLED', message: 'Pi SDK 尚未安装。执行 npm run setup:pi；系统不会使用模拟 AI 代替。' };
    if (found.version !== PI_VERSION || found.aiVersion !== PI_VERSION)
        return { ...base, ready: false, code: 'PI_VERSION_MISMATCH', message: `需要已核对接口的 Pi 与 pi-ai ${PI_VERSION}；当前版本不同。` };
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || major === 22 && minor < 19)
        return { ...base, ready: false, code: 'PI_NODE_UNSUPPORTED', message: 'Pi 需要 Node.js ≥22.19.0；建议使用固定的 Node.js 24。' };
    if (!model.provider || !model.model)
        return { ...base, ready: false, code: 'MODEL_NOT_CONFIGURED', message: '请设置供应商与模型 ID，然后创建新的主会话。' };
    return { ...base, ready: true, code: 'CONFIGURED_NOT_LIVE_VERIFIED', message: 'SDK 和模型配置可用；须实际调用验证凭据、接口与模型能力。' };
}
//# sourceMappingURL=runtime.js.map