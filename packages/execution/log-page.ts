import {openSync,closeSync,lstatSync,fstatSync,readSync,constants,type BigIntStats} from 'node:fs';
import {safePath} from '../workspace/files.js';
import {digest} from '../storage/store.js';
import {integer,text} from '../contracts/validation.js';
import {DomainError,ensure} from '../domain/errors.js';

export interface LogPage {content:string;cursor:number;complete:boolean;start:number;size:number;identity:string|null;}
const identityOf=(stat:BigIntStats)=>digest(`${stat.dev}:${stat.ino}:${stat.birthtimeNs}`);
const reset=()=>new DomainError('LOG_RESET','日志文件已改变或游标超出范围，请从头重新读取',409);

/** Byte cursor over one append-only UTF-8 log; at most maxBytes are actually read per request. */
export function readLogPage(root:string,path:string,rawCursor:unknown,options:{terminal:boolean;identity?:string|null;maxBytes?:number}):LogPage {
    const cursor=integer(rawCursor,'cursor',0,Number.MAX_SAFE_INTEGER),maxBytes=integer(options.maxBytes??65536,'maxBytes',4,65536),expected=options.identity==null?null:text(options.identity,'identity',100),file=safePath(root,path);
    let before:BigIntStats;
    try{before=lstatSync(file,{bigint:true});}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;if(expected!==null||cursor!==0)throw reset();return {content:'',cursor:0,complete:options.terminal,start:0,size:0,identity:null};}
    ensure(before.isFile(),'ARTIFACT_NOT_FILE','日志必须为普通文件');
    const originalIdentity=identityOf(before);if(expected!==null&&expected!==originalIdentity)throw reset();
    let fd:number;try{fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0)|(constants.O_NONBLOCK??0));}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw reset();throw error;}
    try{
        const opened=fstatSync(fd,{bigint:true});if(!opened.isFile()||identityOf(opened)!==originalIdentity||opened.size<before.size)throw reset();
        const size=Number(opened.size);ensure(Number.isSafeInteger(size),'LOG_CURSOR_INVALID','日志大小无法用安全字节游标表示',409);if(cursor>size)throw reset();
        const buffer=Buffer.alloc(Math.min(maxBytes,size-cursor));let count=0;
        while(count<buffer.length){const n=readSync(fd,buffer,count,buffer.length-count,cursor+count);if(!n)break;count+=n;}
        const after=fstatSync(fd,{bigint:true});let named:BigIntStats;
        try{named=lstatSync(safePath(root,path),{bigint:true});}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')throw reset();throw error;}
        if(!named.isFile()||identityOf(after)!==originalIdentity||identityOf(named)!==originalIdentity||after.size<opened.size||named.size<after.size||after.size===opened.size&&(after.mtimeNs!==opened.mtimeNs||after.ctimeNs!==opened.ctimeNs))throw reset();
        const finalSize=Number(named.size);ensure(Number.isSafeInteger(finalSize),'LOG_CURSOR_INVALID','日志大小无法用安全字节游标表示',409);
        let content:string;
        try{const decoder=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true});content=decoder.decode(buffer.subarray(0,count),{stream:true});if(options.terminal&&cursor+count===finalSize)content+=decoder.decode();}
        catch{throw new DomainError('LOG_ENCODING_INVALID','日志包含非法或终态残缺的 UTF-8；原始日志字节未被改写',409);}
        const end=cursor+Buffer.byteLength(content,'utf8');return {content,cursor:end,complete:options.terminal&&end===finalSize,start:cursor,size:finalSize,identity:originalIdentity};
    }finally{closeSync(fd);}
}
