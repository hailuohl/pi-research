import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
export const PI_VERSION = '0.87.1';
export function locatePi(repoRoot) {
    for (const base of [join(repoRoot, '.pi-runtime'), repoRoot]) {
        const pkg = join(base, 'node_modules', '@earendil-works', 'pi-coding-agent', 'package.json');
        if (existsSync(pkg)) {
            const require = createRequire(join(base, 'package.json'));
            return { base, version: JSON.parse(readFileSync(pkg, 'utf8')).version, sdkPath: require.resolve('@earendil-works/pi-coding-agent'), aiPath: require.resolve('@earendil-works/pi-ai') };
        }
    }
    return null;
}
export function inspectPi(repoRoot, model) {
    let found = null;
    try {
        found = locatePi(repoRoot);
    }
    catch { }
    const base = { expectedVersion: PI_VERSION, installedVersion: found?.version ?? null, node: process.versions.node, requiredNode: '>=22.19.0', liveVerified: false };
    if (!found)
        return { ...base, ready: false, code: 'PI_NOT_INSTALLED', message: 'Pi SDK 尚未安装。执行 npm run setup:pi；系统不会使用模拟 AI 代替。' };
    if (found.version !== PI_VERSION)
        return { ...base, ready: false, code: 'PI_VERSION_MISMATCH', message: `需要已核对接口的 Pi ${PI_VERSION}；当前版本不同。` };
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major < 22 || major === 22 && minor < 19)
        return { ...base, ready: false, code: 'PI_NODE_UNSUPPORTED', message: 'Pi 需要 Node.js ≥22.19.0；建议使用 Node.js 24。' };
    if (!model.provider || !model.model)
        return { ...base, ready: false, code: 'MODEL_NOT_CONFIGURED', message: '请设置供应商与模型 ID，然后创建新的主会话。' };
    return { ...base, ready: true, code: 'CONFIGURED_NOT_LIVE_VERIFIED', message: 'SDK 和模型配置可用；须实际调用验证凭据、接口与模型能力。' };
}
//# sourceMappingURL=runtime.js.map