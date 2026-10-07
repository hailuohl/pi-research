import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync, renameSync, chmodSync, unlinkSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, dirname, basename, sep } from 'node:path';
import { digest, stable, type Store } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import {readStableFile} from './stable-file.js';
import type {SourceSnapshot} from '../domain/types.js';
import {assertTextWriteSettled,captureWritePreimage} from './text-write-recovery.js';
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export type SourceMode = '100644' | '100755';
const EXCLUDED = new Set(['.git', 'node_modules', '.pi', '.env', '.DS_Store', '.pi-research', '.pi-runtime', '.npmrc', '.pypirc']);
const excluded = (name: string) => EXCLUDED.has(name) || name.startsWith('.env.') || /^(?:model-connections|environment-variables)\.json(?:\.[\w-]+\.tmp)?$/i.test(name);
function assertNotSymlink(path: string) {
    try {
        ensure(!lstatSync(path).isSymbolicLink(), 'PATH_DENIED', '不允许通过符号链接访问文件', 403);
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
            throw error;
    }
}
export function safePath(root: string, path: string, allowRoot = false): string {
    assertTextWriteSettled(root);
    ensure(typeof path === 'string' && !path.includes('\0') && !path.includes('\\') && !isAbsolute(path) && !path.split('/').some(p => p === '..' || p === '.' || excluded(p)) && (allowRoot || path.length > 0), 'PATH_DENIED', '路径不在授权工作区内', 403);
    const base = resolve(root), target = resolve(base, path);
    ensure(target === base || target.startsWith(base + sep), 'PATH_DENIED', '路径越界', 403);
    assertNotSymlink(base);
    let current = base;
    for (const part of relative(base, target).split(sep).filter(Boolean)) {
        current = join(current, part);
        assertNotSymlink(current);
    }
    return target;
}
// Windows has no executable bit: keep host-owned logical modes outside the model's workspace.
const modesPath=(root:string)=>safePath(root,'',true)+'.source-modes.json';
function modeKey(root:string,path:string) {
    ensure(relative(resolve(root),safePath(root,path)).split(sep).join('/')===path&&!(process.platform==='win32'&&path.split('/').some(p=>p.includes(':')||/[. ]$/.test(p))),'PATH_DENIED','模式路径必须是规范相对路径',403);
    return process.platform==='win32'?path.toLowerCase():path;
}
function readModes(root:string,captured?:Buffer|null):Map<string,SourceMode> {
    const file=modesPath(root);assertNotSymlink(file);
    if(captured===null||(captured===undefined&&!existsSync(file)))return new Map();
    ensure(captured===undefined||captured.length<=8*1024*1024,'SOURCE_MODES_INVALID','源码模式元数据过大');
    const value:unknown=JSON.parse((captured??readStableFile(dirname(file),basename(file),8*1024*1024)).toString('utf8'));
    ensure(value!==null&&typeof value==='object'&&!Array.isArray(value),'SOURCE_MODES_INVALID','源码模式元数据无效');
    const entries=Object.entries(value);ensure(entries.length<=5000,'SOURCE_MODES_INVALID','源码模式元数据过多');
    const result=new Map<string,SourceMode>();
    for(const [path,mode] of entries){const key=modeKey(root,path);ensure((mode==='100644'||mode==='100755')&&!result.has(key),'SOURCE_MODES_INVALID','源码模式无效或重复');result.set(key,mode);}
    return result;
}
function writeModes(root:string,modes:Map<string,SourceMode>) {
    const file=modesPath(root);assertNotSymlink(file);
    for(const path of modes.keys())if(!existsSync(safePath(root,path)))modes.delete(path);
    ensure(modes.size<=5000,'SOURCE_MODES_INVALID','源码模式元数据过多');
    const temporary=file+'.tmp-'+randomUUID();
    try {writeFileSync(temporary,JSON.stringify(Object.fromEntries([...modes].sort(([a],[b])=>a.localeCompare(b)))),{mode:0o600,flag:'wx'});renameSync(temporary,file);}
    finally {if(existsSync(temporary))unlinkSync(temporary);}
}
function sourceMode(root:string,path:string,modes?:Map<string,SourceMode>):SourceMode {
    const stat=lstatSync(safePath(root,path));ensure(stat.isFile(),'SOURCE_NOT_FILE','源码必须是普通文件');
    const key=modeKey(root,path);
    return process.platform==='win32'?(modes??readModes(root)).get(key)??'100644':stat.mode&0o111?'100755':'100644';
}
export function readSourceMode(root:string,path:string):SourceMode {return sourceMode(root,path);}
/** A missing legacy mode becomes an explicitly new 100644 copy; never mutate its original manifest. */
export function setSourceModes(root:string,files:Array<{path:string;mode?:SourceMode}>,readOnly=false) {
    const modes=process.platform==='win32'?readModes(root):undefined;
    for(const file of files) {
        const mode=file.mode??'100644';ensure(mode==='100644'||mode==='100755','SOURCE_MODES_INVALID','源码模式必须为 100644 或 100755');
        const key=modeKey(root,file.path),path=safePath(root,file.path),stat=lstatSync(path);ensure(stat.isFile(),'SOURCE_NOT_FILE','源码必须是普通文件');
        chmodSync(path,readOnly?(mode==='100755'?0o555:0o444):((stat.mode&0o666)|(mode==='100755'?0o111:0)));
        if(mode==='100755')modes?.set(key,mode);else modes?.delete(key);
    }
    if(modes)writeModes(root,modes);
}
export function setSourceMode(root:string,path:string,mode:SourceMode) {setSourceModes(root,[{path,mode}]);}
export function copySourceModes(from:string,to:string,files:Array<{path:string}>) {
    const modes=process.platform==='win32'?readModes(from):undefined;
    setSourceModes(to,files.map(f=>({path:f.path,mode:sourceMode(from,f.path,modes)})));
}
export function readText(root: string, path: string) { const file = safePath(root, path); ensure(existsSync(file) && lstatSync(file).isFile(), 'NOT_FOUND', '文件不存在', 404); ensure(lstatSync(file).size <= MAX_TEXT_BYTES, 'FILE_TOO_LARGE', '文件过大，不能作为文本打开', 413); const raw = readFileSync(file); ensure(!raw.includes(0), 'BINARY_FILE', '不能作为文本读取二进制文件', 415); return { path, content: raw.toString('utf8'), digest: digest(raw), size: raw.length }; }
export function writeText(root: string, path: string, content: string, expectedDigest: string | null, store?: Store) {
    const write = () => {
        const file = safePath(root, path), bytes = Buffer.from(content);
        modeKey(root,path);
        ensure(bytes.length <= MAX_TEXT_BYTES, 'FILE_TOO_LARGE', '文件过大', 413);
        const preimage=captureWritePreimage(root,path),before=preimage.bytes,beforePermissions=preimage.mode;
        const modePreimage=process.platform==='win32'?captureWritePreimage(root,'',true):undefined;
        const modes=modePreimage?readModes(root,modePreimage.bytes):undefined;
        const beforeMode:SourceMode=before===null?'100644':modes?(modes.get(modeKey(root,path))??'100644'):(beforePermissions&0o111?'100755':'100644');
        ensure((before === null ? null : digest(before)) === expectedDigest, 'FILE_VERSION_CONFLICT', '文件已被其他操作修改，请刷新并比较差异');
        mkdirSync(dirname(file), {recursive: true, mode: 0o700});
        if(store?.textWrites) {
            const recovery=store.textWrites;
            store.onRollback(()=>recovery.rollback());
            store.afterCommit(()=>store.transaction(()=>{}));
            recovery.write(root,path,bytes,beforePermissions,false,preimage);
            if(modes&&modePreimage) {
                const key=modeKey(root,path);
                if(beforeMode==='100755')modes.set(key,beforeMode);else modes.delete(key);
                const value=Buffer.from(JSON.stringify(Object.fromEntries([...modes].sort(([a],[b])=>a.localeCompare(b)))));
                recovery.write(root,'',value,0o600,true,modePreimage);
            }
            return {path,digest:digest(bytes),size:bytes.length};
        }
        const temporary = file + '.tmp-' + randomUUID();
        try {writeFileSync(temporary,bytes,{mode:0o600,flag:'wx'});renameSync(temporary,file);}
        finally {if(existsSync(temporary))unlinkSync(temporary);}
        const nextDigest = digest(bytes);
        store?.onRollback(() => {
            const target = safePath(root, path);
            ensure(existsSync(target) && digest(readFileSync(target)) === nextDigest, 'FILE_VERSION_CONFLICT', '事务外文件修改需要人工恢复');
            if (before === null) {if(process.platform==='win32'){const modes=readModes(root);modes.delete(modeKey(root,path));writeModes(root,modes);}unlinkSync(target);}
            else {chmodSync(target,0o600);writeFileSync(target,before);chmodSync(target,beforePermissions);if(process.platform==='win32')setSourceMode(root,path,beforeMode);}
        });
        chmodSync(file,beforePermissions);if(process.platform==='win32')setSourceMode(root,path,beforeMode);
        return {path, digest: nextDigest, size: bytes.length};
    };
    return store ? store.transaction(write) : write();
}
export function listFiles(root: string, sub = ''): Array<{
    path: string;
    size: number;
    digest?: string;
}> {
    const result: Array<{
        path: string;
        size: number;
    }> = [];
    const walk = (dir: string) => {
        for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            if (excluded(item.name))
                continue;
            const path = join(dir, item.name);
            ensure(!item.isSymbolicLink(), 'PATH_DENIED', '工作区包含符号链接', 403);
            if (item.isDirectory())
                walk(path);
            else if (item.isFile()) {
                result.push({ path: relative(root, path).split(sep).join('/'), size: lstatSync(path).size });
                ensure(result.length <= 5000, 'TOO_MANY_FILES', '工作区文件超过 5000 个', 413);
            }
        }
    };
    const start = safePath(root, sub, true);
    if (existsSync(start))
        walk(start);
    return result;
}
export function snapshotDirectory(root: string, store: string, options:{legacy?:boolean}={}):SourceSnapshot {
    const files = listFiles(root);
    ensure(!files.some(f => f.path.split('/').includes('.gitmodules')), 'UNSUPPORTED_SUBMODULE', '当前版本不展开 Git 子模块；请明确导入已解析的源码而不是遗漏依赖', 422);
    ensure(files.length > 0, 'EMPTY_WORKSPACE', '工作区没有可运行文件', 400);
    let total = 0;
    const modes=process.platform==='win32'&&!options.legacy?readModes(root):undefined;
    const data = files.map(f => { const bytes = readStableFile(root,f.path,64*1024*1024);total+=bytes.length;ensure(total<=64*1024*1024,'SNAPSHOT_TOO_LARGE','当前快照限制为 64 MiB；请将大型数据集独立版本化',413);ensure(!bytes.subarray(0, 150).toString().startsWith('version https://git-lfs.github.com/spec'), 'UNSUPPORTED_LFS', '必须先解析 Git LFS 文件再建立快照', 422); return { path:f.path,size:bytes.length,digest:digest(bytes),bytes,...(!options.legacy?{mode:sourceMode(root,f.path,modes)}:{}) }; });
    const manifest = data.map(({bytes,...file})=>file).sort((a, b) => a.path.localeCompare(b.path));
    const hash = digest(stable(manifest));
    const destination = join(store, hash);
    mkdirSync(destination, { recursive: true, mode: 0o700 });
    const destinationModes=process.platform==='win32'&&!options.legacy?readModes(destination):undefined;
    const created:Array<{path:string;mode?:SourceMode}>=[];
    for (const item of data) {
        const target = safePath(destination, item.path);
        if (!existsSync(target)) {
            mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
            writeFileSync(target, item.bytes, { mode: 0o444, flag: 'wx' });
            created.push(item);
        }
        else {
            ensure(digest(readStableFile(destination,item.path,64*1024*1024)) === item.digest, 'SNAPSHOT_CORRUPTED', '已保存快照摘要不一致', 500);
            if(item.mode)ensure(sourceMode(destination,item.path,destinationModes)===item.mode,'SNAPSHOT_CORRUPTED','已保存快照执行模式不一致',500);
        }
    }
    if(!options.legacy&&created.length)setSourceModes(destination,created,true);
    return { digest: hash, path: destination, files: manifest };
}
export function verifySnapshot(path: string, files: Array<{
    path: string;
    digest: string;
    size: number;
    mode?:SourceMode;
}>) {
    const modes=process.platform==='win32'&&files.some(f=>f.mode!==undefined)?readModes(path):undefined;
    for (const f of files) {
        const p = safePath(path, f.path);
        ensure(existsSync(p) && lstatSync(p).isFile()&&lstatSync(p).size===f.size&&digest(readStableFile(path,f.path,64*1024*1024)) === f.digest, 'SNAPSHOT_CORRUPTED', '快照文件校验失败', 409);
        if(f.mode!==undefined)ensure((f.mode==='100644'||f.mode==='100755')&&sourceMode(path,f.path,modes)===f.mode,'SNAPSHOT_CORRUPTED','快照执行模式校验失败',409);
    }
    ensure(listFiles(path).length === files.length, 'SNAPSHOT_CORRUPTED', '快照出现额外文件', 409);
}
