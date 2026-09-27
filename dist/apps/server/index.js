import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHttpServer } from './http.js';
const root = resolve(fileURLToPath(new URL('../../../', import.meta.url)));
if (existsSync(join(root, '.env')))
    process.loadEnvFile(join(root, '.env'));
const dataDir = resolve(process.env.PI_DATA_DIR ?? join(root, '.pi-research')), port = Number(process.env.PORT ?? 4317);
const service = createHttpServer({ repoRoot: root, dataDir, port });
try {
    const actual = await service.listen();
    console.log(`\nPi Research 0.3.1-experimental\n打开工作台：http://127.0.0.1:${actual}/#token=${service.token}\n数据目录：${dataDir}\n仅本机访问；请勿公开访问令牌。\n`);
}
catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
    await service.close();
}
let closing = false;
for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, async () => {
        if (closing)
            return;
        closing = true;
        console.log('停止 Agent 与控制服务；正式 Run 由独立监管进程继续管理。');
        await service.close();
        process.exit(0);
    });
//# sourceMappingURL=index.js.map