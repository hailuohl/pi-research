import {operationRoute} from './operation-routes.js';
import {writeEnvironment} from './environment-routes.js';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { ResearchApp } from '../../packages/research-app.js';
import { AgentHost } from '../../packages/scheduler/agent-host.js';
import { asError, DomainError, ensure } from '../../packages/domain/errors.js';
import { text } from '../../packages/contracts/validation.js';
import { safePath } from '../../packages/workspace/files.js';
import { USER } from '../../packages/domain/types.js';
import { readRoute, writeRoute } from './routes.js';
import {EventStreamHub,eventQuery} from './event-stream.js';
export interface ServerOptions {
    dataDir: string;
    repoRoot: string;
    port?: number;
}
export function createHttpServer(options: ServerOptions) {
    const app = new ResearchApp(options.dataDir, options.repoRoot), host = new AgentHost(app);
    const events=new EventStreamHub(app.store);
    let port = options.port ?? 4317;
    const server = http.createServer(async (req, res) => {
        const headers = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
        Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
        const json = (value: unknown, status = 200) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(publicRecords(value))); };
        try {
            const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
            ensure(allowed.includes(req.headers.host ?? ''), 'HOST_DENIED', '只允许回环地址访问', 403);
            ensure(req.headers['sec-fetch-site'] !== 'cross-site', 'ORIGIN_DENIED', '拒绝跨站请求', 403);
            if (req.headers.origin)
                ensure(req.headers.origin === `http://${req.headers.host}`, 'ORIGIN_DENIED', '拒绝跨站请求', 403);
            const url = new URL(req.url ?? '/', `http://${req.headers.host}`), path = url.pathname;
            if (path === '/api/health') {
                ensure(req.method === 'GET', 'METHOD_NOT_ALLOWED', '请求方法不支持', 405);
                return json({ ok: true, version: '0.3.1-experimental', mode: 'local-owner-only' });
            }
            if (path.startsWith('/api/')) {
                const route = path.slice(4);
                if (req.method === 'GET') {
                    if(route==='/github/status')return json(await app.github.status({type:'user'}));
                    if(route==='/events/stream'){const query=eventQuery(url,true,req.headers['last-event-id'] as string|undefined);if(query.projectId)app.projects.get(USER,query.projectId);events.open(req,res,query);return;}
                    if (route === '/operations') return json(app.operations.specs());
                    const files = route.match(/^\/projects\/([^/]+)\/files$/);
                    if (files) ensure([...url.searchParams.keys()].every(key => key === 'path') && url.searchParams.getAll('path').length <= 1, 'INVALID_INPUT', '项目文件接口只接受 path；指定实验版本请使用 experiment_source_read', 400);
                    if (files && url.searchParams.has('path')) return json(await app.operations.execute(USER, 'workspace_read', { source: 'project', path: url.searchParams.get('path') }, { projectId: files[1] }));
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
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                    size += chunk.length;
                    const maximum=route==='/operations/document_import'?48*1024*1024:['/operations/manuscript_create','/operations/publication_template_import','/publication-templates'].includes(route)?24*1024*1024:3*1024*1024;
                    ensure(size <= maximum, 'BODY_TOO_LARGE', route==='/operations/document_import'?'文档导入 JSON 最多 48 MiB；原始文件最多 32 MiB':['/operations/manuscript_create','/operations/publication_template_import','/publication-templates'].includes(route)?'文稿或模板输入 JSON 最多 24 MiB；原始文件合计最多 16 MiB':'请求最多 3 MiB', 413);
                    chunks.push(Buffer.from(chunk));
                }
                let body: unknown;
                try {
                    body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                }
                catch {
                    throw new DomainError('INVALID_JSON', '请求不是有效 JSON', 400);
                }
                if(route==='/settings/environment')return json(writeEnvironment(app,url,req.method!,body,key!));
                const controller = new AbortController();
                if(route==='/publication-templates'){ensure(req.method==='POST'&&url.search==='','METHOD_NOT_ALLOWED','模板导入只接受无查询参数的 POST',405);return json(app.publicationTemplates.import(USER,body,key!));}
                const cancel = () => { if (!res.writableEnded) controller.abort(); };
                res.on('close', cancel);
                try {
                    if(route==='/projects'&&req.method==='POST'&&body&&typeof body==='object'&&'github' in body)return json(await app.github.createProject({type:'user'},body,key!));
                    const operation = operationRoute(app, route, body, key, controller.signal, req.method!, url.search);
                    if (operation) return json(await operation.result);
                } finally { res.off('close', cancel); }
                if(route==='/projects/import') {
                    ensure(req.method==='POST','METHOD_NOT_ALLOWED','导入只接受 POST',405);
                    const scope=`${req.method}:${route}`,request={body,query:url.search},prior=app.store.operationResult(scope,key!,request);
                    if(prior.found)return json(prior.value);
                    const prepared=await app.projects.prepareImport(USER,body);
                    return json(app.store.operation(scope,key!,request,()=>app.projects.importDirectory(USER,body,prepared)));
                }
                const hostAccessRoute=route.match(/^\/sessions\/([^/]+)\/host-access$/);
                const permissionRoute=route.match(/^\/sessions\/([^/]+)\/(?:permissions|permission-actions\/[^/]+\/decide)$/);
                if(permissionRoute){app.store.operation(`${req.method}:${route}`,key!,{body,query:url.search},()=>{writeRoute(app,host,route,body,req.method);return {sessionId:permissionRoute[1]};});return json(app.sessionPermissions.status(USER,permissionRoute[1]));}
                if(hostAccessRoute){app.store.operation(`${req.method}:${route}`,key!,{body,query:url.search},()=>{writeRoute(app,host,route,body,req.method);return {sessionId:hostAccessRoute[1]};});return json(app.hostAccess.status(USER,hostAccessRoute[1]));}
                const value = app.store.operation(`${req.method}:${route}`, key!, { body, query: url.search }, () => writeRoute(app, host, route, body, req.method));
                return json(value);
            }
            ensure(req.method === 'GET' || req.method === 'HEAD', 'METHOD_NOT_ALLOWED', '只读静态资源', 405);
            const publicRoot = join(options.repoRoot, 'dist/web');
            let rel = decodeURIComponent(path).replace(/^\/+/, '') || 'index.html';
            if (!extname(rel) && !rel.startsWith('assets/'))
                rel = 'index.html';
            const file = safePath(publicRoot, rel);
            ensure(existsSync(file) && statSync(file).isFile(), 'NOT_FOUND', '页面尚未构建，请执行 npm run build', 404);
            const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
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
    server.requestTimeout = 20000;
    server.headersTimeout = 10000;
    server.maxHeadersCount = 50;
    let closing:Promise<void>|undefined;
    return { app, host, server, listen: () => new Promise<number>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => { port = (server.address() as AddressInfo).port; host.start(); resolve(port); }); }), close: () => closing??=(async()=>{events.close();await host.stop();await app.hostAccess.stop(); server.closeIdleConnections(); await new Promise<void>(resolve => server.close(() => resolve())); app.close();})() };
}
import {publicRecords} from '../../packages/domain/public-record.js';
