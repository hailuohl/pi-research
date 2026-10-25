import { assertProjectWritable } from '../../packages/policy/lifecycle.js';
import { operationRoute } from './operation-routes.js';
import { readNativeRoute, writeNativeRoute } from './native-routes.js';
import { attachmentRoute } from './attachment-routes.js';
import { writeEnvironment } from './environment-routes.js';
import { configureModelConnection, bindModelRestoreEpoch } from '../../packages/pi-adapter/model-connections.js';
import { inspectModelManagement, configureModelManagement, recommendModel, prepareModelSelection } from '../../packages/pi-adapter/model-management.js';
import { probeModel } from '../../packages/pi-adapter/model-probe.js';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ResearchApp } from '../../packages/research-app.js';
import { AgentHost } from '../../packages/scheduler/agent-host.js';
import { asError, DomainError, ensure } from '../../packages/domain/errors.js';
import { text, object } from '../../packages/contracts/validation.js';
import { safePath } from '../../packages/workspace/files.js';
import { USER } from '../../packages/domain/types.js';
import { readRoute, writeRoute, guardProjectRoute } from './routes.js';
import { EventStreamHub, eventQuery } from './event-stream.js';
import { documentFileRoute, DOCUMENT_UPLOAD_TIMEOUT_MS } from './document-file-routes.js';
import { filePolicy } from '../../packages/storage/file-policy.js';
export function createHttpServer(options) {
    filePolicy();
    const app = new ResearchApp(options.dataDir, options.repoRoot), host = new AgentHost(app);
    const events = new EventStreamHub(app.store);
    let port = options.port ?? 4317;
    const server = http.createServer(async (req, res) => {
        const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
        Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
        const json = (value, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(publicRecords(value))); };
        try {
            const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
            ensure(allowed.includes(req.headers.host ?? ''), 'HOST_DENIED', '只允许回环地址访问', 403);
            const url = new URL(req.url ?? '/', `http://${req.headers.host}`), path = url.pathname;
            if (path === '/api/health') {
                ensure(req.method === 'GET', 'METHOD_NOT_ALLOWED', '请求方法不支持', 405);
                return json({ ok: true, version: '0.3.1-experimental', mode: 'local-owner-only' });
            }
            if (path.startsWith('/api/')) {
                const route = path.slice(4);
                const documentFile = await documentFileRoute(app, route, url, req, res);
                if (documentFile)
                    return json(documentFile.result);
                if (req.method === 'GET') {
                    guardProjectRoute(app, route);
                    const attachment = attachmentRoute(app, route, url, req.method);
                    if (attachment)
                        return json(attachment.result);
                    const native = readNativeRoute(app.nativeRequests, route, url);
                    if (native !== undefined)
                        return json(native);
                    if (route === '/settings/model-management') {
                        ensure(url.search === '', 'INVALID_INPUT', '模型管理目录不接受查询参数', 400);
                        return json(await inspectModelManagement(app.context, USER));
                    }
                    if (route === '/settings/model-recommendations') {
                        ensure([...url.searchParams.keys()].every(k => ['provider', 'model'].includes(k)) && url.searchParams.getAll('provider').length === 1 && url.searchParams.getAll('model').length === 1, 'INVALID_INPUT', '推荐只接受一个供应商与模型ID', 400);
                        return json(await recommendModel(app.context, USER, text(url.searchParams.get('provider'), 'provider', 100), text(url.searchParams.get('model'), 'model', 160)));
                    }
                    if (route === '/bootstrap') {
                        const view = await inspectModelManagement(app.context, USER), bootstrap = readRoute(app, host, route, url);
                        return json({ ...bootstrap, models: view.providers.filter(p => p.enabled && !p.deletedAt && !p.requiresCredential).flatMap(p => p.models.filter(m => m.enabled && !m.deletedAt).flatMap(m => m.reasoning.levels.map(l => ({ provider: p.provider, model: m.model, thinking: l.id, ...(m.restoreEpoch ? { restoreEpoch: m.restoreEpoch } : {}) })))) });
                    }
                    if (route === '/github/status')
                        return json(await app.github.status({ type: 'user' }));
                    if (route === '/events/stream') {
                        const query = eventQuery(url, true, req.headers['last-event-id']);
                        if (query.projectId)
                            app.projects.read(USER, query.projectId);
                        events.open(req, res, query);
                        return;
                    }
                    if (route === '/operations')
                        return json(app.operations.specs());
                    const files = route.match(/^\/projects\/([^/]+)\/files$/);
                    if (files)
                        ensure([...url.searchParams.keys()].every(key => key === 'path') && url.searchParams.getAll('path').length <= 1, 'INVALID_INPUT', '项目文件接口只接受 path；指定实验版本请使用 experiment_source_read', 400);
                    if (files && url.searchParams.has('path'))
                        return json(await app.operations.execute(USER, 'workspace_read', { source: 'project', path: url.searchParams.get('path') }, { projectId: files[1] }));
                    const match = route.match(/^\/artifacts\/([^/]+)\/content$/);
                    if (match) {
                        const { artifact, bytes } = app.evidence.read(USER, match[1]);
                        res.setHeader('Content-Type', 'application/octet-stream');
                        res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
                        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(artifact.title)}`);
                        return res.end(bytes);
                    }
                    return json(readRoute(app, host, route, url));
                }
                ensure(['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method ?? ''), 'METHOD_NOT_ALLOWED', '请求方法不支持', 405);
                ensure((req.headers['content-type'] ?? '').startsWith('application/json'), 'UNSUPPORTED_MEDIA_TYPE', '请使用 application/json', 415);
                const rawKey = req.headers['idempotency-key'];
                const key = rawKey === undefined && route.startsWith('/operations/') ? undefined : text(rawKey, 'Idempotency-Key', 200);
                let size = 0;
                const chunks = [];
                const bodyTimeout = setTimeout(() => req.destroy(), 20000);
                bodyTimeout.unref();
                try {
                    for await (const chunk of req) {
                        size += chunk.length;
                        const maximum = /^\/sessions\/[^/]+\/attachments$/.test(route) || route === '/operations/document_import' ? 48 * 1024 * 1024 : /^\/sessions\/[^/]+\/native-media$/.test(route) ? 32 * 1024 * 1024 : ['/operations/manuscript_create', '/operations/publication_template_import', '/publication-templates'].includes(route) ? 24 * 1024 * 1024 : 3 * 1024 * 1024;
                        ensure(size <= maximum, 'BODY_TOO_LARGE', route === '/operations/document_import' ? '文档导入 JSON 最多 48 MiB；原始文件最多 32 MiB' : ['/operations/manuscript_create', '/operations/publication_template_import', '/publication-templates'].includes(route) ? '文稿或模板输入 JSON 最多 24 MiB；原始文件合计最多 16 MiB' : '请求最多 3 MiB', 413);
                        chunks.push(Buffer.from(chunk));
                    }
                }
                finally {
                    clearTimeout(bodyTimeout);
                }
                let body;
                try {
                    body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                }
                catch {
                    throw new DomainError('INVALID_JSON', '请求不是有效 JSON', 400);
                }
                const purge = route.match(/^\/projects\/([^/]+)\/purge$/);
                if (purge) {
                    ensure(req.method === 'POST' && url.search === '', 'METHOD_NOT_ALLOWED', '清理请求只接受无查询参数POST', 405);
                    return json(app.projects.purge(USER, purge[1], body, key));
                }
                if (route === '/settings/environment')
                    return json(writeEnvironment(app, url, req.method, body, key));
                const attachment = attachmentRoute(app, route, url, req.method, body, key);
                if (attachment)
                    return json(attachment.result);
                if (route === '/settings/model-connections') {
                    ensure(req.method === 'POST' && url.search === '', 'METHOD_NOT_ALLOWED', '模型连接保存仅接受无查询参数的 POST', 405);
                    return json(configureModelConnection(app.context, USER, body, key));
                }
                if (route === '/settings/model-management' || route === '/settings/model-tests') {
                    ensure(req.method === 'POST' && url.search === '', 'METHOD_NOT_ALLOWED', '模型管理与测试仅接受无查询参数的POST', 405);
                    return json(route === '/settings/model-management' ? await configureModelManagement(app.context, USER, body, key) : await probeModel(app.context, USER, body, key));
                }
                const controller = new AbortController();
                if (route === '/publication-templates') {
                    ensure(req.method === 'POST' && url.search === '', 'METHOD_NOT_ALLOWED', '模板导入只接受无查询参数的 POST', 405);
                    return json(app.publicationTemplates.import(USER, body, key));
                }
                const cancel = () => { if (!res.writableEnded)
                    controller.abort(); };
                res.on('close', cancel);
                try {
                    const native = writeNativeRoute(app.nativeRequests, route, body, key, controller.signal, req.method, url.search);
                    if (native)
                        return json(await native.result);
                    if (route === '/projects' && req.method === 'POST' && body && typeof body === 'object' && 'github' in body)
                        return json(await app.github.createProject({ type: 'user' }, body, key));
                    const operation = operationRoute(app, route, body, key, controller.signal, req.method, url.search);
                    if (operation)
                        return json(await operation.result);
                }
                finally {
                    res.off('close', cancel);
                }
                if (route === '/projects/import') {
                    ensure(req.method === 'POST', 'METHOD_NOT_ALLOWED', '导入只接受 POST', 405);
                    const scope = `${req.method}:${route}`, request = { body, query: url.search }, prior = app.store.operationResult(scope, key, request);
                    if (prior.found)
                        return json(prior.value);
                    const prepared = await app.projects.prepareImport(USER, body);
                    return json(app.store.operation(scope, key, request, () => app.projects.importDirectory(USER, body, prepared)));
                }
                if (route === '/sessions' || route === '/settings/model' || /^\/sessions\/[^/]+\/model$/.test(route)) {
                    ensure(req.method === 'POST' && url.search === '', 'METHOD_NOT_ALLOWED', '会话和模型配置仅接受无查询参数的 POST', 405);
                    const scope = `${req.method}:${route}`, request = { body, query: url.search }, prior = app.store.operationResult(scope, key, request);
                    if (prior.found)
                        return json(prior.value);
                    const projectId = route === '/sessions' ? text(object(body).projectId, 'projectId', 100) : route === '/settings/model' ? undefined : app.sessions.get(USER, route.split('/')[2]).projectId;
                    const lifecycleEpoch = projectId ? assertProjectWritable(app.store, projectId).lifecycleEpoch : undefined;
                    const prepared = await prepareModelSelection(app.context);
                    return json(app.store.operation(scope, key, request, () => {
                        if (projectId)
                            assertProjectWritable(app.store, projectId, lifecycleEpoch);
                        prepared.assertCurrent();
                        const x = object(body);
                        if (route === '/sessions') {
                            const session = app.sessions.createRoot(USER, text(x.projectId, 'projectId', 100), x, prepared);
                            if (x.reuseSessionId === undefined)
                                app.sessionPermissions.initialize(session.id);
                            return session;
                        }
                        if (x.clear !== true) {
                            const raw = route === '/settings/model' ? x : x.model === undefined ? prepared.current : object(x.model);
                            const selected = { provider: text(raw.provider, 'provider', 100), model: text(raw.model, 'model', 160), thinking: text(raw.thinking ?? 'off', 'thinking', 64) };
                            prepared.resolve(bindModelRestoreEpoch(app.context.dataDir, selected));
                        }
                        return writeRoute(app, host, route, body, req.method);
                    }));
                }
                const hostAccessRoute = route.match(/^\/sessions\/([^/]+)\/host-access$/);
                const permissionRoute = route.match(/^\/sessions\/([^/]+)\/(?:permissions|permission-actions\/[^/]+\/decide)$/);
                if (permissionRoute) {
                    app.store.operation(`${req.method}:${route}`, key, { body, query: url.search }, () => { writeRoute(app, host, route, body, req.method); return { sessionId: permissionRoute[1] }; });
                    return json(app.sessionPermissions.status(USER, permissionRoute[1]));
                }
                if (hostAccessRoute) {
                    app.store.operation(`${req.method}:${route}`, key, { body, query: url.search }, () => { writeRoute(app, host, route, body, req.method); return { sessionId: hostAccessRoute[1] }; });
                    return json(app.hostAccess.status(USER, hostAccessRoute[1]));
                }
                const value = app.store.operation(`${req.method}:${route}`, key, { body, query: url.search }, () => writeRoute(app, host, route, body, req.method));
                return json(value);
            }
            ensure(req.method === 'GET' || req.method === 'HEAD', 'METHOD_NOT_ALLOWED', '只读静态资源', 405);
            const publicRoot = join(options.repoRoot, 'dist/web');
            let rel = decodeURIComponent(path).replace(/^\/+/, '') || 'index.html';
            if (!extname(rel) && !rel.startsWith('assets/'))
                rel = 'index.html';
            const file = safePath(publicRoot, rel);
            ensure(existsSync(file) && statSync(file).isFile(), 'NOT_FOUND', '页面尚未构建，请执行 npm run build', 404);
            const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
            res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
            res.end(req.method === 'HEAD' ? undefined : readFileSync(file));
        }
        catch (e) {
            const error = asError(e);
            if (!res.headersSent)
                json({ error: { code: error.code, message: error.message, details: error.details } }, e instanceof DomainError ? e.status : 500);
            else
                res.end();
        }
    });
    server.requestTimeout = DOCUMENT_UPLOAD_TIMEOUT_MS;
    server.headersTimeout = 10000;
    server.maxHeadersCount = 50;
    let closing;
    return { app, host, server, listen: () => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => { port = server.address().port; host.start(); if (options.computeMonitoring)
            app.computeMonitor.start(); resolve(port); }); }), close: () => closing ??= (async () => { await app.nativeRequests.shutdown(); events.close(); await Promise.all([app.computeMonitor.stop(), host.stop()]); await app.hostAccess.stop(); server.closeIdleConnections(); await new Promise(resolve => server.close(() => resolve())); app.close(); })() };
}
import { publicRecords } from '../../packages/domain/public-record.js';
//# sourceMappingURL=http.js.map